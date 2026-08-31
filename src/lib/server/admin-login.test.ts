import { describe, expect, it, vi } from 'vitest';
import { hashAdminPassword } from './auth';
import {
	authenticateAdmin,
	parseAdminProvisioningInput,
	type AdminCredentialRecord
} from './admin-login';

describe('DB 관리자 로그인', () => {
	it('입력 아이디와 일치하는 관리자 사용자 ID를 반환한다', async () => {
		const password = await hashAdminPassword(
			'second-password',
			new Uint8Array(16).fill(3)
		);
		const result = await authenticateAdmin(
			{ inputId: 'second-admin', inputPassword: 'second-password' },
			async (loginId) =>
				loginId === 'second-admin'
					? {
							id: 27,
							password,
							role: 'admin',
							status: 'ACTIVE',
							isBanned: false
						}
					: null
		);

		expect(result).toEqual({ ok: true, userId: 27 });
	});

	it.each([
		{ role: 'user', status: 'ACTIVE', isBanned: false },
		{ role: 'admin', status: 'INACTIVE', isBanned: false },
		{ role: 'admin', status: 'ACTIVE', isBanned: true }
	])('일반 사용자와 비활성 관리자를 거부한다: %o', async (state) => {
		const password = await hashAdminPassword('password', new Uint8Array(16).fill(4));
		const admin: AdminCredentialRecord = { id: 2, password, ...state };

		await expect(
			authenticateAdmin(
				{ inputId: 'blocked', inputPassword: 'password' },
				async () => admin
			)
		).resolves.toEqual({ ok: false });
	});

	it('비밀번호가 다르면 관리자를 거부한다', async () => {
		const password = await hashAdminPassword('correct', new Uint8Array(16).fill(5));
		await expect(
			authenticateAdmin(
				{ inputId: 'golabau', inputPassword: 'wrong' },
				async () => ({
					id: 1,
					password,
					role: 'admin',
					status: 'ACTIVE',
					isBanned: false
				})
			)
		).resolves.toEqual({ ok: false });
	});

	it('F12로 비정상적으로 큰 로그인 값을 보내면 DB와 PBKDF2 처리 전에 거부한다', async () => {
		const findAdmin = vi.fn();

		await expect(
			authenticateAdmin({ inputId: 'a'.repeat(81), inputPassword: 'x' }, findAdmin)
		).resolves.toEqual({ ok: false });
		await expect(
			authenticateAdmin({ inputId: 'golabau', inputPassword: 'x'.repeat(257) }, findAdmin)
		).resolves.toEqual({ ok: false });
		expect(findAdmin).not.toHaveBeenCalled();
	});

	it('관리자 등록 명령 입력을 정규화한다', () => {
		expect(
			parseAdminProvisioningInput(
				[' golabau ', ' admin@golabau.local ', ' 관리자 '],
				'password123!'
			)
		).toEqual({
			ok: true,
			value: {
				loginId: 'golabau',
				email: 'admin@golabau.local',
				nickname: '관리자',
				password: 'password123!'
			}
		});
	});

	it('관리자 등록 비밀번호가 없으면 거부한다', () => {
		expect(parseAdminProvisioningInput(['golabau', 'admin@golabau.local', '관리자'], '')).toEqual({
			ok: false,
			message: 'ADMIN_LOGIN_PASSWORD 환경변수가 필요합니다.'
		});
	});
});
