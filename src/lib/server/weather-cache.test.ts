import { describe, expect, it, vi } from 'vitest';
import type { WeatherCacheEntry } from '$lib/domain/weather';
import { createWeatherCacheService } from './weather-cache';

const now = new Date('2026-08-13T04:46:00.000Z');

const freshEntry: WeatherCacheEntry = {
	temperature: 30,
	status: '더움',
	icon: 'hot',
	observedAt: '2026-08-13T13:00:00+09:00',
	fetchedAt: '2026-08-13T13:45:00+09:00',
	observationBase: '202608131300',
	forecastBase: '202608131330'
};

const staleEntryWithinSixHours: WeatherCacheEntry = {
	...freshEntry,
	temperature: 27,
	status: '구름많음',
	icon: 'mostly-cloudy',
	fetchedAt: '2026-08-13T11:00:00+09:00',
	observationBase: '202608131000',
	forecastBase: '202608131030'
};

const staleEntryOlderThanSixHours: WeatherCacheEntry = {
	...staleEntryWithinSixHours,
	fetchedAt: '2026-08-13T06:00:00+09:00'
};

function createKv(initial?: WeatherCacheEntry | string) {
	let value = typeof initial === 'string' ? initial : initial ? JSON.stringify(initial) : null;

	return {
		get: vi.fn(async (_key: string) => value),
		put: vi.fn(async (_key: string, next: string) => {
			value = next;
		})
	};
}

describe('날씨 캐시', () => {
	it('현재 발표 시각과 일치하는 캐시는 외부 호출 없이 반환한다', async () => {
		const service = createWeatherCacheService();
		const kv = createKv(freshEntry);
		const fetchWeather = vi.fn();

		const result = await service.getCurrentWeather(
			{ env: { GOLABAU_CACHE: kv } },
			{ now, serviceKey: 'key', fetchWeather }
		);

		expect(result).toEqual({
			temperature: 30,
			status: '더움',
			icon: 'hot',
			observedAt: '2026-08-13T13:00:00+09:00',
			fetchedAt: '2026-08-13T13:45:00+09:00',
			stale: false
		});
		expect(fetchWeather).not.toHaveBeenCalled();
	});

	it('6시간 이내 이전 캐시는 즉시 반환하고 waitUntil에서 한 번 갱신한다', async () => {
		const service = createWeatherCacheService();
		const kv = createKv(staleEntryWithinSixHours);
		const tasks: Promise<unknown>[] = [];
		const fetchWeather = vi.fn().mockResolvedValue(freshEntry);

		const result = await service.getCurrentWeather(
			{
				env: { GOLABAU_CACHE: kv },
				context: {
					waitUntil: (task: Promise<unknown>) => {
						tasks.push(task);
					}
				}
			},
			{ now, serviceKey: 'key', fetchWeather }
		);

		expect(result.stale).toBe(true);
		expect(result.temperature).toBe(27);
		expect(tasks).toHaveLength(1);
		await tasks[0];
		expect(JSON.parse((await kv.get('weather:campus:current:v1'))!)).toEqual(freshEntry);
	});

	it('캐시가 없으면 첫 요청에서 동기로 갱신하고 KV에 하루 동안 저장한다', async () => {
		const service = createWeatherCacheService();
		const kv = createKv();
		const fetchWeather = vi.fn().mockResolvedValue(freshEntry);

		const result = await service.getCurrentWeather(
			{ env: { GOLABAU_CACHE: kv } },
			{ now, serviceKey: 'key', fetchWeather }
		);

		expect(result.stale).toBe(false);
		expect(kv.put).toHaveBeenCalledWith(
			'weather:campus:current:v1',
			JSON.stringify(freshEntry),
			{ expirationTtl: 86_400 }
		);
	});

	it('동시에 들어온 빈 캐시 요청은 하나의 외부 갱신 결과를 공유한다', async () => {
		const service = createWeatherCacheService();
		const kv = createKv();
		const fetchWeather = vi.fn().mockResolvedValue(freshEntry);

		const results = await Promise.all([
			service.getCurrentWeather(
				{ env: { GOLABAU_CACHE: kv } },
				{ now, serviceKey: 'key', fetchWeather }
			),
			service.getCurrentWeather(
				{ env: { GOLABAU_CACHE: kv } },
				{ now, serviceKey: 'key', fetchWeather }
			)
		]);

		expect(results[0]).toEqual(results[1]);
		expect(fetchWeather).toHaveBeenCalledTimes(1);
	});

	it('6시간을 넘긴 캐시는 외부 갱신도 실패하면 반환하지 않는다', async () => {
		const service = createWeatherCacheService();
		const kv = createKv(staleEntryOlderThanSixHours);
		const fetchWeather = vi.fn().mockRejectedValue(new Error('외부 장애'));

		await expect(
			service.getCurrentWeather(
				{ env: { GOLABAU_CACHE: kv } },
				{ now, serviceKey: 'key', fetchWeather }
			)
		).rejects.toThrow('외부 장애');
	});

	it('깨진 KV 값은 무시하고 정상 데이터를 새로 저장한다', async () => {
		const service = createWeatherCacheService();
		const kv = createKv('{invalid json');
		const fetchWeather = vi.fn().mockResolvedValue(freshEntry);

		const result = await service.getCurrentWeather(
			{ env: { GOLABAU_CACHE: kv } },
			{ now, serviceKey: 'key', fetchWeather }
		);

		expect(result.temperature).toBe(30);
		expect(JSON.parse((await kv.get('weather:campus:current:v1'))!)).toEqual(freshEntry);
	});

	it('사용 가능한 캐시와 서비스 키가 모두 없으면 외부 호출 전에 거부한다', async () => {
		const service = createWeatherCacheService();

		await expect(
			service.getCurrentWeather(undefined, { now, serviceKey: '' })
		).rejects.toThrow('기상청 API 인증키가 없습니다.');
	});
});
