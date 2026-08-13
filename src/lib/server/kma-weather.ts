import { classifyWeather, type WeatherCacheEntry } from '$lib/domain/weather';

const KMA_BASE_URL = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';
const CAMPUS_GRID_X = 66;
const CAMPUS_GRID_Y = 107;
const REQUEST_TIMEOUT_MS = 5_000;
const INVALID_RESPONSE_MESSAGE = '기상청 날씨 응답이 올바르지 않습니다.';

type KmaBaseTime = {
	baseDate: string;
	baseTime: string;
	id: string;
};

export type KmaRequestTimes = {
	observation: KmaBaseTime;
	forecast: KmaBaseTime;
};

export type ParsedKmaWeather = {
	temperature: number;
	skyCode: number;
	precipitationCode: number;
	observedAt: string;
};

type KmaItem = {
	baseDate?: unknown;
	baseTime?: unknown;
	category?: unknown;
	obsrValue?: unknown;
	fcstDate?: unknown;
	fcstTime?: unknown;
	fcstValue?: unknown;
};

type KoreanDateParts = {
	year: string;
	month: string;
	day: string;
	hour: string;
	minute: string;
	second: string;
};

const koreanDateFormatter = new Intl.DateTimeFormat('en-CA', {
	timeZone: 'Asia/Seoul',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
	hourCycle: 'h23'
});

export function getKmaRequestTimes(now: Date): KmaRequestTimes {
	const current = getKoreanDateParts(now);
	const minute = Number(current.minute);

	return {
		observation: createBaseTime(now, minute >= 40, '00'),
		forecast: createBaseTime(now, minute >= 45, '30')
	};
}

export function parseKmaPayload(
	observationPayload: unknown,
	forecastPayload: unknown,
	now: Date
): ParsedKmaWeather {
	const observationItems = extractKmaItems(observationPayload);
	const forecastItems = extractKmaItems(forecastPayload);
	const temperatureItem = findItem(observationItems, 'T1H', 'obsrValue');
	const observedPrecipitationItem = findItem(observationItems, 'PTY', 'obsrValue');
	const temperature = Math.round(readFiniteNumber(temperatureItem.obsrValue));
	const observedPrecipitation = readFiniteNumber(observedPrecipitationItem.obsrValue);
	const forecastTime = findNearestForecastTime(forecastItems, now);
	const skyItem = findForecastItem(forecastItems, forecastTime, 'SKY');
	const forecastPrecipitationItem = findForecastItem(forecastItems, forecastTime, 'PTY');
	const skyCode = readFiniteNumber(skyItem.fcstValue);
	const forecastPrecipitation = readFiniteNumber(forecastPrecipitationItem.fcstValue);
	const baseDate = readDigits(temperatureItem.baseDate, 8);
	const baseTime = readDigits(temperatureItem.baseTime, 4);

	return {
		temperature,
		skyCode,
		precipitationCode:
			observedPrecipitation !== 0 ? observedPrecipitation : forecastPrecipitation,
		observedAt: formatKoreanBaseTime(baseDate, baseTime)
	};
}

export async function fetchKmaWeather(
	serviceKey: string,
	now = new Date(),
	fetcher: typeof fetch = fetch
): Promise<WeatherCacheEntry> {
	const requestTimes = getKmaRequestTimes(now);
	const abortController = new AbortController();
	const timeout = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);

	try {
		const [observationResponse, forecastResponse] = await Promise.all([
			fetcher(
				createKmaUrl('getUltraSrtNcst', serviceKey, requestTimes.observation),
				{ signal: abortController.signal }
			),
			fetcher(createKmaUrl('getUltraSrtFcst', serviceKey, requestTimes.forecast), {
				signal: abortController.signal
			})
		]);

		if (!observationResponse.ok || !forecastResponse.ok) {
			throw new Error(INVALID_RESPONSE_MESSAGE);
		}

		const [observationPayload, forecastPayload] = await Promise.all([
			readJson(observationResponse),
			readJson(forecastResponse)
		]);
		const parsed = parseKmaPayload(observationPayload, forecastPayload, now);
		const presentation = classifyWeather(parsed);

		return {
			temperature: parsed.temperature,
			...presentation,
			observedAt: parsed.observedAt,
			fetchedAt: formatKoreanDateTime(now),
			observationBase: requestTimes.observation.id,
			forecastBase: requestTimes.forecast.id
		};
	} catch (error) {
		if (error instanceof Error && error.message === INVALID_RESPONSE_MESSAGE) throw error;
		throw new Error(INVALID_RESPONSE_MESSAGE);
	} finally {
		clearTimeout(timeout);
	}
}

function createBaseTime(now: Date, currentHourReady: boolean, minute: '00' | '30'): KmaBaseTime {
	const baseDate = currentHourReady ? now : new Date(now.getTime() - 60 * 60 * 1000);
	const parts = getKoreanDateParts(baseDate);
	const date = `${parts.year}${parts.month}${parts.day}`;
	const time = `${parts.hour}${minute}`;

	return { baseDate: date, baseTime: time, id: `${date}${time}` };
}

function getKoreanDateParts(date: Date): KoreanDateParts {
	const entries = koreanDateFormatter
		.formatToParts(date)
		.filter((part) => part.type !== 'literal')
		.map((part) => [part.type, part.value]);
	return Object.fromEntries(entries) as KoreanDateParts;
}

function formatKoreanDateTime(date: Date): string {
	const parts = getKoreanDateParts(date);
	return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+09:00`;
}

function formatKoreanBaseTime(baseDate: string, baseTime: string): string {
	return `${baseDate.slice(0, 4)}-${baseDate.slice(4, 6)}-${baseDate.slice(6, 8)}T${baseTime.slice(0, 2)}:${baseTime.slice(2, 4)}:00+09:00`;
}

function createKmaUrl(
	endpoint: 'getUltraSrtNcst' | 'getUltraSrtFcst',
	serviceKey: string,
	base: KmaBaseTime
): URL {
	const url = new URL(`${KMA_BASE_URL}/${endpoint}`);
	url.searchParams.set('serviceKey', serviceKey);
	url.searchParams.set('pageNo', '1');
	url.searchParams.set('numOfRows', '1000');
	url.searchParams.set('dataType', 'JSON');
	url.searchParams.set('nx', String(CAMPUS_GRID_X));
	url.searchParams.set('ny', String(CAMPUS_GRID_Y));
	url.searchParams.set('base_date', base.baseDate);
	url.searchParams.set('base_time', base.baseTime);
	return url;
}

async function readJson(response: Response): Promise<unknown> {
	try {
		return await response.json();
	} catch {
		throw new Error(INVALID_RESPONSE_MESSAGE);
	}
}

function extractKmaItems(payload: unknown): KmaItem[] {
	if (!payload || typeof payload !== 'object') throw new Error(INVALID_RESPONSE_MESSAGE);

	const response = (payload as { response?: unknown }).response;
	if (!response || typeof response !== 'object') throw new Error(INVALID_RESPONSE_MESSAGE);

	const header = (response as { header?: unknown }).header;
	if (!header || typeof header !== 'object') throw new Error(INVALID_RESPONSE_MESSAGE);
	if ((header as { resultCode?: unknown }).resultCode !== '00') {
		throw new Error(INVALID_RESPONSE_MESSAGE);
	}

	const body = (response as { body?: unknown }).body;
	const items = body && typeof body === 'object' ? (body as { items?: unknown }).items : null;
	const itemList =
		items && typeof items === 'object' ? (items as { item?: unknown }).item : undefined;
	if (!Array.isArray(itemList)) throw new Error(INVALID_RESPONSE_MESSAGE);

	return itemList.filter((item): item is KmaItem => Boolean(item) && typeof item === 'object');
}

function findItem(items: KmaItem[], category: string, valueKey: 'obsrValue'): KmaItem {
	const item = items.find(
		(candidate) => candidate.category === category && candidate[valueKey] !== undefined
	);
	if (!item) throw new Error(INVALID_RESPONSE_MESSAGE);
	return item;
}

function findForecastItem(items: KmaItem[], forecastTime: string, category: string): KmaItem {
	const item = items.find(
		(candidate) =>
			`${candidate.fcstDate ?? ''}${candidate.fcstTime ?? ''}` === forecastTime &&
			candidate.category === category &&
			candidate.fcstValue !== undefined
	);
	if (!item) throw new Error(INVALID_RESPONSE_MESSAGE);
	return item;
}

function findNearestForecastTime(items: KmaItem[], now: Date): string {
	const forecastTimes = [
		...new Set(
			items
				.filter((item) => item.category === 'SKY' || item.category === 'PTY')
				.map((item) => `${item.fcstDate ?? ''}${item.fcstTime ?? ''}`)
				.filter((value) => /^\d{12}$/.test(value))
		)
	].sort();
	if (forecastTimes.length === 0) throw new Error(INVALID_RESPONSE_MESSAGE);

	const parts = getKoreanDateParts(now);
	const currentTime = `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}`;
	return forecastTimes.find((time) => time >= currentTime) ?? forecastTimes.at(-1)!;
}

function readFiniteNumber(value: unknown): number {
	const parsed = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN;
	if (!Number.isFinite(parsed)) throw new Error(INVALID_RESPONSE_MESSAGE);
	return parsed;
}

function readDigits(value: unknown, length: number): string {
	if (typeof value !== 'string' || !new RegExp(`^\\d{${length}}$`).test(value)) {
		throw new Error(INVALID_RESPONSE_MESSAGE);
	}
	return value;
}
