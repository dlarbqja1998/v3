import { describe, expect, it } from 'vitest';
import { flattenFoodCourtMenu, flattenWeeklyMenu, shouldSyncWeeklyMenu } from './cafeteria-sync';

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
				expect.objectContaining({ displayName: '쌀밥', isVotable: true }),
				expect.objectContaining({ displayName: '배추김치', isVotable: true })
			])
		);
	});

	it('교직원은 중식만 동기화하고 진리관 석식은 유지한다', () => {
		const offerings = flattenWeeklyMenu({
			weekStartDate: '2026.08.31',
			todayKey: 'mon',
			todayDate: '2026.08.31',
			todayDay: '월',
			days: [
				{
					key: 'mon',
					date: '2026.08.31',
					day: '월',
					student: {
						breakfast: [],
						korean: [],
						special: [],
						snack: [],
						dinner: ['진리관 석식']
					},
					faculty: { lunch: ['교직원 중식'], dinner: ['잘못 들어온 교직원 석식'] }
				}
			]
		});

		expect(offerings).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ cafeteriaCode: 'faculty', displayName: '교직원 중식' }),
				expect.objectContaining({ cafeteriaCode: 'jinri', displayName: '진리관 석식' })
			])
		);
		expect(offerings).not.toEqual(
			expect.arrayContaining([
				expect.objectContaining({ cafeteriaCode: 'faculty', mealSlot: 'dinner' })
			])
		);
	});
});

describe('푸드코트 메뉴 동기화 입력', () => {
	it('정적 메뉴를 오늘의 평가 제공 회차로 만든다', () => {
		const offerings = flattenFoodCourtMenu('2026-07-23');

		expect(offerings[0]).toEqual(
			expect.objectContaining({
				cafeteriaCode: 'foodcourt',
				menuDate: '2026-07-23',
				mealSlot: 'all_day',
				isVotable: true
			})
		);
	});
});

describe('주간 메뉴 동기화 필요 여부', () => {
	it('DB 제공 회차가 크롤링 메뉴보다 적으면 동기화한다', () => {
		expect(shouldSyncWeeklyMenu(12, 0)).toBe(true);
		expect(shouldSyncWeeklyMenu(12, 11)).toBe(true);
		expect(shouldSyncWeeklyMenu(12, 12)).toBe(false);
	});
});
