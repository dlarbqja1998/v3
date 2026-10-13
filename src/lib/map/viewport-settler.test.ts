import { afterEach, describe, expect, it, vi } from 'vitest';
import { createViewportSettler } from './viewport-settler';

afterEach(() => vi.useRealTimers());

describe('지도 이동 완료 후 갱신', () => {
	it('연속 확대와 관성 이동에서 마지막 화면만 한 번 반영한다', () => {
		vi.useFakeTimers();
		const commit = vi.fn();
		const settler = createViewportSettler(commit);
		settler.schedule('고대앞');
		vi.advanceTimersByTime(80);
		settler.schedule('욱일');
		vi.advanceTimersByTime(119);
		expect(commit).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(commit).toHaveBeenCalledExactlyOnceWith('욱일');
	});

	it('다시 지도를 움직이면 이전에 예약한 구역 전환을 취소한다', () => {
		vi.useFakeTimers();
		const commit = vi.fn();
		const settler = createViewportSettler(commit);
		settler.schedule('고대앞');
		settler.cancel();
		vi.runAllTimers();
		expect(commit).not.toHaveBeenCalled();
		settler.schedule('교내');
		vi.runAllTimers();
		expect(commit).toHaveBeenCalledExactlyOnceWith('교내');
	});
});
