import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getHomeData } from '$lib/server/db/queries';
import { filterPublicPlaces } from '$lib/server/public-places';

export async function GET({ url }) {
	const zone = url.searchParams.get('zone');
	const category = url.searchParams.get('category');
	const scopeValue = url.searchParams.get('scope');
	const query = url.searchParams.get('query');
	const data = await getHomeData(env.DATABASE_URL);
	const scope = scopeValue === 'campus' || scopeValue === 'outside' ? scopeValue : undefined;
	const filteredPlaces = filterPublicPlaces(data.places, {
		scope,
		zone: zone ?? undefined,
		category: category ?? undefined,
		query: query ?? undefined,
		facilityOnly: url.searchParams.get('type') === 'facility'
	});

	return json({ places: filteredPlaces });
}
