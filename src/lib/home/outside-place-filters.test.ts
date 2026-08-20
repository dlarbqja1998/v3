import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';

import OutsidePlaceFilters from './OutsidePlaceFilters.svelte';

const handlers = {
	onCategoryChange: () => undefined,
	onCuisineChange: () => undefined
};

describe('학교 밖 장소 필터', () => {
	it('상위 카테고리를 한 줄의 필터칩으로 제공한다', () => {
		const { body } = render(OutsidePlaceFilters, {
			props: {
				selectedCategory: 'all',
				selectedCuisine: 'all',
				...handlers
			}
		});

		expect(body).toContain('aria-label="학교 밖 장소 카테고리"');
		expect(body).toContain('전체');
		expect(body).toContain('음식점');
		expect(body).toContain('카페');
		expect(body).toContain('술집');
		expect(body).toContain('필터');
	});

	it('음식점에서 선택한 음식 종류를 활성 필터칩에 표시한다', () => {
		const { body } = render(OutsidePlaceFilters, {
			props: {
				selectedCategory: 'restaurant',
				selectedCuisine: 'korean',
				...handlers
			}
		});

		expect(body).toContain('한식');
		expect(body).toContain('aria-pressed="true"');
	});
});
