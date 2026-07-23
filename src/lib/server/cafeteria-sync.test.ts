import { describe, expect, it } from 'vitest';
import { flattenWeeklyMenu } from './cafeteria-sync';

describe('주간 학식 메뉴 동기화 입력', () => {
	it('진리관 중식의 메인 메뉴와 국을 각각 제공 회차로 만든다', () => {
		const offerings = flattenWeeklyMenu({
			weekStartDate: '2026.07.20',
			todayKey: 'mon',
			todayDate: '2026.07.20',
			todayDay: '월',
			days: [
				{
					key: 'mon',
					date: '2026.07.20',
					day: '월',
					student: {
						breakfast: [],
						korean: ['제육볶음', '된장국', '쌀밥', '배추김치'],
						special: [],
						snack: [],
						dinner: []
					},
					faculty: { lunch: [], dinner: [] }
				}
			]
		});

		expect(offerings).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					cafeteriaCode: 'jinri',
					menuDate: '2026-07-20',
					mealSlot: 'lunch',
					menuSection: 'korean',
					displayName: '제육볶음',
					isVotable: true
				}),
				expect.objectContaining({ displayName: '된장국', isVotable: true }),
				expect.objectContaining({ displayName: '쌀밥', isVotable: false })
			])
		);
	});
});
