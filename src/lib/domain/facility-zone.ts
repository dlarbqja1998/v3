export type FacilityCoordinate = { latitude: number; longitude: number };
export type FacilityZone = { id: string; boundary: FacilityCoordinate[] };

export function findContainingZoneId(point: FacilityCoordinate, zones: FacilityZone[]) {
	return zones.find((zone) => isPointInPolygon(point, zone.boundary))?.id ?? null;
}

function isPointInPolygon(point: FacilityCoordinate, polygon: FacilityCoordinate[]) {
	if (polygon.length < 3) return false;
	let inside = false;
	for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
		const currentPoint = polygon[index];
		const previousPoint = polygon[previous];
		const crosses =
			currentPoint.latitude > point.latitude !== previousPoint.latitude > point.latitude &&
			point.longitude <
				((previousPoint.longitude - currentPoint.longitude) *
					(point.latitude - currentPoint.latitude)) /
					(previousPoint.latitude - currentPoint.latitude) +
					currentPoint.longitude;
		if (crosses) inside = !inside;
	}
	return inside;
}
