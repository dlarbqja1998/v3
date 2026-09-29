import { and, count, desc, eq, lt, ne, sql } from 'drizzle-orm';
import { createDb } from './db';
import { eventCandidates, eventCandidateSources, eventImportRuns } from './db/schema';
import { candidateDedupKey, candidateIdentity, candidateToFormData, getCandidateIssues, matchCandidateLocation, type CandidateCover, type EventCandidateDraft, type EventProposal } from '../domain/event-candidates';
import { normalizeCampusEventInput } from '../domain/campus-events';
import type { CampusSpot } from '../domain/campus-spots';
import type { EventMediaBucket } from './event-media';
import type { EventLocationInput } from '../domain/event-location-editor';

export type EventCandidateRow = typeof eventCandidates.$inferSelect;
export type EventImportRunRow = typeof eventImportRuns.$inferSelect;

function missingTable(error: unknown): boolean {
	return !!error && typeof error === 'object' && (('code' in error && error.code === '42P01') || ('cause' in error && missingTable(error.cause)));
}

export async function readEventInbox(databaseUrl: string | undefined) {
	if (!databaseUrl) return { available: false, candidates: [] as EventCandidateRow[], runs: [] as EventImportRunRow[] };
	const db = createDb(databaseUrl);
	try {
		const [candidates, runs] = await Promise.all([
			db.query.eventCandidates.findMany({ orderBy: [desc(eventCandidates.updatedAt)], limit: 200 }),
			db.query.eventImportRuns.findMany({ orderBy: [desc(eventImportRuns.startedAt)], limit: 10 })
		]);
		return { available: true, candidates, runs };
	} catch (error) {
		if (missingTable(error)) return { available: false, candidates: [] as EventCandidateRow[], runs: [] as EventImportRunRow[] };
		throw error;
	}
}

export async function countPendingEventCandidates(databaseUrl: string | undefined) {
	if (!databaseUrl) return 0;
	try {
		const [row] = await createDb(databaseUrl).select({ count: count() }).from(eventCandidates).where(eq(eventCandidates.state, 'pending'));
		return row.count;
	} catch (error) { if (missingTable(error)) return 0; throw error; }
}

export async function getEventCandidate(databaseUrl: string, id: string) {
	if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
	return await createDb(databaseUrl).query.eventCandidates.findFirst({ where: eq(eventCandidates.id, id) }) ?? null;
}

async function digest(value: unknown) {
	const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(value)));
	return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function importEventProposal(databaseUrl: string, proposal: EventProposal, spots: CampusSpot[], coverImage: CandidateCover | null = null) {
	const db = createDb(databaseUrl);
	const identity = `${proposal.source.url}#${candidateIdentity(proposal.draft.title)}`;
	const hash = proposal.source.contentHash ?? await digest({ draft: proposal.draft, cancellation: proposal.isCancellation, evidence: proposal.source.evidence, missing: proposal.missing });
	const source = await db.query.eventCandidateSources.findFirst({ where: eq(eventCandidateSources.identity, identity) });
	if (source?.contentHash === hash) return { status: 'unchanged' as const, id: source.candidateId };
	const draft = matchCandidateLocation(proposal.draft, spots);
	const dedupKey = candidateDedupKey(draft);
	const existing = source
		? await getEventCandidate(databaseUrl, source.candidateId)
		: dedupKey ? await db.query.eventCandidates.findFirst({ where: eq(eventCandidates.dedupKey, dedupKey) }) : null;
	const previousSource = existing?.sources.find((item) => item.url === proposal.source.url);
	if (source && previousSource && new Date(previousSource.observedAt) > new Date(proposal.source.observedAt)) return { status: 'unchanged' as const, id: existing!.id };
	const proposalFlags = [...new Set([...proposal.missing, ...(proposal.isCancellation ? ['원문에 취소 안내가 있습니다. 기존 행사 상태를 확인해 주세요.'] : [])])];
	let candidateId: string;
	if (existing) {
		candidateId = existing.id;
		const sourceChanged = !!source;
		const nextSources = [...existing.sources.filter((item) => item.url !== proposal.source.url), proposal.source].slice(-20);
		const protectDraft = existing.manuallyEdited || existing.publishedEventId !== null;
		const flags = sourceChanged
			? [...proposalFlags, ...(protectDraft ? ['원문이 변경되었습니다. 변경 내용을 확인해 주세요.'] : [])]
			: [...new Set([...existing.reviewFlags, ...proposalFlags])];
		// 관리자 편집과 경합하면 후보 내용을 덮지 않는다. 다음 수집에서 같은 원문을 다시 처리한다.
		const [updated] = await db.update(eventCandidates).set({
			sources: nextSources,
			...(sourceChanged || proposal.isCancellation ? { suggestedDraft: protectDraft ? draft : null, draft: protectDraft ? existing.draft : draft, reviewFlags: flags, state: existing.state === 'rejected' ? 'rejected' : 'pending' } : {}),
			...(!existing.coverImage && coverImage ? { coverImage, coverApproved: false } : {}),
			version: existing.version + 1, updatedAt: new Date()
		}).where(and(eq(eventCandidates.id, existing.id), eq(eventCandidates.version, existing.version))).returning();
		if (!updated) throw new Error('관리자가 편집 중인 후보입니다. 다음 실행에서 다시 확인합니다.');
	} else {
		const id = crypto.randomUUID();
		const [created] = await db.insert(eventCandidates).values({
			id, dedupKey, draft, sources: [proposal.source], coverImage,
			reviewFlags: proposalFlags
		}).onConflictDoNothing().returning();
		if (!created) throw new Error('같은 행사 후보가 동시에 저장되었습니다. 다시 확인합니다.');
		candidateId = created.id;
	}
	await db.insert(eventCandidateSources).values({ identity, candidateId, contentHash: hash }).onConflictDoUpdate({
		target: eventCandidateSources.identity, set: { contentHash: hash, updatedAt: new Date() }
	});
	return { status: existing ? source || proposal.isCancellation ? 'changed' as const : 'merged' as const : 'created' as const, id: candidateId };
}

export async function saveEventCandidate(databaseUrl: string, input: {
	id: string; version: number; draft: EventCandidateDraft; coverImage: CandidateCover | null; coverApproved: boolean; acknowledged: boolean;
}) {
	const [updated] = await createDb(databaseUrl).update(eventCandidates).set({
		draft: input.draft, coverImage: input.coverImage, coverApproved: input.coverApproved,
		manuallyEdited: true, state: 'pending', suggestedDraft: input.acknowledged ? null : undefined,
		reviewFlags: input.acknowledged ? [] : undefined,
		version: sql`${eventCandidates.version} + 1`, updatedAt: new Date()
	}).where(and(eq(eventCandidates.id, input.id), eq(eventCandidates.version, input.version), eq(eventCandidates.state, 'pending'))).returning();
	return updated ?? null;
}

/** 위치만 보완하며 이미지 승인과 나머지 검토 항목은 그대로 유지한다. */
export async function saveEventCandidateLocation(databaseUrl: string, candidate: EventCandidateRow, location: EventLocationInput) {
	const [updated] = await createDb(databaseUrl).update(eventCandidates).set({
		draft: { ...candidate.draft, ...location }, manuallyEdited: true,
		reviewFlags: candidate.reviewFlags.filter((flag) => !['지도 위치 확인', '행사 구역의 지도 위치 확인'].includes(flag)),
		version: sql`${eventCandidates.version} + 1`, updatedAt: new Date()
	}).where(and(eq(eventCandidates.id, candidate.id), eq(eventCandidates.version, candidate.version), eq(eventCandidates.state, 'pending'))).returning();
	return updated ?? null;
}

export async function setCandidateReviewState(databaseUrl: string, id: string, version: number, state: 'pending' | 'rejected', adminId: number) {
	const [updated] = await createDb(databaseUrl).update(eventCandidates).set({ state, reviewedBy: adminId, version: sql`${eventCandidates.version} + 1`, updatedAt: new Date() })
		.where(and(eq(eventCandidates.id, id), eq(eventCandidates.version, version), eq(eventCandidates.state, state === 'rejected' ? 'pending' : 'rejected'))).returning();
	return updated ?? null;
}

export function buildCandidatePublishQuery(candidate: EventCandidateRow, adminId: number, input: ReturnType<typeof normalizeCampusEventInput> & { ok: true }) {
	const eventId = candidate.publishedEventId ?? candidate.id;
	const event = input.value;
	const cover = candidate.coverImage!;
	// 하나의 SQL 문으로 후보 버전 확인, 행사/대표 이미지 저장, 승인 완료를 함께 커밋한다.
	return sql`
		WITH eligible AS (
			SELECT id FROM event_candidates WHERE id = ${candidate.id}::uuid AND version = ${candidate.version}
			AND state = 'pending' AND cover_approved = true
			AND (published_event_id IS NULL OR EXISTS (SELECT 1 FROM campus_events WHERE campus_events.id = published_event_id AND campus_events.updated_at = event_candidates.published_at)) FOR UPDATE
		), published AS (
			INSERT INTO campus_events (id, title, category, organizer, description, external_url, starts_at, ends_at, location_name, latitude, longitude, location, is_visible, created_by)
			SELECT ${eventId}::uuid, ${event.title}, ${event.category}, ${event.organizer}, ${event.description}, ${event.externalUrl},
			${event.startsAt.toISOString()}::timestamptz, ${event.endsAt.toISOString()}::timestamptz, ${event.locationName}, ${event.latitude}, ${event.longitude},
			${JSON.stringify(event.location)}::jsonb, true, ${adminId} FROM eligible
			ON CONFLICT (id) DO UPDATE SET title = excluded.title, category = excluded.category, organizer = excluded.organizer,
			description = excluded.description, external_url = excluded.external_url, starts_at = excluded.starts_at, ends_at = excluded.ends_at,
			location_name = excluded.location_name, latitude = excluded.latitude, longitude = excluded.longitude, location = excluded.location, is_visible = true, updated_at = now()
			WHERE campus_events.updated_at = (SELECT published_at FROM event_candidates WHERE id = ${candidate.id}::uuid)
			RETURNING id
		), reset_cover AS (
			UPDATE campus_event_images SET is_cover = false WHERE event_id IN (SELECT id FROM published) AND id <> ${cover.id}::uuid
		), image AS (
			INSERT INTO campus_event_images (id, event_id, object_key, content_type, byte_size, display_order, is_cover)
			SELECT ${cover.id}::uuid, id, ${cover.objectKey}, ${cover.contentType}, ${cover.byteSize}, 0, true FROM published
			ON CONFLICT (id) DO UPDATE SET is_cover = true RETURNING id
		)
		UPDATE event_candidates SET state = 'published', published_event_id = ${eventId}::uuid, published_at = now(), reviewed_by = ${adminId}, version = version + 1, updated_at = now()
		WHERE id IN (SELECT id FROM eligible) AND EXISTS (SELECT 1 FROM image) RETURNING id
	`;
}

export async function publishEventCandidate(databaseUrl: string, id: string, version: number, adminId: number, spots: CampusSpot[], bucket: EventMediaBucket | undefined) {
	const candidate = await getEventCandidate(databaseUrl, id);
	if (!candidate || candidate.version !== version || candidate.state !== 'pending') return { ok: false, message: '후보가 변경되었거나 이미 처리되었습니다. 새로 확인해 주세요.' };
	const issues = getCandidateIssues(candidate, spots);
	if (issues.length) return { ok: false, message: issues.join(' · ') };
	if (!bucket || !await bucket.get(candidate.coverImage!.objectKey)) return { ok: false, message: '대표 이미지를 찾지 못했습니다. 다시 업로드해 주세요.' };
	const parsed = normalizeCampusEventInput(candidateToFormData(candidate.draft), { coverImageCount: 1, campusSpots: spots });
	if (!parsed.ok) return { ok: false, message: parsed.message };
	const result = await createDb(databaseUrl).execute(buildCandidatePublishQuery(candidate, adminId, parsed));
	return result.rows.length ? { ok: true, message: '게시했습니다.' } : { ok: false, message: '후보 또는 기존 행사가 변경되었습니다. 기존 행사 수정 화면에서 내용을 확인해 주세요.' };
}

export async function beginEventImportRun(databaseUrl: string, slot: string, now: Date) {
	const db = createDb(databaseUrl);
	await db.update(eventImportRuns).set({ status: 'failed', finishedAt: now, message: '이전 수집이 중단되었습니다. 미확인 범위를 다시 확인합니다.' })
		.where(and(eq(eventImportRuns.status, 'running'), lt(eventImportRuns.startedAt, new Date(now.getTime() - 16 * 60 * 1000))));
	const [run] = await db.insert(eventImportRuns).values({ slot, startedAt: now }).onConflictDoNothing().returning();
	return run ?? null;
}

export async function lastSuccessfulEventImport(databaseUrl: string) {
	return await createDb(databaseUrl).query.eventImportRuns.findFirst({ where: eq(eventImportRuns.status, 'completed'), orderBy: [desc(eventImportRuns.startedAt)] }) ?? null;
}

export async function previousEventImport(databaseUrl: string, currentRunId: string) {
	return await createDb(databaseUrl).query.eventImportRuns.findFirst({ where: ne(eventImportRuns.id, currentRunId), orderBy: [desc(eventImportRuns.startedAt)] }) ?? null;
}

export async function saveEventImportCheckpoint(databaseUrl: string, id: string, checkpoint: NonNullable<EventImportRunRow['checkpoint']>) {
	await createDb(databaseUrl).update(eventImportRuns).set({ checkpoint }).where(and(eq(eventImportRuns.id, id), eq(eventImportRuns.status, 'running')));
}

export async function finishEventImportRun(databaseUrl: string, id: string, result: Pick<EventImportRunRow, 'status' | 'newCount' | 'changedCount' | 'message' | 'checkedBoards'> & { checkpoint?: EventImportRunRow['checkpoint'] }) {
	await createDb(databaseUrl).update(eventImportRuns).set({ ...result, finishedAt: new Date() }).where(and(eq(eventImportRuns.id, id), eq(eventImportRuns.status, 'running')));
}
