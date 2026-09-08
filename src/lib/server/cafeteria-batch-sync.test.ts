import { describe, expect, it, vi } from 'vitest';
import { syncCafeteriaOfferings, type CafeteriaOfferingInput } from './cafeteria-sync';

describe('학식 일괄 저장', () => {
	it('반복 메뉴와 중복 제공 회차를 합치고 두 번의 저장으로 처리한다', async () => {
		const input: CafeteriaOfferingInput = { cafeteriaCode: 'jinri', menuDate: '2026-09-07', mealSlot: 'lunch', menuSection: 'korean', displayName: '쌀밥', normalizedName: '쌀밥', isVotable: true };
		const values = vi.fn();
		const returning = vi.fn().mockResolvedValue([{ id: 'rice', cafeteriaCode: 'jinri', normalizedName: '쌀밥' }]);
		const conflict = vi.fn().mockReturnValue({ returning });
		values.mockReturnValue({ onConflictDoUpdate: conflict });
		const insert = vi.fn().mockReturnValue({ values });
		const count = await syncCafeteriaOfferings('test', [input, input, { ...input, menuDate: '2026-09-08' }], { insert } as never);
		expect(insert).toHaveBeenCalledTimes(2);
		expect(values.mock.calls[0][0]).toHaveLength(1);
		expect(values.mock.calls[1][0]).toHaveLength(2);
		expect(count).toBe(2);
	});
});
