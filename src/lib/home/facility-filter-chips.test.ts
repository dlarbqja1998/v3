import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import FacilityFilterChips from './FacilityFilterChips.svelte';

describe('시설 카테고리 필터칩', () => {
	it('승인된 여섯 시설 카테고리만 표시한다', () => {
		const { body } = render(FacilityFilterChips, {
			props: { selectedCategory: 'all', onCategoryChange: () => undefined }
		});

		for (const label of ['편의점', '카페', '복사실', '크림슨스토어', '헬스장', '우체국']) {
			expect(body).toContain(label);
		}
		expect(body).not.toContain('학식');
		expect(body).not.toContain('셔틀');
	});
});
