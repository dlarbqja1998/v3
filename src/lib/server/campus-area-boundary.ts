import { eq } from 'drizzle-orm';
import type { CampusCoordinate } from '$lib/domain/campus-spots';
import { CAMPUS_AREA_NAME } from '$lib/domain/commercial-zones';
import { createDb } from '$lib/server/db';
import { zones } from '$lib/server/db/schema';
import { getCampusSpotCenter } from './campus-spots';
import { normalizeZoneBoundary } from './zone-editor';

// 전체 캠퍼스 경계는 기존 구역 저장소에 보관하되 상권·시설 구역 목록에는 섞지 않는다.
export const CAMPUS_BOUNDARY_SLUG = 'campus-area-boundary';

export function isCampusAreaZone(zone: { slug: string }) {
	return zone.slug === CAMPUS_BOUNDARY_SLUG;
}

export async function readCampusAreaBoundary(databaseUrl: string): Promise<CampusCoordinate[]> {
	const [row] = await createDb(databaseUrl).select({ polygon: zones.polygon }).from(zones)
		.where(eq(zones.slug, CAMPUS_BOUNDARY_SLUG)).limit(1);
	return normalizeZoneBoundary(row?.polygon);
}

export async function saveCampusAreaBoundary(databaseUrl: string, boundary: CampusCoordinate[]) {
	const center = getCampusSpotCenter(boundary);
	const values = {
		name: CAMPUS_AREA_NAME,
		polygon: boundary,
		centerLatitude: center.latitude,
		centerLongitude: center.longitude,
		isVisible: false,
		updatedAt: new Date()
	};
	await createDb(databaseUrl).insert(zones).values({ ...values, slug: CAMPUS_BOUNDARY_SLUG })
		.onConflictDoUpdate({ target: zones.slug, set: values });
}
