import { refreshTodayMenuCache } from './cafeteria-cache';
import { syncWeeklyCafeteriaMenu } from './cafeteria-sync';

export const MONDAY_MENU_REFRESH_CRON = '0 2 * * 1';

export function shouldRunCafeteriaMenuRefresh(cron: string): boolean {
	return cron === MONDAY_MENU_REFRESH_CRON;
}

type ScheduledCache = {
	get(key: string): Promise<string | null>;
	put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
};

type ScheduledEnv = {
	GOLABAU_CACHE?: ScheduledCache;
	DATABASE_URL?: string;
};

type ScheduledContext = {
	waitUntil(promise: Promise<unknown>): void;
};

export async function refreshCafeteriaMenuOnSchedule(
	cron: string,
	env: ScheduledEnv,
	ctx: ScheduledContext
) {
	if (!shouldRunCafeteriaMenuRefresh(cron)) return;

	const refresh = refreshTodayMenuCache(
		{ env, context: ctx },
		{
			force: true,
			onUpdated: (menu) => syncWeeklyCafeteriaMenu(env.DATABASE_URL, menu)
		}
	);
	ctx.waitUntil(refresh);
	await refresh;
}
