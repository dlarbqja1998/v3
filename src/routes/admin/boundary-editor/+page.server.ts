import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { createDb } from '$lib/server/db';
import { campusSpots, zones } from '$lib/server/db/schema';
import { CAMPUS_AREA_NAME } from '$lib/domain/commercial-zones';
import { getCampusAreaBoundary } from '$lib/map/campus-area-boundary';
import { isCampusAreaZone, saveCampusAreaBoundary } from '$lib/server/campus-area-boundary';
import {
	getCampusSpotCenter,
	normalizeCampusBoundary,
	toCampusSpot,
	writeCachedCampusSpots
} from '$lib/server/campus-spots';
import {
	createZoneSlug,
	isZoneNameTaken,
	normalizeZoneBoundary,
	parseZoneEditorInput,
	toEditableZone
} from '$lib/server/zone-editor';
import type { Actions, PageServerLoad } from './$types';

function requireAdmin(user: App.Locals['user']) {
	if (!user) throw redirect(303, '/login?next=/admin/boundary-editor');
	if (user.role !== 'admin') throw redirect(303, '/');
}

export const load: PageServerLoad = async ({ locals, url }) => {
	requireAdmin(locals.user);
	const db = createDb(env.DATABASE_URL);
	const [spotRows, zoneRows] = await Promise.all([
		db.select().from(campusSpots),
		db.select().from(zones).orderBy(asc(zones.displayOrder), asc(zones.name))
	]);
	const spots = spotRows.map(toCampusSpot);
	const savedCampusBoundary = normalizeZoneBoundary(zoneRows.find(isCampusAreaZone)?.polygon);
	const editableZones = zoneRows.filter(zone => !isCampusAreaZone(zone)).map(toEditableZone);
	const requestedZoneId = url.searchParams.get('zone') ?? '';
	const requestedMode = url.searchParams.get('mode');

	return {
		spots,
		campusAreaBoundary: savedCampusBoundary.length >= 3 ? savedCampusBoundary : getCampusAreaBoundary(spots),
		campusAreaIsDraft: savedCampusBoundary.length < 3,
		campusAreaSaved: url.searchParams.get('saved') === 'campus-area',
		zones: editableZones,
		naverMapClientId: env.NAVER_MAP_CLIENT_ID ?? '',
		initialEditorMode: requestedMode === 'campus-area' ? ('campus-area' as const)
			: requestedMode === 'zone' ? ('zone' as const) : ('campus' as const),
		initialZoneId: editableZones.some((zone) => zone.id === requestedZoneId)
			? requestedZoneId
			: (editableZones[0]?.id ?? ''),
		zoneSaved: url.searchParams.get('saved') === 'zone'
	};
};

export const actions: Actions = {
	saveCampusArea: async ({ request, locals }) => {
		requireAdmin(locals.user);
		const formData = await request.formData();
		const rawBoundary = formData.get('boundary');
		const draft = {
			editorMode: 'campus-area' as const,
			campusAreaBoundary: typeof rawBoundary === 'string' ? rawBoundary : '[]'
		};
		const input = parseZoneEditorInput(CAMPUS_AREA_NAME, rawBoundary);
		if (!input.ok) return fail(400, { ...draft, campusAreaError: input.message });
		if (getCampusAreaBoundary([{ boundary: input.boundary }]).length < 3) {
			return fail(400, { ...draft, campusAreaError: '겹치거나 일직선인 점만으로는 경계를 만들 수 없습니다.' });
		}
		try {
			await saveCampusAreaBoundary(env.DATABASE_URL, input.boundary);
		} catch (error) {
			console.error('캠퍼스 전체 경계 저장 실패:', error);
			return fail(500, { ...draft, campusAreaError: '경계를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' });
		}
		throw redirect(303, '/admin/boundary-editor?mode=campus-area&saved=campus-area');
	},
	saveCampusSpot: async ({ request, locals, platform }) => {
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
	},
	createZone: async ({ request, locals }) => {
		requireAdmin(locals.user);
		const formData = await request.formData();
		const rawName = formData.get('name');
		const rawBoundary = formData.get('boundary');
		const input = parseZoneEditorInput(rawName, rawBoundary);
		const draft = {
			editorMode: 'zone' as const,
			zoneOperation: 'create' as const,
			zoneName: typeof rawName === 'string' ? rawName : '',
			zoneBoundary: typeof rawBoundary === 'string' ? rawBoundary : '[]'
		};
		if (!input.ok) return fail(400, { ...draft, zoneError: input.message });

		const db = createDb(env.DATABASE_URL);
		const existingZones = await db
			.select({ id: zones.id, name: zones.name, displayOrder: zones.displayOrder })
			.from(zones);
		if (isZoneNameTaken(existingZones, input.name)) {
			return fail(409, {
				...draft,
				zoneError: '같은 이름의 구역이 이미 있습니다. 기존 구역을 선택해 수정해 주세요.'
			});
		}

		const id = crypto.randomUUID();
		const center = getCampusSpotCenter(input.boundary);
		const displayOrder = Math.max(0, ...existingZones.map((zone) => zone.displayOrder)) + 1;
		try {
			await db.insert(zones).values({
				id,
				name: input.name,
				slug: createZoneSlug(id),
				centerLatitude: center.latitude,
				centerLongitude: center.longitude,
				polygon: input.boundary,
				displayOrder,
				isVisible: true
			});
		} catch (error) {
			console.error('zone create failed:', error);
			return fail(500, { ...draft, zoneError: '구역을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' });
		}

		throw redirect(303, `/admin/boundary-editor?mode=zone&zone=${encodeURIComponent(id)}&saved=zone`);
	},
	updateZone: async ({ request, locals }) => {
		requireAdmin(locals.user);
		const formData = await request.formData();
		const id = formData.get('id')?.toString() ?? '';
		const rawName = formData.get('name');
		const rawBoundary = formData.get('boundary');
		const input = parseZoneEditorInput(rawName, rawBoundary);
		const draft = {
			editorMode: 'zone' as const,
			zoneOperation: 'update' as const,
			zoneId: id,
			zoneName: typeof rawName === 'string' ? rawName : '',
			zoneBoundary: typeof rawBoundary === 'string' ? rawBoundary : '[]'
		};
		if (!id) return fail(400, { ...draft, zoneError: '수정할 구역을 선택해 주세요.' });
		if (!input.ok) return fail(400, { ...draft, zoneError: input.message });

		const db = createDb(env.DATABASE_URL);
		const existingZones = await db.select({ id: zones.id, name: zones.name, slug: zones.slug }).from(zones);
		if (!existingZones.some((zone) => zone.id === id && !isCampusAreaZone(zone))) {
			return fail(404, { ...draft, zoneError: '수정할 구역을 찾지 못했습니다.' });
		}
		if (isZoneNameTaken(existingZones, input.name, id)) {
			return fail(409, {
				...draft,
				zoneError: '같은 이름의 다른 구역이 이미 있습니다.'
			});
		}

		const center = getCampusSpotCenter(input.boundary);
		try {
			await db
				.update(zones)
				.set({
					name: input.name,
					centerLatitude: center.latitude,
					centerLongitude: center.longitude,
					polygon: input.boundary,
					updatedAt: new Date()
				})
				.where(eq(zones.id, id));
		} catch (error) {
			console.error('zone update failed:', error);
			return fail(500, { ...draft, zoneError: '구역을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' });
		}

		throw redirect(303, `/admin/boundary-editor?mode=zone&zone=${encodeURIComponent(id)}&saved=zone`);
	}
};
