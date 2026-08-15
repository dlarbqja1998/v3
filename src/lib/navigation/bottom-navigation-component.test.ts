import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import BottomNavigation from './BottomNavigation.svelte';

describe('하단 내비게이션 배치', () => {
	it('외부 위치 클래스와 토스트 기준 위치를 서로 다른 요소에 적용한다', () => {
		const { body } = render(BottomNavigation, {
			props: {
				containerClass: 'absolute inset-x-0 bottom-0 z-30',
				isAuthenticated: false
			}
		});

		expect(body).toContain(
			'class="absolute inset-x-0 bottom-0 z-30" data-bottom-navigation-shell'
		);
		expect(body).toContain('<nav class="relative h-[var(--bottom-navigation-height)]');
	});
});
