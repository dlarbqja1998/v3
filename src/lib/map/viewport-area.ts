import { CAMPUS_AREA_ID, type CommercialCoordinate, type CommercialZone } from '$lib/domain/commercial-zones';
import { findContainingZoneId } from '$lib/domain/facility-zone';
import type { CampusSpot } from '$lib/domain/campus-spots';
import { getCampusAreaBoundary } from './campus-area-boundary';

export type MapViewport = CommercialCoordinate & { zoom: number };

const CAMPUS_CENTER = { latitude: 36.6093, longitude: 127.2875 };
const NEARBY_METERS = 450;
const BORDER_TOLERANCE_METERS = 35;

function distanceMeters(a: CommercialCoordinate, b: CommercialCoordinate) {
	const latitude = (a.latitude + b.latitude) * Math.PI / 360;
	return Math.hypot((a.latitude - b.latitude) * 111320, (a.longitude - b.longitude) * 111320 * Math.cos(latitude));
}

function distanceToBoundary(point: CommercialCoordinate, boundary: CommercialCoordinate[]) {
	let distance = Infinity;
	const longitudeScale = 111320 * Math.cos(point.latitude * Math.PI / 180);
	for (let index = 0; index < boundary.length; index++) {
		const a = boundary[index], b = boundary[(index + 1) % boundary.length];
		const x = (a.longitude - point.longitude) * longitudeScale, y = (a.latitude - point.latitude) * 111320;
		const dx = (b.longitude - a.longitude) * longitudeScale, dy = (b.latitude - a.latitude) * 111320;
		const length = dx * dx + dy * dy;
		const ratio = length ? Math.max(0, Math.min(1, -(x * dx + y * dy) / length)) : 0;
		distance = Math.min(distance, Math.hypot(x + dx * ratio, y + dy * ratio));
	}
	return distance;
}

/** 이동이 끝난 지도의 가시 영역 중심으로 구역을 판정한다. 경계의 작은 움직임은 유지한다. */
export function resolveViewportArea(
	viewport: MapViewport,
	zones: CommercialZone[],
	campusSpots: Pick<CampusSpot, 'id' | 'center' | 'boundary'>[],
	previousAreaId = CAMPUS_AREA_ID,
	customCampusBoundary?: CommercialCoordinate[]
) {
	if (viewport.zoom < 14) return 'outside-all';
	const hasCustomBoundary = Boolean(customCampusBoundary && customCampusBoundary.length >= 3);
	const campusBoundary = hasCustomBoundary ? customCampusBoundary! : getCampusAreaBoundary(campusSpots);
	const areas = [{ id: CAMPUS_AREA_ID, boundary: campusBoundary }, ...zones];
	const previous = areas.find(area => area.id === previousAreaId);
	const containingArea = findContainingZoneId(viewport, areas);
	// 경계선 바로 바깥에서는 기존 구역을 유지해 왕복 전환과 목록 재생성을 막는다.
	if (previous && previous.boundary.length >= 3 && (
		containingArea === previous.id || distanceToBoundary(viewport, previous.boundary) <= BORDER_TOLERANCE_METERS
	)) return previous.id;
	if (containingArea) return containingArea;
	if (!hasCustomBoundary && findContainingZoneId(viewport, campusSpots)) return CAMPUS_AREA_ID;

	// 건물 사이의 교내 도로와 상권 폴리곤 사이의 빈 공간도 자연스럽게 이어 준다.
	const campusDistance = Math.min(...(campusSpots.length ? campusSpots.map(spot => spot.center) : [CAMPUS_CENTER])
		.map(center => distanceMeters(viewport, center)));
	const candidates = [
		...(!hasCustomBoundary ? [{ id: CAMPUS_AREA_ID, distance: campusDistance, reach: 180 }] : []),
		...zones.map(zone => ({ id: zone.id, distance: distanceMeters(viewport, zone.center), reach: NEARBY_METERS }))
	].filter(candidate => candidate.distance <= candidate.reach).sort((a, b) => a.distance - b.distance);
	const nearest = candidates[0];
	if (!nearest) return 'outside-all';
	const previousCandidate = candidates.find(candidate => candidate.id === previousAreaId);
	return previousCandidate && previousCandidate.distance <= nearest.distance + BORDER_TOLERANCE_METERS ? previousCandidate.id : nearest.id;
}
