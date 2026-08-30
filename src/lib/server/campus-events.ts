import { and, asc, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
	getCampusEventStatus,
	getPublicCampusEvents,
	type CampusEventCategory,
	type CampusEventInput
} from '$lib/domain/campus-events';
import { createDb, type Db } from '$lib/server/db';
import { campusEventImages, campusEvents } from '$lib/server/db/schema';

export type CampusEventRow = InferSelectModel<typeof campusEvents>;
export type CampusEventImageRow = InferSelectModel<typeof campusEventImages>;
export type CampusEventImageInsert = InferInsertModel<typeof campusEventImages>;

export type CampusEventImageDto = CampusEventImageRow & {
	kind: 'cover' | 'sub';
	url: string;
};

export type CampusEventDto = Omit<CampusEventRow, 'category'> & {
	category: CampusEventCategory;
	coverImageId: string | null;
	images: CampusEventImageDto[];
};

type CampusEventDb = Pick<Db, 'query' | 'insert' | 'update' | 'delete'>;

function getDb(databaseUrl: string, providedDb?: CampusEventDb) {
	return providedDb ?? createDb(databaseUrl);
}

function sortImages(images: CampusEventImageRow[]) {
	return [...images].sort(
		(a, b) => Number(b.isCover) - Number(a.isCover) || a.displayOrder - b.displayOrder
	);
}

export function toCampusEventDto(
	row: CampusEventRow,
	images: CampusEventImageRow[]
): CampusEventDto {
	const sortedImages = sortImages(images).map((image) => ({
		...image,
		kind: image.isCover ? ('cover' as const) : ('sub' as const),
		url: `/api/events/${row.id}/images/${image.id}`
	}));

	return {
		...row,
		category: row.category as CampusEventCategory,
		coverImageId: sortedImages.find((image) => image.isCover)?.id ?? null,
		images: sortedImages
	};
}

function attachImages(rows: CampusEventRow[], images: CampusEventImageRow[]) {
	const byEvent = new Map<string, CampusEventImageRow[]>();
	for (const image of images) {
		const eventImages = byEvent.get(image.eventId) ?? [];
		eventImages.push(image);
		byEvent.set(image.eventId, eventImages);
	}
	return rows.map((row) => toCampusEventDto(row, byEvent.get(row.id) ?? []));
}

async function listImagesForEvents(db: CampusEventDb, eventIds: string[]) {
	if (eventIds.length === 0) return [];
	return db.query.campusEventImages.findMany({
		where: inArray(campusEventImages.eventId, eventIds),
		orderBy: [desc(campusEventImages.isCover), asc(campusEventImages.displayOrder)]
	});
}

export async function listPublicCampusEvents(
	databaseUrl: string,
	now = new Date(),
	providedDb?: CampusEventDb
) {
	const db = getDb(databaseUrl, providedDb);
	const latestUpcomingStart = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
	let rows: CampusEventRow[];
	try {
		rows = await db.query.campusEvents.findMany({
			where: and(
				eq(campusEvents.isVisible, true),
				gte(campusEvents.endsAt, now),
				lte(campusEvents.startsAt, latestUpcomingStart)
			),
			orderBy: [asc(campusEvents.startsAt)]
		});
	} catch (error) {
		if (isUndefinedTableError(error)) return [];
		throw error;
	}
	const images = await listImagesForEvents(db, rows.map((row) => row.id));
	return getPublicCampusEvents(attachImages(rows, images), now);
}

function isUndefinedTableError(error: unknown): boolean {
	if (typeof error !== 'object' || error === null) return false;
	if ('code' in error && error.code === '42P01') return true;
	return 'cause' in error && isUndefinedTableError(error.cause);
}

export async function getPublicCampusEvent(
	databaseUrl: string,
	id: string,
	now = new Date(),
	providedDb?: CampusEventDb
) {
	const db = getDb(databaseUrl, providedDb);
	const row = await db.query.campusEvents.findFirst({
		where: and(eq(campusEvents.id, id), eq(campusEvents.isVisible, true))
	});
	if (!row) return null;
	const [event] = getPublicCampusEvents(
		[toCampusEventDto(row, await listImagesForEvents(db, [row.id]))],
		now
	);
	return event ?? null;
}

export async function listAdminCampusEvents(databaseUrl: string, providedDb?: CampusEventDb) {
	const db = getDb(databaseUrl, providedDb);
	const rows = await db.query.campusEvents.findMany({ orderBy: [desc(campusEvents.updatedAt)] });
	const images = await listImagesForEvents(db, rows.map((row) => row.id));
	return attachImages(rows, images);
}

export async function getAdminCampusEvent(
	databaseUrl: string,
	id: string,
	providedDb?: CampusEventDb
) {
	const db = getDb(databaseUrl, providedDb);
	const row = await db.query.campusEvents.findFirst({ where: eq(campusEvents.id, id) });
	if (!row) return null;
	return toCampusEventDto(row, await listImagesForEvents(db, [row.id]));
}

export async function createCampusEvent(
	databaseUrl: string,
	adminId: number,
	input: CampusEventInput,
	providedDb?: CampusEventDb,
	id?: string
) {
	const [created] = await getDb(databaseUrl, providedDb)
		.insert(campusEvents)
		.values({ ...input, id, createdBy: adminId })
		.returning();
	return created;
}

export async function updateCampusEvent(
	databaseUrl: string,
	id: string,
	input: CampusEventInput,
	providedDb?: CampusEventDb,
	now = new Date()
) {
	const [updated] = await getDb(databaseUrl, providedDb)
		.update(campusEvents)
		.set({ ...input, updatedAt: now })
		.where(eq(campusEvents.id, id))
		.returning();
	return updated ?? null;
}

export async function setCampusEventVisibility(
	databaseUrl: string,
	id: string,
	isVisible: boolean,
	providedDb?: CampusEventDb,
	now = new Date()
) {
	const [updated] = await getDb(databaseUrl, providedDb)
		.update(campusEvents)
		.set({ isVisible, updatedAt: now })
		.where(eq(campusEvents.id, id))
		.returning();
	return updated ?? null;
}

export async function insertCampusEventImages(
	databaseUrl: string,
	values: CampusEventImageInsert[],
	providedDb?: CampusEventDb
) {
	if (values.length === 0) return [];
	return getDb(databaseUrl, providedDb).insert(campusEventImages).values(values).returning();
}

export async function replaceCampusEventImageOrder(
	databaseUrl: string,
	eventId: string,
	orderedIds: string[],
	coverImageId: string,
	providedDb?: CampusEventDb
) {
	const db = getDb(databaseUrl, providedDb);
	const rows = await db.query.campusEventImages.findMany({
		where: eq(campusEventImages.eventId, eventId)
	});
	const allowedIds = new Set(rows.map((row) => row.id));
	if (!allowedIds.has(coverImageId) || orderedIds.some((id) => !allowedIds.has(id))) {
		throw new Error('행사 이미지 구성이 올바르지 않습니다.');
	}
	for (const [displayOrder, imageId] of orderedIds.entries()) {
		await db
			.update(campusEventImages)
			.set({ displayOrder, isCover: imageId === coverImageId })
			.where(and(eq(campusEventImages.eventId, eventId), eq(campusEventImages.id, imageId)));
	}
	return true;
}

export async function deleteCampusEventImageRows(
	databaseUrl: string,
	eventId: string,
	imageIds: string[],
	providedDb?: CampusEventDb
) {
	if (imageIds.length === 0) return [];
	return getDb(databaseUrl, providedDb)
		.delete(campusEventImages)
		.where(
			and(eq(campusEventImages.eventId, eventId), inArray(campusEventImages.id, imageIds))
		)
		.returning();
}

export async function getCampusEventImageRecord(
	databaseUrl: string,
	eventId: string,
	imageId: string,
	providedDb?: CampusEventDb
) {
	const db = getDb(databaseUrl, providedDb);
	const event = await db.query.campusEvents.findFirst({ where: eq(campusEvents.id, eventId) });
	if (!event) return null;
	const image = await db.query.campusEventImages.findFirst({
		where: and(eq(campusEventImages.eventId, eventId), eq(campusEventImages.id, imageId))
	});
	return image ? { event, image } : null;
}

export async function deleteCampusEventRows(
	databaseUrl: string,
	id: string,
	providedDb?: CampusEventDb
) {
	const db = getDb(databaseUrl, providedDb);
	const images = await db.query.campusEventImages.findMany({
		where: eq(campusEventImages.eventId, id)
	});
	const [deleted] = await db.delete(campusEvents).where(eq(campusEvents.id, id)).returning();
	return { event: deleted ?? null, images };
}

export function selectCampusEventSpotlight(events: CampusEventDto[], now = new Date()) {
	return [...events]
		.filter((event) => getCampusEventStatus(event, now) !== 'ended')
		.sort((a, b) => {
			const aStatus = getCampusEventStatus(a, now);
			const bStatus = getCampusEventStatus(b, now);
			if (aStatus !== bStatus) return aStatus === 'ongoing' ? -1 : 1;
			return aStatus === 'ongoing'
				? a.endsAt.getTime() - b.endsAt.getTime()
				: a.startsAt.getTime() - b.startsAt.getTime();
		})[0] ?? null;
}
