import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import LoginPage from './+page.svelte';

const baseData = {
	kakaoAuthUrl: 'https://kauth.kakao.com/oauth/authorize',
	loginError: null
};

describe('비로그인 마이 로그인 화면', () => {
	it('마이에서 진입하면 마이 헤더와 하단 내비게이션을 유지한다', () => {
		const { body } = render(LoginPage, {
			props: {
				data: { ...baseData, next: '/my' },
				form: null
			} as never
		});

		expect(body).toContain('aria-label="마이 로그인"');
		expect(body).toContain('aria-label="하단 내비게이션"');
		expect(body).toContain('href="/my" aria-current="page"');
	});

	it('일반 로그인 진입은 독립 로그인 화면을 유지한다', () => {
		const { body } = render(LoginPage, {
			props: {
				data: { ...baseData, next: null },
				form: null
			} as never
		});

		expect(body).not.toContain('aria-label="하단 내비게이션"');
	});
});
