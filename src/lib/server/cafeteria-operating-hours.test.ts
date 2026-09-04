import { describe, expect, it } from 'vitest';

import { getCafeteriaOperatingHours } from './cafeteria-operating-hours';

describe('학식 운영시간 기본 데이터', () => {
	it('DB를 사용할 수 없을 때 공식 식단표로 확인된 진리관 운영시간만 반환한다', async () => {
		const rows = await getCafeteriaOperatingHours();

		expect(
			rows.map(({ cafeteriaCode, label, daysOfWeek, opensAt, closesAt, displayOrder }) => ({
				cafeteriaCode,
				label,
				daysOfWeek,
				opensAt,
				closesAt,
				displayOrder
			}))
		).toEqual([
			{
				cafeteriaCode: 'jinri',
				label: '조식',
				daysOfWeek: [1, 2, 3, 4, 5],
				opensAt: '07:30',
				closesAt: '09:00',
				displayOrder: 1
			},
			{
				cafeteriaCode: 'jinri',
				label: '중식',
				daysOfWeek: [1, 2, 3, 4, 5],
				opensAt: '11:30',
				closesAt: '13:30',
				displayOrder: 2
			},
			{
				cafeteriaCode: 'jinri',
				label: '석식',
				daysOfWeek: [1, 2, 3, 4, 5],
				opensAt: '17:00',
				closesAt: '18:30',
				displayOrder: 3
			}
		]);
	});
});
