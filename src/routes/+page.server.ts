import { env } from '$env/dynamic/private';
import { getHomeData } from '$lib/server/db/queries';

export async function load() {
	const homeData = await getHomeData(env.DATABASE_URL);

	return {
		...homeData,
		naverMapClientId: env.NAVER_MAP_CLIENT_ID ?? ''
	};
}
