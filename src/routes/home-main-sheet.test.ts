import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
vi.mock('$app/state', () => ({ page: { url: new URL('https://example.com/'), state: {} } }));
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

	it('모바일 브라우저의 실제 가변 화면 높이에 메인 지도 홈을 맞춘다', () => {
		const { body } = render(HomePage, { props: { data } as never });

		expect(body).toMatch(/<main[^>]*data-home-viewport[^>]*class="[^"]*home-viewport[^"]*"/);
		expect(body).toMatch(/<section[^>]*data-home-app-shell[^>]*class="[^"]*home-app-shell[^"]*"/);
		expect(body).not.toContain('min-h-screen');
	});

	it('첫 진입 시 서비스 선택이 보이는 104px 높이로 접힌다', () => {
		const { body } = render(HomePage, { props: { data } as never });

		expect(body).toContain('height: 104px;');
	});

	it('하단 네비게이션 대신 기본 시트에서 생활 기능을 연다', () => {
		const { body } = render(HomePage, { props: { data } as never });

		expect(body).toContain('data-lifestyle-shortcuts');
		expect(body).toContain('href="/?view=shuttle"');
		expect(body).toContain('href="/?view=cafeteria"');
		expect(body).toContain('href="/?view=today"');
		expect(body).not.toContain('data-bottom-navigation');
	});

	it('하단 메뉴 제거 후에도 상단에서 마이페이지에 접근할 수 있다', () => {
		const { body } = render(HomePage, { props: { data } as never });

		expect(body).toContain('aria-label="마이페이지"');
		expect(body).toContain('href="/my"');
	});

	it('첫 진입에서는 학식·셔틀·행사 콘텐츠를 중복 노출하지 않는다', () => {
		const { body } = render(HomePage, { props: { data } as never });

		expect(body).not.toContain('data-home-quick-status');
		expect(body).not.toContain('돈가스, 된장국');
		expect(body).not.toContain('다음 셔틀');
		expect(body).not.toContain('메인에서 제거할 행사 홍보');
	});

	it('상단 그라데이션은 보조기기에서 장식으로 처리한다', () => {
		const { body } = render(HomePage, { props: { data } as never });

		const gradient = body.match(/<div[^>]*data-home-map-top-gradient[^>]*>/)?.[0];
		expect(gradient).toContain('aria-hidden="true"');
	});

	it('헤더 컨트롤이 드러나도록 그라데이션 시작점을 옅은 회백색으로 표시한다', () => {
		const { body } = render(HomePage, { props: { data } as never });

		expect(body).toContain('#f4f3f1');
	});
});
