import type { WeatherCacheEntry, WeatherSnapshot } from '$lib/domain/weather';
import { isWeatherSnapshot } from '$lib/domain/weather';
import { fetchKmaWeather, getKmaRequestTimes } from './kma-weather';

export const WEATHER_CACHE_KEY = 'weather:campus:current:v1';
const WEATHER_CACHE_TTL_SECONDS = 60 * 60 * 24;
const WEATHER_STALE_LIMIT_MS = 6 * 60 * 60 * 1000;

type FetchWeather = typeof fetchKmaWeather;

type WeatherKv = {
	get(key: string): Promise<string | null>;
	put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
};

type WeatherPlatform = {
	env?: {
		GOLABAU_CACHE?: WeatherKv;
	};
	context?: {
		waitUntil(promise: Promise<unknown>): void;
	};
};

type WeatherOptions = {
	now?: Date;
	serviceKey: string;
	fetchWeather?: FetchWeather;
};

export function createWeatherCacheService() {
	let inMemoryWeather: WeatherCacheEntry | null = null;
	let refreshPromise: Promise<WeatherCacheEntry> | null = null;

	async function getCurrentWeather(
		platform: WeatherPlatform | undefined,
		options: WeatherOptions
	): Promise<WeatherSnapshot> {
		const now = options.now ?? new Date();
		const requestTimes = getKmaRequestTimes(now);
		const cached =
			inMemoryWeather ?? (await readKvWeather(platform?.env?.GOLABAU_CACHE, WEATHER_CACHE_KEY));

		if (cached) {
			inMemoryWeather = cached;

			if (
				cached.observationBase === requestTimes.observation.id &&
				cached.forecastBase === requestTimes.forecast.id
			) {
				return toSnapshot(cached, false);
			}

			if (isWithinStaleLimit(cached, now)) {
				if (options.serviceKey) {
					const task = refresh(platform, options.serviceKey, now, options.fetchWeather);
					if (platform?.context?.waitUntil) {
						platform.context.waitUntil(task);
					} else {
						void task.catch(() => undefined);
					}
				}
				return toSnapshot(cached, true);
			}
		}

		const refreshed = await refresh(platform, options.serviceKey, now, options.fetchWeather);
		return toSnapshot(refreshed, false);
	}

	function refresh(
		platform: WeatherPlatform | undefined,
		serviceKey: string,
		now: Date,
		fetchWeather: FetchWeather = fetchKmaWeather
	): Promise<WeatherCacheEntry> {
		if (refreshPromise) return refreshPromise;
		if (!serviceKey) return Promise.reject(new Error('기상청 API 인증키가 없습니다.'));

		refreshPromise = (async () => {
			try {
				const weather = await fetchWeather(serviceKey, now);
				inMemoryWeather = weather;
				await writeKvWeather(platform?.env?.GOLABAU_CACHE, weather);
				return weather;
			} finally {
				refreshPromise = null;
			}
		})();

		return refreshPromise;
	}

	return { getCurrentWeather };
}

const defaultWeatherCacheService = createWeatherCacheService();
export const getCurrentWeather = defaultWeatherCacheService.getCurrentWeather;

function toSnapshot(entry: WeatherCacheEntry, stale: boolean): WeatherSnapshot {
	return {
		temperature: entry.temperature,
		status: entry.status,
		icon: entry.icon,
		observedAt: entry.observedAt,
		fetchedAt: entry.fetchedAt,
		stale
	};
}

function isWithinStaleLimit(entry: WeatherCacheEntry, now: Date): boolean {
	const age = now.getTime() - Date.parse(entry.fetchedAt);
	return age >= 0 && age <= WEATHER_STALE_LIMIT_MS;
}

async function readKvWeather(
	kv: WeatherKv | undefined,
	key: string
): Promise<WeatherCacheEntry | null> {
	if (!kv) return null;

	try {
		const raw = await kv.get(key);
		if (!raw) return null;
		const parsed: unknown = JSON.parse(raw);
		return isWeatherCacheEntry(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

async function writeKvWeather(
	kv: WeatherKv | undefined,
	weather: WeatherCacheEntry
): Promise<void> {
	if (!kv) return;

	try {
		await kv.put(WEATHER_CACHE_KEY, JSON.stringify(weather), {
			expirationTtl: WEATHER_CACHE_TTL_SECONDS
		});
	} catch {
		// KV 장애가 정상 날씨 응답까지 막지 않도록 메모리 캐시는 유지한다.
	}
}

function isWeatherCacheEntry(value: unknown): value is WeatherCacheEntry {
	if (!value || typeof value !== 'object') return false;
	const candidate = value as Partial<WeatherCacheEntry>;

	return (
		isWeatherSnapshot({ ...candidate, stale: false }) &&
		typeof candidate.observationBase === 'string' &&
		/^\d{12}$/.test(candidate.observationBase) &&
		typeof candidate.forecastBase === 'string' &&
		/^\d{12}$/.test(candidate.forecastBase)
	);
}
