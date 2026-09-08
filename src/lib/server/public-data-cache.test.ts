import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPublicDataCache } from './public-data-cache';

afterEach(() => vi.useRealTimers());

describe('공개 데이터의 짧은 캐시', () => {
	it('동시 요청을 합치고 유효기간이 지난 뒤 다시 조회한다', async () => {
		vi.useFakeTimers();
		const cache = createPublicDataCache<number>(1000);
		const read = vi.fn().mockResolvedValue(1);
		await Promise.all([cache('db', read), cache('db', read)]);
		await cache('db', read);
		expect(read).toHaveBeenCalledTimes(1);
		vi.advanceTimersByTime(1001);
		await cache('db', read);
		expect(read).toHaveBeenCalledTimes(2);
	});

	it('실패를 저장하지 않고 다른 데이터베이스 결과를 섞지 않는다', async () => {
		const cache = createPublicDataCache<number>(1000);
		const read = vi.fn().mockRejectedValueOnce(new Error('조회 실패')).mockResolvedValue(1);
		await expect(cache('a', read)).rejects.toThrow('조회 실패');
		await expect(cache('a', read)).resolves.toBe(1);
		await expect(cache('b', () => Promise.resolve(2))).resolves.toBe(2);
		expect(read).toHaveBeenCalledTimes(2);
	});
});
