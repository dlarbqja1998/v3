import type { WeatherSnapshot } from '$lib/domain/weather';

const SUCCESS_CACHE_CONTROL =
	'public, max-age=300, s-maxage=600, stale-while-revalidate=3600';

export async function createCurrentWeatherResponse(
	loader: () => Promise<WeatherSnapshot>
): Promise<Response> {
	try {
		const weather = await loader();
		return jsonResponse(weather, 200, SUCCESS_CACHE_CONTROL);
	} catch {
		return jsonResponse(
			{
				error: 'weather_unavailable',
				message: '날씨 정보를 불러오지 못했습니다.'
			},
			503,
			'no-store'
		);
	}
}

function jsonResponse(body: unknown, status: number, cacheControl: string): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': cacheControl
		}
	});
}
