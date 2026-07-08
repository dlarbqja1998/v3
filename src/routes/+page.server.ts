import { env } from '$env/dynamic/private';
import { getHomeData } from '$lib/server/db/queries';

export async function load() {
	return getHomeData(env.DATABASE_URL);
}
