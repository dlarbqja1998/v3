import { describe, expect, it, vi } from 'vitest';

import {
	ANALYTICS_USER_MARKER_KEY,
	captureEvent,
	createPageViewProperties,
	isPosthogProductionHost,
	syncAnalyticsUser,
	type AnalyticsStorage,
	type PostHogClient
} from './posthog.client';

function createClient(): PostHogClient {
	return {
		capture: vi.fn(),
		identify: vi.fn(),
		reset: vi.fn()
	};
}

function createStorage(initial: Record<string, string> = {}): AnalyticsStorage {
	const values = new Map(Object.entries(initial));
	return {
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => values.set(key, value),
		removeItem: (key) => values.delete(key)
	};
}

describe('PostHog 클라이언트 연결', () => {
	it('운영 도메인에서만 분석을 활성화한다', () => {
		expect(isPosthogProductionHost('golabau.com')).toBe(true);
		expect(isPosthogProductionHost('www.golabau.com')).toBe(true);
		expect(isPosthogProductionHost('localhost')).toBe(false);
		expect(isPosthogProductionHost('v3.example.workers.dev')).toBe(false);
	});

	it('로그인 사용자를 DB ID로 식별하고 개인정보는 전송하지 않는다', () => {
		const client = createClient();
		const storage = createStorage();

		syncAnalyticsUser(
			{ id: 42, role: 'user', isOnboarded: true, nickname: '보내면 안 됨' },
			client,
			storage
		);

		expect(client.identify).toHaveBeenCalledWith('42', {
			user_role: 'user',
			onboarding_completed: true
		});
		expect(client.identify).not.toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ nickname: expect.anything() })
		);
		expect(storage.getItem(ANALYTICS_USER_MARKER_KEY)).toBe('42');
	});

	it('로그아웃 직후 한 번만 식별을 초기화하고 일반 비로그인 재방문은 유지한다', () => {
		const client = createClient();
		const storage = createStorage({ [ANALYTICS_USER_MARKER_KEY]: '42' });

		syncAnalyticsUser(null, client, storage);
		syncAnalyticsUser(null, client, storage);

		expect(client.reset).toHaveBeenCalledTimes(1);
		expect(storage.getItem(ANALYTICS_USER_MARKER_KEY)).toBeNull();
	});

	it('이벤트와 안전한 페이지 경로를 PostHog에 전달한다', () => {
		const client = createClient();
		captureEvent(client, 'view_map_home', { source: 'navigation' });

		expect(client.capture).toHaveBeenCalledWith('view_map_home', { source: 'navigation' });
		expect(createPageViewProperties(new URL('https://golabau.com/search?q=nickname'))).toEqual({
			path: '/search'
		});
	});
});
