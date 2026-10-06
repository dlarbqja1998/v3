import { error } from '@sveltejs/kit';
import { isLocalEventPreview } from '$lib/server/event-preview';
import type { RequestHandler } from './$types';

const posters: Record<string, string> = { jansasa: 'jansasa-cover.jpg', 'eco-up': 'eco-up-poster.jpg' };

export const GET: RequestHandler = async ({ url, params }) => {
	if (!isLocalEventPreview(url.hostname) || !Object.hasOwn(posters, params.id)) error(404, '이미지를 찾지 못했습니다.');
	const { readFile } = await import('node:fs/promises');
	try {
		const bytes = await readFile(`.local/event-inbox/2026-10-06-posters/${posters[params.id]}`);
		return new Response(new Uint8Array(bytes), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, no-store' } });
	} catch { error(404, '로컬 포스터 파일을 찾지 못했습니다.'); }
};
