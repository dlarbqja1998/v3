import { describe, expect, it } from 'vitest';
import { campusSpots, type CampusCoordinate, type CampusSpot } from './campus-spots';
import { getPublicCampusEvents, normalizeCampusEventInput } from './campus-events';
import { eventBoundariesOverlap, eventPointInBoundary, getCampusEventSpots, getStandaloneCampusEvents, groupCampusEventsBySpot, isValidEventBoundary, parseCampusEventLocation, type LocatedCampusEvent } from './event-locations';

const p = (latitude: number, longitude: number): CampusCoordinate => ({ latitude, longitude });
const square = [p(1, 1), p(1, 3), p(3, 3), p(3, 1)];
const spot: CampusSpot = { id: 'building-test', name: '농심국제관', type: 'building', center: p(2, 2), boundary: square, source: 'designer-final', description: '' };
const event: LocatedCampusEvent = { id: 'event-1', locationName: '농심국제관', ...p(2, 2) };

describe('행사 위치와 건물 연결', () => {
	it('직접 선택한 여러 건물을 좌표나 장소명에 영향받지 않고 연결한다', () => {
		const other = { ...spot, id: 'building-other', name: '학술정보원' };
		expect(getCampusEventSpots({ ...event, ...p(10, 10), location: { type: 'building', buildingIds: [spot.id, other.id] } }, [spot, other])).toEqual([spot, other]);
	});
	it('건물 안과 경계 위의 핀만 연결한다', () => {
		expect(eventPointInBoundary(p(2, 2), square)).toBe(true);
		expect(eventPointInBoundary(p(1, 2), square)).toBe(true);
		expect(eventPointInBoundary(p(1, 1), square)).toBe(true);
		expect(getCampusEventSpots({ ...event, ...p(4, 2), location: { type: 'pin' } }, [spot])).toEqual([]);
	});
	it('이전에 장소명만 입력한 행사도 건물에 연결한다', () => {
		expect(getCampusEventSpots({ ...event, ...p(10, 10), locationName: '농심 국제관' }, [spot])).toEqual([spot]);
	});
	it('범위가 건물을 포함하거나 일부만 겹쳐도 연결하고 떨어진 건물은 제외한다', () => {
		const containing = [p(0, 0), p(0, 4), p(4, 4), p(4, 0)];
		expect(getCampusEventSpots({ ...event, location: { type: 'area', boundary: containing } }, [spot])).toEqual([spot]);
		expect(eventBoundariesOverlap(square, [p(2, 2), p(2, 4), p(4, 4), p(4, 2)])).toBe(true);
		expect(eventBoundariesOverlap(square, [p(4, 4), p(4, 5), p(5, 5), p(5, 4)])).toBe(false);
	});
	it('서로 꼭짓점을 포함하지 않고 선분만 교차하는 범위도 연결한다', () => {
		expect(eventBoundariesOverlap([p(1, 0), p(1, 4), p(2, 4), p(2, 0)], [p(0, 1), p(0, 2), p(3, 2), p(3, 1)])).toBe(true);
	});
	it('실제 농심국제관 경계에서 3개 행사를 모으고 같은 ID는 한 번만 센다', () => {
		const building = campusSpots.find((item) => item.name === '농심국제관')!;
		const pin = { ...event, ...building.center, location: { type: 'pin' as const } };
		const events = [pin, { ...pin, id: 'event-2' }, { ...pin, id: 'event-3' }, pin];
		expect(groupCampusEventsBySpot(events, campusSpots)[building.id]).toHaveLength(3);
	});
	it('오늘과 같은 공개 기준을 사용하면 종료·비공개·7일 이후 행사는 개수와 목록에서 제외된다', () => {
		const now = new Date('2026-09-20T03:00Z');
		const base = { ...event, isVisible: true, startsAt: new Date('2026-09-20T02:00Z'), endsAt: new Date('2026-09-20T04:00Z') };
		const events = [base, { ...base, id: 'hidden', isVisible: false }, { ...base, id: 'ended', endsAt: new Date('2026-09-20T02:59Z') }, { ...base, id: 'later', startsAt: new Date('2026-09-28T02:00Z'), endsAt: new Date('2026-09-28T04:00Z') }];
		expect(groupCampusEventsBySpot(getPublicCampusEvents(events, now), [spot])[spot.id].map((item) => item.id)).toEqual([event.id]);
	});
	it('중앙광장에 연결된 KUS는 숫자 하나로 모으고 구역 밖 행사만 개별 핀을 표시한다', () => {
		const plaza: CampusSpot = { ...spot, id: 'central-plaza', name: '중앙광장', type: 'outdoor' };
		const kus = { ...event, locationName: '미래관 사거리 앞', location: { type: 'pin' as const } };
		const outside = { ...kus, id: 'outside', ...p(10, 10) };
		expect(groupCampusEventsBySpot([kus, outside], [plaza])[plaza.id]).toEqual([kus]);
		expect(getStandaloneCampusEvents([kus, outside], [plaza])).toEqual([outside]);
	});
});

describe('행사 위치 입력 검증', () => {
	it('꼭짓점 부족, 중복, 일직선, 교차, 잘못된 좌표, 과도한 점을 거부한다', () => {
		for (const boundary of [[], [p(1, 1), p(2, 2)], [...square, square[0]], [p(1, 1), p(2, 2), p(3, 3)], [p(1, 1), p(3, 3), p(1, 3), p(3, 1)], [p(91, 1), p(2, 2), p(3, 1)], Array.from({ length: 65 }, (_, i) => p(i, i))]) expect(isValidEventBoundary(boundary)).toBe(false);
		expect(isValidEventBoundary(square)).toBe(true);
	});
	it('건물 중복 선택을 정리하고 빈 건물과 알 수 없는 방식을 거부한다', () => {
		expect(parseCampusEventLocation({ type: 'building', buildingIds: ['one', 'one'] })).toEqual({ type: 'building', buildingIds: ['one'] });
		expect(parseCampusEventLocation({ type: 'building', buildingIds: [] })).toBeNull();
		expect(parseCampusEventLocation({ type: 'unknown' })).toBeNull();
	});
	function input(location: string) {
		const form = new FormData();
		for (const [key, value] of Object.entries({ title: '행사 제목', category: '강연', organizer: '학생회', description: '행사 상세 설명', startsAt: '2026-09-20T09:00+09:00', endsAt: '2026-09-20T18:00+09:00', locationName: '농심국제관', latitude: '30', longitude: '120', location })) form.set(key, value);
		return form;
	}
	it('건물 ID를 실제 목록과 대조하고 중심 좌표를 서버에서 정한다', () => {
		expect(normalizeCampusEventInput(input(JSON.stringify({ type: 'building', buildingIds: [spot.id] })), { campusSpots: [spot] })).toMatchObject({ ok: true, value: { latitude: 2, longitude: 2, location: { type: 'building', buildingIds: [spot.id] } } });
		expect(normalizeCampusEventInput(input(JSON.stringify({ type: 'building', buildingIds: ['missing'] })), { campusSpots: [spot] }).ok).toBe(false);
	});
	it('범위는 서버에서 검증하고 중심 좌표를 계산한다', () => {
		expect(normalizeCampusEventInput(input(JSON.stringify({ type: 'area', boundary: square })))).toMatchObject({ ok: true, value: { latitude: 2, longitude: 2, location: { type: 'area', boundary: square } } });
		expect(normalizeCampusEventInput(input('{잘못된 JSON')).ok).toBe(false);
	});
	it('기존 입력은 위치 메타데이터 없이 저장할 수 있다', () => {
		expect(normalizeCampusEventInput(input(''))).toMatchObject({ ok: true, value: { location: null } });
	});
});
