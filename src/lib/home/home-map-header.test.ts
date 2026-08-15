import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import HomeMapHeader from './HomeMapHeader.svelte';

const zones = [
	{
		id: 'front-gate',
		name: '고대앞',
		center: { latitude: 36.6, longitude: 127.29 },
		boundary: [{ latitude: 36.6, longitude: 127.29 }]
	},
	{
		id: 'station',
		name: '조치원역',
		center: { latitude: 36.61, longitude: 127.3 },
		boundary: [{ latitude: 36.61, longitude: 127.3 }]
	}
];

const handlers = {
	onAreaModeChange: () => undefined,
	onZoneChange: () => undefined
};

describe('메인 지도 헤더', () => {
	it('학교안에서는 구역 칩을 숨기고 상점 페이지 링크를 제공한다', () => {
		const { body } = render(HomeMapHeader, {
			props: {
				areaMode: 'campus',
				zones,
				selectedZoneId: 'all',
				...handlers
			}
		});

		expect(body).toContain('href="/shops"');
		expect(body).toContain('aria-label="상점 페이지"');
		expect(body).toContain('학교안');
		expect(body).toContain('-rotate-90');
		expect(body).not.toContain('고대앞');
	});

	it('학교밖에서는 전체와 DB 상권을 구역 선택지로 표시한다', () => {
		const { body } = render(HomeMapHeader, {
			props: {
				areaMode: 'outside',
				zones,
				selectedZoneId: 'front-gate',
				...handlers
			}
		});

		expect(body).toContain('aria-label="학교 밖 상권 구역"');
		expect(body).toContain('전체');
		expect(body).toContain('고대앞');
		expect(body).toContain('조치원역');
		expect(body).toContain('aria-pressed="true"');
	});

	it('학교밖 상권이 없으면 빈 상태를 안내한다', () => {
		const { body } = render(HomeMapHeader, {
			props: {
				areaMode: 'outside',
				zones: [],
				selectedZoneId: 'all',
				...handlers
			}
		});

		expect(body).toContain('등록된 상권이 없습니다.');
	});
});
