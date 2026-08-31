import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getOfferingById, toggleCafeteriaMenuVote, getOfferingFeedback } = vi.hoisted(() => ({
	getOfferingById: vi.fn(),
	toggleCafeteriaMenuVote: vi.fn(),
	getOfferingFeedback: vi.fn()
}));

vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'db' } }));
vi.mock('$lib/server/cafeteria-feedback', () => ({
	getOfferingById,
	toggleCafeteriaMenuVote,
	getOfferingFeedback
}));

import { POST } from './+server';

const user = {
	id: 7,
	email: 'student@korea.ac.kr',
	nickname: '학생',
	profileImg: null,
	isOnboarded: true,
	role: 'user',
	college: null,
	department: null,
	grade: null,
	gender: null
};

function makeEvent(options: {
	user?: typeof user | null;
	menuDate?: string;
	reaction?: 'like' | 'dislike';
	rateLimitSuccess?: boolean;
}) {
	getOfferingById.mockResolvedValue({
		id: 'offering',
		menuDate: options.menuDate ?? '2026-08-31',
		isVotable: true,
		displayName: '제육볶음'
	});
	return {
		request: new Request('http://localhost/api/cafeteria/votes', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ offeringId: 'offering', reaction: options.reaction ?? 'like' })
		}),
		locals: { user: options.user === undefined ? user : options.user },
		platform: {
			env: {
				PUBLIC_WRITE_RATE_LIMITER: {
					limit: vi.fn(async () => ({ success: options.rateLimitSuccess ?? true }))
				}
			}
		}
	} as never;
}

describe('학식 메뉴 투표 API', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-08-31T03:00:00.000Z'));
		toggleCafeteriaMenuVote.mockResolvedValue({ reaction: null });
		getOfferingFeedback.mockResolvedValue({
			offeringId: 'offering',
			isVotable: true,
			occurrenceLikes: 0,
			occurrenceDislikes: 0,
			cumulativeLikes: 4,
			cumulativeDislikes: 1,
			hasPreviousOffering: true,
			myReaction: null
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	it('비로그인 요청을 401로 거부한다', async () => {
		const response = await POST(makeEvent({ user: null }));

		expect(response.status).toBe(401);
		expect(getOfferingById).not.toHaveBeenCalled();
	});

	it('현재 주의 미래 메뉴를 403으로 거부한다', async () => {
		const response = await POST(makeEvent({ menuDate: '2026-09-01' }));

		expect(response.status).toBe(403);
		expect(toggleCafeteriaMenuVote).not.toHaveBeenCalled();
	});

	it('한 사용자의 과도한 반복 평가는 DB 조회 전에 429로 거부한다', async () => {
		const response = await POST(makeEvent({ rateLimitSuccess: false }));

		expect(response.status).toBe(429);
		expect(getOfferingById).not.toHaveBeenCalled();
	});

	it('같은 반응 재클릭 결과에서 사용자 반응이 null인 최신 집계를 반환한다', async () => {
		const response = await POST(makeEvent({ reaction: 'like' }));

		expect(response.status).toBe(200);
		expect(toggleCafeteriaMenuVote).toHaveBeenCalledWith('db', 'offering', 7, 'like');
		expect(await response.json()).toMatchObject({
			success: true,
			feedback: { myReaction: null, occurrenceLikes: 0 }
		});
	});
});
