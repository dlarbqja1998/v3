import { refreshTodayMenuCache } from './cafeteria-cache';

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
		{ force: true }
	);
	ctx.waitUntil(refresh);
	await refresh;
}
