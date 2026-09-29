import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import { requireEventAdmin } from '$lib/server/event-admin';
import { listAdminCampusEvents, getAdminCampusEvent, saveCampusEventLocation } from '$lib/server/campus-events';
import { readEventInbox, getEventCandidate, saveEventCandidateLocation } from '$lib/server/event-candidates';
import { listCampusSpots } from '$lib/server/campus-spots';
import { parseEventLocationInput } from '$lib/domain/event-location-editor';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	requireEventAdmin(locals.user);
	const [events, inbox] = await Promise.all([listAdminCampusEvents(env.DATABASE_URL), readEventInbox(env.DATABASE_URL)]);
	const pending = inbox.candidates.filter((candidate) => candidate.state === 'pending');
	const pendingEventIds = new Set(pending.map((candidate) => candidate.publishedEventId).filter(Boolean));
	const entries = [
		...pending.map((candidate) => ({
			key: `candidate:${candidate.id}`, id: candidate.id, kind: 'candidate' as const,
			title: candidate.draft.title, startsAt: candidate.draft.startsAt,
			locationName: candidate.draft.locationName, latitude: candidate.draft.latitude, longitude: candidate.draft.longitude,
			location: candidate.draft.location, version: candidate.version, updatedAt: candidate.updatedAt.toISOString(),
			status: '검토 대기', detailUrl: `/admin/events/inbox/${candidate.id}`
		})),
		...events.filter((event) => !pendingEventIds.has(event.id)).map((event) => ({
			key: `event:${event.id}`, id: event.id, kind: 'event' as const,
			title: event.title, startsAt: event.startsAt.toISOString(), locationName: event.locationName,
			latitude: event.latitude, longitude: event.longitude, location: event.location, version: 0,
			updatedAt: event.updatedAt.toISOString(), status: event.isVisible ? '공개 중' : '비공개',
			detailUrl: `/admin/events/${event.id}/edit`
		}))
	];
	const requested = url.searchParams.has('candidate') ? `candidate:${url.searchParams.get('candidate')}` : `event:${url.searchParams.get('event')}`;
	return { entries, initialKey: entries.some((entry) => entry.key === requested) ? requested : entries[0]?.key ?? '', naverMapClientId: env.NAVER_MAP_CLIENT_ID ?? '' };
};

export const actions: Actions = {
	save: async ({ locals, request }) => {
		requireEventAdmin(locals.user);
		const form = await request.formData();
		const key = String(form.get('entry') ?? '');
		const match = /^(candidate|event):([0-9a-f-]{36})$/i.exec(key);
		if (!match) return fail(400, { saved: false, message: '위치를 저장할 행사를 선택해 주세요.' });
		const parsed = parseEventLocationInput(form, await listCampusSpots(env.DATABASE_URL));
		if (!parsed.ok) return fail(400, { saved: false, message: parsed.message });
		const [, kind, id] = match;
		try {
			if (kind === 'candidate') {
				const candidate = await getEventCandidate(env.DATABASE_URL, id);
				if (!candidate) return fail(404, { saved: false, message: '행사 후보를 찾지 못했습니다.' });
				if (candidate.state !== 'pending' || candidate.version !== Number(form.get('version')))
					return fail(409, { saved: false, message: '행사 정보가 변경되었습니다. 새로고침 후 다시 확인해 주세요.' });
				if (!await saveEventCandidateLocation(env.DATABASE_URL, candidate, parsed.value))
					return fail(409, { saved: false, message: '저장 중 행사 정보가 변경되었습니다. 새로고침 후 다시 확인해 주세요.' });
			} else {
				const event = await getAdminCampusEvent(env.DATABASE_URL, id);
				if (!event) return fail(404, { saved: false, message: '행사를 찾지 못했습니다.' });
				if (event.updatedAt.toISOString() !== form.get('updatedAt') || !await saveCampusEventLocation(env.DATABASE_URL, id, event.updatedAt, parsed.value))
					return fail(409, { saved: false, message: '행사 정보가 변경되었습니다. 새로고침 후 다시 확인해 주세요.' });
			}
			return { saved: true, entry: key, message: '행사 위치를 저장했어요.' };
		} catch {
			return fail(500, { saved: false, message: '위치를 저장하지 못했습니다. 입력한 위치를 유지했으니 다시 시도해 주세요.' });
		}
	}
};
