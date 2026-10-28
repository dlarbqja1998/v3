import { beforeEach, describe, expect, it, vi } from 'vitest';
const { countUnreadInquiryAnswers, revokeUserSessionToken, countPendingEventCandidates } = vi.hoisted(() => ({
	countUnreadInquiryAnswers: vi.fn(),
	revokeUserSessionToken: vi.fn(),
	countPendingEventCandidates: vi.fn()
}));
vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'db' } }));
vi.mock('$lib/server/support-inquiries', () => ({ countUnreadInquiryAnswers }));
vi.mock('$lib/server/user', () => ({ revokeUserSessionToken }));
vi.mock('$lib/server/event-candidates', () => ({ countPendingEventCandidates }));
import { actions, load } from './+page.server';

describe('마이페이지 서버 데이터', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		countUnreadInquiryAnswers.mockResolvedValue(0);
		countPendingEventCandidates.mockResolvedValue(0);
	});

	it('앱 버전과 읽지 않은 답변 수를 반환한다', async () => {
		countUnreadInquiryAnswers.mockResolvedValue(2);
		const user = { id: 7, nickname: null, college: null, department: null, grade: null, gender: null, role: 'user' };
		const result = await load({ locals: { user } } as never);
		expect(result).toMatchObject({ user, appVersion: '0.0.1', unreadInquiryCount: 2 });
		expect(countPendingEventCandidates).not.toHaveBeenCalled();
	});

	it('관리자 문의 수가 늦어져도 행사 후보 수 조회를 동시에 시작한다', async () => {
		let finishUnread!: (count: number) => void;
		countUnreadInquiryAnswers.mockReturnValue(new Promise((resolve) => { finishUnread = resolve; }));
		countPendingEventCandidates.mockResolvedValue(3);
		const pending = load({ locals: { user: { id: 7, role: 'admin' } } } as never);
		expect(countUnreadInquiryAnswers).toHaveBeenCalledWith('db', 7);
		expect(countPendingEventCandidates).toHaveBeenCalledWith('db');
		finishUnread(2);
		await expect(pending).resolves.toMatchObject({ unreadInquiryCount: 2, pendingEventCount: 3 });
	});

	it('로그아웃하면 서버 세션을 먼저 폐기하고 쿠키를 삭제한다', async () => {
		const cookies = { get: vi.fn(() => 'a'.repeat(64)), delete: vi.fn() };

		await expect(actions.logout!({ cookies } as never)).rejects.toMatchObject({ status: 303, location: '/' });

		expect(revokeUserSessionToken).toHaveBeenCalledWith('a'.repeat(64), 'db');
		expect(cookies.delete).toHaveBeenCalledWith('session_id', { path: '/' });
	});
});
