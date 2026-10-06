import { render } from 'svelte/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TodayPage from './+page.svelte';
import TodayDetailPage from './[id]/+page.svelte';

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-08-30T03:00:00.000Z')); });
afterEach(() => vi.useRealTimers());

function event(overrides: Record<string, unknown> = {}) {
	return {
		id: '11111111-1111-4111-8111-111111111111',
		title: '고려대학교 가을 축제',
		category: '축제',
		organizer: '총학생회',
		description: '교내 구성원이 함께 즐기는 행사입니다.',
		startsAt: new Date('2026-08-30T02:00:00.000Z'),
		endsAt: new Date('2026-08-30T05:00:00.000Z'),
		locationName: '중앙광장',
		externalUrl: null,
		latitude: 36.6101,
		longitude: 127.2872,
		isVisible: true,
		createdBy: 1,
		createdAt: new Date('2026-08-20T00:00:00.000Z'),
		updatedAt: new Date('2026-08-20T00:00:00.000Z'),
		coverImageId: 'cover',
		images: [
			{ id: 'cover', eventId: '11111111-1111-4111-8111-111111111111', objectKey: 'cover', contentType: 'image/webp', byteSize: 3, displayOrder: 0, isCover: true, createdAt: new Date(), kind: 'cover', url: '/cover.webp' }
		],
		...overrides
	};
}

describe('오늘 행사 목록', () => {
	it('서버에서 받은 목록도 종료 뒤에는 현재 시각으로 다시 걸러낸다', () => {
		const ended = event({ endsAt: new Date('2026-08-30T02:59:59.999Z') });
		const body = render(TodayPage, { props: { data: { user: null, ongoingEvents: [ended], upcomingEvents: [], initialTab: 'ongoing' } } as never }).body;
		expect(body).not.toContain(ended.title);
		expect(body).toContain('지금 진행 중인 행사가 없어요');
	});
	it('축제는 별도 상세 페이지 대신 지도 바텀시트로 바로 연결한다', () => {
		const body = render(TodayPage, { props: { data: { user: null, ongoingEvents: [], upcomingEvents: [], initialTab: 'upcoming', festival: { id: 'club-festival-preview', title: '2026 동연제 : POLARIS', status: 'upcoming', startsAt: new Date('2026-09-15T12:00:00+09:00'), endsAt: new Date('2026-09-16T00:00:00+09:00'), dateLabel: '9월 15일 (화)', location: '학생회관 일대', href: '/?panel=festival' } } } as never }).body;
		expect(body).toContain('2026 동연제 : POLARIS');
		expect(body).toContain('href="/?panel=festival"');
		expect(body).not.toContain('예정된 행사가 없어요');
	});
	it('학식·셔틀처럼 바깥 화면의 모서리를 강제로 자르지 않는다', () => {
		const body = render(TodayPage, {
			props: { data: { user: null, ongoingEvents: [], upcomingEvents: [], initialTab: 'upcoming' } } as never
		}).body;

		expect(body).not.toContain('w-full overflow-hidden bg-white');
	});

	it('진행 중과 진행 예정 탭 및 상세 링크를 제공하고 완료 행사는 노출하지 않는다', () => {
		const ongoing = event();
		const upcoming = event({
			id: '22222222-2222-4222-8222-222222222222',
			title: '예정 강연',
			startsAt: new Date('2026-08-31T02:00:00.000Z'),
			endsAt: new Date('2026-08-31T04:00:00.000Z')
		});
		const body = render(TodayPage, {
			props: {
				data: { user: null, ongoingEvents: [ongoing], upcomingEvents: [upcoming], initialTab: 'ongoing' }
			} as never
		}).body;

		expect(body).toContain('진행 중');
		expect(body).toContain('진행 예정');
		expect(body).toContain(`/today/${ongoing.id}`);
		expect(body).toContain('data-today-tab-indicator');
		expect(body).not.toContain('완료 행사');
	});

	it('선택 탭에 행사가 없으면 상태별 빈 문구를 보여준다', () => {
		const body = render(TodayPage, {
			props: { data: { user: null, ongoingEvents: [], upcomingEvents: [], initialTab: 'upcoming' } } as never
		}).body;
		expect(body).toContain('>예정된 행사가 없어요</h2>');
	});
});

describe('행사 상세', () => {
	it('열어 둔 상세의 일정이 종료되면 이미지와 지도 동작 대신 종료 안내를 표시한다', () => {
		const ended = event({ endsAt: new Date('2026-08-30T02:59:59.999Z') });
		const body = render(TodayDetailPage, { props: { data: { event: ended } } as never }).body;
		expect(body).toContain('종료된 행사예요');
		expect(body).not.toContain('지도에서 보기');
		expect(body).not.toContain('/cover.webp');
	});
	it('이미지 갤러리와 지도 딥링크를 제공하고 신청 동작은 넣지 않는다', () => {
		const detailEvent = event({
			images: [
				{ id: '1', eventId: 'e', objectKey: '1', contentType: 'image/webp', byteSize: 1, displayOrder: 0, isCover: true, createdAt: new Date(), kind: 'cover', url: '/1.webp' },
				{ id: '2', eventId: 'e', objectKey: '2', contentType: 'image/webp', byteSize: 1, displayOrder: 1, isCover: false, createdAt: new Date(), kind: 'sub', url: '/2.webp' },
				{ id: '3', eventId: 'e', objectKey: '3', contentType: 'image/webp', byteSize: 1, displayOrder: 2, isCover: false, createdAt: new Date(), kind: 'sub', url: '/3.webp' }
			]
		});
		const body = render(TodayDetailPage, { props: { data: { event: detailEvent } } as never }).body;

		expect(body).toContain('1 / 3');
		expect(body).toContain(`/?panel=event&amp;eventId=${detailEvent.id}`);
		expect(body).toContain('지도에서 보기');
		expect(body).not.toContain('신청하기');
	});

	it('안내 링크가 있으면 행사 홈페이지로 이동하는 보조 동작을 제공한다', () => {
		const detailEvent = event({ externalUrl: 'https://kusejong-jobfair.com/' });
		const body = render(TodayDetailPage, { props: { data: { event: detailEvent } } as never }).body;

		expect(body).toContain('행사 홈페이지');
		expect(body).toContain('href="https://kusejong-jobfair.com/"');
		expect(body).toContain('rel="noreferrer"');
	});
});
