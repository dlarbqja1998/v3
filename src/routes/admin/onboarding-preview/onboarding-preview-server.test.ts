import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));

vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'postgresql://test' } }));
vi.mock('$lib/server/db', () => ({
	createDb: () => ({ query: { users: { findFirst } } })
}));

import { actions, load } from './+page.server';

const admin = { id: 1, role: 'admin', isOnboarded: true };
const user = { id: 2, role: 'user', isOnboarded: true };

describe('관리자 온보딩 미리보기 접근', () => {
	beforeEach(() => {
		findFirst.mockReset();
	});

	it('비로그인 사용자를 로그인으로 보낸다', async () => {
		await expect(load({ locals: { user: null } } as never)).rejects.toMatchObject({
			status: 303,
			location: '/login?next=/admin/onboarding-preview'
		});
	});

	it('일반 사용자를 홈으로 보낸다', async () => {
		await expect(load({ locals: { user } } as never)).rejects.toMatchObject({
			status: 303,
			location: '/'
		});
	});

	it('관리자에게 DB 데이터 없이 미리보기 상태만 제공한다', async () => {
		await expect(load({ locals: { user: admin } } as never)).resolves.toEqual({ preview: true });
	});

	it('관리자는 미리보기에서 실제 닉네임 중복 확인을 할 수 있다', async () => {
		findFirst.mockResolvedValue(undefined);
		const formData = new FormData();
		formData.set('nickname', '골라바유');

		const result = await actions.checkNickname!({
			request: new Request('http://localhost/admin/onboarding-preview', {
				method: 'POST',
				body: formData
			}),
			locals: { user: admin }
		} as never);

		expect(result).toEqual({
			nicknameCheck: {
				nickname: '골라바유',
				status: 'available',
				message: '사용 가능한 닉네임입니다.'
			},
			values: {
				nickname: '골라바유',
				college: '',
				department: '',
				studentYear: '',
				gender: ''
			}
		});
	});

	it('일반 사용자는 미리보기 중복 확인을 실행할 수 없다', async () => {
		const formData = new FormData();
		formData.set('nickname', '골라바유');

		await expect(
			actions.checkNickname!({
				request: new Request('http://localhost/admin/onboarding-preview', {
					method: 'POST',
					body: formData
				}),
				locals: { user }
			} as never)
		).rejects.toMatchObject({ status: 303, location: '/' });
	});
});
