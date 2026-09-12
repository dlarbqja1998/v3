import { env } from '$env/dynamic/private';
import { readFestivalDraft } from '$lib/server/festival-editor';
import { getHomeData } from '$lib/server/db/queries';
import { getTodayMenuWithRefresh } from '$lib/server/cafeteria-cache';
import {
	ensureWeeklyCafeteriaMenu,
	syncFoodCourtMenu,
	syncWeeklyCafeteriaMenu
} from '$lib/server/cafeteria-sync';
import { getWeeklyCafeteriaFeedback } from '$lib/server/cafeteria-feedback';
import { getHomeLoadPolicy } from '$lib/server/home-load-policy';
import { getHomeNotice } from '$lib/server/notices';
import { listPublicCampusEvents } from '$lib/server/campus-events';
import { getEventSpotlight, getInitialHomeEventId } from '$lib/home/home-events';
import type { ShuttleStopId } from '$lib/domain/shuttle';
import { isFacilityCategorySlug } from '$lib/domain/facility-categories';
import { createPublicDataCache } from '$lib/server/public-data-cache';

const readPublicHome = createPublicDataCache<Awaited<ReturnType<typeof getHomeData>>>(30_000);
const readPublicEvents = createPublicDataCache<Awaited<ReturnType<typeof listPublicCampusEvents>>>(30_000);
const readPublicNotice = createPublicDataCache<Awaited<ReturnType<typeof getHomeNotice>>>(30_000);

export async function load({ platform, locals, url }) {
	const loadPolicy = getHomeLoadPolicy(url.searchParams.get('panel'));

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

	const databaseUrl = env.DATABASE_URL ?? '';
	const [homeData, campusEvents, homeNotice] = await Promise.all([
		// 메뉴가 있는 구형 학식 딥링크는 주간 메뉴가 섞인 결과를 공용 캐시에 넣지 않는다.
		weeklyMenu ? getHomeData(databaseUrl, weeklyMenu) : readPublicHome(databaseUrl, () => getHomeData(databaseUrl)),
		databaseUrl ? readPublicEvents(databaseUrl, () => listPublicCampusEvents(databaseUrl)).catch((error) => {
			console.error('메인 행사 조회 실패:', error);
			return [];
		}) : Promise.resolve([]),
		databaseUrl ? readPublicNotice(databaseUrl, () => getHomeNotice(databaseUrl)).catch((error) => {
			console.error('메인 공지 조회 실패:', error);
			return null;
		}) : Promise.resolve(null)
	]);
	const requestedPlaceId = url.searchParams.get('place') ?? '';
	const requestedEventId = url.searchParams.get('eventId') ?? '';
	const requestedFacilityCategory = url.searchParams.get('category') ?? '';
	const initialEventId =
		loadPolicy.initialPanel === 'event'
			? getInitialHomeEventId(campusEvents, requestedEventId)
			: '';
	const initialShuttleStopId: ShuttleStopId =
		url.searchParams.get('shuttleStop') === 'jochewon-station-back'
		? 'jochewon-station-back'
			: 'campus';
	const initialPlaceId =
		loadPolicy.initialPanel === 'place' &&
		homeData.places.some((place) => place.id === requestedPlaceId && place.type === 'cafeteria')
			? requestedPlaceId
			: '';
	const initialFacilityPlaceId =
		loadPolicy.initialPanel === 'facility' &&
		homeData.places.some(
			(place) =>
				place.id === requestedPlaceId &&
				place.scope === 'campus' &&
				place.isVisible &&
				(place.type === 'facility' || place.type === 'cafeteria')
		)
			? requestedPlaceId
			: '';
	let cafeteriaFeedback = {};
	if (loadPolicy.needsCafeteriaFeedback) {
		try {
			cafeteriaFeedback = await getWeeklyCafeteriaFeedback(
				env.DATABASE_URL,
				weeklyMenu,
				locals.user?.id
			);
		} catch (error) {
			console.error('cafeteria feedback load failed:', error);
		}
	}

	return {
		...homeData,
		festival: (await readFestivalDraft(platform?.env?.GOLABAU_CACHE)).festival,
		initialFestival: url.searchParams.get('panel') === 'festival',
		campusEvents,
		eventSpotlight: getEventSpotlight(campusEvents),
		homeNotice,
		cafeteriaFeedback,
		initialPanel:
			loadPolicy.initialPanel === 'event'
				? initialEventId ? 'event' : null
				: initialPlaceId
					? loadPolicy.initialPanel
					: loadPolicy.initialPanel === 'place'
						? null
						: loadPolicy.initialPanel,
		initialPlaceId,
		initialFacilityPlaceId,
		initialEventId,
		initialFacilityCategory:
			loadPolicy.initialPanel === 'facility' && isFacilityCategorySlug(requestedFacilityCategory)
				? requestedFacilityCategory
				: null,
		initialShuttleStopId: loadPolicy.initialPanel === 'shuttle' ? initialShuttleStopId : null,
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
