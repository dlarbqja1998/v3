import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { error, redirect } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { createDb } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { createUserSessionToken } from '$lib/server/user';

type KakaoTokenResponse = {
	access_token?: string;
};

type KakaoUserResponse = {
	id?: number;
	kakao_account?: {
		email?: string;
		profile?: {
			profile_image_url?: string;
		};
	};
};

export const GET: RequestHandler = async ({ url, cookies }) => {
	if (!env.DATABASE_URL) throw error(500, '데이터베이스 연결 정보가 없습니다.');
	if (!env.AUTH_KAKAO_ID) throw error(500, '카카오 REST API 키가 없습니다.');

	const code = url.searchParams.get('code');
	if (!code) throw error(400, '카카오 인증 코드가 없습니다.');

	const redirectUri = `${env.AUTH_URL || url.origin}/auth/callback/kakao`;
	const tokenParams = new URLSearchParams({
		grant_type: 'authorization_code',
		client_id: env.AUTH_KAKAO_ID,
		redirect_uri: redirectUri,
		code
	});

	if (env.AUTH_KAKAO_SECRET) {
		tokenParams.set('client_secret', env.AUTH_KAKAO_SECRET);
	}

	const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded;charset=utf-8' },
		body: tokenParams
	});

	if (!tokenResponse.ok) {
		throw redirect(303, '/login?error=kakao');
	}

	const tokens = (await tokenResponse.json()) as KakaoTokenResponse;
	if (!tokens.access_token) {
		throw redirect(303, '/login?error=kakao');
	}

	const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
		headers: { Authorization: `Bearer ${tokens.access_token}` }
	});

	if (!userResponse.ok) {
		throw redirect(303, '/login?error=kakao');
	}

	const kakaoUser = (await userResponse.json()) as KakaoUserResponse;
	if (!kakaoUser.id) {
		throw redirect(303, '/login?error=kakao');
	}

	const providerId = String(kakaoUser.id);
	const db = createDb(env.DATABASE_URL);
	let user = await db.query.users.findFirst({
		where: and(eq(users.provider, 'kakao'), eq(users.providerId, providerId))
	});

	if (!user) {
		const [newUser] = await db
			.insert(users)
			.values({
				email: kakaoUser.kakao_account?.email || `${providerId}@kakao.local`,
				profileImg: kakaoUser.kakao_account?.profile?.profile_image_url ?? null,
				provider: 'kakao',
				providerId,
				isOnboarded: false
			})
			.returning();
		user = newUser;
	}

	if (user.status !== 'ACTIVE' || user.isBanned) {
		throw error(403, '이용할 수 없는 계정입니다.');
	}

	const sessionToken = await createUserSessionToken(user.id);
	cookies.set('session_id', sessionToken, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: 60 * 60 * 24 * 7
	});

	if (!user.isOnboarded) {
		const next = url.searchParams.get('state');
		throw redirect(303, next ? `/register?next=${encodeURIComponent(next)}` : '/register');
	}

	throw redirect(303, url.searchParams.get('state') || '/');
};
