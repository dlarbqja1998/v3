import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listPublicNotices } = vi.hoisted(() => ({ listPublicNotices: vi.fn() }));

vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'postgresql://test' } }));
vi.mock('$lib/server/notices', () => ({ listPublicNotices }));

import { load } from './+page.server';

describe('공개 공지사항 목록', () => {
	beforeEach(() => listPublicNotices.mockReset());

	it('게시된 공지 목록을 반환한다', async () => {
		listPublicNotices.mockResolvedValue([{ id: 'notice-1', title: '점검 안내' }]);

		await expect(load({} as never)).resolves.toEqual({
			notices: [{ id: 'notice-1', title: '점검 안내' }]
		});
	});
});
