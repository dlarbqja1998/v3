import { describe, expect, it } from 'vitest';
import { selectEventHistoryYear } from './event-history';

describe('연도별 행사 기록', () => {
	const events = [
		{ id: 'older', startsAt: new Date('2025-05-01T12:00:00+09:00') },
		{ id: 'new-year', startsAt: new Date('2025-12-31T15:00:00Z') },
		{ id: 'polaris', startsAt: new Date('2026-09-15T12:00:00+09:00') }
	];
	const now = new Date('2026-09-16T12:00:00+09:00');
	it('한국 날짜 기준으로 분류하고 최근 개최 순서로 보여준다', () => {
		const result = selectEventHistoryYear(events, '2026', now);
		expect(result.years).toEqual([2026, 2025]);
		expect(result.events.map((event) => event.id)).toEqual(['polaris', 'new-year']);
	});
	it('이전 연도 기록을 선택해도 보존하고 잘못된 연도는 올해로 돌아간다', () => {
		expect(selectEventHistoryYear(events, '2025', now).events.map((event) => event.id)).toEqual(['older']);
		expect(selectEventHistoryYear(events, '9999', now).selectedYear).toBe(2026);
		expect(selectEventHistoryYear([], null, now)).toEqual({ years: [2026], selectedYear: 2026, events: [] });
	});
});
