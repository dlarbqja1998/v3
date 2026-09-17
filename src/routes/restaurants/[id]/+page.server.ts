import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { isOutsidePreview } from '$lib/domain/restaurants';
import { readRestaurantDetail } from '$lib/server/restaurants';

export async function load({params,url,locals}) {
	const mode = isOutsidePreview(dev, url.hostname) ? 'preview' : 'public';
	const restaurant=await readRestaurantDetail(env.DATABASE_URL??'',params.id, mode);
	if(!restaurant) error(404,'등록된 음식점을 찾을 수 없어요.');
	return {restaurant,isAuthenticated:Boolean(locals.user)};
}
