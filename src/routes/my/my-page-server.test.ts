import { describe, expect, it, vi } from 'vitest';
const { countUnreadInquiryAnswers } = vi.hoisted(() => ({ countUnreadInquiryAnswers: vi.fn() }));
vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'db' } }));
vi.mock('$lib/server/support-inquiries', () => ({ countUnreadInquiryAnswers }));
import { load } from './+page.server';

describe('마이페이지 서버 데이터', () => {
	it('앱 버전과 읽지 않은 답변 수를 반환한다', async () => {
		countUnreadInquiryAnswers.mockResolvedValue(2);
		const user = { id: 7, nickname: null, college: null, department: null, grade: null, gender: null, role: 'user' };
		const result = await load({ locals: { user } } as never);
		expect(result).toMatchObject({ user, appVersion: '0.0.1', unreadInquiryCount: 2 });
	});
});
