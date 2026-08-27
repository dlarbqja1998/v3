export const FACILITY_CATEGORIES = [
	{
		slug: 'convenience-store',
		name: '편의점',
		icon: 'convenience_store_GS',
		displayOrder: 1
	},
	{ slug: 'cafe', name: '카페', icon: 'cafe', displayOrder: 2 },
	{ slug: 'copy-room', name: '복사실', icon: 'print', displayOrder: 3 },
	{ slug: 'crimson-store', name: '크림슨스토어', icon: 'crimson_store', displayOrder: 4 },
	{ slug: 'gym', name: '헬스장', icon: 'gym', displayOrder: 5 },
	{ slug: 'post-office', name: '우체국', icon: 'post_office', displayOrder: 6 }
] as const;

export type FacilityCategorySlug = (typeof FACILITY_CATEGORIES)[number]['slug'];
export type FacilityIconName = (typeof FACILITY_CATEGORIES)[number]['icon'];

export function isFacilityCategorySlug(value: string): value is FacilityCategorySlug {
	return FACILITY_CATEGORIES.some((category) => category.slug === value);
}

export function isFacilityIconName(value: string): value is FacilityIconName {
	return FACILITY_CATEGORIES.some((category) => category.icon === value);
}
