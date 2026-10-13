import type { CampusCoordinate, CampusSpot } from '$lib/domain/campus-spots';

type CampusBoundarySpot = Pick<CampusSpot, 'boundary'>;

const cross = (a: CampusCoordinate, b: CampusCoordinate, c: CampusCoordinate) =>
	(b.longitude - a.longitude) * (c.latitude - a.latitude) -
	(b.latitude - a.latitude) * (c.longitude - a.longitude);

/** 건물·야외 공간을 감싸는 표시용 외곽 초안. 실제 담장·필지 경계로 확정한 선은 아니다. */
export function getCampusAreaBoundary(spots: CampusBoundarySpot[]): CampusCoordinate[] {
	const unique = new Map<string, CampusCoordinate>();
	for (const point of spots.flatMap(spot => spot.boundary)) {
		if (Number.isFinite(point.latitude) && Number.isFinite(point.longitude)) {
			unique.set(`${point.latitude},${point.longitude}`, point);
		}
	}
	const points = [...unique.values()].sort((a, b) => a.longitude - b.longitude || a.latitude - b.latitude);
	if (points.length < 3) return [];
	const half = (ordered: CampusCoordinate[]) => {
		const edge: CampusCoordinate[] = [];
		for (const point of ordered) {
			while (edge.length > 1 && cross(edge[edge.length - 2], edge[edge.length - 1], point) <= 0) edge.pop();
			edge.push(point);
		}
		return edge.slice(0, -1);
	};
	const boundary = [...half(points), ...half([...points].reverse())];
	return boundary.length >= 3 ? boundary : [];
}
