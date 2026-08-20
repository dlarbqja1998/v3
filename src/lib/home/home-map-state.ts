import { CAMPUS_AREA_ID } from '$lib/domain/commercial-zones';
import type {
	OutsideCuisine,
	OutsidePlaceCategory
} from '$lib/domain/outside-place-filters';

export type HomeMapResetState = {
	selectedMapAreaId: typeof CAMPUS_AREA_ID;
	areaMode: 'campus';
	selectedCommercialZoneId: 'all';
	selectedOutsideCategory: OutsidePlaceCategory;
	selectedOutsideCuisine: OutsideCuisine;
};

export function getHomeMapResetState(): HomeMapResetState {
	return {
		selectedMapAreaId: CAMPUS_AREA_ID,
		areaMode: 'campus',
		selectedCommercialZoneId: 'all',
		selectedOutsideCategory: 'all',
		selectedOutsideCuisine: 'all'
	};
}
