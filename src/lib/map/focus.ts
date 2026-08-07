export type MapFocusMode = 'default' | 'top-band';

const defaultLatitudeOffset = 0;
const topBandMarkerTargetRatio = 1 / 12;
const mapCenterBounds = {
	south: 36.5938,
	west: 127.2765,
	north: 36.6215,
	east: 127.3065
};

export function getMapCenterBounds() {
	return mapCenterBounds;
}

export function getMarkerTargetRatio(focusMode: MapFocusMode) {
	return focusMode === 'top-band' ? topBandMarkerTargetRatio : 0.5;
}

export function getSheetAwareLatitudeOffset({
	latitude,
	zoom,
	mapHeight,
	focusMode
}: {
	latitude: number;
	zoom: number;
	mapHeight: number;
	focusMode: MapFocusMode;
}) {
	if (focusMode === 'default') {
		return defaultLatitudeOffset;
	}

	const markerTargetRatio = getMarkerTargetRatio(focusMode);
	const markerCenterRatio = 0.5;
	const verticalShiftPixels = mapHeight * (markerCenterRatio - markerTargetRatio);
	const metersPerPixel =
		(156543.03392 * Math.cos((latitude * Math.PI) / 180)) / Math.pow(2, zoom);
	const latitudeDegreesPerMeter = 1 / 111320;

	return verticalShiftPixels * metersPerPixel * latitudeDegreesPerMeter;
}
