import type { Place, PlaceScope } from '$lib/domain/places';

export type FacilityDiscoveryState = {
	scope: PlaceScope;
	zoneId: string;
	categorySlug: string;
	query: string;
};

export function getVisibleFacilityPlaces(places: Place[], state: FacilityDiscoveryState) {
	const query = state.query.trim().toLocaleLowerCase('ko');
	return places
		.filter((place) => place.type === 'facility' && place.isVisible && place.scope === state.scope)
		.filter((place) => state.zoneId === 'all' || place.zoneId === state.zoneId)
		.filter(
			(place) => state.categorySlug === 'all' || place.categorySlug === state.categorySlug
		)
		.filter(
			(place) =>
				!query ||
				`${place.name} ${place.categoryName}`.toLocaleLowerCase('ko').includes(query)
		)
		.sort(
			(a, b) =>
				a.displayPriority - b.displayPriority || a.name.localeCompare(b.name, 'ko')
		);
}

export function getNextActivePlaceId(places: Place[], requestedId: string) {
	return places.some((place) => place.id === requestedId) ? requestedId : (places[0]?.id ?? '');
}

export function getFacilitySearchPlaceholder(scope: PlaceScope, areaLabel: string) {
	return scope === 'campus' ? '교내 시설을 검색해 보세요' : `${areaLabel} 시설을 검색해 보세요`;
}
