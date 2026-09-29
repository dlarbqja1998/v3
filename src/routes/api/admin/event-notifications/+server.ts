import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { error, json } from '@sveltejs/kit';
import { deleteEventPushSubscription, hasEventPushSubscription, parseEventPushSubscription, saveEventPushSubscription } from '$lib/server/event-notifications';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (locals.user?.role !== 'admin') error(403, '관리자만 알림을 설정할 수 있습니다.');
	return json({ publicKey: publicEnv.PUBLIC_VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT ? publicEnv.PUBLIC_VAPID_PUBLIC_KEY : null }, { headers: { 'Cache-Control': 'private, no-store' } });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (locals.user?.role !== 'admin') error(403, '관리자만 알림을 설정할 수 있습니다.');
	const text = await request.text();
	if (text.length > 8192) error(413, '알림 설정 요청이 너무 큽니다.');
	let input;
	try { input = JSON.parse(text); } catch { error(400, '알림 설정을 확인해 주세요.'); }
	const subscription = parseEventPushSubscription(input?.subscription);
	if (!subscription) error(400, '이 브라우저의 알림 정보를 확인하지 못했습니다.');
	if (input.action === 'status') return json({ subscribed: await hasEventPushSubscription(env.DATABASE_URL, locals.user.id, subscription.endpoint) }, { headers: { 'Cache-Control': 'private, no-store' } });
	if (input.action === 'unsubscribe') await deleteEventPushSubscription(env.DATABASE_URL, locals.user.id, subscription.endpoint);
	else if (input.action === 'subscribe') {
		if (!publicEnv.PUBLIC_VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) error(503, '알림 연결을 준비 중입니다.');
		await saveEventPushSubscription(env.DATABASE_URL, locals.user.id, subscription);
	} else error(400, '알림 설정을 확인해 주세요.');
	return json({ ok: true });
};
