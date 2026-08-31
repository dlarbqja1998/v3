import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { authenticateAdmin } from '$lib/server/admin-login';
import { createDb } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { createUserSessionToken, SESSION_MAX_AGE_SECONDS } from '$lib/server/user';
import { createOAuthState, normalizeInternalRedirect } from '$lib/server/security';

const adminAttempts = new Map<string, { fails: number; lockedUntil: number }>();

export const load: PageServerLoad = async ({ url, locals, cookies }) => {
	if (locals.user?.isOnboarded) {
		throw redirect(303, '/');
	}

	const redirectUri = `${env.AUTH_URL || url.origin}/auth/callback/kakao`;
	const kakaoAuthUrl = new URL('https://kauth.kakao.com/oauth/authorize');
	kakaoAuthUrl.searchParams.set('client_id', env.AUTH_KAKAO_ID ?? '');
	kakaoAuthUrl.searchParams.set('redirect_uri', redirectUri);
	kakaoAuthUrl.searchParams.set('response_type', 'code');

	const next = normalizeInternalRedirect(url.searchParams.get('next'));
	const oauthState = createOAuthState();
	kakaoAuthUrl.searchParams.set('state', oauthState);
	const oauthCookieOptions = {
		path: '/',
		httpOnly: true,
		sameSite: 'lax' as const,
		secure: !dev,
		maxAge: 60 * 10
	};
	cookies.set('oauth_state', oauthState, oauthCookieOptions);
	cookies.set('oauth_next', next, oauthCookieOptions);

	return {
		kakaoAuthUrl: kakaoAuthUrl.toString(),
		next,
		loginError: url.searchParams.get('error') === 'kakao' ? '카카오 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.' : null
	};
};

export const actions: Actions = {
	adminLogin: async ({ request, cookies, getClientAddress, platform }) => {
		if (!env.DATABASE_URL) {
			return fail(500, { adminMessage: '데이터베이스 연결 정보가 없습니다.' });
		}

		const ip = getClientAddress();
		const distributedLimit = await platform?.env?.ADMIN_LOGIN_RATE_LIMITER?.limit({ key: ip });
		if (distributedLimit && !distributedLimit.success) {
			return fail(429, { adminMessage: '로그인 요청이 너무 많습니다. 1분 후 다시 시도해 주세요.' });
		}
		const now = Date.now();
		const attempt = adminAttempts.get(ip) ?? { fails: 0, lockedUntil: 0 };
		if (attempt.lockedUntil > now) {
			const minutes = Math.ceil((attempt.lockedUntil - now) / 60000);
			return fail(429, { adminMessage: `${minutes}분 후 다시 시도할 수 있습니다.` });
		}

		const data = await request.formData();
		const inputId = data.get('adminId')?.toString().trim() ?? '';
		const inputPassword = data.get('adminPassword')?.toString() ?? '';
		const db = createDb(env.DATABASE_URL);
		const authentication = await authenticateAdmin(
			{ inputId, inputPassword },
			async (loginId) =>
				(await db.query.users.findFirst({
					where: and(
						eq(users.provider, 'local'),
						eq(users.providerId, loginId),
						eq(users.role, 'admin')
					)
				})) ?? null
		);

		if (!authentication.ok) {
			const nextFails = attempt.fails + 1;
			adminAttempts.set(ip, {
				fails: nextFails >= 5 ? 0 : nextFails,
				lockedUntil: nextFails >= 5 ? now + 15 * 60 * 1000 : 0
			});
			return fail(400, { adminMessage: '관리자 정보가 올바르지 않습니다.' });
		}

		adminAttempts.delete(ip);
		const sessionToken = await createUserSessionToken(authentication.userId);
		cookies.set('session_id', sessionToken, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !dev,
			maxAge: SESSION_MAX_AGE_SECONDS
		});

		throw redirect(303, '/');
	}
};
