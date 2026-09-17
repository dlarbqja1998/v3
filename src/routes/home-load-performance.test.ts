import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ home: vi.fn(), events: vi.fn(), notice: vi.fn(), restaurants: vi.fn() }));
vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'test' } }));
vi.mock('$lib/server/db/queries', () => ({ getHomeData: mocks.home }));
vi.mock('$lib/server/campus-events', () => ({ listPublicCampusEvents: mocks.events }));
vi.mock('$lib/server/notices', () => ({ getHomeNotice: mocks.notice }));
vi.mock('$lib/server/restaurants', () => ({ readOutsideCatalog: mocks.restaurants }));
import { load } from './+page.server';

describe('홈 데이터 조회 대기', () => {
	it('장소 조회가 끝나기 전 행사·공지·음식점 조회도 시작하고 짧은 재방문은 캐시를 사용한다', async () => {
		let finishHome!: (value: unknown) => void;
		mocks.home.mockReturnValue(new Promise((resolve) => { finishHome = resolve; }));
		mocks.events.mockResolvedValue([]);
		mocks.notice.mockResolvedValue(null);
		mocks.restaurants.mockResolvedValue({ restaurants: [], memberships: {} });
		const event = { locals: { user: null }, url: new URL('https://example.com/') } as never;
		const pending = load(event);
		await vi.waitFor(() => {
			expect(mocks.events).toHaveBeenCalledTimes(1);
			expect(mocks.notice).toHaveBeenCalledTimes(1);
			expect(mocks.restaurants).toHaveBeenCalledTimes(1);
			expect(mocks.restaurants).toHaveBeenCalledWith('test', 'public');
		});
		finishHome({ places: [], cafeterias: [] });
		await pending;
		await load(event);
		expect(mocks.home).toHaveBeenCalledTimes(1);
		expect(mocks.events).toHaveBeenCalledTimes(1);
		expect(mocks.notice).toHaveBeenCalledTimes(1);
		expect(mocks.restaurants).toHaveBeenCalledTimes(1);
	});
});
