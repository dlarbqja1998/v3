import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ menu: vi.fn(), sync: vi.fn(), feedback: vi.fn() }));
vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'test' } }));
vi.mock('$lib/server/cafeteria-cache', () => ({ getTodayMenuWithRefresh: mocks.menu }));
vi.mock('$lib/server/cafeteria-sync', () => ({ ensureWeeklyCafeteriaMenu: mocks.sync }));
vi.mock('$lib/server/cafeteria-feedback', () => ({ getWeeklyCafeteriaFeedback: mocks.feedback }));
import { GET } from './+server';

describe('분리된 학식 평가 조회', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.menu.mockResolvedValue({ days: [] });
		mocks.sync.mockResolvedValue(0);
		mocks.feedback.mockResolvedValue({});
	});

	it('현재 로그인 사용자의 평가를 조회하고 공유 캐시를 금지한다', async () => {
		const response = await GET({ locals: { user: { id: 7 } } } as never);
		expect(mocks.feedback).toHaveBeenCalledWith('test', { days: [] }, 7);
		expect(response.headers.get('cache-control')).toBe('private, no-store');
		expect(await response.json()).toEqual({ feedback: {} });
	});

	it('평가 실패를 메뉴 없음으로 숨기지 않고 재시도 가능한 오류로 응답한다', async () => {
		mocks.feedback.mockRejectedValueOnce(new Error('조회 실패'));
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		const response = await GET({ locals: { user: null } } as never);
		expect(response.status).toBe(503);
		expect(await response.json()).toEqual({ error: '평가를 불러오지 못했어요.' });
		log.mockRestore();
	});
});
