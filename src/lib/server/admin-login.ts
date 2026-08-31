import { verifyAdminPassword } from './auth';

export type AdminCredentialRecord = {
	id: number;
	password: string | null;
	role: string;
	status: string;
	isBanned: boolean;
};

type AdminLoginInput = {
	inputId: string;
	inputPassword: string;
};

type FindAdmin = (loginId: string) => Promise<AdminCredentialRecord | null>;

const MAX_ADMIN_LOGIN_ID_LENGTH = 80;
const MAX_ADMIN_PASSWORD_LENGTH = 256;

export async function authenticateAdmin(input: AdminLoginInput, findAdmin: FindAdmin) {
	const loginId = input.inputId.trim();
	if (
		!loginId ||
		loginId.length > MAX_ADMIN_LOGIN_ID_LENGTH ||
		!input.inputPassword ||
		input.inputPassword.length > MAX_ADMIN_PASSWORD_LENGTH
	) {
		return { ok: false } as const;
	}

	const admin = await findAdmin(loginId);
	if (
		!admin ||
		admin.role !== 'admin' ||
		admin.status !== 'ACTIVE' ||
		admin.isBanned ||
		!admin.password
	) {
		return { ok: false } as const;
	}

	const passwordMatches = await verifyAdminPassword(input.inputPassword, admin.password);
	return passwordMatches
		? ({ ok: true, userId: admin.id } as const)
		: ({ ok: false } as const);
}

export function parseAdminProvisioningInput(args: string[], passwordValue: string | undefined) {
	const [loginId = '', email = '', nickname = ''] = args.map((value) => value.trim());
	const password = passwordValue ?? '';
	if (!password) {
		return { ok: false, message: 'ADMIN_LOGIN_PASSWORD 환경변수가 필요합니다.' } as const;
	}
	if (!loginId || !email || !nickname) {
		return { ok: false, message: '관리자 아이디, 이메일, 닉네임을 모두 입력해 주세요.' } as const;
	}
	return {
		ok: true,
		value: { loginId, email, nickname, password }
	} as const;
}
