export type MapFocusMode = 'default' | 'top-band';

const defaultLatitudeOffset = 0;
const topBandMarkerTargetRatio = 1 / 12;
const placeFocusZoomOffset = 2;
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

export function getPlaceFocusZoom(homeZoom: number) {
	return homeZoom + placeFocusZoomOffset;
}

export function getAvailableMapMarkerTargetRatio({
	mapHeight,
	navigationHeight,
	sheetHeight
}: {
	mapHeight: number;
	navigationHeight: number;
	sheetHeight: number;
}) {
	const safeMapHeight = Math.max(1, mapHeight);
	const availableMapHeight = Math.max(0, safeMapHeight - Math.max(0, navigationHeight) - Math.max(0, sheetHeight));

	return Math.min(1, availableMapHeight / (safeMapHeight * 2));
}

export function shouldFocusMapArea(activePlaceId: string) {
	return !activePlaceId;
}

export function getSheetAwareLatitudeOffset({
	latitude,
	zoom,
	mapHeight,
	focusMode,
	markerTargetRatio
}: {
	latitude: number;
	zoom: number;
	mapHeight: number;
	focusMode: MapFocusMode;
	markerTargetRatio?: number;
}) {
	const resolvedMarkerTargetRatio = markerTargetRatio ?? getMarkerTargetRatio(focusMode);
	if (resolvedMarkerTargetRatio === 0.5) {
		return defaultLatitudeOffset;
	}

	const markerCenterRatio = 0.5;
	const verticalShiftPixels = mapHeight * (markerCenterRatio - resolvedMarkerTargetRatio);
	const metersPerPixel =
		(156543.03392 * Math.cos((latitude * Math.PI) / 180)) / Math.pow(2, zoom);
	const latitudeDegreesPerMeter = 1 / 111320;

	return verticalShiftPixels * metersPerPixel * latitudeDegreesPerMeter;
}
