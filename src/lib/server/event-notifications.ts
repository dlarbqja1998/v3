import { and, eq } from 'drizzle-orm';
import { createDb } from './db';
import { eventNotificationSubscriptions, users } from './db/schema';

export type EventNotificationEnv = { DATABASE_URL?: string; PUBLIC_VAPID_PUBLIC_KEY?: string; VAPID_PRIVATE_KEY?: string; VAPID_SUBJECT?: string };
export type EventPushSubscription = { endpoint: string; keys: { p256dh: string; auth: string } };

export function isAllowedPushEndpoint(value: unknown): value is string {
	if (typeof value !== 'string' || value.length > 4096) return false;
	try {
		const url = new URL(value);
		return url.protocol === 'https:' && !url.username && !url.password && (!url.port || url.port === '443') &&
			(url.hostname === 'fcm.googleapis.com' || url.hostname === 'updates.push.services.mozilla.com' || url.hostname.endsWith('.push.apple.com') || url.hostname.endsWith('.notify.windows.com'));
	} catch { return false; }
}

export function parseEventPushSubscription(value: unknown): EventPushSubscription | null {
	if (!value || typeof value !== 'object') return null;
	const input = value as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
	if (!isAllowedPushEndpoint(input.endpoint) || !input.keys) return null;
	const { p256dh, auth } = input.keys;
	if (typeof p256dh !== 'string' || typeof auth !== 'string' || !/^[A-Za-z0-9_-]{86,88}={0,2}$/.test(p256dh) || !/^[A-Za-z0-9_-]{22}={0,2}$/.test(auth)) return null;
	return { endpoint: input.endpoint, keys: { p256dh, auth } };
}

export async function saveEventPushSubscription(databaseUrl: string, userId: number, subscription: EventPushSubscription) {
	await createDb(databaseUrl).insert(eventNotificationSubscriptions).values({ userId, endpoint: subscription.endpoint, ...subscription.keys }).onConflictDoUpdate({ target: eventNotificationSubscriptions.endpoint, set: { userId, ...subscription.keys } });
}

export async function deleteEventPushSubscription(databaseUrl: string, userId: number, endpoint: string) {
	await createDb(databaseUrl).delete(eventNotificationSubscriptions).where(and(eq(eventNotificationSubscriptions.userId, userId), eq(eventNotificationSubscriptions.endpoint, endpoint)));
}

export async function hasEventPushSubscription(databaseUrl: string, userId: number, endpoint: string) {
	const row = await createDb(databaseUrl).query.eventNotificationSubscriptions.findFirst({ where: and(eq(eventNotificationSubscriptions.userId, userId), eq(eventNotificationSubscriptions.endpoint, endpoint)), columns: { id: true } });
	return !!row;
}

export async function notifyEventCollection(env: EventNotificationEnv, result: { status: string; newCount?: number; changedCount?: number; message: string }) {
	if (!env.DATABASE_URL || !env.PUBLIC_VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) return;
	const db = createDb(env.DATABASE_URL);
	const subscriptions = await db.select({ subscription: eventNotificationSubscriptions }).from(eventNotificationSubscriptions).innerJoin(users, and(eq(users.id, eventNotificationSubscriptions.userId), eq(users.role, 'admin'))).limit(50);
	const { generateRequestDetails } = await import('web-push');
	const title = result.status === 'completed' ? `행사 확인 완료 · 새 후보 ${result.newCount ?? 0}개` : '행사 확인 상태를 확인해 주세요';
	const payload = JSON.stringify({ title, body: result.message.slice(0, 200), url: '/admin/events/inbox' });
	let failures = 0;
	for (const { subscription } of subscriptions) {
		if (!isAllowedPushEndpoint(subscription.endpoint)) { failures++; continue; }
		try {
			const details = generateRequestDetails({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, payload, { TTL: 12 * 60 * 60, vapidDetails: { subject: env.VAPID_SUBJECT, publicKey: env.PUBLIC_VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY } });
			const response = await fetch(subscription.endpoint, { method: 'POST', headers: details.headers as Record<string, string>, body: details.body as BodyInit, redirect: 'error', signal: AbortSignal.timeout(10000) });
			if (response.status === 404 || response.status === 410) await db.delete(eventNotificationSubscriptions).where(eq(eventNotificationSubscriptions.id, subscription.id));
			else if (!response.ok) failures++;
		} catch { failures++; }
	}
	if (failures) console.error('행사 결과 알림 전송 실패', { count: failures });
}
