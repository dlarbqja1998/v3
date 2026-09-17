import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAsyncDataCache } from './async-data-cache';

afterEach(() => vi.useRealTimers());

describe('매장 데이터 메모리 캐시', () => {
	it('동일 매장의 동시 조회를 합치고 여러 매장을 번갈아 열어도 재사용한다', async () => {
		const cache = createAsyncDataCache<number>(60_000);
		const first = vi.fn().mockResolvedValue(1);
		const second = vi.fn().mockResolvedValue(2);
		expect(await Promise.all([cache.read('a', first), cache.read('a', first), cache.read('b', second)])).toEqual([1, 1, 2]);
		await cache.read('a', first);
		expect(first).toHaveBeenCalledTimes(1);
		expect(second).toHaveBeenCalledTimes(1);
		expect(cache.peek('b')).toBe(2);
	});
	it('유효기간 이후에는 오래된 데이터를 보여주지 않고 새로 조회한다', async () => {
		vi.useFakeTimers();
		const cache = createAsyncDataCache<number>(60_000);
		const read = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);
		await cache.read('a', read);
		vi.advanceTimersByTime(60_001);
		expect(cache.peek('a')).toBeUndefined();
		await expect(cache.read('a', read)).resolves.toBe(2);
	});
	it('실패한 조회는 저장하지 않아 다시 시도할 수 있다', async () => {
		const cache = createAsyncDataCache<number>(60_000);
		const read = vi.fn().mockRejectedValueOnce(new Error('연결 실패')).mockResolvedValueOnce(3);
		await expect(cache.read('a', read)).rejects.toThrow('연결 실패');
		expect(cache.peek('a')).toBeUndefined();
		await expect(cache.read('a', read)).resolves.toBe(3);
	});
	it('저장 상한을 넘으면 가장 오래 사용하지 않은 매장을 제거한다', async () => {
		const cache = createAsyncDataCache<number>(60_000, 2);
		await cache.read('a', async () => 1);
		await cache.read('b', async () => 2);
		cache.peek('a');
		await cache.read('c', async () => 3);
		expect(cache.peek('a')).toBe(1);
		expect(cache.peek('b')).toBeUndefined();
		expect(cache.peek('c')).toBe(3);
	});
});
