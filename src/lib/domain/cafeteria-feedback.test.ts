import { describe, expect, it } from 'vitest';
import {
	aggregateOfferingFeedback,
	getWeeklyVoteAvailability,
	normalizeMenuName
} from './cafeteria-feedback';

describe('학식 메뉴 이름 정리', () => {
	it('메뉴 이름의 공백을 정리해 같은 메뉴 키를 만든다', () => {
		expect(normalizeMenuName('  제육   볶음  ')).toBe('제육 볶음');
	});
});

describe('학식 평가 가능 기간', () => {
	it('수요일에는 이번 주 월·수 메뉴만 열고 목요일 메뉴는 목요일 안내를 반환한다', () => {
		const now = new Date('2026-09-02T03:00:00.000Z');
		expect(getWeeklyVoteAvailability('2026-08-31', now)).toEqual({
			isOpen: true,
			availableFromDayLabel: null
		});
		expect(getWeeklyVoteAvailability('2026-09-02', now).isOpen).toBe(true);
		expect(getWeeklyVoteAvailability('2026-09-03', now)).toEqual({
			isOpen: false,
			availableFromDayLabel: '목요일'
		});
	});

	it('일요일에는 같은 주 금요일 메뉴를 평가할 수 있고 지난주 메뉴는 닫는다', () => {
		const now = new Date('2026-09-06T03:00:00.000Z');
		expect(getWeeklyVoteAvailability('2026-09-04', now).isOpen).toBe(true);
		expect(getWeeklyVoteAvailability('2026-08-28', now)).toEqual({
			isOpen: false,
			availableFromDayLabel: null
		});
	});
});

describe('현재 및 누적 평가 집계', () => {
	it('같은 식당 메뉴의 이전·현재 투표를 누적하고 현재 사용자의 이번 등장 반응만 찾는다', () => {
		const summaries = aggregateOfferingFeedback(
			[
				{ id: 'past', menuItemId: 'jinri-pork', isCurrent: false },
				{ id: 'today', menuItemId: 'jinri-pork', isCurrent: true }
			],
			[
				{ offeringId: 'past', userId: 2, reaction: 'like' },
				{ offeringId: 'today', userId: 1, reaction: 'dislike' }
			],
			1
		);

		expect(summaries.get('today')).toEqual({
			occurrenceLikes: 0,
			occurrenceDislikes: 1,
			cumulativeLikes: 1,
			cumulativeDislikes: 1,
			hasPreviousOffering: true,
			myReaction: 'dislike'
		});
	});
});
