import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { refreshTodayMenuCache } from '$lib/server/cafeteria-cache';

export const POST: RequestHandler = async ({ platform, request }) => {
	const adminSecret = platform?.env?.CACHE_CLEAR_SECRET || platform?.env?.ADMIN_SECRET_KEY || '';
	const requestSecret =
		request.headers.get('x-cache-clear-secret') || request.headers.get('x-admin-secret') || '';

	if (!adminSecret || requestSecret !== adminSecret) {
		return json(
			{
				success: false,
				error: '관리자 시크릿이 필요합니다.'
			},
			{ status: 403 }
		);
	}

	const result = await refreshTodayMenuCache(platform, { force: true });

	if (result.status === 'updated') {
		return json({
			success: true,
			status: result.status,
			menu: result.menu
		});
	}

	if (result.status === 'skipped') {
		return json({
			success: true,
			status: result.status,
			reason: result.reason
		});
	}

	return json(
		{
			success: false,
			status: result.status,
			reason: result.reason
		},
		{ status: 500 }
	);
};
