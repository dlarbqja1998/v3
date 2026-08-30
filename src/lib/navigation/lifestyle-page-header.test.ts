import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import LifestylePageHeader from './LifestylePageHeader.svelte';

describe('생활 페이지 공통 헤더', () => {
	it('18px 중앙 제목과 같은 크기의 양쪽 터치 영역을 제공한다', () => {
		const body = render(LifestylePageHeader, {
			props: { title: '오늘, 고려대학교', closeLabel: '오늘 닫기' }
		}).body;

		expect(body).toContain('data-lifestyle-page-header');
		expect(body).toContain('text-lg font-black');
		expect(body.match(/h-11 w-11/g)).toHaveLength(2);
		expect(body).toContain('aria-label="뒤로 가기"');
		expect(body).toContain('aria-label="오늘 닫기"');
	});
});
