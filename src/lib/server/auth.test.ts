import { describe, expect, it } from 'vitest';
import {
	createSessionToken,
	getUserIdFromSessionToken,
	validateAdminCredentials
} from './auth';

describe('인증 유틸리티', () => {
	it('세션 토큰에서 사용자 ID를 검증해 복원한다', () => {
		return createSessionToken('secret', 'user-1').then(async (token) => {
			expect(await getUserIdFromSessionToken('secret', token)).toBe('user-1');
			expect(await getUserIdFromSessionToken('other-secret', token)).toBeNull();
		});
	});

	it('관리자 아이디와 비밀번호를 환경값 기준으로 검증한다', async () => {
		await expect(
			validateAdminCredentials({
				inputId: 'golabau',
				inputPassword: 'golabau123@',
				expectedId: 'golabau',
				expectedPassword: 'golabau123@'
			})
		).resolves.toBe(true);

		await expect(
			validateAdminCredentials({
				inputId: 'golabau',
				inputPassword: 'wrong',
				expectedId: 'golabau',
				expectedPassword: 'golabau123@'
			})
		).resolves.toBe(false);
	});
});
