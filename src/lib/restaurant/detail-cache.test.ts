import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRestaurantDetailCache } from './detail-cache';

afterEach(() => vi.useRealTimers());
const response = (id: string) => new Response(JSON.stringify({ restaurant: { place: { id } } }));

describe('목록에서 상세 미리 읽기', () => {
	it('미리 읽기와 클릭이 겹쳐도 한 번만 요청하고 다음 클릭은 캐시로 연다', async () => {
		const request = vi.fn().mockResolvedValue(response('a'));
		const cache = createRestaurantDetailCache(request);
		cache.warm('a');
		await cache.get('a');
		expect(cache.peek('a')?.place.id).toBe('a');
		await cache.get('a');
		expect(request).toHaveBeenCalledTimes(1);
	});
	it('실패나 다른 가게 응답을 캐시하지 않고 재시도한다', async () => {
		const request = vi.fn().mockResolvedValueOnce(new Response(null, { status: 503 }))
			.mockResolvedValueOnce(response('wrong')).mockResolvedValueOnce(response('a'));
		const cache = createRestaurantDetailCache(request);
		await expect(cache.get('a')).rejects.toThrow('불러오지 못했어요');
		await expect(cache.get('a')).rejects.toThrow('확인할 수 없어요');
		await expect(cache.get('a')).resolves.toMatchObject({ place: { id: 'a' } });
	});
	it('한국 날짜가 바뀌면 오늘 운영시간이 담긴 이전 캐시를 재사용하지 않는다', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-09-18T14:59:59Z'));
		const request = vi.fn().mockImplementation(async () => response('a'));
		const cache = createRestaurantDetailCache(request);
		await cache.get('a');
		vi.advanceTimersByTime(2_000);
		expect(cache.peek('a')).toBeUndefined();
		await cache.get('a');
		expect(request).toHaveBeenCalledTimes(2);
	});
});
