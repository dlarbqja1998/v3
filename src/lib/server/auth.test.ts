import { describe, expect, it } from 'vitest';
import {
	createSessionToken,
	getUserIdFromSessionToken,
	hashAdminPassword,
	verifyAdminPassword
} from './auth';

describe('인증 유틸리티', () => {
	it('세션 토큰에서 사용자 ID를 검증해 복원한다', () => {
		return createSessionToken('secret', 'user-1').then(async (token) => {
			expect(await getUserIdFromSessionToken('secret', token)).toBe('user-1');
			expect(await getUserIdFromSessionToken('other-secret', token)).toBeNull();
		});
	});

	it('관리자 비밀번호를 버전이 포함된 PBKDF2 해시로 저장하고 검증한다', async () => {
		const encoded = await hashAdminPassword('golabau123@', new Uint8Array(16).fill(7));

		expect(encoded).toMatch(/^pbkdf2-sha256\$310000\$/);
		await expect(verifyAdminPassword('golabau123@', encoded)).resolves.toBe(true);
		await expect(verifyAdminPassword('wrong', encoded)).resolves.toBe(false);
	});

	it('잘못된 관리자 비밀번호 해시 형식을 거부한다', async () => {
		await expect(verifyAdminPassword('password', 'broken')).resolves.toBe(false);
		await expect(
			verifyAdminPassword('password', 'pbkdf2-sha256$1$00$00')
		).resolves.toBe(false);
	});
});
