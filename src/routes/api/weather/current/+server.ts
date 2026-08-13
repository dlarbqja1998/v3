import type { RequestHandler } from './$types';
import { getCurrentWeather } from '$lib/server/weather-cache';
import { createCurrentWeatherResponse } from './current-weather-response';

export const GET: RequestHandler = ({ platform }) => {
	return createCurrentWeatherResponse(() =>
		getCurrentWeather(platform, {
			serviceKey: platform?.env?.KMA_SERVICE_KEY ?? ''
		})
	);
};
