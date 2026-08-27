import { env } from '$env/dynamic/private';
import { listPublicNotices } from '$lib/server/notices';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	notices: await listPublicNotices(env.DATABASE_URL)
});
