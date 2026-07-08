import 'dotenv/config';
import { createDb } from '../src/lib/server/db';
import {
	cafeteriaMenus,
	cafeterias,
	placeCategories,
	places,
	shuttleSchedules,
	shuttleStops,
	zones
} from '../src/lib/server/db/schema';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error('DATABASE_URL이 필요합니다. 로컬 .env에 Neon 연결 문자열을 넣어 주세요.');
}

const db = createDb(databaseUrl);

const zoneRows = await db
	.insert(zones)
	.values([
		{
			name: '정문',
			slug: 'front-gate',
			centerLatitude: 36.6109,
			centerLongitude: 127.2872,
			displayOrder: 1
		},
		{
			name: '조치원역',
			slug: 'station',
			centerLatitude: 36.6019,
			centerLongitude: 127.2964,
			displayOrder: 2
		},
		{
			name: '학생회관',
			slug: 'student-center',
			centerLatitude: 36.6098,
			centerLongitude: 127.291,
			displayOrder: 3
		}
	])
	.onConflictDoNothing({ target: zones.slug })
	.returning();

const categoryRows = await db
	.insert(placeCategories)
	.values([
		{ name: '한식', slug: 'korean', icon: '밥', color: '#2f6e47', displayOrder: 1 },
		{ name: '카페', slug: 'cafe', icon: '커피', color: '#6f563f', displayOrder: 2 },
		{ name: '학식', slug: 'cafeteria', icon: '학', color: '#315f8a', displayOrder: 3 },
		{ name: '셔틀', slug: 'shuttle', icon: '버스', color: '#7a4f20', displayOrder: 4 }
	])
	.onConflictDoNothing({ target: placeCategories.slug })
	.returning();

const allZones = zoneRows.length ? zoneRows : await db.select().from(zones);
const allCategories = categoryRows.length ? categoryRows : await db.select().from(placeCategories);

const zoneBySlug = new Map(allZones.map((zone) => [zone.slug, zone.id]));
const categoryBySlug = new Map(allCategories.map((category) => [category.slug, category.id]));

const required = {
	frontGateZone: zoneBySlug.get('front-gate'),
	stationZone: zoneBySlug.get('station'),
	studentCenterZone: zoneBySlug.get('student-center'),
	koreanCategory: categoryBySlug.get('korean'),
	cafeCategory: categoryBySlug.get('cafe'),
	cafeteriaCategory: categoryBySlug.get('cafeteria'),
	shuttleCategory: categoryBySlug.get('shuttle')
};

for (const [key, value] of Object.entries(required)) {
	if (!value) {
		throw new Error(`seed 기준 데이터가 부족합니다: ${key}`);
	}
}

const [restaurant, cafe, cafeteriaPlace, shuttlePlace, stationRestaurant] = await db
	.insert(places)
	.values([
		{
			type: 'restaurant',
			name: '정문 든든한식',
			categoryId: required.koreanCategory,
			zoneId: required.frontGateZone,
			latitude: 36.6114,
			longitude: 127.2877,
			description: '점심 회전이 빠른 정문 근처 백반 후보',
			displayPriority: 1
		},
		{
			type: 'cafe',
			name: '세종 스터디 카페',
			categoryId: required.cafeCategory,
			zoneId: required.frontGateZone,
			latitude: 36.6102,
			longitude: 127.2884,
			description: '공강 시간에 노트북 펴기 좋은 카페',
			displayPriority: 2
		},
		{
			type: 'cafeteria',
			name: '학생회관 학식',
			categoryId: required.cafeteriaCategory,
			zoneId: required.studentCenterZone,
			latitude: 36.6097,
			longitude: 127.2912,
			description: '오늘 메뉴와 운영 시간을 바로 확인',
			displayPriority: 3
		},
		{
			type: 'shuttle_stop',
			name: '정문 셔틀 정류장',
			categoryId: required.shuttleCategory,
			zoneId: required.frontGateZone,
			latitude: 36.6111,
			longitude: 127.2866,
			description: '다음 셔틀 도착 시간을 보여줄 정류장 핀',
			displayPriority: 4
		},
		{
			type: 'restaurant',
			name: '조치원역 분식',
			categoryId: required.koreanCategory,
			zoneId: required.stationZone,
			latitude: 36.6022,
			longitude: 127.296,
			description: '기차 타기 전 빠르게 먹기 좋은 후보',
			displayPriority: 5
		}
	])
	.returning();

void restaurant;
void cafe;
void stationRestaurant;

await db
	.insert(cafeterias)
	.values({
		placeId: cafeteriaPlace.id,
		name: '학생회관 학식',
		type: 'student_center'
	})
	.onConflictDoNothing({ target: cafeterias.placeId });

await db
	.insert(cafeteriaMenus)
	.values({
		cafeteriaId: cafeteriaPlace.id,
		menuDate: '2026-07-08',
		mealType: '점심',
		items: ['돈가스', '된장국'],
		source: 'seed'
	});

await db
	.insert(shuttleStops)
	.values({
		placeId: shuttlePlace.id,
		stopCode: 'front-gate',
		direction: '조치원역행',
		memo: '정문 앞'
	})
	.onConflictDoNothing({ target: shuttleStops.placeId });

await db.insert(shuttleSchedules).values({
	stopId: shuttlePlace.id,
	dayType: 'weekday',
	departureTime: '16:20',
	routeName: '조치원역행',
	isActive: true
});

console.log('v3 seed 데이터 입력 완료');
