import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getHomeData } from '$lib/server/db/queries';

export async function GET() {
	const data = await getHomeData(env.DATABASE_URL);
	return json({ shuttle: data.nextShuttle });
}
