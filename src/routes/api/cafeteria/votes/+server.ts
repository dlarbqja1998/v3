import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { getWeeklyVoteAvailability } from '$lib/domain/cafeteria-feedback';
import {
	getOfferingById,
	getOfferingFeedback,
	toggleCafeteriaMenuVote
} from '$lib/server/cafeteria-feedback';
import type { RequestHandler } from './$types';

type VoteRequest = {
	offeringId?: string;
	reaction?: 'like' | 'dislike';
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: '로그인이 필요합니다.' }, { status: 401 });
	}

	let payload: VoteRequest;
	try {
		payload = await request.json();
	} catch {
		return json({ error: '잘못된 요청입니다.' }, { status: 400 });
	}

	if (!payload.offeringId || (payload.reaction !== 'like' && payload.reaction !== 'dislike')) {
		return json({ error: '평가 정보를 확인해 주세요.' }, { status: 400 });
	}
	if (!env.DATABASE_URL) {
		return json({ error: '평가 서비스를 준비 중입니다.' }, { status: 503 });
	}

	const offering = await getOfferingById(env.DATABASE_URL, payload.offeringId);
	if (!offering || !offering.isVotable || !offering.displayName.trim()) {
		return json({ error: '평가할 수 없는 메뉴입니다.' }, { status: 400 });
	}

	const availability = getWeeklyVoteAvailability(offering.menuDate, new Date());
	if (!availability.isOpen) {
		return json(
			{
				error: availability.availableFromDayLabel
					? `${availability.availableFromDayLabel}부터 평가할 수 있어요.`
					: '평가 기간이 지났습니다.'
			},
			{ status: 403 }
		);
	}

	try {
		await toggleCafeteriaMenuVote(
			env.DATABASE_URL,
			offering.id,
			locals.user.id,
			payload.reaction
		);
		const feedback = await getOfferingFeedback(env.DATABASE_URL, offering.id, locals.user.id);
		if (!feedback) {
			return json({ error: '평가 결과를 불러오지 못했습니다.' }, { status: 500 });
		}

		return json({ success: true, offeringId: offering.id, feedback });
	} catch (error) {
		console.error('학식 메뉴 평가 저장 실패:', error);
		return json({ error: '평가를 저장하지 못했어요. 다시 시도해 주세요.' }, { status: 500 });
	}
};
