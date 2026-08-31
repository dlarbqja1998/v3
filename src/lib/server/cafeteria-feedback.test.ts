import { describe, expect, it } from 'vitest';
import {
	toggleCafeteriaMenuVote,
	type CafeteriaVoteStore
} from './cafeteria-feedback';

function createVoteStore(initialReaction: 'like' | 'dislike' | null) {
	let reaction = initialReaction;
	const store: CafeteriaVoteStore = {
		find: async () => (reaction ? { reaction } : null),
		insert: async (_offeringId, _userId, nextReaction) => {
			reaction = nextReaction;
		},
		update: async (_offeringId, _userId, nextReaction) => {
			reaction = nextReaction;
		},
		remove: async () => {
			reaction = null;
		}
	};
	return store;
}

describe('계정형 학식 투표 토글', () => {
	it('미선택이면 투표를 생성한다', async () => {
		const result = await toggleCafeteriaMenuVote(
			'db',
			'offering',
			7,
			'like',
			createVoteStore(null)
		);

		expect(result).toEqual({ reaction: 'like' });
	});

	it('같은 반응이면 기존 투표를 삭제한다', async () => {
		const result = await toggleCafeteriaMenuVote(
			'db',
			'offering',
			7,
			'like',
			createVoteStore('like')
		);

		expect(result).toEqual({ reaction: null });
	});

	it('반대 반응이면 기존 투표를 변경한다', async () => {
		const result = await toggleCafeteriaMenuVote(
			'db',
			'offering',
			7,
			'dislike',
			createVoteStore('like')
		);

		expect(result).toEqual({ reaction: 'dislike' });
	});
});
