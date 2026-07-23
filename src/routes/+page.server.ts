import { env } from '$env/dynamic/private';
import { getHomeData } from '$lib/server/db/queries';
import { getTodayMenuWithRefresh } from '$lib/server/cafeteria-cache';
import { syncWeeklyCafeteriaMenu } from '$lib/server/cafeteria-sync';

export async function load({ platform }) {
	const weeklyMenu = await getTodayMenuWithRefresh(platform, {
		onUpdated: (menu) => syncWeeklyCafeteriaMenu(env.DATABASE_URL, menu)
	});
	const homeData = await getHomeData(env.DATABASE_URL, weeklyMenu);

	return {
		...homeData,
		naverMapClientId: env.NAVER_MAP_CLIENT_ID ?? ''
	};
}
