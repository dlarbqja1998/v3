import { env } from '$env/dynamic/private';
import { getCampusEventImageRecord } from '$lib/server/campus-events';
import { createEventImageResponse } from '$lib/server/event-media';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals, platform }) => {
	const bucket = platform?.env?.EVENT_MEDIA;
	if (!bucket) return new Response('이미지 저장소를 사용할 수 없습니다.', { status: 503 });

	const record = await getCampusEventImageRecord(env.DATABASE_URL, params.id, params.imageId);
	if (!record) return new Response(null, { status: 404 });

	return createEventImageResponse({
		isEventVisible: record.event.isVisible,
		isAdmin: locals.user?.role === 'admin',
		image: record.image,
		bucket
	});
};
