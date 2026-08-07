export const DEFAULT_CAMPUS_BOUNDARIES_VISIBLE = true;
export const DEFAULT_HOME_CAMPUS_SPOT_ID = 'new-main-gate';
export const DEFAULT_HOME_MAP_ZOOM = 17;

export function shouldShowCampusCenterMarker(activeSpotId: string, spotId: string) {
	return Boolean(activeSpotId) && activeSpotId === spotId;
}
