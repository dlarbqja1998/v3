import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';

import ShuttlePage from './+page.svelte';

describe('셔틀 페이지', () => {
	it('GB1 스타일의 독립 페이지에서 출발지 시간표와 지도 동작을 제공한다', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 7, 24, 12, 0));

		const { body } = render(ShuttlePage, {
			props: { data: { user: null } } as never
		});
		vi.useRealTimers();

		expect(body).toContain('data-shuttle-page');
		expect(body).toContain('오늘, 셔틀');
		expect(body).toContain('data-lifestyle-page-header');
		expect(body).toContain('aria-label="뒤로 가기"');
		expect(body).toContain('aria-label="셔틀 닫기"');
		expect(body).toContain('data-shuttle-tabs');
		expect(body).toContain('aria-label="방향 선택"');
		expect(body).toContain('data-shuttle-tab-indicator');
		expect(body).toContain('조치원역 행');
		expect(body).toContain('고려대 행');
		expect(body).toMatch(/<button class="[^"]*outline-none[^"]*focus-visible:ring-2[^"]*"[^>]*aria-pressed="true">조치원역 행/);
		expect(body).toContain('data-shuttle-next-card');
		expect(body).toMatch(/<section class="[^"]*border-b[^"]*"[^>]*data-shuttle-next-card/);
		expect(body).toContain('다음 셔틀까지');
		expect(body).toContain('data-shuttle-timetable');
		expect(body).toContain('배차 시간표');
		expect(body).toContain('교통 상황에 따라 출발 시간이 달라질 수 있어요.');
		expect(body).toContain('오송역 08:30 출발');
		expect(body).toContain('6번 출구 · 조치원역 경유');
		expect(body).not.toContain('평일 시간표');
		expect(body).not.toContain('학술정보원 앞 셔틀버스 정류장');
		expect(body).not.toContain('고려대학교 세종캠퍼스 셔틀버스 안내 기준');
		expect(body).toContain('18:10');
		expect(body).toContain('오송역 도착');
		expect(body).toContain('지도에서 보기');
		expect(body).toContain('h-[18px] w-1');
		expect(body).toContain('mr-5');
		expect(body).toContain('/?panel=shuttle&amp;shuttleStop=campus');
	});

	it('조치원역 행의 08시 45분 옆에 2대 운행을 표시한다', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 7, 31, 8, 35));

		const { body } = render(ShuttlePage, {
			props: { data: { user: null, initialShuttleStopId: 'jochewon-station-back' } } as never
		});
		vi.useRealTimers();

		expect(body).toMatch(/08:45[\s\S]*?data-shuttle-vehicle-count[^>]*>2대 운행/);
	});

	it('오송역행의 공식 도착 시각을 임의로 계산하지 않는다', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 7, 31, 18, 5));

		const { body } = render(ShuttlePage, {
			props: { data: { user: null, initialShuttleStopId: 'campus' } } as never
		});
		vi.useRealTimers();

		expect(body).toContain('18:10 고려대 출발');
		expect(body).toContain('오송역 방향');
		expect(body).not.toContain('18:20 오송역 도착');
	});
});
