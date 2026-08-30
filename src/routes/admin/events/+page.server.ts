import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import { normalizeCampusEventInput } from '$lib/domain/campus-events';
import {
	deleteCampusEventRows,
	getAdminCampusEvent,
	listAdminCampusEvents,
	setCampusEventVisibility
} from '$lib/server/campus-events';
import { requireEventAdmin } from '$lib/server/event-admin';
import { deleteEventImages } from '$lib/server/event-media';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	requireEventAdmin(locals.user);
	return {
		events: await listAdminCampusEvents(env.DATABASE_URL),
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
			const values = new FormData();
			for (const key of ['title', 'category', 'organizer', 'description', 'locationName'] as const) {
				values.set(key, String(event[key]));
			}
			values.set('startsAt', event.startsAt.toISOString());
			values.set('endsAt', event.endsAt.toISOString());
			values.set('latitude', String(event.latitude));
			values.set('longitude', String(event.longitude));
			values.set('isVisible', 'on');
			const parsed = normalizeCampusEventInput(values, {
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
