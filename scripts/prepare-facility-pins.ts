import 'dotenv/config';
import { and, between, eq } from 'drizzle-orm';
import { FACILITY_CATEGORIES } from '../src/lib/domain/facility-categories';
import { createDb } from '../src/lib/server/db';
import { placeCategories, places } from '../src/lib/server/db/schema';

const databaseUrl = process.env.DATABASE_URL ?? '';
if (!databaseUrl) throw new Error('DATABASE_URL 환경변수가 필요합니다.');

const db = createDb(databaseUrl);

for (const category of FACILITY_CATEGORIES) {
	await db
		.insert(placeCategories)
		.values({
			name: category.name,
			slug: category.slug,
			icon: category.icon,
			color: '#8a1538',
			displayOrder: category.displayOrder,
			isVisible: true
		})
		.onConflictDoUpdate({
			target: placeCategories.slug,
			set: {
				name: category.name,
				icon: category.icon,
				color: '#8a1538',
				displayOrder: category.displayOrder,
				isVisible: true,
				updatedAt: new Date()
			}
		});
}

await db
	.update(places)
	.set({ scope: 'campus', zoneId: null, updatedAt: new Date() })
	.where(eq(places.type, 'cafeteria'));

await db
	.update(places)
	.set({ scope: 'campus', zoneId: null, updatedAt: new Date() })
	.where(
		and(
			eq(places.type, 'shuttle_stop'),
			between(places.latitude, 36.605, 36.615),
			between(places.longitude, 127.28, 127.295)
		)
	);

console.log('시설 카테고리와 교내 기존 핀 범위를 DB에 반영했습니다.');
