import { env } from '$env/dynamic/private';
import { error, redirect } from '@sveltejs/kit';
import { getPublicCampusEvent } from '$lib/server/campus-events';
import { readLocalEventPreviews } from '$lib/server/event-preview';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, locals }) => {
	if (url.searchParams.get('embedded') !== '1') {
		redirect(307, `/?${new URLSearchParams({ view: 'today', detail: params.id })}`);
	}
	const event = await getPublicCampusEvent(env.DATABASE_URL, params.id) ??
		(await readLocalEventPreviews(env.DATABASE_URL, url.hostname, locals.user?.role === 'admin')).find((event) => event.id === params.id);
	if (!event) throw error(404, '행사를 찾을 수 없습니다.');
	return { event };
};
