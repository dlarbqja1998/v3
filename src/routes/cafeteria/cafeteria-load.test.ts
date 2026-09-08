import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ menu: vi.fn(), sync: vi.fn(), feedback: vi.fn() }));
vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'test' } }));
vi.mock('$lib/server/cafeteria-cache', () => ({ getTodayMenuWithRefresh: mocks.menu }));
vi.mock('$lib/server/cafeteria-sync', () => ({ ensureWeeklyCafeteriaMenu: mocks.sync }));
vi.mock('$lib/server/cafeteria-feedback', () => ({ getWeeklyCafeteriaFeedback: mocks.feedback }));
import { load } from './+page.server';

describe('학식 화면 전환', () => {
	it('평가 DB가 응답하지 않아도 메뉴와 딥링크 정보를 즉시 반환한다', async () => {
		mocks.menu.mockResolvedValue({ weekStartDate: '2026.09.07', todayKey: 'mon', todayDate: '2026.09.07', todayDay: '월', days: [] });
		mocks.sync.mockReturnValue(new Promise(() => {}));
		mocks.feedback.mockReturnValue(new Promise(() => {}));
		const result = await load({ locals: { user: null }, url: new URL('https://example.com/cafeteria?cafeteria=faculty&day=tue') } as never);
		expect(result).toMatchObject({ initialCafeteriaId: 'faculty', initialDayKey: 'tue', cafeteriaFeedback: {} });
		expect(mocks.sync).not.toHaveBeenCalled();
		expect(mocks.feedback).not.toHaveBeenCalled();
	});
});
