import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { validateAdminCredentials } from '$lib/server/auth';
import { createDb } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { createUserSessionToken } from '$lib/server/user';

const adminAttempts = new Map<string, { fails: number; lockedUntil: number }>();

export const load: PageServerLoad = async ({ url, locals }) => {
	if (locals.user?.isOnboarded) {
		throw redirect(303, '/');
	}

	const redirectUri = `${env.AUTH_URL || url.origin}/auth/callback/kakao`;
	const kakaoAuthUrl = new URL('https://kauth.kakao.com/oauth/authorize');
	kakaoAuthUrl.searchParams.set('client_id', env.AUTH_KAKAO_ID ?? '');
	kakaoAuthUrl.searchParams.set('redirect_uri', redirectUri);
	kakaoAuthUrl.searchParams.set('response_type', 'code');

	const next = url.searchParams.get('next');
	if (next) {
		kakaoAuthUrl.searchParams.set('state', next);
	}

	return {
		kakaoAuthUrl: kakaoAuthUrl.toString(),
		next,
		loginError: url.searchParams.get('error') === 'kakao' ? '카카오 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.' : null
	};
};

export const actions: Actions = {
	adminLogin: async ({ request, cookies, getClientAddress }) => {
		if (!env.DATABASE_URL) {
			return fail(500, { adminMessage: '데이터베이스 연결 정보가 없습니다.' });
		}

		const ip = getClientAddress();
		const now = Date.now();
		const attempt = adminAttempts.get(ip) ?? { fails: 0, lockedUntil: 0 };
		if (attempt.lockedUntil > now) {
			const minutes = Math.ceil((attempt.lockedUntil - now) / 60000);
			return fail(429, { adminMessage: `${minutes}분 후 다시 시도할 수 있습니다.` });
		}

		const data = await request.formData();
		const inputId = data.get('adminId')?.toString().trim() ?? '';
		const inputPassword = data.get('adminPassword')?.toString() ?? '';
		const expectedId = env.ADMIN_LOGIN_ID;
		const expectedPassword = env.ADMIN_LOGIN_PASSWORD;
		if (!expectedId || !expectedPassword || expectedId !== 'golabau') {
			return fail(500, { adminMessage: '관리자 로그인 환경변수가 없습니다.' });
		}

		const isValid = await validateAdminCredentials({
			inputId,
			inputPassword,
			expectedId,
			expectedPassword
		});

		if (!isValid) {
			const nextFails = attempt.fails + 1;
			adminAttempts.set(ip, {
				fails: nextFails >= 5 ? 0 : nextFails,
				lockedUntil: nextFails >= 5 ? now + 15 * 60 * 1000 : 0
			});
			return fail(400, { adminMessage: '관리자 정보가 올바르지 않습니다.' });
		}

		adminAttempts.delete(ip);

		const db = createDb(env.DATABASE_URL);
		const existingAdmin = await db.query.users.findFirst({
			where: eq(users.id, 1)
		});

		if (existingAdmin) {
			await db
				.update(users)
				.set({
					email: existingAdmin.email || 'admin@golabau.local',
					nickname: existingAdmin.nickname || '관리자',
					provider: 'local',
					role: 'admin',
					isOnboarded: true,
					status: 'ACTIVE',
					isBanned: false
				})
				.where(eq(users.id, 1));
		} else {
			await db.insert(users).values({
				id: 1,
				email: 'admin@golabau.local',
				nickname: '관리자',
				provider: 'local',
				role: 'admin',
				isOnboarded: true
			});
		}

		const sessionToken = await createUserSessionToken(1);
		cookies.set('session_id', sessionToken, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !dev,
			maxAge: 60 * 60 * 24 * 7
		});

		throw redirect(303, '/');
	}
};
