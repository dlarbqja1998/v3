import { dev } from '$app/environment';
import { getPublicCampusEvents } from '$lib/domain/campus-events';
import { isEventCoordinate, parseCampusEventLocation } from '$lib/domain/event-locations';
import { getEventCandidate } from './event-candidates';
import type { CampusEventDto } from './campus-events';

export const gbFestivalCandidateId = '56e12977-3473-41c8-ab45-84d3a82e9e64';
const localEventCandidateIds = ['5a443533-9343-442b-aedb-f7d8ace96e66'];

export function isLocalEventPreview(hostname: string) {
	return dev && ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
}

/** 요청받은 행사만 로컬 관리자에게 미리 보여준다. 후보나 공개 상태는 변경하지 않는다. */
export async function readLocalEventPreviews(databaseUrl: string | undefined, hostname: string, isAdmin: boolean, now = new Date()): Promise<CampusEventDto[]> {
	if (!databaseUrl || !isAdmin || !isLocalEventPreview(hostname)) return [];
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
	return getPublicCampusEvents(events, now);
}
