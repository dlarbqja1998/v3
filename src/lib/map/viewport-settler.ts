/** 관성 이동·연속 휠 이벤트가 끝난 뒤 마지막 화면만 반영한다. */
export function createViewportSettler<T>(commit: (value: T) => void, delay = 120) {
	let timer: ReturnType<typeof setTimeout> | undefined;
	function cancel() {
		if (timer !== undefined) clearTimeout(timer);
		timer = undefined;
	}
	return {
		cancel,
		schedule(value: T) {
			cancel();
			timer = setTimeout(() => {
				timer = undefined;
				commit(value);
			}, delay);
		}
	};
}
