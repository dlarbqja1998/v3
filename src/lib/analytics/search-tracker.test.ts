import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSearchTracker } from './search-tracker';

afterEach(() => vi.useRealTimers());

describe('검색 행동 기록', () => {
	it('빠른 연속 입력을 최종 검색 한 건으로 합치고 검색어 원문을 보내지 않는다', () => {
		vi.useFakeTimers();
		const capture = vi.fn();
		const tracker = createSearchTracker(capture);
		tracker.update('택', { area_mode: 'campus', result_count: 3 });
		vi.advanceTimersByTime(200);
		tracker.update('택배', { area_mode: 'campus', result_count: 1 });
		vi.advanceTimersByTime(400);
		expect(capture).toHaveBeenCalledExactlyOnceWith({ area_mode: 'campus', result_count: 1, query_length: 2 });
	});
	it('같은 입력의 중복 기록을 막고 지운 뒤 재검색과 다른 구역 검색을 구분한다', () => {
		vi.useFakeTimers();
		const capture = vi.fn();
		const tracker = createSearchTracker(capture);
		for (const [query, area_mode] of [['택배', 'campus'], ['택배', 'campus'], ['', 'campus'], ['택배', 'campus'], ['택배', 'outside']]) {
			tracker.update(query, { area_mode });
			vi.advanceTimersByTime(400);
		}
		expect(capture).toHaveBeenCalledTimes(3);
	});
	it('검색 취소나 화면 종료 후에는 지연된 검색 이벤트를 보내지 않는다', () => {
		vi.useFakeTimers();
		const capture = vi.fn();
		const tracker = createSearchTracker(capture);
		tracker.update('택배', { area_mode: 'campus' });
		tracker.cancel();
		vi.advanceTimersByTime(1000);
		expect(capture).not.toHaveBeenCalled();
	});
	it('입력 직후 결과를 선택해도 검색을 먼저 기록하고 지연 이벤트를 중복 전송하지 않는다', () => {
		vi.useFakeTimers();
		const capture = vi.fn();
		const tracker = createSearchTracker(capture);
		tracker.update('택배', { area_mode: 'campus', result_count: 1 });
		tracker.flush();
		tracker.flush();
		vi.advanceTimersByTime(1000);
		expect(capture).toHaveBeenCalledExactlyOnceWith({ area_mode: 'campus', result_count: 1, query_length: 2 });
	});
});
