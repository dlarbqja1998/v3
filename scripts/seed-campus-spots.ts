import 'dotenv/config';
import { createDb } from '../src/lib/server/db';
import { campusSpots } from '../src/lib/server/db/schema';
import { campusSpots as initialCampusSpots } from '../src/lib/domain/campus-spots';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required.');

const db = createDb(databaseUrl);
await db
	.insert(campusSpots)
	.values(
		initialCampusSpots.map((spot) => ({
			id: spot.id,
			name: spot.name,
			type: spot.type,
			centerLatitude: spot.center.latitude,
			centerLongitude: spot.center.longitude,
			boundary: spot.boundary,
			source: spot.source,
			osmId: spot.osmId ?? null,
			description: spot.description
		}))
	)
	.onConflictDoNothing({ target: campusSpots.id });

const savedSpots = await db.select({ id: campusSpots.id }).from(campusSpots);
console.log(`캠퍼스 스팟 ${savedSpots.length}개 확인 완료`);
