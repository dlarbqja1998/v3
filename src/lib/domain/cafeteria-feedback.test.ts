import { describe, expect, it } from 'vitest';
import {
	aggregateOfferingFeedback,
	getVoteWindow,
	isVotableMenu,
	normalizeMenuName
} from './cafeteria-feedback';

describe('학식 평가 메뉴 판별', () => {
	it.each(['제육볶음', '된장국', '비빔밥', '치즈돈까스'])('%s을 평가 대상으로 판단한다', (menu) => {
		expect(isVotableMenu(menu)).toBe(true);
	});

	it.each(['쌀밥', '배추김치', '깍두기', '양배추샐러드', '오이무침'])('%s을 평가 대상에서 제외한다', (menu) => {
		expect(isVotableMenu(menu)).toBe(false);
	});

	it('메뉴 이름의 공백을 정리해 같은 메뉴 키를 만든다', () => {
		expect(normalizeMenuName('  제육   볶음  ')).toBe('제육 볶음');
	});
});

describe('학식 평가 가능 기간', () => {
	it('중식은 당일 11:30부터 3일 뒤 자정 전까지 평가할 수 있다', () => {
		const window = getVoteWindow('2026-07-23', 'lunch');

		expect(window.opensAt.toISOString()).toBe('2026-07-23T02:30:00.000Z');
		expect(window.closesAt.toISOString()).toBe('2026-07-26T15:00:00.000Z');
	});
});

describe('오늘 및 역대 평가 집계', () => {
	it('오늘 제공 회차와 같은 메뉴의 역대 반응을 분리해 합산한다', () => {
		const summaries = aggregateOfferingFeedback(
			[
				{ id: 'today', menuItemId: 'pork', isCurrent: true },
				{ id: 'past', menuItemId: 'pork', isCurrent: false }
			],
			[
				{ offeringId: 'today', voterHash: 'me', reaction: 'like' },
				{ offeringId: 'today', voterHash: 'other', reaction: 'dislike' },
				{ offeringId: 'past', voterHash: 'other', reaction: 'like' }
			],
			'me'
		);

		expect(summaries.get('today')).toEqual({
			todayLikes: 1,
			todayDislikes: 1,
			historicalLikes: 2,
			historicalDislikes: 1,
			myReaction: 'like'
		});
	});
});
