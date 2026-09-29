import { config } from 'dotenv';
import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';

async function main() {
	const args = process.argv.slice(2);
	if (args.some((arg) => arg !== '--apply') || args.length > 1) throw new Error('사용법: npm run events:setup [-- --apply]');
	config({ quiet: true });
	if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL 설정이 필요합니다.');
	const sql = neon(process.env.DATABASE_URL);
	const inspect = () => sql`SELECT to_regclass('public.event_candidates') IS NOT NULL AS candidates,
		to_regclass('public.event_candidate_sources') IS NOT NULL AS sources,
		to_regclass('public.event_import_runs') IS NOT NULL AS runs,
		to_regclass('public.event_notification_subscriptions') IS NOT NULL AS notifications,
		EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='campus_events' AND column_name='location') AS location`;
	const [before] = await inspect();
	const tables = [before.candidates, before.sources, before.runs, before.notifications];
	if (tables.some(Boolean) && !tables.every(Boolean)) throw new Error('승인함 테이블이 일부만 존재합니다. 스키마를 확인한 뒤 적용해 주세요.');
	console.log(JSON.stringify({ before, ready: Object.values(before).every(Boolean), mode: args.includes('--apply') ? '필요한 스키마 적용' : '조회만 수행' }));
	if (!args.includes('--apply') || Object.values(before).every(Boolean)) return;
	const statements: string[] = [];
	if (!before.location) statements.push('ALTER TABLE "campus_events" ADD COLUMN IF NOT EXISTS "location" jsonb;');
	if (!tables.every(Boolean)) {
		const migration = await readFile(new URL('../drizzle/0013_event_collection_inbox.sql', import.meta.url), 'utf8');
		statements.push(...migration.split('--> statement-breakpoint').map((statement) => statement.trim()).filter(Boolean));
	}
	// 기존 수동 스키마 적용 방식에 맞춰 필요한 추가 사항만 하나의 트랜잭션으로 반영한다.
	// 이전 마이그레이션이 실행된 것처럼 이력을 만들거나 기존 행사 데이터를 변경하지 않는다.
	await sql.transaction(statements.map((statement) => sql.query(statement)));
	const [after] = await inspect();
	if (!Object.values(after).every(Boolean)) throw new Error('승인함 스키마 적용 결과를 확인해 주세요.');
	console.log(JSON.stringify({ after, ready: true, message: '승인함 저장소 준비 완료 · 기존 행사 데이터 유지' }));
}

main().catch((caught) => {
	const message = caught instanceof Error && !('code' in caught) && !('cause' in caught) ? caught.message : '승인함 스키마 준비에 실패했습니다. DB 연결과 테이블 상태를 확인해 주세요.';
	console.error(message); process.exitCode = 1;
});
