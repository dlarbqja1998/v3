import { describe, expect, it } from 'vitest';
import { getSafeMarkerIcon } from './marker-icon';

describe('지도 핀 내부 아이콘', () => {
	it('시설·학식·셔틀 아이콘만 허용한다', () => {
		expect(getSafeMarkerIcon('print')).toBe('print');
		expect(getSafeMarkerIcon('food')).toBe('food');
		expect(getSafeMarkerIcon('bus')).toBe('bus');
		expect(getSafeMarkerIcon('home')).toBe('');
	});

	it('경로 문자가 포함된 값은 거부한다', () => {
		expect(getSafeMarkerIcon('../home')).toBe('');
	});
});
