/** 입력 중인 검색은 합치고, 실제로 멈춘 검색의 길이·결과 수만 기록한다. */
export function createSearchTracker(capture: (properties: Record<string, unknown>) => void, delay = 400) {
	let timer: ReturnType<typeof setTimeout> | undefined;
	let lastSearch = '';
	let pending: { key: string; properties: Record<string, unknown> } | undefined;
	function flush() {
		clearTimeout(timer);
		timer = undefined;
		if (!pending) return;
		const search = pending;
		pending = undefined;
		lastSearch = search.key;
		capture(search.properties);
	}
	function cancel() {
		clearTimeout(timer);
		timer = undefined;
		lastSearch = '';
		pending = undefined;
	}
	return {
		cancel,
		flush,
		update(query: string, properties: Record<string, unknown>) {
			clearTimeout(timer);
			pending = undefined;
			const value = query.trim();
			if (!value) { cancel(); return; }
			const key = `${properties.area_mode}|${value}`;
			if (key === lastSearch) return;
			pending = { key, properties: { ...properties, query_length: value.length } };
			timer = setTimeout(flush, delay);
		}
	};
}
