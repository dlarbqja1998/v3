import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { getVoteWindow } from '$lib/domain/cafeteria-feedback';
import { getOfferingById, getOrCreateVoterHash } from '$lib/server/cafeteria-feedback';
import { createDb } from '$lib/server/db';
import { cafeteriaMenuVotes } from '$lib/server/db/schema';

type VoteRequest = {
	offeringId?: string;
	reaction?: 'like' | 'dislike';
};

export async function POST({ request, cookies }) {
	let payload: VoteRequest;
	try {
		payload = await request.json();
	} catch {
		return json({ error: '잘못된 요청입니다.' }, { status: 400 });
	}

	if (!payload.offeringId || (payload.reaction !== 'like' && payload.reaction !== 'dislike')) {
		return json({ error: '평가 정보를 확인해 주세요.' }, { status: 400 });
	}

	const offering = await getOfferingById(env.DATABASE_URL, payload.offeringId);
	if (!offering || !offering.isVotable) {
		return json({ error: '평가할 수 없는 메뉴입니다.' }, { status: 400 });
	}

	const mealSlot = offering.mealSlot as 'breakfast' | 'lunch' | 'dinner' | 'all_day';
	const voteWindow = getVoteWindow(offering.menuDate, mealSlot);
	const now = new Date();
	if (now < voteWindow.opensAt || now >= voteWindow.closesAt) {
		return json({ error: '평가 가능 시간이 아닙니다.' }, { status: 403 });
	}

	const voter = await getOrCreateVoterHash(cookies.get('cafeteria_voter'));
	if (!cookies.get('cafeteria_voter')) {
		cookies.set('cafeteria_voter', voter.voterId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !dev,
			maxAge: 60 * 60 * 24 * 365
		});
	}

	if (!env.DATABASE_URL) {
		return json({ error: '평가 서비스를 준비 중입니다.' }, { status: 503 });
	}

	const db = createDb(env.DATABASE_URL);
	await db
		.insert(cafeteriaMenuVotes)
		.values({ offeringId: offering.id, voterHash: voter.voterHash, reaction: payload.reaction })
		.onConflictDoUpdate({
			target: [cafeteriaMenuVotes.offeringId, cafeteriaMenuVotes.voterHash],
			set: { reaction: payload.reaction, updatedAt: new Date() }
		});

	return json({ success: true, offeringId: offering.id, reaction: payload.reaction });
}
