import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: {} }));
vi.mock('$lib/server/db/queries', () => ({ getHomeData: async () => ({ places: [], cafeterias: [] }) }));
vi.mock('$lib/server/campus-events', () => ({ listPublicCampusEvents: async () => [] }));

import { load as loadHome } from './+page.server';
import { load as loadToday } from './today/+page.server';

afterEach(() => vi.useRealTimers());

describe('축제 공개 중단', () => {
	it('행사 당일에도 홈과 직접 링크에 축제 데이터를 전달하지 않는다', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-09-15T14:00:00+09:00'));
		for (const path of ['/', '/?panel=festival', '/?panel=event']) {
			const data = await loadHome({ locals: { user: null }, url: new URL(path, 'https://example.com') } as never);
			expect(data).toMatchObject({ festival: null, initialFestival: false });
		}
	});
	it('행사 당일에도 오늘 탭에 축제를 전달하지 않는다', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-09-15T14:00:00+09:00'));
		expect(await loadToday({} as never)).toMatchObject({ festival: null });
	});
});
