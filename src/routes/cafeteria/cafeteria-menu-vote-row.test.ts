import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import CafeteriaMenuVoteRow from './CafeteriaMenuVoteRow.svelte';

const feedback = {
	offeringId: 'offering',
	isVotable: true,
	occurrenceLikes: 12,
	occurrenceDislikes: 3,
	cumulativeLikes: 13,
	cumulativeDislikes: 5,
	hasPreviousOffering: true,
	myReaction: 'like' as const
};

describe('학식 메뉴 평가 행', () => {
	it('현재 평가 수와 선택 상태, 반복 메뉴 누적 통계를 표시한다', () => {
		const { body } = render(CafeteriaMenuVoteRow, {
			props: {
				menuName: '제육볶음',
				feedback,
				isAuthenticated: true,
				isVoteOpen: true,
				availableFromDayLabel: null,
				isSubmitting: false,
				onVote: () => undefined,
				onLoginRequired: () => undefined,
				onFutureVote: () => undefined
			}
		});

		expect(body).toContain('aria-label="제육볶음 좋아요 12개"');
		expect(body).toContain('aria-label="제육볶음 싫어요 3개"');
		expect(body).toContain('누적 18명 · 72%가 좋아했어요');
		expect(body).toContain('bg-brand text-white');
	});

	it('이전 등장 기록이 없거나 누적 평가가 5개 미만이면 누적 문구를 숨긴다', () => {
		const { body } = render(CafeteriaMenuVoteRow, {
			props: {
				menuName: '쌀밥',
				feedback: {
					...feedback,
					occurrenceLikes: 2,
					occurrenceDislikes: 1,
					cumulativeLikes: 2,
					cumulativeDislikes: 1,
					hasPreviousOffering: false,
					myReaction: null
				},
				isAuthenticated: false,
				isVoteOpen: true,
				availableFromDayLabel: null,
				isSubmitting: false,
				onVote: () => undefined,
				onLoginRequired: () => undefined,
				onFutureVote: () => undefined
			}
		});

		expect(body).not.toContain('누적');
	});
});
