import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import HomePage from './+page.svelte';

const data = {
	places: [],
	cafeterias: [],
	todayCafeteria: { summary: '돈가스, 된장국', mealType: '점심', updatedAt: '2026-08-30' },
	nextShuttle: { stopName: '학술정보원 앞', departureTime: '16:20', routeName: '조치원역 행' },
	cafeteriaFeedback: {},
	commercialZones: [],
	homeNotice: null,
	campusEvents: [],
	eventSpotlight: {
		id: 'event-spotlight',
		title: '메인에서 제거할 행사 홍보',
		category: '축제',
		startsAt: new Date('2026-08-30T02:00:00.000Z'),
		endsAt: new Date('2026-08-30T05:00:00.000Z'),
		locationName: '중앙광장',
		images: []
	},
	initialPanel: null,
	initialPlaceId: null,
	initialEventId: null,
	initialShuttleStopId: null,
	naverMapClientId: '',
	user: null
};

describe('메인 첫 바텀시트', () => {
	it('브라우저 제목에는 제품명만 표시한다', () => {
		const { head } = render(HomePage, { props: { data } as never });

		expect(head).toContain('<title>골라바유</title>');
		expect(head).not.toContain('골라바유 v3');
	});

	it('지도 홈 접근성 이름에는 버전명을 노출하지 않는다', () => {
		const { body } = render(HomePage, { props: { data } as never });

		expect(body).toContain('aria-label="골라바유 지도 홈"');
	});

	it('첫 진입 시 맥락 헤더만 보이는 104px 높이로 접힌다', () => {
		const { body } = render(HomePage, { props: { data } as never });

		expect(body).toContain('height: 104px;');
	});

	it('현재 학교 맥락을 왼쪽 상단 제목으로 보여준다', () => {
		const { body } = render(HomePage, { props: { data } as never });

		expect(body).toContain('지금, 고려대학교');
	});

	it('오늘 날짜를 제목 오른쪽에 보여준다', () => {
		const { body } = render(HomePage, { props: { data } as never });

		expect(body).toMatch(/data-home-date[^>]*>[A-Z]{3} · \d{2} [A-Z]{3}</);
	});

	it('첫 진입에서는 학식·셔틀·행사 콘텐츠를 중복 노출하지 않는다', () => {
		const { body } = render(HomePage, { props: { data } as never });

		expect(body).not.toContain('data-home-quick-status');
		expect(body).not.toContain('돈가스, 된장국');
		expect(body).not.toContain('다음 셔틀');
		expect(body).not.toContain('메인에서 제거할 행사 홍보');
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
