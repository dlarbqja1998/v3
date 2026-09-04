import { describe, expect, it } from 'vitest';
import * as markerIcon from './marker-icon';
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

	it('기본 핀은 모두 크림슨이며 선택된 핀의 기존 강조색은 유지한다', () => {
		const getBackground = (
			markerIcon as Partial<{
				getMapMarkerBackground: (isActive: boolean) => string;
			}>
		).getMapMarkerBackground;
		expect(getBackground).toBeTypeOf('function');
		if (!getBackground) return;

		expect(getBackground(false)).toBe('#a51c45');
		expect(getBackground(true)).toBe('#5f0f2d');
	});
});
