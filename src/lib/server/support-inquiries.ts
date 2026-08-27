import { and, asc, desc, eq, gte, isNotNull, isNull } from 'drizzle-orm';
import type { InquiryInput } from '$lib/domain/support-inquiries';
import { createDb, type Db } from '$lib/server/db';
import { supportInquiries } from '$lib/server/db/schema';

type InquiryDb = Pick<Db, 'query' | 'insert' | 'update'>;

function getDb(databaseUrl: string, providedDb?: InquiryDb) {
	return providedDb ?? createDb(databaseUrl);
}

export async function listUserInquiries(databaseUrl: string, userId: number, providedDb?: InquiryDb) {
	return getDb(databaseUrl, providedDb).query.supportInquiries.findMany({
		where: eq(supportInquiries.userId, userId),
		orderBy: [desc(supportInquiries.createdAt)]
	});
}

export async function getUserInquiry(databaseUrl: string, userId: number, id: string, providedDb?: InquiryDb) {
	return (await getDb(databaseUrl, providedDb).query.supportInquiries.findFirst({
		where: and(eq(supportInquiries.id, id), eq(supportInquiries.userId, userId))
	})) ?? null;
}

export async function createInquiry(
	databaseUrl: string,
	userId: number,
	input: InquiryInput,
	providedDb?: InquiryDb,
	now = new Date()
) {
	const db = getDb(databaseUrl, providedDb);
	const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
	const recent = await db.query.supportInquiries.findMany({
		columns: { id: true },
		where: and(eq(supportInquiries.userId, userId), gte(supportInquiries.createdAt, oneHourAgo)),
		limit: 3
	});
	if (recent.length >= 3) return { ok: false, reason: 'RATE_LIMIT' } as const;

	const [inquiry] = await db.insert(supportInquiries).values({ ...input, userId, createdAt: now, updatedAt: now }).returning();
	return { ok: true, inquiry } as const;
}

export async function listAdminInquiries(databaseUrl: string, providedDb?: InquiryDb) {
	return getDb(databaseUrl, providedDb).query.supportInquiries.findMany({
		orderBy: [asc(supportInquiries.status), desc(supportInquiries.createdAt)]
	});
}

export async function getAdminInquiry(databaseUrl: string, id: string, providedDb?: InquiryDb) {
	return (await getDb(databaseUrl, providedDb).query.supportInquiries.findFirst({
		where: eq(supportInquiries.id, id)
	})) ?? null;
}

export async function answerInquiry(
	databaseUrl: string,
	id: string,
	adminId: number,
	answer: string,
	providedDb?: InquiryDb,
	now = new Date()
) {
	const db = getDb(databaseUrl, providedDb);
	const existing = await db.query.supportInquiries.findFirst({ where: eq(supportInquiries.id, id) });
	const [updated] = await db.update(supportInquiries).set({
		answer,
		answeredBy: adminId,
		status: 'ANSWERED',
		answeredAt: existing?.answeredAt ?? now,
		answerUpdatedAt: now,
		answerReadAt: null,
		updatedAt: now
	}).where(eq(supportInquiries.id, id)).returning();
	return updated ?? null;
}

export async function markInquiryAnswerRead(databaseUrl: string, userId: number, id: string, providedDb?: InquiryDb, now = new Date()) {
	const [updated] = await getDb(databaseUrl, providedDb).update(supportInquiries).set({ answerReadAt: now }).where(and(
		eq(supportInquiries.id, id),
		eq(supportInquiries.userId, userId),
		isNotNull(supportInquiries.answer),
		isNull(supportInquiries.answerReadAt)
	)).returning();
	return updated ?? null;
}

export async function countUnreadInquiryAnswers(databaseUrl: string, userId: number, providedDb?: InquiryDb) {
	const rows = await getDb(databaseUrl, providedDb).query.supportInquiries.findMany({
		columns: { id: true },
		where: and(
			eq(supportInquiries.userId, userId),
			isNotNull(supportInquiries.answer),
			isNull(supportInquiries.answerReadAt)
		)
	});
	return rows.length;
}
