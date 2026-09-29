import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isRedirect } from '@sveltejs/kit';

const state = vi.hoisted(() => ({ publish: vi.fn(), inbox: vi.fn(), spots: vi.fn(async () => []), subscribe: vi.fn() }));
vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'test', VAPID_PRIVATE_KEY: 'test', VAPID_SUBJECT: 'mailto:test@example.com' } }));
vi.mock('$env/dynamic/public', () => ({ env: { PUBLIC_VAPID_PUBLIC_KEY: 'public-test' } }));
vi.mock('$lib/server/event-candidates', () => ({ publishEventCandidate: state.publish, readEventInbox: state.inbox }));
vi.mock('$lib/server/campus-spots', () => ({ listCampusSpots: state.spots }));
vi.mock('$lib/server/event-notifications', async (importOriginal) => ({ ...await importOriginal<typeof import('./event-notifications')>(), saveEventPushSubscription: state.subscribe }));
import { load, actions } from '../../routes/admin/events/inbox/+page.server';
import { GET, POST } from '../../routes/api/admin/event-notifications/+server';
import { isAllowedPushEndpoint, parseEventPushSubscription } from './event-notifications';

beforeEach(() => vi.clearAllMocks());
const admin = { id: 1, role: 'admin' };
function event(user: unknown, candidates: string[] = []) {
	const form = new FormData(); for (const value of candidates) form.append('candidate', value);
	return { locals: { user }, request: new Request('https://golabau.com/admin/events/inbox?/publish', { method: 'POST', body: form }), platform: undefined };
}

describe('관리자 승인과 알림 접근 제어', () => {
	for (const user of [null, { id: 2, role: 'user' }]) {
		it(`관리자가 아니면 후보 조회와 게시를 막는다 (${user ? '일반 회원' : '비로그인'})`, async () => {
			for (const handler of [load, actions.publish]) {
				try { await handler(event(user) as never); expect.fail('접근이 허용됨'); }
				catch (error) { expect(isRedirect(error)).toBe(true); }
			}
			expect(state.inbox).not.toHaveBeenCalled(); expect(state.publish).not.toHaveBeenCalled();
			await expect(GET(event(user) as never)).rejects.toMatchObject({ status: 403 });
			await expect(POST(event(user) as never)).rejects.toMatchObject({ status: 403 });
		});
	}
	it('선택하지 않았거나 한도를 넘은 요청은 게시하지 않는다', async () => {
		for (const values of [[], Array.from({ length: 11 }, () => `${crypto.randomUUID()}:1`)]) expect(await actions.publish(event(admin, values) as never)).toMatchObject({ status: 400 });
		expect(state.publish).not.toHaveBeenCalled();
	});
	it('일부 후보 실패 시 성공한 후보와 실패한 후보를 구분한다', async () => {
		const ids = [crypto.randomUUID(), crypto.randomUUID()];
		state.publish.mockResolvedValueOnce({ ok: true, message: '게시했습니다.' }).mockRejectedValueOnce(new Error('실패'));
		expect(await actions.publish(event(admin, ids.map((id) => `${id}:1`)) as never)).toMatchObject({ message: '1개 게시 완료 · 1개 확인 필요', results: [{ id: ids[0], ok: true }, { id: ids[1], ok: false }] });
	});
	it('공개 알림 키는 public 환경에서 읽고 비공개 키는 반환하지 않는다', async () => {
		expect(await (await GET(event(admin) as never)).json()).toEqual({ publicKey: 'public-test' });
	});
	it('푸시 주소에 내부 서버나 임의 주소를 지정하지 못한다', () => {
		for (const endpoint of ['http://localhost/', 'https://127.0.0.1/', 'https://example.com/', 'https://fcm.googleapis.com.evil.test/', 'https://user@fcm.googleapis.com/', 'https://fcm.googleapis.com:8080/']) expect(isAllowedPushEndpoint(endpoint)).toBe(false);
		expect(parseEventPushSubscription({ endpoint: 'https://fcm.googleapis.com/fcm/send/test', keys: { p256dh: 'a'.repeat(87), auth: 'b'.repeat(22) } })).not.toBeNull();
		expect(parseEventPushSubscription({ endpoint: 'https://fcm.googleapis.com/fcm/send/test', keys: { p256dh: 'invalid', auth: 'invalid' } })).toBeNull();
	});
});
