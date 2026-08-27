import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import NoticesPage from './+page.svelte';

describe('공지사항 목록 화면', () => {
	it('고정 여부와 게시일을 목록 행으로 보여준다', () => {
		const { body } = render(NoticesPage, {
			props: {
				data: {
					notices: [
						{
							id: 'notice-1',
							title: '서비스 점검 안내',
							isPinned: true,
							publishedAt: new Date('2026-08-28T00:00:00Z')
						}
					]
				}
			} as never
		});

		expect(body).toContain('공지사항');
		expect(body).toContain('고정');
		expect(body).toContain('서비스 점검 안내');
		expect(body).toContain('href="/notices/notice-1"');
	});
});
