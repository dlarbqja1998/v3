export type MapAreaMode = 'campus' | 'outside';

export type CommercialCoordinate = {
	latitude: number;
	longitude: number;
};

export type CommercialZone = {
	id: string;
	name: string;
	center: CommercialCoordinate;
	boundary: CommercialCoordinate[];
};

export type CoordinateBounds = {
	north: number;
	south: number;
	east: number;
	west: number;
};

export function changeMapAreaMode(nextMode: MapAreaMode) {
	return {
		mode: nextMode,
		selectedZoneId: 'all' as const
	};
}

export function getCommercialZoneBounds(
	zones: CommercialZone[],
	selectedZoneId: 'all' | string
): CoordinateBounds | null {
	const targetZones =
		selectedZoneId === 'all' ? zones : zones.filter((zone) => zone.id === selectedZoneId);
	if (targetZones.length === 0) return null;

	const coordinates = targetZones.flatMap((zone) =>
		zone.boundary.length > 0 ? zone.boundary : [zone.center]
	);
	if (coordinates.length === 0) return null;

	return coordinates.reduce<CoordinateBounds>(
		(bounds, coordinate) => ({
			north: Math.max(bounds.north, coordinate.latitude),
			south: Math.min(bounds.south, coordinate.latitude),
			east: Math.max(bounds.east, coordinate.longitude),
			west: Math.min(bounds.west, coordinate.longitude)
		}),
		{
			north: Number.NEGATIVE_INFINITY,
			south: Number.POSITIVE_INFINITY,
			east: Number.NEGATIVE_INFINITY,
			west: Number.POSITIVE_INFINITY
		}
	);
}
