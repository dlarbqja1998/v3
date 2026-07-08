import { json } from '@sveltejs/kit';
import { places } from '$lib/domain/seed';

export function GET({ url }) {
	const zone = url.searchParams.get('zone');
	const category = url.searchParams.get('category');

	const filteredPlaces = places.filter((place) => {
		const zoneMatched = !zone || zone === 'all' || place.zoneId === zone;
		const categoryMatched = !category || category === 'all' || place.categorySlug === category;
		return place.isVisible && zoneMatched && categoryMatched;
	});

	return json({ places: filteredPlaces });
}
