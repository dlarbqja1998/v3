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

	it('각 카테고리를 흰색 배경과 경계선이 있는 버튼으로 표시한다', () => {
		const { body } = render(FacilityFilterChips, {
			props: { selectedCategory: '', onCategoryChange: () => undefined }
		});

		expect(body).toMatch(/<button class="[^"]*rounded-\[14px\][^"]*\bborder\b[^"]*\bbg-white\b[^"]*"/);
	});

	it('선택한 카테고리는 크림슨 채움과 흰색 내용으로 구분한다', () => {
		const { body } = render(FacilityFilterChips, {
			props: { selectedCategory: 'cafe', onCategoryChange: () => undefined }
		});

		expect(body).toMatch(/<button class="[^"]*border-brand[^"]*bg-brand[^"]*text-white[^"]*" type="button" aria-pressed="true"/);
	});
});
