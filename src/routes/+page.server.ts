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
import { getHomeLoadPolicy } from '$lib/server/home-load-policy';

export async function load({ platform, cookies, locals, url }) {
	const loadPolicy = getHomeLoadPolicy(url.searchParams.get('panel'));
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

	const weeklyMenu = loadPolicy.needsCafeteriaMenu
		? await getTodayMenuWithRefresh(platform, {
				onUpdated: async (menu) => {
					scheduleBackgroundTask(platform, syncWeeklyCafeteriaMenu(env.DATABASE_URL, menu));
				}
			})
		: null;
	if (weeklyMenu && loadPolicy.shouldSyncCafeteriaMenu) {
		scheduleBackgroundTask(platform, syncVisibleCafeteriaData(weeklyMenu));
	}

	const homeData = await getHomeData(env.DATABASE_URL, weeklyMenu);
	const requestedPlaceId = url.searchParams.get('place') ?? '';
	const initialPlaceId =
		loadPolicy.initialPanel === 'place' &&
		homeData.places.some((place) => place.id === requestedPlaceId && place.type === 'cafeteria')
			? requestedPlaceId
			: '';
	let cafeteriaFeedback = {};
	if (loadPolicy.needsCafeteriaFeedback) {
		try {
			cafeteriaFeedback = await getWeeklyCafeteriaFeedback(
				env.DATABASE_URL,
				weeklyMenu,
				voter.voterHash
			);
		} catch (error) {
			console.error('cafeteria feedback load failed:', error);
		}
	}

	return {
		...homeData,
		cafeteriaFeedback,
		initialPanel: initialPlaceId ? loadPolicy.initialPanel : loadPolicy.initialPanel === 'place' ? null : loadPolicy.initialPanel,
		initialPlaceId,
		naverMapClientId: env.NAVER_MAP_CLIENT_ID ?? '',
		user: locals.user
			? {
					nickname: locals.user.nickname,
					role: locals.user.role
				}
			: null
	};
}

async function syncVisibleCafeteriaData(weeklyMenu: NonNullable<Awaited<ReturnType<typeof getTodayMenuWithRefresh>>>) {
	try {
		await ensureWeeklyCafeteriaMenu(env.DATABASE_URL, weeklyMenu);
		await syncFoodCourtMenu(env.DATABASE_URL, weeklyMenu.todayDate.replaceAll('.', '-'));
	} catch (error) {
		console.error('cafeteria menu database sync failed:', error);
	}
}

function scheduleBackgroundTask(platform: { context?: { waitUntil?: (promise: Promise<unknown>) => void } } | undefined, task: Promise<unknown>) {
	if (platform?.context?.waitUntil) {
		platform.context.waitUntil(task);
		return;
	}

	void task.catch((error) => {
		console.error('background home task failed:', error);
	});
}
