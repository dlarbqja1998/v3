export type MapAreaMode = 'campus' | 'outside';

export const CAMPUS_AREA_ID = 'campus';
export const CAMPUS_AREA_NAME = '고려대학교 세종캠퍼스';

const PRIORITY_ZONE_NAMES = ['고대앞', '욱일', '홍대사이', '조치원역'] as const;

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

export type MapAreaOption = {
	id: string;
	name: string;
	mode: MapAreaMode;
};

export function buildMapAreaOptions(zones: CommercialZone[]): MapAreaOption[] {
	const priority = new Map<string, number>(
		PRIORITY_ZONE_NAMES.map((name, index) => [name, index])
	);
	const sortedZones = [...zones].sort((left, right) => {
		const leftPriority = priority.get(left.name) ?? Number.POSITIVE_INFINITY;
		const rightPriority = priority.get(right.name) ?? Number.POSITIVE_INFINITY;
		if (leftPriority !== rightPriority) return leftPriority - rightPriority;
		return left.name.localeCompare(right.name, 'ko-KR');
	});

	return [
		{ id: CAMPUS_AREA_ID, name: CAMPUS_AREA_NAME, mode: 'campus' },
		...sortedZones.map((zone) => ({ id: zone.id, name: zone.name, mode: 'outside' as const }))
	];
}

export function changeSelectedMapArea(areaId: string) {
	return areaId === CAMPUS_AREA_ID
		? { mode: 'campus' as const, selectedZoneId: 'all' as const }
		: { mode: 'outside' as const, selectedZoneId: areaId };
}

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

export function getVisibleCommercialZones(
	zones: CommercialZone[],
	selectedZoneId: 'all' | string
): CommercialZone[] {
	if (selectedZoneId === 'all') return zones;
	return zones.filter((zone) => zone.id === selectedZoneId);
}
