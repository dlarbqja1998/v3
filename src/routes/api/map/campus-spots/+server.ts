import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { createDb } from '$lib/server/db';
import { campusSpots } from '$lib/server/db/schema';
import { readCachedCampusSpots, toCampusSpot, writeCachedCampusSpots } from '$lib/server/campus-spots';

export async function GET({ platform }: { platform: App.Platform | undefined }) {
	const cache = platform?.env?.GOLABAU_CACHE;
	const cached = await readCachedCampusSpots(cache);
	if (cached) return json({ spots: cached }, { headers: { 'cache-control': 'public, max-age=300' } });

	const rows = await createDb(env.DATABASE_URL).select().from(campusSpots);
	const spots = rows.map(toCampusSpot);
	await writeCachedCampusSpots(cache, spots);
	return json({ spots }, { headers: { 'cache-control': 'public, max-age=300' } });
}
