export type MapFocusMode = 'default' | 'top-band';

// 교외 전체는 바텀시트 높이와 관계없이 같은 중심과 배율로 시작한다.
export const OUTSIDE_OVERVIEW_CAMERA = {
	latitude: 36.6039,
	longitude: 127.29497909545898,
	zoom: 14
} as const;

// 사용자가 맞춘 첫 진입 구도. 좌표는 상단과 시트 사이에 보이는 지도의 중심이다.
export const OUTSIDE_ZONE_CAMERAS: Record<string, { latitude: number; longitude: number; zoom: number }> = {
	고대앞: {
		latitude: 36.60785865300668,
		longitude: 127.29040861129761,
		zoom: 16
	},
	욱일: {
		latitude: 36.60273839959931,
		longitude: 127.29068756103516,
		zoom: 15
	},
	홍대사이: {
		latitude: 36.61669018361354,
		longitude: 127.28712558746338,
		zoom: 15
	},
	조치원역: {
		latitude: 36.6022560705765,
		longitude: 127.3006010055542,
		zoom: 15
	},
	신흥리: {
		latitude: 36.59546869240584,
		longitude: 127.29055881500244,
		zoom: 15
	},
	죽림리: {
		latitude: 36.59195418076883,
		longitude: 127.29660987854004,
		zoom: 15
	}
};

const defaultLatitudeOffset = 0;
const topBandMarkerTargetRatio = 1 / 12;
const placeFocusZoomOffset = 3;
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
	sheetHeight,
	topOverlayHeight = 0
}: {
	mapHeight: number;
	navigationHeight: number;
	sheetHeight: number;
	topOverlayHeight?: number;
}) {
	const safeMapHeight = Math.max(1, mapHeight);
	const availableMapHeight = Math.max(0, safeMapHeight - Math.max(0, navigationHeight) - Math.max(0, sheetHeight));

	const top = Math.min(availableMapHeight, Math.max(0, topOverlayHeight));
	return Math.min(1, (top + availableMapHeight) / (safeMapHeight * 2));
}

export function shouldFocusMapArea(activePlaceId: string) {
	return !activePlaceId;
}

/** 첫 구역 선택 시 공통 상단과 시트가 가리지 않는 지도 영역을 기준으로 맞춘다. */
export function getOutsideMapFocusInsets(mapHeight: number, topOverlay: number, bottomOverlay: number) {
	const height = Math.max(1, mapHeight);
	const top = Math.min(Math.max(0, topOverlay) + 24, height * 0.4);
	const bottom = Math.min(Math.max(0, bottomOverlay) + 28, Math.max(0, height - top - 120));
	return { top, right: 32, bottom, left: 32, maxZoom: 17 };
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
