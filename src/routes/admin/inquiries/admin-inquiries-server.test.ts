import { describe, expect, it, vi } from 'vitest';
const { listAdminInquiries } = vi.hoisted(() => ({ listAdminInquiries: vi.fn() }));
vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'db' } }));
vi.mock('$lib/server/support-inquiries', () => ({ listAdminInquiries }));
import { load } from './+page.server';

describe('관리자 문의 목록', () => {
	it('일반 사용자는 접근할 수 없다', async () => {
		await expect(load({ locals: { user: { role: 'user' } } } as never)).rejects.toMatchObject({ status: 303, location: '/my' });
	});
	it('관리자에게 문의 목록을 반환한다', async () => {
		listAdminInquiries.mockResolvedValue([{ id: 'q1' }]);
		await expect(load({ locals: { user: { role: 'admin' } } } as never)).resolves.toEqual({ inquiries: [{ id: 'q1' }] });
	});
});
