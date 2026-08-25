import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';

import ShuttlePage from './+page.svelte';

describe('셔틀 페이지', () => {
	it('GB1 스타일의 독립 페이지에서 출발지 시간표와 지도 동작을 제공한다', () => {
		const { body } = render(ShuttlePage, {
			props: { data: { user: null } } as never
		});

		expect(body).toContain('data-shuttle-page');
		expect(body).toContain('셔틀버스');
		expect(body).toContain('aria-label="뒤로 가기"');
		expect(body).toContain('aria-label="셔틀 닫기"');
		expect(body).toContain('data-shuttle-tabs');
		expect(body).toContain('aria-label="방향 선택"');
		expect(body).toContain('data-shuttle-tab-indicator');
		expect(body).toContain('학교 출발');
		expect(body).toContain('조치원역 출발');
		expect(body).toMatch(/<button class="[^"]*outline-none[^"]*focus-visible:ring-2[^"]*"[^>]*aria-pressed="true">학교 출발/);
		expect(body).toContain('data-shuttle-next-card');
		expect(body).toMatch(/<section class="[^"]*border-b[^"]*"[^>]*data-shuttle-next-card/);
		expect(body).toContain('다음 셔틀까지');
		expect(body).toContain('data-shuttle-timetable');
		expect(body).toContain('배차 시간표');
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
});
