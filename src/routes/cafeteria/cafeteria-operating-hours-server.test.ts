import { beforeEach, describe, expect, it, vi } from 'vitest';

const { replaceCafeteriaOperatingHours } = vi.hoisted(() => ({
	replaceCafeteriaOperatingHours: vi.fn()
}));

vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'postgresql://test' } }));
vi.mock('$lib/server/cafeteria-operating-hours', () => ({ replaceCafeteriaOperatingHours }));
vi.mock('$lib/server/cafeteria-cache', () => ({ getTodayMenuWithRefresh: vi.fn() }));
vi.mock('$lib/server/cafeteria-feedback', () => ({ getWeeklyCafeteriaFeedback: vi.fn() }));
vi.mock('$lib/server/cafeteria-sync', () => ({ ensureWeeklyCafeteriaMenu: vi.fn() }));

import { actions } from './+page.server';

describe('학식 운영시간 저장', () => {
	beforeEach(() => {
		replaceCafeteriaOperatingHours.mockReset();
		replaceCafeteriaOperatingHours.mockResolvedValue(undefined);
	});

	it('저장한 식당과 운영시간을 성공 응답으로 돌려준다', async () => {
		const formData = new FormData();
		formData.set(
			'operatingHours',
			JSON.stringify({
				cafeteriaCode: 'faculty',
				rows: [
					{
						label: '중식',
						daysOfWeek: [1, 2, 3, 4, 5],
						opensAt: '11:30',
						closesAt: '14:00'
					}
				]
			})
		);

		await expect(
			actions.saveOperatingHours!({
				request: new Request('http://localhost/cafeteria?/saveOperatingHours', {
					method: 'POST',
					body: formData
				}),
				locals: { user: { id: 1, role: 'admin' } }
			} as never)
		).resolves.toEqual({
			operatingHoursSaved: {
				cafeteriaCode: 'faculty',
				rows: [
					{
						label: '중식',
						daysOfWeek: [1, 2, 3, 4, 5],
						opensAt: '11:30',
						closesAt: '14:00'
					}
				]
			},
			operatingHoursMessage: '운영시간을 저장했어요.'
		});
	});
});
