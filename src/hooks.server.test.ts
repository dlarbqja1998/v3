import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getUserBySessionToken } = vi.hoisted(() => ({ getUserBySessionToken: vi.fn() }));
vi.mock('$lib/server/user', () => ({
	getUserBySessionToken,
	toSafeUser: (user: unknown) => user
}));

import { handle } from './hooks.server';

function eventFor(url: string, init: RequestInit = {}) {
	return {
		url: new URL(url),
		request: new Request(url, init),
		cookies: { get: vi.fn(), delete: vi.fn() },
		locals: { user: null }
	};
}

describe('전역 HTTP 보안 경계', () => {
	beforeEach(() => getUserBySessionToken.mockReset());

	it('운영 도메인의 HTTP 요청을 HTTPS로 영구 이동한다', async () => {
		const resolve = vi.fn();
		const response = await handle({ event: eventFor('http://golabau.com/my') as never, resolve } as never);

		expect(response.status).toBe(308);
		expect(response.headers.get('location')).toBe('https://golabau.com/my');
		expect(resolve).not.toHaveBeenCalled();
	});

	it('다른 Origin에서 보낸 변경 요청은 서버 액션 전에 거부한다', async () => {
		const resolve = vi.fn();
		const response = await handle({
			event: eventFor('https://golabau.com/api/cafeteria/votes', {
				method: 'POST',
				headers: { origin: 'https://evil.example' }
			}) as never,
			resolve
		} as never);

		expect(response.status).toBe(403);
		expect(resolve).not.toHaveBeenCalled();
	});

	it('같은 Origin의 변경 요청은 통과시키고 모든 응답에 보안 헤더를 붙인다', async () => {
		const resolve = vi.fn(async () => new Response('ok'));
		const response = await handle({
			event: eventFor('https://golabau.com/api/cafeteria/votes', {
				method: 'POST',
				headers: { origin: 'https://golabau.com' }
			}) as never,
			resolve
		} as never);

		expect(response.status).toBe(200);
		expect(response.headers.get('strict-transport-security')).toContain('max-age=31536000');
		expect(response.headers.get('x-content-type-options')).toBe('nosniff');
		expect(response.headers.get('x-frame-options')).toBe('DENY');
		expect(response.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
		expect(response.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
	});

	it('네이버 지도 SDK가 사용하는 메타데이터 호스트만 스크립트 출처로 허용한다', async () => {
		const resolve = vi.fn(async () => new Response('ok'));
		const response = await handle({
			event: eventFor('https://golabau.com/') as never,
			resolve
		} as never);

		const policy = response.headers.get('content-security-policy') ?? '';
		expect(policy).toContain('https://nrbe.pstatic.net');
		expect(policy).toContain('https://map.pstatic.net');
		expect(policy).not.toContain('https://*.pstatic.net');
	});

	it('PostHog SDK 자산 호스트만 스크립트 출처로 허용한다', async () => {
		const resolve = vi.fn(async () => new Response('ok'));
		const response = await handle({
			event: eventFor('https://golabau.com/') as never,
			resolve
		} as never);

		const policy = response.headers.get('content-security-policy') ?? '';
		expect(policy).toContain('https://us-assets.i.posthog.com');
		expect(policy).not.toContain('https://*.posthog.com');
	});

	it('서버 시크릿으로 보호된 캐시 갱신 호출은 Origin이 없어도 라우트 검증으로 넘긴다', async () => {
		const resolve = vi.fn(async () => new Response('route result', { status: 403 }));
		const response = await handle({
			event: eventFor('https://golabau.com/api/refresh-menu', { method: 'POST' }) as never,
			resolve
		} as never);

		expect(resolve).toHaveBeenCalledOnce();
		expect(response.status).toBe(403);
	});

	it('일반 변경 API의 비정상적으로 큰 요청 본문은 파싱 전에 413으로 거부한다', async () => {
		const resolve = vi.fn();
		const response = await handle({
			event: eventFor('https://golabau.com/api/cafeteria/votes', {
				method: 'POST',
				headers: { origin: 'https://golabau.com', 'content-length': String(1024 * 1024) }
			}) as never,
			resolve
		} as never);

		expect(response.status).toBe(413);
		expect(resolve).not.toHaveBeenCalled();
	});
});
