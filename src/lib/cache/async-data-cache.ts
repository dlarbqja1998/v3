/** 제한된 수의 데이터만 메모리에 보관하고, 같은 키의 진행 중인 조회를 합친다. */
export function createAsyncDataCache<T>(ttlMs: number, maxEntries = 100) {
	const entries = new Map<string, { value: T; expiresAt: number }>();
	const pending = new Map<string, Promise<T>>();
	function peek(key: string): T | undefined {
		const entry = entries.get(key);
		if (!entry) return undefined;
		if (entry.expiresAt <= Date.now()) {
			entries.delete(key);
			return undefined;
		}
		entries.delete(key);
		entries.set(key, entry);
		return entry.value;
	}
	function read(key: string, fetchData: () => Promise<T>): Promise<T> {
		const cached = peek(key);
		if (cached !== undefined) return Promise.resolve(cached);
		const existing = pending.get(key);
		if (existing) return existing;
		const request = Promise.resolve().then(fetchData).then(value => {
			entries.delete(key);
			entries.set(key, { value, expiresAt: Date.now() + ttlMs });
			while (entries.size > maxEntries) entries.delete(entries.keys().next().value!);
			return value;
		}).finally(() => pending.delete(key));
		pending.set(key, request);
		return request;
	}
	return { peek, read };
}
