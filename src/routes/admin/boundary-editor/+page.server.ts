import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { createDb } from '$lib/server/db';
import { campusSpots } from '$lib/server/db/schema';
import {
	getCampusSpotCenter,
	normalizeCampusBoundary,
	toCampusSpot,
	writeCachedCampusSpots
} from '$lib/server/campus-spots';
import type { Actions, PageServerLoad } from './$types';

function requireAdmin(user: App.Locals['user']) {
	if (!user) throw redirect(303, '/login?next=/admin/boundary-editor');
	if (user.role !== 'admin') throw redirect(303, '/');
}

export const load: PageServerLoad = async ({ locals }) => {
	requireAdmin(locals.user);
	const rows = await createDb(env.DATABASE_URL).select().from(campusSpots);
	return { spots: rows.map(toCampusSpot), naverMapClientId: env.NAVER_MAP_CLIENT_ID ?? '' };
};

export const actions: Actions = {
	save: async ({ request, locals, platform }) => {
		requireAdmin(locals.user);
		const formData = await request.formData();
		const id = formData.get('id')?.toString() ?? '';
		const rawBoundary = formData.get('boundary')?.toString() ?? '';
		let boundary = [];
		try {
			boundary = normalizeCampusBoundary(JSON.parse(rawBoundary));
		} catch {
			return fail(400, { saveError: '경계 좌표 형식이 올바르지 않습니다.' });
		}
		if (!id || boundary.length < 3) {
			return fail(400, { saveError: '경계는 세 개 이상의 꼭짓점이 필요합니다.' });
		}

		const db = createDb(env.DATABASE_URL);
		const center = getCampusSpotCenter(boundary);
		const updated = await db
			.update(campusSpots)
			.set({ boundary, centerLatitude: center.latitude, centerLongitude: center.longitude, source: 'designer-final', updatedAt: new Date() })
			.where(eq(campusSpots.id, id))
			.returning({ id: campusSpots.id });
		if (updated.length === 0) return fail(404, { saveError: '저장할 캠퍼스 구역을 찾지 못했습니다.' });

		const rows = await db.select().from(campusSpots);
		await writeCachedCampusSpots(platform?.env?.GOLABAU_CACHE, rows.map(toCampusSpot));
		return { saved: true };
	}
};
