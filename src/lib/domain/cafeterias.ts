import type { CafeteriaPanelItem, Place } from './places';

const CAFETERIA_ID_BY_PLACE_ID: Record<string, string> = {
	'cafeteria-jinri': 'jinri',
	'cafeteria-faculty': 'faculty'
};

export const cafeteriaPlaces: Place[] = [
	{
		id: 'cafeteria-jinri',
		type: 'cafeteria',
		name: '진리관 식당',
		categorySlug: 'restaurant',
		categoryName: '식당',
		zoneId: 'front-gate',
		scope: 'campus',
		latitude: 36.61121812587927,
		longitude: 127.28464868222916,
		locationGuide: '진리관',
		operatingHours: null,
		phone: null,
		description: '조식부터 석식까지 주간 식단을 확인할 수 있어요.',
		icon: 'food',
		isVisible: true,
		displayPriority: 3
	},
	{
		id: 'cafeteria-faculty',
		type: 'cafeteria',
		name: '교직원 식당',
		categorySlug: 'restaurant',
		categoryName: '식당',
		zoneId: 'front-gate',
		scope: 'campus',
		latitude: 36.610507457052316,
		longitude: 127.28507641138197,
		locationGuide: '교직원 식당',
		operatingHours: null,
		phone: null,
		description: '교직원 식당의 주간 중식 메뉴를 확인할 수 있어요.',
		icon: 'food',
		isVisible: true,
		displayPriority: 4
	}
];

export function getCafeteriaPageHref(place: Pick<Place, 'id' | 'type'>): string | null {
	if (place.type !== 'cafeteria') return null;
	const cafeteriaId = CAFETERIA_ID_BY_PLACE_ID[place.id];
	return cafeteriaId ? `/cafeteria?cafeteria=${cafeteriaId}` : null;
}

export function getCafeteriaMapHref(place: Pick<Place, 'id'>): string {
	return `/?panel=facility&category=restaurant&place=${encodeURIComponent(place.id)}`;
}

export function getInitialCafeteriaIndex(
	cafeterias: Array<{ id: string }>,
	requestedCafeteriaId: string | null | undefined
): number {
	const requestedIndex = cafeterias.findIndex(
		(cafeteria) => cafeteria.id === requestedCafeteriaId
	);
	return requestedIndex >= 0 ? requestedIndex : 0;
}

// 기존 학식 평가·동기화 데이터의 호환을 위해 유지한다. 사용자 학식 화면에는 노출하지 않는다.
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
