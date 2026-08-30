import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { getPublicCampusEvent } from '$lib/server/campus-events';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const event = await getPublicCampusEvent(env.DATABASE_URL, params.id);
	if (!event) throw error(404, '행사를 찾을 수 없습니다.');
	return { event };
};
