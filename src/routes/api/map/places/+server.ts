import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getHomeData } from '$lib/server/db/queries';

export async function GET({ url }) {
	const zone = url.searchParams.get('zone');
	const category = url.searchParams.get('category');
	const data = await getHomeData(env.DATABASE_URL);

	const filteredPlaces = data.places.filter((place) => {
		const zoneMatched = !zone || zone === 'all' || place.zoneId === zone;
		const categoryMatched = !category || category === 'all' || place.categorySlug === category;
		return place.isVisible && zoneMatched && categoryMatched;
	});

	return json({ places: filteredPlaces });
}
