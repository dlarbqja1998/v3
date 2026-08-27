import { and, desc, eq } from 'drizzle-orm';
import type { NoticeInput, NoticeStatus } from '$lib/domain/notices';
import { createDb, type Db } from '$lib/server/db';
import { notices } from '$lib/server/db/schema';

type NoticeDb = Pick<Db, 'query' | 'insert' | 'update'>;

function getDb(databaseUrl: string, providedDb?: NoticeDb) {
	return providedDb ?? createDb(databaseUrl);
}

export function resolvePublishedAt(
	status: NoticeStatus,
	previous: Date | null,
	now = new Date()
) {
	if (status !== 'PUBLISHED') return previous;
	return previous ?? now;
}

export async function listPublicNotices(databaseUrl: string, providedDb?: NoticeDb) {
	return getDb(databaseUrl, providedDb).query.notices.findMany({
		where: eq(notices.status, 'PUBLISHED'),
		orderBy: [desc(notices.isPinned), desc(notices.publishedAt), desc(notices.createdAt)]
	});
}

export async function getPublicNotice(
	databaseUrl: string,
	id: string,
	providedDb?: NoticeDb
) {
	return (
		(await getDb(databaseUrl, providedDb).query.notices.findFirst({
			where: and(eq(notices.id, id), eq(notices.status, 'PUBLISHED'))
		})) ?? null
	);
}

export async function getHomeNotice(databaseUrl: string, providedDb?: NoticeDb) {
	return (
		(await getDb(databaseUrl, providedDb).query.notices.findFirst({
			where: and(eq(notices.status, 'PUBLISHED'), eq(notices.showOnHome, true)),
			orderBy: [desc(notices.publishedAt), desc(notices.createdAt)]
		})) ?? null
	);
}

export async function listAdminNotices(databaseUrl: string, providedDb?: NoticeDb) {
	return getDb(databaseUrl, providedDb).query.notices.findMany({
		orderBy: [desc(notices.updatedAt)]
	});
}

export async function createNotice(
	databaseUrl: string,
	authorId: number,
	input: NoticeInput,
	providedDb?: NoticeDb,
	now = new Date()
) {
	const [created] = await getDb(databaseUrl, providedDb)
		.insert(notices)
		.values({
			...input,
			authorId,
			publishedAt: resolvePublishedAt(input.status, null, now),
			updatedAt: now
		})
		.returning();
	return created;
}

export async function updateNotice(
	databaseUrl: string,
	id: string,
	input: NoticeInput,
	providedDb?: NoticeDb,
	now = new Date()
) {
	const db = getDb(databaseUrl, providedDb);
	const existing = await db.query.notices.findFirst({ where: eq(notices.id, id) });
	if (!existing) return null;

	const [updated] = await db
		.update(notices)
		.set({
			...input,
			publishedAt: resolvePublishedAt(input.status, existing.publishedAt, now),
			updatedAt: now
		})
		.where(eq(notices.id, id))
		.returning();
	return updated ?? null;
}
