import { describe, expect, it } from 'vitest';
import { festivalPreview, formatFestivalPrice, getFestivalBooths, getFestivalTodayEntry } from './festival';

describe('축제 부스 정보', () => {
	it('오늘 목록은 같은 축제명·위치와 바텀시트 링크를 사용하고 시작·자정 종료를 구분한다', () => {
		expect(getFestivalTodayEntry(festivalPreview, new Date('2026-09-15T11:59:59+09:00'))).toMatchObject({ title: festivalPreview.name, status: 'upcoming', href: '/?panel=festival' });
		expect(getFestivalTodayEntry(festivalPreview, new Date('2026-09-15T12:00:00+09:00'))?.status).toBe('ongoing');
		expect(getFestivalTodayEntry(festivalPreview, new Date('2026-09-15T23:59:59+09:00'))?.status).toBe('ongoing');
		expect(getFestivalTodayEntry(festivalPreview, new Date('2026-09-16T00:00:00+09:00'))).toBeNull();
	});
	it('축제 날짜를 수정해도 원자료 부스를 다른 날짜에 표시하지 않는다', () => {
		expect(getFestivalBooths(festivalPreview, '2026-09-15', 'day')).toHaveLength(23);
		expect(getFestivalBooths(festivalPreview, '2026-09-16')).toHaveLength(0);
	});
	it('낮부스를 번호순으로 제공하고 이카루스의 개별 정보만 유지한다', () => {
		const booths = getFestivalBooths(festivalPreview, '2026-09-15', 'day');
		expect(booths.map((item) => item.number)).toEqual(Array.from({ length: 23 }, (_, i) => String(i + 1)));
		expect(booths.slice(0, 22).every((item) => item.sessions.day?.items.length === 0 && !item.sessions.night)).toBe(true);
		expect(booths.at(-1)).toMatchObject({ id: 'icarus', sessions: { day: { hours: '12:00–16:40' } } });
		expect(booths.at(-1)?.sessions.day?.items).toHaveLength(4);
		expect(festivalPreview.dates[0].hours.day).toBe('12:00–17:30');
	});
	it('밤 부스는 제공된 번호순으로 표시하고 낮 운영을 임의로 추가하지 않는다', () => {
		const booths = getFestivalBooths(festivalPreview, '2026-09-15', 'night');
		expect(booths).toHaveLength(13);
		expect(booths.map((item) => item.number)).toEqual(Array.from({ length: 13 }, (_, i) => String(i + 1)));
		expect(booths.every((item) => !item.sessions.day && item.sessions.night?.items.length === 0)).toBe(true);
	});
	it('무료와 가격 미정을 구분한다', () => {
		expect(formatFestivalPrice(0)).toBe('무료');
		expect(formatFestivalPrice(null)).toBe('가격 안내 예정');
		expect(formatFestivalPrice(1000)).toBe('1,000원');
	});
});
