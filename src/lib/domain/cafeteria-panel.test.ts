import { describe, expect, it } from 'vitest';

import { buildCafeteriaPanelItems } from './cafeteria-panel';

describe('학식 페이지 데이터', () => {
	it('주간 식단이 바뀌는 진리관과 교직원 식당만 페이지 모델로 만든다', () => {
		const weeklyMenu = {
			weekStartDate: '2026.08.17',
			todayKey: 'fri' as const,
			todayDate: '2026.08.21',
			todayDay: '금',
			days: []
		};

		expect(buildCafeteriaPanelItems(weeklyMenu)).toEqual([
			expect.objectContaining({ id: 'jinri', source: 'crawler', weeklyMenu }),
			expect.objectContaining({ id: 'faculty', source: 'crawler', weeklyMenu })
		]);
	});
});
