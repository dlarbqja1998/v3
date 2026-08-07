import type { CampusCoordinate, CampusSpot, CampusSpotSource, CampusSpotType } from '$lib/domain/campus-spots';

export const CAMPUS_SPOTS_CACHE_KEY = 'campus_spots:v1';
export const CAMPUS_SPOTS_CACHE_TTL = 60 * 60 * 24 * 30;

type CampusSpotRow = {
	id: string; name: string; type: string; centerLatitude: number; centerLongitude: number;
	boundary: unknown; source: string; osmId: string | null; description: string;
};

type CampusSpotCache = {
	get(key: string): Promise<string | null>;
	put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
};

export function normalizeCampusBoundary(value: unknown): CampusCoordinate[] {
	if (!Array.isArray(value)) return [];
	const boundary = value.filter((point): point is CampusCoordinate =>
		typeof point === 'object' && point !== null &&
		Number.isFinite((point as CampusCoordinate).latitude) && Number.isFinite((point as CampusCoordinate).longitude)
	);
	return boundary.length === value.length && boundary.length >= 3 ? boundary : [];
}

export function toCampusSpot(row: CampusSpotRow): CampusSpot {
	return {
		id: row.id, name: row.name, type: row.type as CampusSpotType,
		center: { latitude: row.centerLatitude, longitude: row.centerLongitude },
		boundary: normalizeCampusBoundary(row.boundary), source: row.source as CampusSpotSource,
		...(row.osmId ? { osmId: row.osmId } : {}), description: row.description
	};
}

export function getCampusSpotCenter(boundary: CampusCoordinate[]): CampusCoordinate {
	const latitude = (Math.min(...boundary.map((point) => point.latitude)) + Math.max(...boundary.map((point) => point.latitude))) / 2;
	const longitude = (Math.min(...boundary.map((point) => point.longitude)) + Math.max(...boundary.map((point) => point.longitude))) / 2;
	return { latitude, longitude };
}

export async function readCachedCampusSpots(cache: CampusSpotCache | undefined) {
	if (!cache) return null;
	try {
		const raw = await cache.get(CAMPUS_SPOTS_CACHE_KEY);
		if (!raw) return null;
		const spots = JSON.parse(raw);
		return Array.isArray(spots) && spots.every((spot) => normalizeCampusBoundary(spot?.boundary).length > 0)
			? (spots as CampusSpot[])
			: null;
	} catch {
		return null;
	}
}

export async function writeCachedCampusSpots(cache: CampusSpotCache | undefined, spots: CampusSpot[]) {
	if (!cache) return;
	try {
		await cache.put(CAMPUS_SPOTS_CACHE_KEY, JSON.stringify(spots), { expirationTtl: CAMPUS_SPOTS_CACHE_TTL });
	} catch (error) {
		console.error('campus spots cache write failed:', error);
	}
}
