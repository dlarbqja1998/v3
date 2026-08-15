import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import LoginRequiredToast from './LoginRequiredToast.svelte';

describe('로그인 필요 토스트', () => {
	it('흰색과 크림슨 스타일로 접근 가능한 안내를 표시한다', () => {
		const { body } = render(LoginRequiredToast);

		expect(body).toContain('role="status"');
		expect(body).toContain('aria-live="polite"');
		expect(body).toContain('로그인이 필요합니다.');
		expect(body).toContain('bg-white');
		expect(body).toContain('text-brand');
	});
});
