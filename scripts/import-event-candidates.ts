import { config } from 'dotenv';
import { readFile, stat } from 'node:fs/promises';
import { parseManualEventImport, MANUAL_EVENT_IMPORT_MAX_BYTES } from '../src/lib/domain/manual-event-import';
import { EVENT_SOURCE_BOARDS, getCollectionWindow } from '../src/lib/domain/event-candidates';

async function main() {
	const args = process.argv.slice(2);
	if (args.includes('--help')) {
		console.log('상태 조회: npm run events:status\n파일 검증: npm run events:import -- --file <확인결과.json>\n후보 저장: npm run events:import -- --file <확인결과.json> --apply');
		return;
	}
	config({ quiet: true });
	if (args.length === 1 && args[0] === '--status') {
		if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL 설정이 필요합니다.');
		const { readEventInbox } = await import('../src/lib/server/event-candidates');
		try {
			const inbox = await readEventInbox(process.env.DATABASE_URL);
			const successful = inbox.runs.find((run) => run.status === 'completed');
			const checkedAt = successful?.checkpoint?.startedAt ? new Date(successful.checkpoint.startedAt) : successful?.startedAt ?? null;
			console.log(JSON.stringify({ available: inbox.available, pendingCount: inbox.candidates.filter((candidate) => candidate.state === 'pending').length, latestRun: inbox.runs[0] ?? null, recommendedWindow: getCollectionWindow(checkedAt, new Date()), boards: EVENT_SOURCE_BOARDS }, null, 2));
		} catch { throw new Error('승인함 상태를 조회하지 못했습니다. DB 연결을 확인해 주세요.'); }
		return;
	}
	let file: string | undefined;
	let apply = false;
	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--file' && args[i + 1] && !args[i + 1].startsWith('--') && !file) file = args[++i];
		else if (args[i] === '--apply' && !apply) apply = true;
		else throw new Error('사용법: npm run events:import -- --file <확인결과.json> [--apply]');
	}
	if (!file) throw new Error('저장할 확인 결과를 --file로 지정해 주세요.');
	let text: string;
	try {
		const info = await stat(file);
		if (!info.isFile() || info.size > MANUAL_EVENT_IMPORT_MAX_BYTES) throw new Error();
		text = await readFile(file, 'utf8');
	} catch { throw new Error('확인 결과 파일을 읽지 못했습니다. 경로와 1MB 이하 용량을 확인해 주세요.'); }
	const batch = parseManualEventImport(text);
	if (!apply) {
		console.log(JSON.stringify({ mode: '검증만 수행 · 저장 안 함', since: batch.since, checkedAt: batch.checkedAt, coverage: batch.coverage, candidates: batch.candidates.map((item) => ({ title: item.draft.title, sourceUrl: item.source.url })) }, null, 2));
		return;
	}
	if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL 설정이 필요합니다.');
	const { readEventInbox } = await import('../src/lib/server/event-candidates');
	const { listCampusSpots } = await import('../src/lib/server/campus-spots');
	const { importManualEventCandidates, ManualEventImportError } = await import('../src/lib/server/manual-event-import');
	try {
		const inbox = await readEventInbox(process.env.DATABASE_URL);
		if (!inbox.available) throw new ManualEventImportError('승인함 저장소를 먼저 준비해 주세요: npm run events:setup -- --apply');
		const result = await importManualEventCandidates(process.env.DATABASE_URL, text, await listCampusSpots(process.env.DATABASE_URL));
		console.log(JSON.stringify({ ...result, inboxPath: '/admin/events/inbox', publication: '검토 대기에 저장 · 공개는 관리자 승인 후' }, null, 2));
		if (result.failedCount > 0) process.exitCode = 1;
	} catch (caught) {
		if (caught instanceof ManualEventImportError) throw caught;
		throw new Error('후보 저장에 실패했습니다. DB 연결·승인함 테이블·실행 기록을 확인해 주세요.');
	}
}

main().catch((caught) => { console.error(caught instanceof Error ? caught.message : '확인 결과를 처리하지 못했습니다.'); process.exitCode = 1; });
