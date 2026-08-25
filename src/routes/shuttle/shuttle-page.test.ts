import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';

import ShuttlePage from './+page.svelte';

describe('셔틀 페이지', () => {
	it('GB1 스타일의 독립 페이지에서 출발지 시간표와 지도 동작을 제공한다', () => {
		const { body } = render(ShuttlePage, {
			props: { data: { user: null } } as never
		});

		expect(body).toContain('data-shuttle-page');
		expect(body).toContain('오늘의 셔틀');
		expect(body).toContain('data-shuttle-tabs');
		expect(body).toContain('학교 출발');
		expect(body).toContain('조치원역 출발');
		expect(body).toContain('data-shuttle-osong-services');
		expect(body).toContain('오송역 운행');
		expect(body).toContain('08:30');
		expect(body).toContain('18:10');
		expect(body).toContain('지도에서 보기');
		expect(body).toContain('/?panel=shuttle&amp;shuttleStop=campus');
	});
});
