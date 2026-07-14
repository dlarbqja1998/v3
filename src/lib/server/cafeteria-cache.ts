import type { WeeklyMenu } from '$lib/domain/places';
import { getCafeteriaMenu } from './cafeteria-scraper';

export const MENU_CACHE_KEY = 'cafeteria_menu_weekly';
export const MENU_META_KEY = 'cafeteria_menu_weekly_meta';

type MenuKV = {
	get(key: string): Promise<string | null>;
	put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
};

type CachePlatform = {
	env?: {
		GOLABAU_CACHE?: MenuKV;
	};
	context?: {
		waitUntil(promise: Promise<unknown>): void;
	};
};

type RefreshMenuOptions = {
	force?: boolean;
};

type MenuRefreshResult =
	| { status: 'updated'; menu: WeeklyMenu }
	| { status: 'skipped'; reason: 'missing_kv' | 'already_fresh' }
	| { status: 'failed'; reason: string };

type MenuCacheMeta = {
	weekStartDate: string;
	fetchedAt: string;
	lastAttemptAt: string;
	lastStatus: 'success' | 'failed';
	lastFailureReason?: string;
};

function getMenuCache(platform: CachePlatform | undefined) {
	return platform?.env?.GOLABAU_CACHE ?? null;
}

function getSeoulNow(now = new Date()) {
	return new Date(new Date(now).toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
}

function getSeoulWeekStart(now = new Date()) {
	const seoulNow = getSeoulNow(now);
	const monday = new Date(seoulNow);
	const weekday = monday.getDay();
	const diff = weekday === 0 ? -6 : 1 - weekday;
	monday.setDate(monday.getDate() + diff);

	const year = monday.getFullYear();
	const month = String(monday.getMonth() + 1).padStart(2, '0');
	const day = String(monday.getDate()).padStart(2, '0');
	return `${year}.${month}.${day}`;
}

function getTodayMenuKey(now = new Date()): WeeklyMenu['todayKey'] {
	const weekday = getSeoulNow(now).getDay();
	if (weekday === 1) return 'mon';
	if (weekday === 2) return 'tue';
	if (weekday === 3) return 'wed';
	if (weekday === 4) return 'thu';
	return 'fri';
}

function shouldHideMenuUntilMondayLunch(now = new Date()) {
	const seoulNow = getSeoulNow(now);
	const weekday = seoulNow.getDay();
	const hour = seoulNow.getHours();

	if (weekday === 6 || weekday === 0) {
		return true;
	}

	return weekday === 1 && hour < 11;
}

function withCurrentTodayFields(menu: WeeklyMenu, now = new Date()): WeeklyMenu {
	const todayKey = getTodayMenuKey(now);
	const todayMenu = menu.days.find((day) => day.key === todayKey) ?? menu.days[0];

	if (!todayMenu) return menu;

	return {
		...menu,
		todayKey,
		todayDate: todayMenu.date,
		todayDay: todayMenu.day
	};
}

async function readJson<T>(kv: MenuKV | null, key: string): Promise<T | null> {
	if (!kv) return null;

	try {
		const raw = await kv.get(key);
		return raw ? (JSON.parse(raw) as T) : null;
	} catch (error) {
		console.error(`menu cache read failed: ${key}`, error);
		return null;
	}
}

async function writeJson(
	kv: MenuKV | null,
	key: string,
	value: unknown,
	expirationTtl: number
) {
	if (!kv) return;

	try {
		await kv.put(key, JSON.stringify(value), { expirationTtl });
	} catch (error) {
		console.error(`menu cache write failed: ${key}`, error);
	}
}

function isWeeklyMenu(value: unknown): value is WeeklyMenu {
	return !!value && typeof value === 'object' && 'days' in value && 'weekStartDate' in value;
}

function isFreshWeeklyMenu(menu: WeeklyMenu | null, now = new Date()) {
	if (!menu) return false;
	return menu.weekStartDate === getSeoulWeekStart(now);
}

async function readCachedWeeklyMenu(
	platform: CachePlatform | undefined,
	{ allowStale = false }: { allowStale?: boolean } = {}
) {
	const cached = await readJson<unknown>(getMenuCache(platform), MENU_CACHE_KEY);
	const menu = isWeeklyMenu(cached) ? cached : null;
	if (!menu) return null;

	if (!allowStale && !isFreshWeeklyMenu(menu)) {
		return null;
	}

	return withCurrentTodayFields(menu);
}

export async function refreshTodayMenuCache(
	platform: CachePlatform | undefined,
	{ force = false }: RefreshMenuOptions = {}
): Promise<MenuRefreshResult> {
	const kv = getMenuCache(platform);
	if (!kv) {
		return { status: 'skipped', reason: 'missing_kv' };
	}

	const currentWeekStartDate = getSeoulWeekStart();
	const previousMenu = await readJson<unknown>(kv, MENU_CACHE_KEY);
	const existingMenu = isWeeklyMenu(previousMenu) ? previousMenu : null;
	const existingMeta = await readJson<MenuCacheMeta>(kv, MENU_META_KEY);

	if (!force && existingMenu && existingMeta?.weekStartDate === currentWeekStartDate) {
		return { status: 'skipped', reason: 'already_fresh' };
	}

	const attemptedAt = new Date().toISOString();

	try {
		const menuResult = await getCafeteriaMenu();
		if (typeof menuResult !== 'object' || menuResult === null) {
			await writeJson(
				kv,
				MENU_META_KEY,
				{
					weekStartDate: existingMeta?.weekStartDate ?? '',
					fetchedAt: existingMeta?.fetchedAt ?? '',
					lastAttemptAt: attemptedAt,
					lastStatus: 'failed',
					lastFailureReason: 'empty_menu_result'
				} satisfies MenuCacheMeta,
				60 * 60 * 24 * 8
			);

			return { status: 'failed', reason: 'empty_menu_result' };
		}

		await Promise.all([
			writeJson(kv, MENU_CACHE_KEY, menuResult, 60 * 60 * 24 * 8),
			writeJson(
				kv,
				MENU_META_KEY,
				{
					weekStartDate: menuResult.weekStartDate,
					fetchedAt: attemptedAt,
					lastAttemptAt: attemptedAt,
					lastStatus: 'success'
				} satisfies MenuCacheMeta,
				60 * 60 * 24 * 8
			)
		]);

		return { status: 'updated', menu: withCurrentTodayFields(menuResult) };
	} catch (error) {
		await writeJson(
			kv,
			MENU_META_KEY,
			{
				weekStartDate: existingMeta?.weekStartDate ?? '',
				fetchedAt: existingMeta?.fetchedAt ?? '',
				lastAttemptAt: attemptedAt,
				lastStatus: 'failed',
				lastFailureReason: error instanceof Error ? error.message : 'unknown_error'
			} satisfies MenuCacheMeta,
			60 * 60 * 24 * 8
		);

		console.error('scheduled menu refresh failed:', error);
		return { status: 'failed', reason: error instanceof Error ? error.message : 'unknown_error' };
	}
}

export async function getTodayMenuWithRefresh(
	platform: CachePlatform | undefined
): Promise<WeeklyMenu | null> {
	if (shouldHideMenuUntilMondayLunch()) {
		return null;
	}

	const cachedMenu = await readCachedWeeklyMenu(platform);
	if (cachedMenu) return cachedMenu;

	const staleMenu = await readCachedWeeklyMenu(platform, { allowStale: true });
	if (staleMenu && platform?.context?.waitUntil) {
		platform.context.waitUntil(refreshTodayMenuCache(platform));
		return staleMenu;
	}

	if (getMenuCache(platform)) {
		const refreshed = await refreshTodayMenuCache(platform);
		return refreshed.status === 'updated' ? withCurrentTodayFields(refreshed.menu) : staleMenu;
	}

	const directMenu = await getCafeteriaMenu();
	return typeof directMenu === 'object' && directMenu !== null ? withCurrentTodayFields(directMenu) : null;
}
