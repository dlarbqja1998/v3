import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	getHomeNotice,
	getPublicNotice,
	listPublicNotices,
	resolvePublishedAt
} from './notices';

const { findMany, findFirst } = vi.hoisted(() => ({
	findMany: vi.fn(),
	findFirst: vi.fn()
}));

const db = { query: { notices: { findMany, findFirst } } };

describe('공지사항 서버 조회', () => {
	beforeEach(() => {
		findMany.mockReset();
		findFirst.mockReset();
	});

	it('공개 공지 목록을 고정·최신 순서로 요청한다', async () => {
		findMany.mockResolvedValue([{ id: 'notice-1' }]);

		await expect(listPublicNotices('postgresql://test', db as never)).resolves.toEqual([
			{ id: 'notice-1' }
		]);
		expect(findMany).toHaveBeenCalledOnce();
		expect(findMany.mock.calls[0][0]).toMatchObject({ orderBy: expect.any(Array) });
	});

	it('공개되지 않은 공지는 상세 조회 결과로 반환하지 않는다', async () => {
		findFirst.mockResolvedValue(undefined);

		await expect(getPublicNotice('postgresql://test', 'hidden', db as never)).resolves.toBeNull();
		expect(findFirst).toHaveBeenCalledOnce();
	});

	it('메인 노출 공지 한 건을 조회한다', async () => {
		findFirst.mockResolvedValue({ id: 'home-notice' });

		await expect(getHomeNotice('postgresql://test', db as never)).resolves.toEqual({
			id: 'home-notice'
		});
		expect(findFirst.mock.calls[0][0]).toMatchObject({ orderBy: expect.any(Array) });
	});

	it('최초 게시 시각은 한 번만 설정한다', () => {
		const now = new Date('2026-08-28T00:00:00Z');
		const previous = new Date('2026-08-27T00:00:00Z');

		expect(resolvePublishedAt('DRAFT', null, now)).toBeNull();
		expect(resolvePublishedAt('PUBLISHED', null, now)).toBe(now);
		expect(resolvePublishedAt('PUBLISHED', previous, now)).toBe(previous);
	});
});
