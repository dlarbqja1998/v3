import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { getTodayMenuWithRefresh } from '$lib/server/cafeteria-cache';
import { getWeeklyCafeteriaFeedback } from '$lib/server/cafeteria-feedback';
import { ensureWeeklyCafeteriaMenu } from '$lib/server/cafeteria-sync';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform, locals }) => {
	const headers = { 'cache-control': 'private, no-store' };
	if (!env.DATABASE_URL) return json({ error: '평가 서비스를 준비 중입니다.' }, { status: 503, headers });
	try {
		const menu = await getTodayMenuWithRefresh(platform);
		if (!menu) return json({ feedback: {} }, { headers });
		// 예약 갱신이 누락된 경우의 복구도 페이지 전환 이후에만 실행한다.
		await ensureWeeklyCafeteriaMenu(env.DATABASE_URL, menu);
		const feedback = await getWeeklyCafeteriaFeedback(env.DATABASE_URL, menu, locals.user?.id);
		return json({ feedback }, { headers });
	} catch (error) {
		console.error('학식 평가 조회 실패:', error);
		return json({ error: '평가를 불러오지 못했어요.' }, { status: 503, headers });
	}
};
