import { createAsyncDataCache } from '$lib/cache/async-data-cache';
import { koreanDate, type RestaurantDetail } from '$lib/domain/restaurants';

/** 홈 화면 인스턴스 안에서만 사용한다. 서버 렌더링이나 다른 사용자와 공유하지 않는다. */
export function createRestaurantDetailCache(request: typeof fetch) {
	const cache = createAsyncDataCache<RestaurantDetail>(60_000, 80);
	const queued = new Set<string>();
	let warming = 0;
	const key = (id: string) => `${koreanDate()}:${id}`;
	function get(id: string) {
		return cache.read(key(id), async () => {
			const response = await request(`/restaurants/${encodeURIComponent(id)}/detail.json`);
			if (!response.ok) throw new Error('매장 정보를 불러오지 못했어요.');
			const data = await response.json() as { restaurant: RestaurantDetail };
			if (data.restaurant?.place.id !== id) throw new Error('매장 정보를 확인할 수 없어요.');
			return data.restaurant;
		});
	}
	function drain() {
		while (warming < 2 && queued.size) {
			const id = queued.values().next().value!;
			queued.delete(id);
			warming++;
			void get(id).catch(() => {}).finally(() => { warming--; drain(); });
		}
	}
	return {
		get,
		peek: (id: string) => cache.peek(key(id)),
		warm: (id: string) => {
			if (!cache.peek(key(id))) { queued.add(id); drain(); }
		}
	};
}
