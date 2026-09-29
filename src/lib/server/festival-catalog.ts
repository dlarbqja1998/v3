import { readPublicFestival } from './festival-editor';
import { gbFestivalPreview } from './festival-gb-2026';
import { getEventCandidate } from './event-candidates';
import { gbFestivalCandidateId, isLocalEventPreview } from './event-preview';
import { isEventCoordinate } from '$lib/domain/event-locations';
import { getPublicCampusEvent } from './campus-events';

/** 로컬에서는 새 축제를 검토하고, 운영에서는 승인·공개된 행사에만 상세 안내를 연결한다. */
export async function readFestivalForPage(hostname: string, store?: Parameters<typeof readPublicFestival>[0], databaseUrl?: string) {
	if (isLocalEventPreview(hostname)) {
		const festival = structuredClone(gbFestivalPreview);
		const candidate = databaseUrl ? await getEventCandidate(databaseUrl, gbFestivalCandidateId) : null;
		const draft = candidate?.state !== 'rejected' ? candidate?.draft : null;
		const point = { latitude: draft?.latitude, longitude: draft?.longitude };
		if (draft && isEventCoordinate(point)) {
			festival.area = { ...point, label: draft.locationName, approximate: false,
				boundary: draft.location?.type === 'area' ? draft.location.boundary : [] };
		}
		return festival;
	}
	const event = databaseUrl ? await getPublicCampusEvent(databaseUrl, gbFestivalCandidateId) : null;
	if (event) {
		const festival = structuredClone(gbFestivalPreview);
		festival.preview = false;
		festival.eventId = event.id;
		festival.area = { latitude: event.latitude, longitude: event.longitude, label: event.locationName,
			boundary: event.location?.type === 'area' ? event.location.boundary : [], approximate: false };
		return festival;
	}
	return readPublicFestival(store);
}
