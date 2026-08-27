import { describe, expect, it } from 'vitest';
import { normalizeNoticeInput, sortPublicNotices } from './notices';

describe('공지사항 도메인', () => {
	it('고정 공지를 먼저 두고 같은 그룹은 최신 게시순으로 정렬한다', () => {
		expect(
			sortPublicNotices([
				{ id: 'old', isPinned: false, publishedAt: new Date('2026-08-01') },
				{ id: 'pinned', isPinned: true, publishedAt: new Date('2026-07-01') },
				{ id: 'new', isPinned: false, publishedAt: new Date('2026-08-02') }
			]).map((notice) => notice.id)
		).toEqual(['pinned', 'new', 'old']);
	});

	it('제목과 본문 길이가 부족한 공지를 거부한다', () => {
		const form = new FormData();
		form.set('title', '공');
		form.set('content', '짧음');

		expect(normalizeNoticeInput(form)).toEqual({
			ok: false,
			message: '공지 제목과 내용을 확인해 주세요.'
		});
	});

	it('게시 상태와 두 스위치를 정규화한다', () => {
		const form = new FormData();
		form.set('title', '서비스 점검 안내');
		form.set('content', '서비스 점검이 오늘 오후에 진행될 예정입니다.');
		form.set('status', 'PUBLISHED');
		form.set('isPinned', 'on');
		form.set('showOnHome', 'on');

		expect(normalizeNoticeInput(form)).toEqual({
			ok: true,
			value: {
				title: '서비스 점검 안내',
				content: '서비스 점검이 오늘 오후에 진행될 예정입니다.',
				status: 'PUBLISHED',
				isPinned: true,
				showOnHome: true
			}
		});
	});
});
