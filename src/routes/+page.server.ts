import { categories, places, todayCafeteria, nextShuttle, zones } from '$lib/domain/seed';

export function load() {
	return {
		categories,
		places,
		todayCafeteria,
		nextShuttle,
		zones
	};
}
