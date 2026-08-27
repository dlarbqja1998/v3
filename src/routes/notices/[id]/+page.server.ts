import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { getPublicNotice } from '$lib/server/notices';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const notice = await getPublicNotice(env.DATABASE_URL, params.id);
	if (!notice) throw error(404, '공지사항을 찾을 수 없습니다.');
	return { notice };
};
