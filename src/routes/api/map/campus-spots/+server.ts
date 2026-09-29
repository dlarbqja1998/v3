import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { listCampusSpots } from '$lib/server/campus-spots';

export async function GET({ platform }: { platform: App.Platform | undefined }) {
	const spots = await listCampusSpots(env.DATABASE_URL, platform?.env?.GOLABAU_CACHE);
	return json({ spots }, { headers: { 'cache-control': 'public, max-age=300' } });
}
