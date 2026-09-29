import { describe, expect, it } from 'vitest';
import { gbFestivalPreview as festival } from '$lib/server/festival-gb-2026';
import { getFestivalBoothForSession, getFestivalMapPoint, getFestivalPerformanceStatus, getFestivalTodayEntry, getInitialFestivalSelection, getNextFestivalPerformance } from './festival';
import { createFestivalLayer } from '$lib/map/festival-layer';

describe('이번 축제의 일정과 미확인 정보', () => {
	it.each([
		['2026-09-29T12:00:00+09:00', 'day'],
		['2026-09-29T17:30:00+09:00', 'night'],
		['2026-09-29T19:00:00+09:00', 'night'],
		['2026-09-30T00:00:00+09:00', 'night']
	])('첫 진입 %s의 세션은 %s이다', (time, session) => {
		expect(getInitialFestivalSelection(festival, new Date(time))).toEqual({ date: '2026-09-29', session });
	});
	it('같은 부스에서 낮 활동과 밤 정보를 전환하며 가짜 번호·가격을 채우지 않는다', () => {
		const day = getFestivalBoothForSession(festival, 'gb-spc', 'day');
		const night = getFestivalBoothForSession(festival, 'gb-spc', 'night');
		expect(day?.id).toBe(night?.id);
		expect(night?.number).toBe('');
		expect(night?.sessions.night?.items.every((item) => item.price === null)).toBe(true);
		expect(getFestivalBoothForSession(festival, 'gb-gusia', 'day')?.sessions.day?.hours).toContain('11:00');
		expect(getFestivalBoothForSession(festival, 'gb-gusia', 'night')?.sessions.night?.hours).toContain('21:00');
	});
	it('확인된 다음 공연과 진행·종료를 실제 날짜 기준으로 구분한다', () => {
		const bbp = festival.performances.find((item) => item.id === 'gb-bbp')!;
		const unmute = festival.performances.find((item) => item.id === 'gb-unmute')!;
		const udf = festival.performances.find((item) => item.id === 'gb-udf')!;
		expect(getNextFestivalPerformance(festival.performances, new Date('2026-09-29T12:00:00+09:00'))).toMatchObject({ name: '소리마당', time: '18:10–18:40' });
		expect(getNextFestivalPerformance(festival.performances, new Date('2026-09-29T19:00:00+09:00'))?.id).toBe(bbp.id);
		expect(getFestivalPerformanceStatus(bbp, new Date('2026-09-29T20:10:00+09:00'))).toBe('ongoing');
		expect(getFestivalPerformanceStatus(bbp, new Date('2026-09-29T20:40:00+09:00'))).toBe('ended');
		expect(getNextFestivalPerformance(festival.performances, new Date('2026-09-29T20:40:00+09:00'))?.id).toBe(unmute.id);
		expect(getFestivalPerformanceStatus(unmute, new Date('2026-09-29T20:50:00+09:00'))).toBe('started');
		expect(getNextFestivalPerformance(festival.performances, new Date('2026-09-29T20:51:00+09:00'))?.id).toBe(udf.id);
		expect(getNextFestivalPerformance(festival.performances, new Date('2026-09-29T22:00:00+09:00'))).toBeUndefined();
		expect(getFestivalPerformanceStatus(udf, new Date('2026-09-29T22:00:00+09:00'))).toBe('started');
	});
	it('지도 위치가 없으면 지도 객체에 접근하거나 예전 축제 핀을 만들지 않는다', () => {
		const unlocated = { ...festival, area: { label: festival.area.label, boundary: [], approximate: true } };
		expect(getFestivalMapPoint(unlocated.area)).toBeNull();
		expect(() => createFestivalLayer(null, null, unlocated, true, () => {}).dispose()).not.toThrow();
	});
	it('오늘 목록에서는 23시에 축제를 내린다', () => {
		expect(getFestivalTodayEntry(festival, new Date('2026-09-29T22:59:59+09:00'))?.title).toBe(festival.name);
		expect(getFestivalTodayEntry(festival, new Date('2026-09-29T23:00:00+09:00'))).toBeNull();
	});
});
