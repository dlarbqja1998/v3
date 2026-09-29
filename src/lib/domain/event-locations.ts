import type { CampusCoordinate, CampusSpot } from './campus-spots';
import { normalizeBuildingName } from './campus-facilities';

export type CampusEventLocation =
	| { type: 'pin' }
	| { type: 'building'; buildingIds: string[] }
	| { type: 'area'; boundary: CampusCoordinate[] };

export type LocatedCampusEvent = CampusCoordinate & {
	id: string;
	locationName: string;
	location?: CampusEventLocation | null;
};

export function isEventCoordinate(value: unknown): value is CampusCoordinate {
	if (!value || typeof value !== 'object') return false;
	const point = value as CampusCoordinate;
	return Number.isFinite(point.latitude) && Math.abs(point.latitude) <= 90 &&
		Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180;
}

function cross(a: CampusCoordinate, b: CampusCoordinate, c: CampusCoordinate) {
	return (b.longitude - a.longitude) * (c.latitude - a.latitude) -
		(b.latitude - a.latitude) * (c.longitude - a.longitude);
}

function onSegment(point: CampusCoordinate, a: CampusCoordinate, b: CampusCoordinate) {
	return Math.abs(cross(a, b, point)) < 1e-12 &&
		point.latitude >= Math.min(a.latitude, b.latitude) - 1e-10 &&
		point.latitude <= Math.max(a.latitude, b.latitude) + 1e-10 &&
		point.longitude >= Math.min(a.longitude, b.longitude) - 1e-10 &&
		point.longitude <= Math.max(a.longitude, b.longitude) + 1e-10;
}

function segmentsIntersect(a: CampusCoordinate, b: CampusCoordinate, c: CampusCoordinate, d: CampusCoordinate) {
	return (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0) ||
		onSegment(c, a, b) || onSegment(d, a, b) || onSegment(a, c, d) || onSegment(b, c, d);
}

/** 경계 위의 핀도 해당 장소에 포함한다. */
export function eventPointInBoundary(point: CampusCoordinate, boundary: CampusCoordinate[]) {
	if (boundary.length < 3) return false;
	let inside = false;
	for (let i = 0, j = boundary.length - 1; i < boundary.length; j = i++) {
		const a = boundary[j], b = boundary[i];
		if (onSegment(point, a, b)) return true;
		if ((a.latitude > point.latitude) !== (b.latitude > point.latitude) &&
			point.longitude < (b.longitude - a.longitude) * (point.latitude - a.latitude) /
				(b.latitude - a.latitude) + a.longitude) inside = !inside;
	}
	return inside;
}

export function eventBoundariesOverlap(a: CampusCoordinate[], b: CampusCoordinate[]) {
	if (a.length < 3 || b.length < 3) return false;
	if (a.some((point) => eventPointInBoundary(point, b)) || b.some((point) => eventPointInBoundary(point, a))) return true;
	return a.some((point, i) => b.some((other, j) =>
		segmentsIntersect(point, a[(i + 1) % a.length], other, b[(j + 1) % b.length])));
}

export function isValidEventBoundary(boundary: unknown): boundary is CampusCoordinate[] {
	if (!Array.isArray(boundary) || boundary.length < 3 || boundary.length > 64 || !boundary.every(isEventCoordinate)) return false;
	if (new Set(boundary.map((point) => `${point.latitude},${point.longitude}`)).size !== boundary.length) return false;
	const origin = boundary[0];
	const area = boundary.reduce((sum, point, i) => sum + cross(origin, point, boundary[(i + 1) % boundary.length]), 0);
	if (Math.abs(area) < 1e-12) return false;
	for (let i = 0; i < boundary.length; i++) {
		for (let j = i + 1; j < boundary.length; j++) {
			if (j === i + 1 || (i === 0 && j === boundary.length - 1)) continue;
			if (segmentsIntersect(boundary[i], boundary[(i + 1) % boundary.length], boundary[j], boundary[(j + 1) % boundary.length])) return false;
		}
	}
	return true;
}

export function getEventAreaCenter(boundary: CampusCoordinate[]): CampusCoordinate {
	return {
		latitude: (Math.min(...boundary.map((p) => p.latitude)) + Math.max(...boundary.map((p) => p.latitude))) / 2,
		longitude: (Math.min(...boundary.map((p) => p.longitude)) + Math.max(...boundary.map((p) => p.longitude))) / 2
	};
}

export function parseCampusEventLocation(raw: unknown): CampusEventLocation | null {
	if (!raw || typeof raw !== 'object') return null;
	const value = raw as Record<string, unknown>;
	if (value.type === 'pin') return { type: 'pin' };
	if (value.type === 'area' && isValidEventBoundary(value.boundary)) return { type: 'area', boundary: value.boundary };
	if (value.type === 'building' && Array.isArray(value.buildingIds) && value.buildingIds.length > 0 &&
		value.buildingIds.length <= 40 && value.buildingIds.every((id) => typeof id === 'string' && id.length > 0 && id.length <= 160)) {
		return { type: 'building', buildingIds: [...new Set(value.buildingIds)] };
	}
	return null;
}

export function getCampusEventSpots(event: LocatedCampusEvent, spots: CampusSpot[]) {
	const location = event.location;
	if (location?.type === 'building') return spots.filter((spot) => spot.type === 'building' && location.buildingIds.includes(spot.id));
	if (location?.type === 'area') return spots.filter((spot) => eventBoundariesOverlap(location.boundary, spot.boundary));
	// 이전에 장소명만 입력한 행사도 건물에 연결한다. 명시적인 핀은 좌표만 사용한다.
	if (!location) {
		const named = spots.filter((spot) => normalizeBuildingName(spot.name) === normalizeBuildingName(event.locationName));
		if (named.length) return named;
	}
	return spots.filter((spot) => eventPointInBoundary(event, spot.boundary));
}

export function groupCampusEventsBySpot<T extends LocatedCampusEvent>(events: T[], spots: CampusSpot[]) {
	const groups: Record<string, T[]> = {};
	for (const event of events) {
		for (const spot of getCampusEventSpots(event, spots)) {
			const group = groups[spot.id] ??= [];
			if (!group.some((item) => item.id === event.id)) group.push(event);
		}
	}
	return groups;
}

/** 건물·구역에 행사 개수가 표시되면 같은 행사의 개별 핀은 중복으로 띄우지 않는다. */
export function getStandaloneCampusEvents<T extends LocatedCampusEvent>(events: T[], spots: CampusSpot[]) {
	return events.filter((event) => event.location?.type !== 'building' && getCampusEventSpots(event, spots).length === 0);
}
