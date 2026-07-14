import { env } from '$env/dynamic/private';
import { getHomeData } from '$lib/server/db/queries';
import { getTodayMenuWithRefresh } from '$lib/server/cafeteria-cache';

export async function load({ platform }) {
	const weeklyMenu = await getTodayMenuWithRefresh(platform);
	const homeData = await getHomeData(env.DATABASE_URL, weeklyMenu);

	return {
		...homeData,
		naverMapClientId: env.NAVER_MAP_CLIENT_ID ?? ''
	};
}
