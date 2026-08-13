import { describe, expect, it } from 'vitest';
import { resolveApiUrl } from './base-url';

describe('API 주소', () => {
	it('웹에서는 같은 출처 상대 경로를 유지한다', () => {
		expect(resolveApiUrl('/api/weather/current', '')).toBe('/api/weather/current');
	});

	it('Capacitor에서는 운영 HTTPS 기준 URL과 결합한다', () => {
		expect(resolveApiUrl('/api/weather/current', 'https://api.golabau.kr/')).toBe(
			'https://api.golabau.kr/api/weather/current'
		);
	});

	it('HTTPS가 아닌 외부 기준 URL은 거부한다', () => {
		expect(() => resolveApiUrl('/api/weather/current', 'http://api.golabau.kr')).toThrow(
			'운영 API 주소는 HTTPS여야 합니다.'
		);
	});

	it('경로처럼 보이지 않는 값은 거부한다', () => {
		expect(() => resolveApiUrl('api/weather/current', '')).toThrow(
			'API 경로는 슬래시로 시작해야 합니다.'
		);
	});
});
