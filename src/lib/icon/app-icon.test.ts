import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import AppIcon from './AppIcon.svelte';

describe('공용 앱 아이콘', () => {
	it('24px 정적 자산을 현재 글자색 마스크로 렌더링한다', () => {
		const { body } = render(AppIcon, {
			props: { name: 'shop', label: '상점' }
		});

		expect(body).toContain('/24 icon/shop.svg');
		expect(body).toContain('width:24px');
		expect(body).toContain('height:24px');
		expect(body).toContain('aria-label="상점"');
	});

	it('장식 아이콘은 보조기술에서 숨긴다', () => {
		const { body } = render(AppIcon, {
			props: { name: 'home' }
		});

		expect(body).toContain('aria-hidden="true"');
	});
});
