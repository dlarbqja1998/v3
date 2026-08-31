import { afterEach, describe, expect, it, vi } from 'vitest';

const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock('$app/environment', () => ({ browser: false, building: false, dev: false, version: 'test' }));
vi.mock('$env/dynamic/private', () => ({
	env: {
		AUTH_URL: 'https://golabau.com',
		AUTH_KAKAO_ID: 'public-client-id',
		DATABASE_URL: 'postgresql://test'
	}
}));
vi.mock('$lib/server/db', () => ({
	createDb: () => ({ query: { users: { findFirst } } })
}));

import { actions, load } from './+page.server';
import { GET as kakaoCallback } from '../auth/callback/kakao/+server';

describe('로그인 보안 경계', () => {
	afterEach(() => vi.restoreAllMocks());

	it('카카오 state에는 이동 경로가 아닌 일회용 난수를 넣는다', async () => {
		const cookies = { set: vi.fn() };
		const result = (await load({
			url: new URL('https://golabau.com/login?next=https://evil.example'),
			locals: { user: null },
			cookies
		} as never)) as { kakaoAuthUrl: string; next: string };
		const authorizeUrl = new URL(result.kakaoAuthUrl);
		const state = authorizeUrl.searchParams.get('state');

		expect(result.next).toBe('/');
		expect(state).toMatch(/^[0-9a-f]{64}$/);
		expect(state).not.toContain('evil.example');
		expect(cookies.set).toHaveBeenCalledWith(
			'oauth_state',
			state,
			expect.objectContaining({ httpOnly: true, sameSite: 'lax', secure: true, maxAge: 600 })
		);
		expect(cookies.set).toHaveBeenCalledWith(
			'oauth_next',
			'/',
			expect.objectContaining({ httpOnly: true, sameSite: 'lax', secure: true, maxAge: 600 })
		);
	});

	it('콜백 state가 쿠키와 다르면 카카오 토큰 요청 전에 거부한다', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		const cookies = {
			get: vi.fn((name: string) => (name === 'oauth_state' ? 'a'.repeat(64) : '/')),
			delete: vi.fn()
		};

		await expect(
			kakaoCallback({
				url: new URL(`https://golabau.com/auth/callback/kakao?code=test&state=${'b'.repeat(64)}`),
				cookies
			} as never)
		).rejects.toMatchObject({ status: 303, location: '/login?error=kakao' });
		expect(fetchSpy).not.toHaveBeenCalled();
		expect(cookies.delete).toHaveBeenCalledWith('oauth_state', { path: '/' });
		expect(cookies.delete).toHaveBeenCalledWith('oauth_next', { path: '/' });
	});

	it('Cloudflare 로그인 요청 제한을 넘으면 DB와 PBKDF2 전에 429로 거부한다', async () => {
		const form = new FormData();
		form.set('adminId', 'golabau');
		form.set('adminPassword', 'password');
		const limiter = { limit: vi.fn(async () => ({ success: false })) };

		const result = await actions.adminLogin!({
			request: new Request('https://golabau.com/login?/adminLogin', { method: 'POST', body: form }),
			cookies: { set: vi.fn() },
			getClientAddress: () => '203.0.113.7',
			platform: { env: { ADMIN_LOGIN_RATE_LIMITER: limiter } }
		} as never);

		expect(result).toMatchObject({ status: 429 });
		expect(limiter.limit).toHaveBeenCalledWith({ key: '203.0.113.7' });
		expect(findFirst).not.toHaveBeenCalled();
	});
});
