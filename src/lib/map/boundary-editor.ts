import type { CampusCoordinate } from '$lib/domain/campus-spots';

export function insertBoundaryPointOnNearestEdge(
	boundary: CampusCoordinate[],
	point: CampusCoordinate
): CampusCoordinate[] {
	if (boundary.length < 2) return [...boundary, point];

	let nearestEdgeStartIndex = 0;
	let shortestDistance = Number.POSITIVE_INFINITY;

	for (let index = 0; index < boundary.length; index += 1) {
		const start = boundary[index];
		const end = boundary[(index + 1) % boundary.length];
		const distance = squaredDistanceToSegment(point, start, end);
		if (distance < shortestDistance) {
			shortestDistance = distance;
			nearestEdgeStartIndex = index;
		}
	}

	const insertionIndex = nearestEdgeStartIndex + 1;
	return [...boundary.slice(0, insertionIndex), point, ...boundary.slice(insertionIndex)];
}

function squaredDistanceToSegment(
	point: CampusCoordinate,
	start: CampusCoordinate,
	end: CampusCoordinate
) {
	const edgeLatitude = end.latitude - start.latitude;
	const edgeLongitude = end.longitude - start.longitude;
	const edgeLengthSquared = edgeLatitude ** 2 + edgeLongitude ** 2;
	if (edgeLengthSquared === 0) return squaredDistance(point, start);

	const projection = Math.min(
		1,
		Math.max(
			0,
			((point.latitude - start.latitude) * edgeLatitude +
				(point.longitude - start.longitude) * edgeLongitude) / edgeLengthSquared
		)
	);
	return squaredDistance(point, {
		latitude: start.latitude + projection * edgeLatitude,
		longitude: start.longitude + projection * edgeLongitude
	});
}

function squaredDistance(left: CampusCoordinate, right: CampusCoordinate) {
	return (left.latitude - right.latitude) ** 2 + (left.longitude - right.longitude) ** 2;
}
