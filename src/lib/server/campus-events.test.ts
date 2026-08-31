import { describe, expect, it } from 'vitest';
import {
	buildCampusEventValidationFormData,
	listPublicCampusEvents,
	selectCampusEventSpotlight,
	toCampusEventDto
} from './campus-events';

const now = new Date('2026-08-30T03:00:00.000Z');

function row(overrides: Record<string, unknown> = {}) {
	return {
		id: '11111111-1111-4111-8111-111111111111',
		title: '고려대학교 가을 축제',
		category: '축제',
		organizer: '총학생회',
		description: '교내 구성원이 함께 즐기는 행사입니다.',
		externalUrl: null,
		startsAt: new Date('2026-08-30T02:00:00.000Z'),
		endsAt: new Date('2026-08-30T05:00:00.000Z'),
		locationName: '중앙광장',
		latitude: 36.6101,
		longitude: 127.2872,
		isVisible: true,
		createdBy: 1,
		createdAt: new Date('2026-08-20T00:00:00.000Z'),
		updatedAt: new Date('2026-08-20T00:00:00.000Z'),
		...overrides
	};
}

describe('교내 행사 저장소 변환', () => {
	it('링크가 없는 기존 행사를 공개 검증할 때 빈 링크 값으로 변환한다', () => {
		const formData = buildCampusEventValidationFormData(row({ externalUrl: null }));

		expect(formData.get('externalUrl')).toBe('');
	});

	it('행사 테이블이 아직 없으면 사용자 목록을 빈 배열로 반환한다', async () => {
		const missingTableError = Object.assign(
			new Error('relation "campus_events" does not exist'),
			{ code: '42P01' }
		);
		const queryError = new Error('Failed query: select from campus_events', {
			cause: missingTableError
		});
		const db = {
			query: {
				campusEvents: {
					findMany: async () => {
						throw queryError;
					}
				}
			}
		};

		await expect(listPublicCampusEvents('', now, db as never)).resolves.toEqual([]);
	});

	it('대표 이미지를 첫 장으로 두고 API 이미지 주소를 만든다', () => {
		const eventRow = row();
		const sub = {
			id: '33333333-3333-4333-8333-333333333333',
			eventId: eventRow.id,
			objectKey: `events/${eventRow.id}/sub.webp`,
			contentType: 'image/webp',
			byteSize: 300,
			isCover: false,
			displayOrder: 0,
			createdAt: now
		};
		const cover = {
			id: '22222222-2222-4222-8222-222222222222',
			eventId: eventRow.id,
			objectKey: `events/${eventRow.id}/cover.png`,
			contentType: 'image/png',
			byteSize: 200,
			isCover: true,
			displayOrder: 4,
			createdAt: now
		};

		expect(toCampusEventDto(eventRow, [sub, cover])).toMatchObject({
			id: eventRow.id,
			coverImageId: cover.id,
			images: [
				{
					id: cover.id,
					kind: 'cover',
					url: `/api/events/${eventRow.id}/images/${cover.id}`
				},
				{
					id: sub.id,
					kind: 'sub',
					url: `/api/events/${eventRow.id}/images/${sub.id}`
				}
			]
		});
	});

	it('대표 이미지가 없으면 coverImageId를 null로 반환한다', () => {
		expect(toCampusEventDto(row(), [])).toMatchObject({ coverImageId: null, images: [] });
	});
});

describe('메인 행사 스포트라이트', () => {
	it('예정 행사보다 진행 중 행사를 우선한다', () => {
		const ongoing = toCampusEventDto(row({ id: 'ongoing' }), []);
		const upcoming = toCampusEventDto(
			row({
				id: 'upcoming',
				startsAt: new Date('2026-08-31T03:00:00.000Z'),
				endsAt: new Date('2026-08-31T05:00:00.000Z')
			}),
			[]
		);

		expect(selectCampusEventSpotlight([upcoming, ongoing], now)?.id).toBe('ongoing');
	});

	it('진행 중 행사가 없으면 가장 가까운 예정 행사를 고른다', () => {
		const later = toCampusEventDto(
			row({
				id: 'later',
				startsAt: new Date('2026-09-02T03:00:00.000Z'),
				endsAt: new Date('2026-09-02T05:00:00.000Z')
			}),
			[]
		);
		const sooner = toCampusEventDto(
			row({
				id: 'sooner',
				startsAt: new Date('2026-08-31T03:00:00.000Z'),
				endsAt: new Date('2026-08-31T05:00:00.000Z')
			}),
			[]
		);

		expect(selectCampusEventSpotlight([later, sooner], now)?.id).toBe('sooner');
	});
});
