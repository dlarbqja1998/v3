import type { CafeteriaSummary, Place, PlaceCategory, ShuttleSummary, Zone } from './places';

export const zones: Zone[] = [
	{
		id: 'front-gate',
		name: '정문',
		slug: 'front-gate',
		centerLatitude: 36.6109,
		centerLongitude: 127.2872
	},
	{
		id: 'station',
		name: '조치원역',
		slug: 'station',
		centerLatitude: 36.6019,
		centerLongitude: 127.2964
	},
	{
		id: 'student-center',
		name: '학생회관',
		slug: 'student-center',
		centerLatitude: 36.6098,
		centerLongitude: 127.291
	}
];

export const categories: PlaceCategory[] = [
	{
		id: 'korean',
		name: '한식',
		slug: 'korean',
		icon: '밥',
		color: '#a51c45',
		displayOrder: 1
	},
	{
		id: 'cafe',
		name: '카페',
		slug: 'cafe',
		icon: '커피',
		color: '#6f563f',
		displayOrder: 2
	},
	{
		id: 'cafeteria',
		name: '학식',
		slug: 'cafeteria',
		icon: '학',
		color: '#315f8a',
		displayOrder: 3
	},
	{
		id: 'shuttle',
		name: '셔틀',
		slug: 'shuttle',
		icon: '버스',
		color: '#7a4f20',
		displayOrder: 4
	}
];

export const places: Place[] = [
	{
		id: 'place-1',
		type: 'restaurant',
		name: '정문 든든한식',
		categorySlug: 'korean',
		categoryName: '한식',
		zoneId: 'front-gate',
		latitude: 36.6114,
		longitude: 127.2877,
		description: '점심 회전이 빠른 정문 근처 백반 후보',
		icon: '밥',
		isVisible: true,
		displayPriority: 1
	},
	{
		id: 'place-2',
		type: 'cafe',
		name: '세종 스터디 카페',
		categorySlug: 'cafe',
		categoryName: '카페',
		zoneId: 'front-gate',
		latitude: 36.6102,
		longitude: 127.2884,
		description: '공강 시간에 노트북 펴기 좋은 카페',
		icon: '커피',
		isVisible: true,
		displayPriority: 2
	},
	{
		id: 'place-3',
		type: 'cafeteria',
		name: '학생회관 학식',
		categorySlug: 'cafeteria',
		categoryName: '학식',
		zoneId: 'student-center',
		latitude: 36.6097,
		longitude: 127.2912,
		description: '오늘 메뉴와 운영 시간을 바로 확인',
		icon: '학',
		isVisible: true,
		displayPriority: 3
	},
	{
		id: 'place-4',
		type: 'shuttle_stop',
		name: '정문 셔틀 정류장',
		categorySlug: 'shuttle',
		categoryName: '셔틀',
		zoneId: 'front-gate',
		latitude: 36.6111,
		longitude: 127.2866,
		description: '다음 셔틀 도착 시간을 보여줄 정류장 핀',
		icon: '버스',
		isVisible: true,
		displayPriority: 4
	},
	{
		id: 'place-5',
		type: 'restaurant',
		name: '조치원역 분식',
		categorySlug: 'korean',
		categoryName: '한식',
		zoneId: 'station',
		latitude: 36.6022,
		longitude: 127.296,
		description: '기차 타기 전 빠르게 먹기 좋은 후보',
		icon: '밥',
		isVisible: true,
		displayPriority: 5
	}
];

export const todayCafeteria: CafeteriaSummary = {
	summary: '돈가스, 된장국',
	mealType: '점심',
	updatedAt: '2026-07-08'
};

export const nextShuttle: ShuttleSummary = {
	stopName: '정문',
	departureTime: '16:20',
	routeName: '조치원역행'
};
