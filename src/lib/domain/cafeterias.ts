import type { CafeteriaPanelItem, Place } from './places';

export const cafeteriaPlaces: Place[] = [
	{
		id: 'cafeteria-jinri',
		type: 'cafeteria',
		name: '진리관 식당',
		categorySlug: 'cafeteria',
		categoryName: '학식',
		zoneId: 'front-gate',
		latitude: 36.61121812587927,
		longitude: 127.28464868222916,
		description: '조식부터 석식까지 주간 식단을 확인할 수 있어요.',
		icon: '학',
		isVisible: true,
		displayPriority: 3
	},
	{
		id: 'cafeteria-faculty',
		type: 'cafeteria',
		name: '교직원 식당',
		categorySlug: 'cafeteria',
		categoryName: '학식',
		zoneId: 'front-gate',
		latitude: 36.610507457052316,
		longitude: 127.28507641138197,
		description: '교직원 식당의 주간 중식/석식 메뉴를 확인할 수 있어요.',
		icon: '학',
		isVisible: true,
		displayPriority: 4
	},
	{
		id: 'cafeteria-foodcourt',
		type: 'cafeteria',
		name: '학관 푸드코트',
		categorySlug: 'cafeteria',
		categoryName: '학식',
		zoneId: 'student-center',
		latitude: 36.610478424045624,
		longitude: 127.2896423876288,
		description: '바비든든, 비비고고, 값찌개가 들어온 고정 메뉴형 푸드코트예요.',
		icon: '학',
		isVisible: true,
		displayPriority: 5
	}
];

export const staticFoodCourtVendors: NonNullable<CafeteriaPanelItem['staticVendors']> = [
	{ id: 'babi', name: '바비든든', menus: [] },
	{ id: 'bibigogo', name: '비비고고', menus: [] },
	{ id: 'gapjjigae', name: '값찌개', menus: [] }
];
