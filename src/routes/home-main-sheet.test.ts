import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import HomePage from './+page.svelte';

const data = {
	places: [],
	cafeterias: [],
	todayCafeteria: { summary: '' },
	cafeteriaFeedback: {},
	commercialZones: [],
	homeNotice: null,
	initialPanel: null,
	initialPlaceId: null,
	initialShuttleStopId: null,
	naverMapClientId: '',
	user: null
};

describe('메인 첫 바텀시트', () => {
	it('첫 진입 시 184px 높이로 보여준다', () => {
		const { body } = render(HomePage, { props: { data } as never });

		expect(body).toContain('height: 184px;');
	});

	it('현재 학교 맥락을 왼쪽 상단 제목으로 보여준다', () => {
		const { body } = render(HomePage, { props: { data } as never });

		expect(body).toContain('지금, 고려대학교');
	});

	it('오늘 날짜를 제목 오른쪽에 보여준다', () => {
		const { body } = render(HomePage, { props: { data } as never });

		expect(body).toMatch(/data-home-date[^>]*>[A-Z]{3} · \d{2} [A-Z]{3}</);
	});

	it('상단 헤더부터 필터칩 아래까지 200px 흰색 그라데이션을 겹친다', () => {
		const { body } = render(HomePage, { props: { data } as never });

		expect(body).toContain('data-home-map-top-gradient');
		expect(body).toMatch(/class="[^"]*h-\[200px\][^"]*"[^>]*data-home-map-top-gradient/);
	});

	it('헤더 컨트롤이 드러나도록 그라데이션 시작점을 옅은 회백색으로 표시한다', () => {
		const { body } = render(HomePage, { props: { data } as never });

		expect(body).toContain('#f4f3f1');
	});
});
