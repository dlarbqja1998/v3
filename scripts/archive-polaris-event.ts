import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { createDb } from '../src/lib/server/db';
import { campusEvents } from '../src/lib/server/db/schema';

// 종료된 행사 기록은 다음 축제 템플릿 변경과 무관하게 보존한다.
const record = {
	id: 'a6c721d7-e234-4ce5-a030-36d8a5d83a1e',
	title: '2026 동연제 : POLARIS',
	category: '축제',
	organizer: '총동아리연합회',
	description: '2026년 동아리연합제 POLARIS 개최 기록입니다.\n낮 부스: 12:00–17:30\n밤 부스: 18:00–24:00\n동아리 공연과 아티스트 공연이 함께 진행되었습니다.',
	startsAt: new Date('2026-09-15T12:00:00+09:00'),
	endsAt: new Date('2026-09-16T00:00:00+09:00'),
	locationName: '학생회관 일대',
	latitude: 36.6106648,
	longitude: 127.2886266,
	isVisible: false
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL 환경변수가 필요합니다.');
const db = createDb(databaseUrl);
const existing = await db.query.campusEvents.findFirst({ where: eq(campusEvents.title, record.title) });
if (!existing) {
	await db.insert(campusEvents).values(record).onConflictDoNothing({ target: campusEvents.id });
}
const saved = await db.query.campusEvents.findFirst({ where: eq(campusEvents.id, existing?.id ?? record.id) });
if (!saved || saved.isVisible || saved.startsAt.getTime() !== record.startsAt.getTime() || saved.endsAt.getTime() !== record.endsAt.getTime()) {
	throw new Error('기존 행사 기록의 공개 상태 또는 일시가 예상과 다릅니다. 기존 기록을 덮어쓰지 않았습니다.');
}
console.log(JSON.stringify({ title: saved.title, startsAt: saved.startsAt, endsAt: saved.endsAt, isVisible: saved.isVisible, created: !existing }));
