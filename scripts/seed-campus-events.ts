import 'dotenv/config';
import { createDb } from '../src/lib/server/db';
import { campusEventImages, campusEvents } from '../src/lib/server/db/schema';
import { createCampusEventSeed } from './campus-event-seed';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL 환경변수가 필요합니다.');

const db = createDb(databaseUrl);
const seedEvents = createCampusEventSeed();

for (const seed of seedEvents) {
	const { image, ...event } = seed;
	await db
		.insert(campusEvents)
		.values(event)
		.onConflictDoUpdate({
			target: campusEvents.id,
			set: { ...event, updatedAt: new Date() }
		});
	await db
		.insert(campusEventImages)
		.values({ ...image, eventId: event.id })
		.onConflictDoUpdate({
			target: campusEventImages.id,
			set: { ...image, eventId: event.id }
		});
}

console.log('교내 행사 테스트 데이터 2건을 생성 또는 갱신했습니다.');
