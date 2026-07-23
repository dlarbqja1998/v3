import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { getHomeData } from '$lib/server/db/queries';
import { getTodayMenuWithRefresh } from '$lib/server/cafeteria-cache';
import {
	ensureWeeklyCafeteriaMenu,
	syncFoodCourtMenu,
	syncWeeklyCafeteriaMenu
} from '$lib/server/cafeteria-sync';
import { getOrCreateVoterHash, getWeeklyCafeteriaFeedback } from '$lib/server/cafeteria-feedback';

export async function load({ platform, cookies }) {
	const voter = await getOrCreateVoterHash(cookies.get('cafeteria_voter'));
	if (!cookies.get('cafeteria_voter')) {
		cookies.set('cafeteria_voter', voter.voterId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !dev,
			maxAge: 60 * 60 * 24 * 365
		});
	}

	const weeklyMenu = await getTodayMenuWithRefresh(platform, {
		onUpdated: (menu) => syncWeeklyCafeteriaMenu(env.DATABASE_URL, menu)
	});
	if (weeklyMenu) {
		try {
			await ensureWeeklyCafeteriaMenu(env.DATABASE_URL, weeklyMenu);
			await syncFoodCourtMenu(env.DATABASE_URL, weeklyMenu.todayDate.replaceAll('.', '-'));
		} catch (error) {
			console.error('food court menu database sync failed:', error);
		}
	}
	const homeData = await getHomeData(env.DATABASE_URL, weeklyMenu);
	let cafeteriaFeedback = {};
	try {
		cafeteriaFeedback = await getWeeklyCafeteriaFeedback(
			env.DATABASE_URL,
			weeklyMenu,
			voter.voterHash
		);
	} catch (error) {
		console.error('cafeteria feedback load failed:', error);
	}

	return {
		...homeData,
		cafeteriaFeedback,
		naverMapClientId: env.NAVER_MAP_CLIENT_ID ?? ''
	};
}
