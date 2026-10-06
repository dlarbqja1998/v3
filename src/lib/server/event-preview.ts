import { dev } from '$app/environment';
import { getPublicCampusEvents } from '$lib/domain/campus-events';
import { isEventCoordinate, parseCampusEventLocation } from '$lib/domain/event-locations';
import { getEventCandidate } from './event-candidates';
import type { CampusEventDto } from './campus-events';
import { readAutumnEventPreviews } from './autumn-events-2026';

export const gbFestivalCandidateId = '56e12977-3473-41c8-ab45-84d3a82e9e64';
const localEventCandidateIds = ['5a443533-9343-442b-aedb-f7d8ace96e66'];

export function isLocalEventPreview(hostname: string) {
	return dev && ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
}

/** 요청한 화면용 자료는 로컬에서, 기존 승인함 후보는 로컬 관리자에게 미리 보여준다. 공개 상태는 변경하지 않는다. */
export async function readLocalEventPreviews(databaseUrl: string | undefined, hostname: string, isAdmin: boolean, now = new Date()): Promise<CampusEventDto[]> {
	if (!isLocalEventPreview(hostname)) return [];
	// 이번 요청의 화면용 공지 자료는 로컬에서만 제공한다. 임의의 승인함 후보 조회는 관리자에게만 허용한다.
	const requestedPreviews = readAutumnEventPreviews(now);
	if (!databaseUrl || !isAdmin) return requestedPreviews;
	const candidates = await Promise.all(localEventCandidateIds.map((id) => getEventCandidate(databaseUrl, id)));
	const events: CampusEventDto[] = [];
	for (const candidate of candidates) {
		if (!candidate || candidate.state !== 'pending' || candidate.publishedEventId) continue;
		const draft = candidate.draft;
		const point = { latitude: draft.latitude, longitude: draft.longitude };
		if (!isEventCoordinate(point) || !draft.startsAt || !draft.endsAt) continue;
		const startsAt = new Date(draft.startsAt), endsAt = new Date(draft.endsAt);
		if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) continue;
		const cover = candidate.coverApproved ? candidate.coverImage : null;
		events.push({
			...draft, ...point, id: candidate.id, startsAt, endsAt,
			location: parseCampusEventLocation(draft.location), isVisible: true,
			createdBy: null, createdAt: candidate.createdAt, updatedAt: candidate.updatedAt,
			coverImageId: cover?.id ?? null,
			images: cover ? [{ ...cover, eventId: candidate.id, isCover: true, kind: 'cover', displayOrder: 0,
				createdAt: candidate.updatedAt, url: `/admin/events/inbox/${candidate.id}/image?v=${candidate.version}` }] : []
		});
	}
	return getPublicCampusEvents([...events, ...requestedPreviews], now);
}
