import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import { normalizeCampusEventInput } from '$lib/domain/campus-events';
import { listCampusSpots } from '$lib/server/campus-spots';
import { getEventHistoryYear, selectEventHistoryYear } from '$lib/domain/event-history';
import { readEventInbox } from '$lib/server/event-candidates';
import {
	deleteCampusEventRows,
	buildCampusEventValidationFormData,
	getAdminCampusEvent,
	listAdminCampusEvents,
	setCampusEventVisibility
} from '$lib/server/campus-events';
import { requireEventAdmin } from '$lib/server/event-admin';
import { deleteEventImages } from '$lib/server/event-media';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	requireEventAdmin(locals.user);
	const [events, inbox] = await Promise.all([listAdminCampusEvents(env.DATABASE_URL), readEventInbox(env.DATABASE_URL)]);
	const pending = inbox.candidates.filter((candidate) => candidate.state === 'pending' && !candidate.publishedEventId);
	const dated = [...events.map((event) => ({ startsAt: event.startsAt })), ...pending.map((candidate) => ({ startsAt: candidate.draft.startsAt ? new Date(candidate.draft.startsAt) : candidate.createdAt }))];
	const { years, selectedYear } = selectEventHistoryYear(dated, url.searchParams.get('year'));
	return {
		years, selectedYear,
		events: events.filter((event) => getEventHistoryYear(event.startsAt) === selectedYear).toSorted((a, b) => b.startsAt.getTime() - a.startsAt.getTime()),
		pendingCandidates: pending.filter((candidate) => getEventHistoryYear(candidate.draft.startsAt ? new Date(candidate.draft.startsAt) : candidate.createdAt) === selectedYear)
			.map((candidate) => ({ id: candidate.id, title: candidate.draft.title, category: candidate.draft.category, startsAt: candidate.draft.startsAt ? new Date(candidate.draft.startsAt) : null, endsAt: candidate.draft.endsAt ? new Date(candidate.draft.endsAt) : null, locationName: candidate.draft.locationName })),
		deleted: url.searchParams.get('deleted') === '1'
	};
};

export const actions: Actions = {
	toggleVisibility: async ({ request, locals }) => {
		requireEventAdmin(locals.user);
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const isVisible = formData.get('isVisible') === 'true';
		const event = await getAdminCampusEvent(env.DATABASE_URL, id);
		if (!event) return fail(404, { message: '행사를 찾지 못했습니다.' });
		if (isVisible) {
			const parsed = normalizeCampusEventInput(buildCampusEventValidationFormData(event), {
				campusSpots: event.location?.type === 'building' ? await listCampusSpots(env.DATABASE_URL) : [],
				coverImageCount: event.coverImageId ? 1 : 0
			});
			if (!parsed.ok) return fail(400, { message: parsed.message });
		}
		await setCampusEventVisibility(env.DATABASE_URL, id, isVisible);
		return { success: true, message: isVisible ? '행사를 공개했습니다.' : '행사를 비공개로 전환했습니다.' };
	},
	delete: async ({ request, locals, platform }) => {
		requireEventAdmin(locals.user);
		const id = String((await request.formData()).get('id') ?? '');
		const event = await getAdminCampusEvent(env.DATABASE_URL, id);
		if (!event) return fail(404, { message: '삭제할 행사를 찾지 못했습니다.' });
		const deleted = await deleteCampusEventRows(env.DATABASE_URL, id);
		if (!deleted.event) return fail(404, { message: '삭제할 행사를 찾지 못했습니다.' });
		const keys = deleted.images.map((image) => image.objectKey);
		if (keys.length > 0) {
			try {
				const bucket = platform?.env?.EVENT_MEDIA;
				if (!bucket) throw new Error('EVENT_MEDIA 바인딩 없음');
				await deleteEventImages(bucket, keys);
			} catch (error) {
				console.error('행사 삭제 후 R2 객체 정리 실패', { eventId: id, keys, error });
			}
		}
		throw redirect(303, '/admin/events?deleted=1');
	}
};
