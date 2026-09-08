/** 사용자 정보가 없는 공개 조회에만 사용한다. 실패한 조회는 저장하지 않는다. */
export function createPublicDataCache<T>(ttlMs: number) {
	let entry: { key: string; expiresAt: number; value: T } | undefined;
	let pending: { key: string; promise: Promise<T> } | undefined;
	return (key: string, read: () => Promise<T>): Promise<T> => {
		if (entry?.key === key && entry.expiresAt > Date.now()) return Promise.resolve(entry.value);
		if (pending?.key === key) return pending.promise;
		const request = { key, promise: Promise.resolve().then(read) };
		pending = request;
		request.promise = request.promise.then((value) => {
			if (pending === request) entry = { key, value, expiresAt: Date.now() + ttlMs };
			return value;
		}).finally(() => {
			if (pending === request) pending = undefined;
		});
		return request.promise;
	};
}
