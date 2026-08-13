export type WeatherIconKey =
	| 'clear'
	| 'mostly-cloudy'
	| 'cloudy'
	| 'rain'
	| 'hot'
	| 'snow';

export type WeatherStatus = '맑음' | '구름많음' | '흐림' | '비' | '더움' | '눈';

export type WeatherPresentation = {
	status: WeatherStatus;
	icon: WeatherIconKey;
};

export type WeatherSnapshot = WeatherPresentation & {
	temperature: number;
	observedAt: string;
	fetchedAt: string;
	stale: boolean;
};

export type WeatherCacheEntry = Omit<WeatherSnapshot, 'stale'> & {
	observationBase: string;
	forecastBase: string;
};

const PRESENTATIONS: Record<WeatherStatus, WeatherIconKey> = {
	맑음: 'clear',
	구름많음: 'mostly-cloudy',
	흐림: 'cloudy',
	비: 'rain',
	더움: 'hot',
	눈: 'snow'
};

const ICON_PATHS: Record<WeatherIconKey, string> = {
	clear: '/images/weather/hoi-clear.webp',
	'mostly-cloudy': '/images/weather/hoi-mostly-cloudy.webp',
	cloudy: '/images/weather/hoi-cloudy.webp',
	rain: '/images/weather/hoi-rain.webp',
	hot: '/images/weather/hoi-hot.webp',
	snow: '/images/weather/hoi-snow.webp'
};

export function classifyWeather(input: {
	temperature: number;
	skyCode: number;
	precipitationCode: number;
}): WeatherPresentation {
	if ([2, 3, 6, 7].includes(input.precipitationCode)) {
		return { status: '눈', icon: 'snow' };
	}
	if ([1, 4, 5].includes(input.precipitationCode)) {
		return { status: '비', icon: 'rain' };
	}
	if (input.temperature >= 30) {
		return { status: '더움', icon: 'hot' };
	}
	if (input.skyCode === 3) {
		return { status: '구름많음', icon: 'mostly-cloudy' };
	}
	if (input.skyCode === 4) {
		return { status: '흐림', icon: 'cloudy' };
	}
	return { status: '맑음', icon: 'clear' };
}

export function getWeatherIconSrc(icon: WeatherIconKey): string {
	return ICON_PATHS[icon];
}

export function isWeatherSnapshot(value: unknown): value is WeatherSnapshot {
	if (!value || typeof value !== 'object') return false;

	const candidate = value as Partial<WeatherSnapshot>;
	return (
		Number.isInteger(candidate.temperature) &&
		typeof candidate.status === 'string' &&
		candidate.status in PRESENTATIONS &&
		PRESENTATIONS[candidate.status as WeatherStatus] === candidate.icon &&
		isValidDateString(candidate.observedAt) &&
		isValidDateString(candidate.fetchedAt) &&
		typeof candidate.stale === 'boolean'
	);
}

function isValidDateString(value: unknown): value is string {
	return typeof value === 'string' && Number.isFinite(Date.parse(value));
}
