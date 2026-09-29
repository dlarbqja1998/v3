import { env } from '$env/dynamic/private';
import { requireEventAdmin } from '$lib/server/event-admin';
import { getEventCandidate } from '$lib/server/event-candidates';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params, platform }) => {
	requireEventAdmin(locals.user);
	const candidate = await getEventCandidate(env.DATABASE_URL, params.id);
	if (!candidate?.coverImage || !platform?.env?.EVENT_MEDIA) return new Response(null, { status: 404 });
	const image = await platform.env.EVENT_MEDIA.get(candidate.coverImage.objectKey);
	if (!image) return new Response(null, { status: 404 });
	return new Response(image.body as BodyInit, { headers: { 'Content-Type': candidate.coverImage.contentType, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
};
