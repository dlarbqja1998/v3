type LayerEntry<T> = { signature: string; value: T };

/** ID와 표시 정보가 같은 지도 객체는 유지하고 변경·삭제된 객체만 정리한다. */
export function createMapLayer<T>(dispose: (value: T) => void) {
	const entries = new Map<string, LayerEntry<T>>();
	return {
		sync<I>(items: I[], identify: (item: I) => { id: string; signature: string }, create: (item: I) => T) {
			const visible = new Set<string>();
			for (const item of items) {
				const { id, signature } = identify(item);
				visible.add(id);
				const previous = entries.get(id);
				if (previous?.signature === signature) continue;
				if (previous) dispose(previous.value);
				entries.set(id, { signature, value: create(item) });
			}
			for (const [id, entry] of entries) {
				if (visible.has(id)) continue;
				dispose(entry.value);
				entries.delete(id);
			}
		},
		clear() {
			for (const entry of entries.values()) dispose(entry.value);
			entries.clear();
		}
	};
}
