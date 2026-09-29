import { describe, expect, it, vi } from 'vitest';
vi.mock('$env/dynamic/private', () => ({ env: {} }));
import { load, actions } from './+page.server';

describe('행사 구역·핀 관리자 접근', () => {
	it.each([null, { id: 2, role: 'user' }])('관리자가 아닌 사용자는 조회와 저장을 할 수 없다', async (user) => {
		await expect(load({ locals: { user } } as any)).rejects.toMatchObject({ status: 303, location: '/my' });
		await expect(actions.save({ locals: { user } } as any)).rejects.toMatchObject({ status: 303, location: '/my' });
	});
});
