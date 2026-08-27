import type { Place, PlaceScope } from '$lib/domain/places';

export type PublicPlaceFilter = {
	scope?: PlaceScope;
	zone?: string;
	category?: string;
	query?: string;
	facilityOnly?: boolean;
};

export function filterPublicPlaces(places: Place[], filter: PublicPlaceFilter) {
	const query = filter.query?.trim().toLocaleLowerCase('ko') ?? '';
	return places.filter((place) => {
		if (!place.isVisible || (filter.facilityOnly && place.type !== 'facility')) return false;
		if (filter.scope && place.scope !== filter.scope) return false;
		if (filter.zone && filter.zone !== 'all' && place.zoneId !== filter.zone) return false;
		if (
			filter.category &&
			filter.category !== 'all' &&
			place.categorySlug !== filter.category
		) {
			return false;
		}
		return (
			!query ||
			`${place.name} ${place.categoryName}`.toLocaleLowerCase('ko').includes(query)
		);
	});
}
