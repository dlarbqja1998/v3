import { describe, expect, it } from 'vitest';
import {
	getCampusEventStatus,
	getInitialCampusEventTab,
	getPublicCampusEvents,
	normalizeCampusEventInput
} from './campus-events';

const now = new Date('2026-08-30T03:00:00.000Z');

function event(overrides: Partial<{
	id: string;
	startsAt: Date;
	endsAt: Date;
	isVisible: boolean;
}> = {}) {
	return {
		id: overrides.id ?? 'event',
		startsAt: overrides.startsAt ?? new Date('2026-08-30T02:00:00.000Z'),
		endsAt: overrides.endsAt ?? new Date('2026-08-30T04:00:00.000Z'),
		isVisible: overrides.isVisible ?? true
	};
}

function form(overrides: Record<string, string> = {}) {
	const data = new FormData();
	const values = {
		title: '2026 고려대학교 가을 축제',
		category: '축제',
		organizer: '고려대학교 총학생회',
		description: '학생들이 함께 즐길 수 있는 교내 축제입니다.',
		startsAt: '2026-08-30T12:00',
		endsAt: '2026-08-30T18:00',
		locationName: '중앙광장',
		externalUrl: '',
		latitude: '36.6101',
		longitude: '127.2872',
		isVisible: 'on',
		...overrides
	};

	for (const [key, value] of Object.entries(values)) data.set(key, value);
	return data;
}

describe('교내 행사 도메인', () => {
	it('시작과 종료 시각을 포함해 진행 중으로 판정한다', () => {
		const range = {
			startsAt: new Date('2026-08-30T03:00:00.000Z'),
			endsAt: new Date('2026-08-30T06:00:00.000Z')
		};

		expect(getCampusEventStatus(range, range.startsAt)).toBe('ongoing');
		expect(getCampusEventStatus(range, range.endsAt)).toBe('ongoing');
	});

	it('종료 뒤에는 완료, 시작 전에는 예정으로 판정한다', () => {
		expect(
			getCampusEventStatus(
				{ startsAt: new Date('2026-08-30T04:00:00.000Z'), endsAt: new Date('2026-08-30T05:00:00.000Z') },
				now
			)
		).toBe('upcoming');
		expect(
			getCampusEventStatus(
				{ startsAt: new Date('2026-08-30T01:00:00.000Z'), endsAt: new Date('2026-08-30T02:59:59.999Z') },
				now
			)
		).toBe('ended');
	});

	it('공개된 진행 중 행사와 정확히 7일 이내 예정 행사만 노출한다', () => {
		const rows = [
			event({ id: 'ongoing' }),
			event({ id: 'private', isVisible: false }),
			event({ id: 'ended', endsAt: new Date('2026-08-30T02:59:59.999Z') }),
			event({
				id: 'seven-days',
				startsAt: new Date('2026-09-06T03:00:00.000Z'),
				endsAt: new Date('2026-09-06T05:00:00.000Z')
			}),
			event({
				id: 'over-seven-days',
				startsAt: new Date('2026-09-06T03:00:00.001Z'),
				endsAt: new Date('2026-09-06T05:00:00.000Z')
			})
		];

		expect(getPublicCampusEvents(rows, now).map((item) => item.id)).toEqual(['ongoing', 'seven-days']);
	});

	it('진행 중은 종료가 가까운 순서, 예정은 시작이 가까운 순서로 정렬한다', () => {
		const rows = [
			event({ id: 'ongoing-later', endsAt: new Date('2026-08-30T08:00:00.000Z') }),
			event({ id: 'upcoming-later', startsAt: new Date('2026-09-01T03:00:00.000Z'), endsAt: new Date('2026-09-01T05:00:00.000Z') }),
			event({ id: 'ongoing-sooner', endsAt: new Date('2026-08-30T04:00:00.000Z') }),
			event({ id: 'upcoming-sooner', startsAt: new Date('2026-08-31T03:00:00.000Z'), endsAt: new Date('2026-08-31T05:00:00.000Z') })
		];

		expect(getPublicCampusEvents(rows, now).map((item) => item.id)).toEqual([
			'ongoing-sooner',
			'ongoing-later',
			'upcoming-sooner',
			'upcoming-later'
		]);
	});

	it('진행 중 행사가 있으면 진행 중 탭, 없으면 진행 예정 탭을 연다', () => {
		expect(getInitialCampusEventTab([event()], now)).toBe('ongoing');
		expect(
			getInitialCampusEventTab(
				[
					event({
						startsAt: new Date('2026-08-31T03:00:00.000Z'),
						endsAt: new Date('2026-08-31T05:00:00.000Z')
					})
				],
				now
			)
		).toBe('upcoming');
	});

	it('종료 시각이 시작 시각보다 빠른 입력을 거부한다', () => {
		const result = normalizeCampusEventInput(
			form({ startsAt: '2026-08-30T18:00', endsAt: '2026-08-30T12:00' }),
			{ coverImageCount: 1 }
		);

		expect(result).toEqual({ ok: false, message: '종료 일시는 시작 일시보다 늦어야 합니다.' });
	});

	it('고정 목록에 없는 카테고리를 거부한다', () => {
		expect(normalizeCampusEventInput(form({ category: '체육대회' }), { coverImageCount: 1 })).toEqual({
			ok: false,
			message: '행사 카테고리를 확인해 주세요.'
		});
	});

	it('박람회 카테고리와 HTTPS 안내 링크를 정규화한다', () => {
		const result = normalizeCampusEventInput(
			form({ category: '박람회', externalUrl: ' https://kusejong-jobfair.com/ ' }),
			{ coverImageCount: 1 }
		);

		expect(result).toMatchObject({
			ok: true,
			value: {
				category: '박람회',
				externalUrl: 'https://kusejong-jobfair.com/'
			}
		});
	});

	it('HTTP 또는 HTTPS가 아닌 안내 링크를 거부한다', () => {
		expect(
			normalizeCampusEventInput(form({ externalUrl: 'javascript:alert(1)' }), {
				coverImageCount: 1
			})
		).toEqual({ ok: false, message: '안내 링크는 http 또는 https 주소로 입력해 주세요.' });
	});

	it('대표 이미지 없는 행사는 공개할 수 없다', () => {
		expect(normalizeCampusEventInput(form(), { coverImageCount: 0 })).toEqual({
			ok: false,
			message: '공개 행사에는 대표 이미지가 필요합니다.'
		});
	});

	it('비공개 행사는 대표 이미지 없이도 저장하고 입력값을 정규화한다', () => {
		const result = normalizeCampusEventInput(form({ isVisible: '' }), { coverImageCount: 0 });

		expect(result).toMatchObject({
			ok: true,
			value: {
				title: '2026 고려대학교 가을 축제',
				category: '축제',
				isVisible: false,
				latitude: 36.6101,
				longitude: 127.2872
			}
		});
	});
});
