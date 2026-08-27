import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listUserInquiries, createInquiry, notifyDiscordOfInquiry } = vi.hoisted(() => ({
	listUserInquiries: vi.fn(), createInquiry: vi.fn(), notifyDiscordOfInquiry: vi.fn()
}));
vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'db', DISCORD_WEBHOOK_URL: 'secret' } }));
vi.mock('$lib/server/support-inquiries', () => ({ listUserInquiries, createInquiry }));
vi.mock('$lib/server/discord-inquiry', () => ({ notifyDiscordOfInquiry }));

import { actions, load } from './+page.server';

describe('사용자 문의함', () => {
	beforeEach(() => vi.clearAllMocks());

	it('로그인하지 않으면 로그인 화면으로 보낸다', async () => {
		await expect(load({ locals: { user: null } } as never)).rejects.toMatchObject({ status: 303 });
	});

	it('문의 저장 성공 후 Discord 알림을 백그라운드로 예약한다', async () => {
		createInquiry.mockResolvedValue({ ok: true, inquiry: { id: 'q1', category: 'OTHER', title: '문의 제목', content: '문의 내용은 열 글자 이상입니다.' } });
		const waitUntil = vi.fn();
		const form = new FormData();
		form.set('category', 'OTHER'); form.set('title', '문의 제목'); form.set('content', '문의 내용은 열 글자 이상입니다.');
		const result = await actions.create!({
			locals: { user: { id: 7 } }, platform: { context: { waitUntil } },
			request: new Request('http://localhost/my/inquiries', { method: 'POST', body: form })
		} as never);
		expect(result).toEqual({ success: true, message: '문의를 등록했습니다.' });
		expect(waitUntil).toHaveBeenCalledOnce();
	});

	it('문의 제한은 429 상태로 알린다', async () => {
		createInquiry.mockResolvedValue({ ok: false, reason: 'RATE_LIMIT' });
		const form = new FormData();
		form.set('category', 'OTHER'); form.set('title', '문의 제목'); form.set('content', '문의 내용은 열 글자 이상입니다.');
		const result = await actions.create!({ locals: { user: { id: 7 } }, request: new Request('http://localhost', { method: 'POST', body: form }) } as never);
		expect(result).toMatchObject({ status: 429 });
	});
});
