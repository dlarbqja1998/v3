/** 화면이 보일 때만 갱신하고, WebView·뒤로 가기 복귀 시 실제 시각을 즉시 반영한다. */
export function startVisibleClock(onTick: (now: Date) => void, intervalMs = 1000) {
	if (typeof window === 'undefined' || typeof document === 'undefined') return () => {};
	let timer: ReturnType<typeof window.setInterval> | undefined;
	let pageHidden = false;
	const stop = () => {
		if (timer !== undefined) window.clearInterval(timer);
		timer = undefined;
	};
	const resume = () => {
		stop();
		if (pageHidden || document.visibilityState === 'hidden') return;
		onTick(new Date());
		timer = window.setInterval(() => onTick(new Date()), intervalMs);
	};
	const hide = () => { pageHidden = true; stop(); };
	const show = () => { pageHidden = false; resume(); };
	document.addEventListener('visibilitychange', resume);
	window.addEventListener('pagehide', hide);
	window.addEventListener('pageshow', show);
	resume();
	return () => {
		stop();
		document.removeEventListener('visibilitychange', resume);
		window.removeEventListener('pagehide', hide);
		window.removeEventListener('pageshow', show);
	};
}
