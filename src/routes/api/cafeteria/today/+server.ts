import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getHomeData } from '$lib/server/db/queries';
import { getTodayMenuWithRefresh } from '$lib/server/cafeteria-cache';

export async function GET({ platform }) {
	const weeklyMenu = await getTodayMenuWithRefresh(platform);
	const data = await getHomeData(env.DATABASE_URL, weeklyMenu);
	return json({ cafeterias: data.cafeterias, summary: data.todayCafeteria });
}
