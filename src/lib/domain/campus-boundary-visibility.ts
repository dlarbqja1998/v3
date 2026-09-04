export const DEFAULT_CAMPUS_BOUNDARIES_VISIBLE = true;
export const DEFAULT_HOME_CAMPUS_SPOT_ID = 'building-학술정보원';
export const DEFAULT_HOME_MAP_ZOOM = 16;
const DEFAULT_HOME_LONGITUDE_OFFSET = -0.00025;

type MapCoordinate = {
	latitude: number;
	longitude: number;
};

export function getCampusSpotFocusCenter(
	focusSpotId: string,
	spotCenter: MapCoordinate,
	activeSpotId: string
): MapCoordinate {
	if (focusSpotId !== DEFAULT_HOME_CAMPUS_SPOT_ID || activeSpotId) return spotCenter;

	return {
		latitude: spotCenter.latitude,
		longitude: spotCenter.longitude + DEFAULT_HOME_LONGITUDE_OFFSET
	};
}

export function shouldShowCampusCenterMarker(activeSpotId: string, spotId: string) {
	return Boolean(activeSpotId) && activeSpotId === spotId;
}
