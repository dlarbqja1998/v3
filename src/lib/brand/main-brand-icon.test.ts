import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import MainBrandIcon from './MainBrandIcon.svelte';

describe('메인 브랜드 아이콘', () => {
	it('정적 호이 핀 이미지를 60px 크기로 렌더링한다', () => {
		const { body } = render(MainBrandIcon);

		expect(body).toContain('src="/icon.png"');
		expect(body).toContain('alt="골라바유 호이 핀"');
		expect(body).toContain('h-[60px] w-[60px]');
		expect(body).toContain('object-contain');
	});
});
