import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import FacilityFilterChips from './FacilityFilterChips.svelte';

describe('시설 카테고리 필터칩', () => {
	it('행사를 맨 앞에 두고 승인된 시설 카테고리를 표시한다', () => {
		const { body } = render(FacilityFilterChips, {
			props: { selectedCategory: 'all', onCategoryChange: () => undefined }
		});

		for (const label of ['행사', '식당', '카페', '편의점', '서점', '복사실', '우체국', '크림슨스토어', '헬스장']) {
			expect(body).toContain(label);
		}
		expect(body.indexOf('행사')).toBeLessThan(body.indexOf('식당'));
		expect(body.indexOf('식당')).toBeLessThan(body.indexOf('카페'));
		expect(body.indexOf('카페')).toBeLessThan(body.indexOf('편의점'));
		expect(body).not.toContain('학식');
		expect(body).not.toContain('셔틀');
	});

	it('선택한 카테고리 하나만 눌림 상태로 알린다', () => {
		const { body } = render(FacilityFilterChips, {
			props: { selectedCategory: 'cafe', onCategoryChange: () => undefined }
		});

		const selected = [...body.matchAll(/<button\b[^>]*aria-pressed="true"[^>]*>([\s\S]*?)<\/button>/g)];
		expect(selected).toHaveLength(1);
		expect(selected[0][1]).toContain('카페');
	});
});
