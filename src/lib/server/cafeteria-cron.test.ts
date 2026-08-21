import { describe, expect, it, vi } from 'vitest';

const { refreshTodayMenuCache } = vi.hoisted(() => ({
	refreshTodayMenuCache: vi.fn().mockResolvedValue({ status: 'updated' })
}));

vi.mock('./cafeteria-cache', () => ({ refreshTodayMenuCache }));

import {
	MONDAY_MENU_REFRESH_CRON,
	refreshCafeteriaMenuOnSchedule,
	shouldRunCafeteriaMenuRefresh
} from './cafeteria-cron';

describe('주간 학식 메뉴 Cron', () => {
	it('한국 시간 월요일 11시의 UTC Cron에서만 캐시 갱신을 실행한다', () => {
		expect(MONDAY_MENU_REFRESH_CRON).toBe('0 2 * * 1');
		expect(shouldRunCafeteriaMenuRefresh('0 2 * * 1')).toBe(true);
		expect(shouldRunCafeteriaMenuRefresh('*/5 2-6 * * 1')).toBe(false);
	});

	it('일치하는 Cron에서는 KV 캐시 갱신만 실행한다', async () => {
		const waitUntil = vi.fn();
		const env = { GOLABAU_CACHE: { get: vi.fn(), put: vi.fn() } };

		await refreshCafeteriaMenuOnSchedule(MONDAY_MENU_REFRESH_CRON, env, { waitUntil });

		expect(refreshTodayMenuCache).toHaveBeenCalledWith(
			{ env, context: { waitUntil } },
			{ force: true }
		);
		expect(waitUntil).toHaveBeenCalledTimes(1);
	});
});
