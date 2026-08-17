import { describe, expect, it } from 'vitest';
import { load } from './+page.server';

const admin = { id: 1, role: 'admin', isOnboarded: true };
const user = { id: 2, role: 'user', isOnboarded: true };

describe('관리자 온보딩 미리보기 접근', () => {
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
});
