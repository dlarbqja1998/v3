import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import OnboardingFlow from './OnboardingFlow.svelte';

describe('공통 온보딩 화면', () => {
	it('실제 가입 모드는 POST 폼을 제공하고 미리보기 도구를 숨긴다', () => {
		const { body } = render(OnboardingFlow, { props: { mode: 'register' } });

		expect(body).toContain('method="POST"');
		expect(body).not.toContain('미리보기 나가기');
	});

	it('미리보기 모드는 나가기와 저장 차단 안내를 제공하고 POST 폼을 만들지 않는다', () => {
		const { body } = render(OnboardingFlow, {
			props: { mode: 'preview', exitHref: '/my' }
		});

		expect(body).toContain('미리보기 나가기');
		expect(body).toContain('href="/my"');
		expect(body).not.toContain('method="POST"');
		expect(body).toContain('미리보기에서는 정보가 저장되지 않습니다.');
		expect(body).toContain('aria-live="polite"');
	});
});
