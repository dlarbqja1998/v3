import { describe, expect, it, vi } from 'vitest';
const { getAdminInquiry, answerInquiry } = vi.hoisted(() => ({ getAdminInquiry: vi.fn(), answerInquiry: vi.fn() }));
vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'db' } }));
vi.mock('$lib/server/support-inquiries', () => ({ getAdminInquiry, answerInquiry }));
import { actions } from './+page.server';

describe('관리자 문의 답변', () => {
	it('한 개의 답변을 저장하거나 수정한다', async () => {
		answerInquiry.mockResolvedValue({ id: 'q1' });
		const form = new FormData(); form.set('answer', '확인 후 수정했습니다.');
		const result = await actions.answer!({ locals: { user: { id: 1, role: 'admin' } }, params: { id: 'q1' }, request: new Request('http://localhost', { method: 'POST', body: form }) } as never);
		expect(answerInquiry).toHaveBeenCalledWith('db', 'q1', 1, '확인 후 수정했습니다.');
		expect(result).toEqual({ success: true, message: '답변을 저장했습니다.' });
	});
});
