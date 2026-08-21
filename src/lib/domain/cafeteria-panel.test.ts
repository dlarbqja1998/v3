import { describe, expect, it } from 'vitest';

import { buildCafeteriaPanelItems } from './cafeteria-panel';

describe('학식 페이지 데이터', () => {
	it('DB 조회 없이 크롤링한 주간 식단과 고정 푸드코트 메뉴를 페이지 모델로 만든다', () => {
		const weeklyMenu = {
			weekStartDate: '2026.08.17',
			todayKey: 'fri' as const,
			todayDate: '2026.08.21',
			todayDay: '금',
			days: []
		};

		expect(buildCafeteriaPanelItems(weeklyMenu)).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: 'jinri', weeklyMenu }),
				expect.objectContaining({ id: 'faculty', weeklyMenu }),
				expect.objectContaining({ id: 'foodcourt', source: 'static' })
			])
		);
	});
});
