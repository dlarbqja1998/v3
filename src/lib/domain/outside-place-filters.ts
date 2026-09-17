export type OutsidePlaceCategory = 'all' | 'restaurant' | 'cafe' | 'bar';

export type OutsideCuisine =
	| 'all'
	| 'korean'
	| 'chinese'
	| 'japanese'
	| 'western'
	| 'snack'
	| 'chicken'
	| 'fastfood'
	| 'asian'
	| 'meat'
	| 'snack-cutlet'
	| 'chicken-fastfood'
	| 'other';

export const outsidePlaceCategoryOptions: { value: OutsidePlaceCategory; label: string }[] = [
	{ value: 'all', label: '전체' },
	{ value: 'restaurant', label: '음식점' },
	{ value: 'cafe', label: '카페' },
	{ value: 'bar', label: '술집' }
];

export const outsideCuisineOptions: { value: OutsideCuisine; label: string }[] = [
	{ value: 'all', label: '전체 음식점' },
	{ value: 'korean', label: '한식' },
	{ value: 'chinese', label: '중식' },
	{ value: 'japanese', label: '일식' },
	{ value: 'western', label: '양식' },
	{ value: 'snack', label: '분식' },
	{ value: 'chicken', label: '치킨' },
	{ value: 'fastfood', label: '피자·버거' },
	{ value: 'asian', label: '아시아' },
	{ value: 'other', label: '기타' }
];

export function getOutsideCuisineLabel(cuisine: OutsideCuisine) {
	return outsideCuisineOptions.find((option) => option.value === cuisine)?.label ?? '필터';
}
