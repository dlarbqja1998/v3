import { afterEach, describe, expect, it, vi } from 'vitest';
import { startVisibleClock } from './visible-clock';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('화면 복귀 시각 갱신', () => {
	it('백그라운드에서는 멈추고 복귀·뒤로 가기 복원 시 현재 시각을 즉시 반영한다', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-09-14T00:09:00Z'));
		const windowTarget = Object.assign(new EventTarget(), { setInterval, clearInterval });
		const documentTarget = Object.assign(new EventTarget(), { visibilityState: 'visible' });
		vi.stubGlobal('window', windowTarget); vi.stubGlobal('document', documentTarget);
		const tick = vi.fn();
		const cleanup = startVisibleClock(tick);
		expect(tick).toHaveBeenCalledTimes(1);
		vi.advanceTimersByTime(1000); expect(tick).toHaveBeenCalledTimes(2);
		documentTarget.visibilityState = 'hidden'; documentTarget.dispatchEvent(new Event('visibilitychange'));
		vi.advanceTimersByTime(60_000); expect(tick).toHaveBeenCalledTimes(2);
		documentTarget.visibilityState = 'visible'; documentTarget.dispatchEvent(new Event('visibilitychange'));
		expect(tick).toHaveBeenLastCalledWith(new Date('2026-09-14T00:10:01Z'));
		expect(vi.getTimerCount()).toBe(1);
		windowTarget.dispatchEvent(new Event('pagehide')); expect(vi.getTimerCount()).toBe(0);
		vi.advanceTimersByTime(30_000); windowTarget.dispatchEvent(new Event('pageshow'));
		expect(tick).toHaveBeenLastCalledWith(new Date('2026-09-14T00:10:31Z'));
		expect(vi.getTimerCount()).toBe(1);
		cleanup(); expect(vi.getTimerCount()).toBe(0);
		const calls = tick.mock.calls.length;
		windowTarget.dispatchEvent(new Event('pageshow')); documentTarget.dispatchEvent(new Event('visibilitychange'));
		expect(tick).toHaveBeenCalledTimes(calls);
	});

	it('서버 렌더링에서는 브라우저 API를 사용하지 않는다', () => {
		vi.stubGlobal('window', undefined); vi.stubGlobal('document', undefined);
		const tick = vi.fn(); const cleanup = startVisibleClock(tick); cleanup();
		expect(tick).not.toHaveBeenCalled();
	});
});
