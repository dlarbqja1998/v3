import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { FACILITY_CATEGORIES } from '$lib/domain/facility-categories';
import { createDb } from '$lib/server/db';
import { placeCategories, places, zones } from '$lib/server/db/schema';
import { parseFacilityPinInput } from '$lib/server/facility-pin';
import { toEditableZone } from '$lib/server/zone-editor';
import type { Actions, PageServerLoad } from './$types';

function requireAdmin(user: App.Locals['user']) {
	if (!user) throw redirect(303, '/login?next=/admin/pin-editor');
	if (user.role !== 'admin') throw redirect(303, '/');
}

export const load: PageServerLoad = async ({ locals, url }) => {
	requireAdmin(locals.user);
	const db = createDb(env.DATABASE_URL);
	const categorySlugs = FACILITY_CATEGORIES.map((category) => category.slug);
	const [pinRows, categoryRows, zoneRows] = await Promise.all([
		db
			.select({
				id: places.id,
				name: places.name,
				scope: places.scope,
				categorySlug: placeCategories.slug,
				categoryName: placeCategories.name,
				icon: placeCategories.icon,
				zoneId: places.zoneId,
				latitude: places.latitude,
				longitude: places.longitude,
				locationGuide: places.locationGuide,
				description: places.description,
				operatingHours: places.operatingHours,
				phone: places.phone,
				displayPriority: places.displayPriority,
				isVisible: places.isVisible
			})
			.from(places)
			.innerJoin(placeCategories, eq(places.categoryId, placeCategories.id))
			.where(eq(places.type, 'facility'))
			.orderBy(asc(places.displayPriority), asc(places.name)),
		db
			.select({
				id: placeCategories.id,
				slug: placeCategories.slug,
				name: placeCategories.name,
				icon: placeCategories.icon
			})
			.from(placeCategories)
			.where(inArray(placeCategories.slug, categorySlugs)),
		db.select().from(zones).orderBy(asc(zones.displayOrder), asc(zones.name))
	]);

	const categoryBySlug = new Map(categoryRows.map((category) => [category.slug, category]));
	return {
		pins: pinRows,
		categories: FACILITY_CATEGORIES.map((category) => ({
			...category,
			id: categoryBySlug.get(category.slug)?.id ?? ''
		})),
		zones: zoneRows.map(toEditableZone),
		naverMapClientId: env.NAVER_MAP_CLIENT_ID ?? '',
		saved: url.searchParams.get('saved') === '1',
		selectedPinId: url.searchParams.get('pin') ?? ''
	};
};

export const actions: Actions = {
	savePin: async ({ request, locals }) => {
		requireAdmin(locals.user);
		const parsed = parseFacilityPinInput(await request.formData());
		if (!parsed.ok) return fail(400, { saveError: parsed.message });

		const db = createDb(env.DATABASE_URL);
		const category = await db.query.placeCategories.findFirst({
			where: eq(placeCategories.slug, parsed.value.categorySlug)
		});
		if (!category) return fail(400, { saveError: '시설 카테고리 DB 정보를 찾지 못했습니다.' });

		if (parsed.value.scope === 'outside') {
			const zone = await db.query.zones.findFirst({
				where: eq(zones.id, parsed.value.zoneId!)
			});
			if (!zone) return fail(400, { saveError: '선택한 상권 구역을 찾지 못했습니다.' });
		}

		const values = {
			type: 'facility',
			name: parsed.value.name,
			categoryId: category.id,
			zoneId: parsed.value.zoneId,
			scope: parsed.value.scope,
			latitude: parsed.value.latitude,
			longitude: parsed.value.longitude,
			locationGuide: parsed.value.locationGuide,
			description: parsed.value.description,
			operatingHours: parsed.value.operatingHours,
			phone: parsed.value.phone,
			displayPriority: parsed.value.displayPriority,
			isVisible: parsed.value.isVisible,
			updatedAt: new Date()
		};

		if (parsed.value.id) {
			const updated = await db
				.update(places)
				.set(values)
				.where(and(eq(places.id, parsed.value.id), eq(places.type, 'facility')))
				.returning({ id: places.id });
			if (!updated[0]) return fail(404, { saveError: '수정할 시설 핀을 찾지 못했습니다.' });
			throw redirect(303, `/admin/pin-editor?saved=1&pin=${updated[0].id}`);
		}

		const inserted = await db.insert(places).values(values).returning({ id: places.id });
		throw redirect(303, `/admin/pin-editor?saved=1&pin=${inserted[0].id}`);
	},
	deletePin: async ({ request, locals }) => {
		requireAdmin(locals.user);
		const id = (await request.formData()).get('id')?.toString() ?? '';
		if (!id) return fail(400, { deleteError: '삭제할 시설 핀을 선택해 주세요.' });
		const db = createDb(env.DATABASE_URL);
		const deleted = await db
			.delete(places)
			.where(and(eq(places.id, id), eq(places.type, 'facility')))
			.returning({ id: places.id });
		if (!deleted[0]) return fail(404, { deleteError: '삭제할 시설 핀을 찾지 못했습니다.' });
		throw redirect(303, '/admin/pin-editor');
	}
};
