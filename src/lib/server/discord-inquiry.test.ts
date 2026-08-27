import { describe, expect, it, vi } from 'vitest';
import { notifyDiscordOfInquiry } from './discord-inquiry';

describe('Discord 문의 알림', () => {
	it('웹훅이 없으면 전송하지 않는다', async () => {
		const fetcher = vi.fn();
		await expect(notifyDiscordOfInquiry('', { id: 'q1', categoryLabel: '기타', title: '문의', content: '내용입니다.' }, fetcher)).resolves.toBe(false);
		expect(fetcher).not.toHaveBeenCalled();
	});

	it('Discord 오류가 문의 처리까지 실패시키지 않는다', async () => {
		const fetcher = vi.fn().mockRejectedValue(new Error('network'));
		await expect(notifyDiscordOfInquiry('https://discord.test/webhook', { id: 'q1', categoryLabel: '기타', title: '문의', content: '내용입니다.' }, fetcher)).resolves.toBe(false);
	});
});
