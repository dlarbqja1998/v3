import { describe, expect, it, vi } from 'vitest';
const { deleteUserAccount, hashVoterId } = vi.hoisted(() => ({ deleteUserAccount: vi.fn(), hashVoterId: vi.fn() }));
vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'db' } }));
vi.mock('$lib/server/account-deletion', () => ({ deleteUserAccount }));
vi.mock('$lib/server/cafeteria-feedback', () => ({ hashVoterId }));
import { DELETE_ACCOUNT_CONFIRMATION } from '$lib/domain/account-deletion';
import { actions } from './+page.server';

describe('회원 탈퇴', () => {
	it('정확한 확인 문구가 아니면 삭제하지 않는다', async () => {
		const form = new FormData(); form.set('confirmation', '탈퇴합니다');
		const result = await actions.withdraw!({ locals: { user: { id: 7 } }, request: new Request('http://localhost', { method: 'POST', body: form }), cookies: { get: vi.fn() } } as never);
		expect(result).toMatchObject({ status: 400 });
		expect(deleteUserAccount).not.toHaveBeenCalled();
	});
	it('정확한 문구에서는 계정과 세션을 삭제한다', async () => {
		hashVoterId.mockResolvedValue('hash');
		const form = new FormData(); form.set('confirmation', DELETE_ACCOUNT_CONFIRMATION);
		const cookies = { get: vi.fn(() => 'device'), delete: vi.fn() };
		await expect(actions.withdraw!({ locals: { user: { id: 7 } }, request: new Request('http://localhost', { method: 'POST', body: form }), cookies } as never)).rejects.toMatchObject({ status: 303, location: '/' });
		expect(deleteUserAccount).toHaveBeenCalledWith('db', 7, 'hash');
		expect(cookies.delete).toHaveBeenCalledWith('session_id', { path: '/' });
	});
});
