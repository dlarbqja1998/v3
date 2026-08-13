import { describe, expect, it } from 'vitest';
import type { WeatherSnapshot } from '$lib/domain/weather';
import { createCurrentWeatherResponse } from './current-weather-response';

const snapshot: WeatherSnapshot = {
	temperature: 30,
	status: '더움',
	icon: 'hot',
	observedAt: '2026-08-13T13:00:00+09:00',
	fetchedAt: '2026-08-13T13:46:00+09:00',
	stale: false
};

describe('현재 날씨 HTTP 응답', () => {
	it('정상 날씨를 공개 캐시 헤더와 함께 반환한다', async () => {
		const response = await createCurrentWeatherResponse(async () => snapshot);

		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe(
			'public, max-age=300, s-maxage=600, stale-while-revalidate=3600'
		);
		expect(await response.json()).toEqual(snapshot);
	});

	it('내부 오류 내용을 숨기고 503 안전 응답을 반환한다', async () => {
		const response = await createCurrentWeatherResponse(async () => {
			throw new Error('service key=secret');
		});

		expect(response.status).toBe(503);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(await response.json()).toEqual({
			error: 'weather_unavailable',
			message: '날씨 정보를 불러오지 못했습니다.'
		});
	});
});
