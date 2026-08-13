import { describe, expect, it } from 'vitest';
import { classifyWeather, getWeatherIconSrc, isWeatherSnapshot } from './weather';

describe('호이 날씨 판정', () => {
	it.each([
		[{ temperature: 25, skyCode: 1, precipitationCode: 0 }, ['맑음', 'clear']],
		[{ temperature: 25, skyCode: 3, precipitationCode: 0 }, ['구름많음', 'mostly-cloudy']],
		[{ temperature: 25, skyCode: 4, precipitationCode: 0 }, ['흐림', 'cloudy']],
		[{ temperature: 30, skyCode: 1, precipitationCode: 0 }, ['더움', 'hot']],
		[{ temperature: 34, skyCode: 1, precipitationCode: 1 }, ['비', 'rain']],
		[{ temperature: 2, skyCode: 4, precipitationCode: 3 }, ['눈', 'snow']],
		[{ temperature: 2, skyCode: 4, precipitationCode: 2 }, ['눈', 'snow']]
	] as const)('%o를 상태와 아이콘으로 정규화한다', (input, expected) => {
		const result = classifyWeather(input);

		expect([result.status, result.icon]).toEqual(expected);
	});

	it('29도는 더움으로 판정하지 않는다', () => {
		expect(classifyWeather({ temperature: 29, skyCode: 1, precipitationCode: 0 }).icon).toBe(
			'clear'
		);
	});

	it('아이콘 키를 공개 이미지 경로로 변환한다', () => {
		expect(getWeatherIconSrc('mostly-cloudy')).toBe(
			'/images/weather/hoi-mostly-cloudy.webp'
		);
	});
});

describe('날씨 공개 응답 검증', () => {
	it('필수 필드가 모두 유효한 응답을 허용한다', () => {
		expect(
			isWeatherSnapshot({
				temperature: 28,
				status: '맑음',
				icon: 'clear',
				observedAt: '2026-08-13T13:00:00+09:00',
				fetchedAt: '2026-08-13T13:46:00+09:00',
				stale: false
			})
		).toBe(true);
	});

	it('필수 필드가 빠진 응답을 거부한다', () => {
		expect(isWeatherSnapshot({ temperature: 28, status: '맑음' })).toBe(false);
	});

	it('상태와 맞지 않는 아이콘 조합을 거부한다', () => {
		expect(
			isWeatherSnapshot({
				temperature: 28,
				status: '맑음',
				icon: 'rain',
				observedAt: '2026-08-13T13:00:00+09:00',
				fetchedAt: '2026-08-13T13:46:00+09:00',
				stale: false
			})
		).toBe(false);
	});
});
