import { CAMPUS_AREA_ID } from '$lib/domain/commercial-zones';
import type {
	OutsideCuisine,
	OutsidePlaceCategory
} from '$lib/domain/outside-place-filters';
import type { BottomSheetDetent } from '$lib/domain/bottom-sheet';

export type ShuttlePanelOpenSource = 'home_map' | 'home_bottom_navigation';

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

export function getShuttlePanelInitialDetent(
	source: ShuttlePanelOpenSource
): BottomSheetDetent {
	return source === 'home_map' ? 'medium' : 'collapsed';
}
