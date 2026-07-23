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
		icon: '식당',
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
		description: '교직원 식당의 주간 중식과 석식 메뉴를 확인할 수 있어요.',
		icon: '식당',
		isVisible: true,
		displayPriority: 4
	},
	{
		id: 'cafeteria-foodcourt',
		type: 'cafeteria',
		name: '학생회관 푸드코트',
		categorySlug: 'cafeteria',
		categoryName: '학식',
		zoneId: 'student-center',
		latitude: 36.610478424045624,
		longitude: 127.2896423876288,
		description: '바비든, 비비고고, 갑찌개가 있는 고정 메뉴 푸드코트예요.',
		icon: '식당',
		isVisible: true,
		displayPriority: 5
	}
];

export const staticFoodCourtVendors: NonNullable<CafeteriaPanelItem['staticVendors']> = [
	{
		id: 'babi',
		name: '바비든',
		menus: [
			{ id: 'babi-bulgogi-rice', name: '불고기 덮밥', price: 7000 },
			{ id: 'babi-spicy-pork-rice', name: '제육 덮밥', price: 7000 }
		]
	},
	{
		id: 'bibigogo',
		name: '비비고고',
		menus: [
			{ id: 'bibigogo-bibimbap', name: '비빔밥', price: 6500 },
			{ id: 'bibigogo-stone-bibimbap', name: '돌솥 비빔밥', price: 7500 }
		]
	},
	{
		id: 'gapjjigae',
		name: '갑찌개',
		menus: [
			{ id: 'gapjjigae-kimchi-stew', name: '김치찌개', price: 7000 },
			{ id: 'gapjjigae-budae-stew', name: '부대찌개', price: 7500 }
		]
	}
];
