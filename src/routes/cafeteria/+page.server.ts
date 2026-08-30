import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';

import {
	canEditCafeteriaOperatingHours,
	validateOperatingHoursInput,
	type CafeteriaOperatingHoursInput
} from '$lib/domain/cafeteria-operating-hours';
import { buildCafeteriaPanelItems } from '$lib/domain/cafeteria-panel';
import { getTodayMenuWithRefresh } from '$lib/server/cafeteria-cache';
import { replaceCafeteriaOperatingHours } from '$lib/server/cafeteria-operating-hours';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, locals, url }) => {
	const weeklyMenu = await getTodayMenuWithRefresh(platform);

	return {
		cafeterias: buildCafeteriaPanelItems(weeklyMenu),
		initialCafeteriaId: url.searchParams.get('cafeteria'),
		canEditOperatingHours: canEditCafeteriaOperatingHours(locals.user),
		user: locals.user
			? {
					nickname: locals.user.nickname,
					role: locals.user.role
				}
			: null
	};
};

export const actions: Actions = {
	saveOperatingHours: async ({ request, locals }) => {
		if (!canEditCafeteriaOperatingHours(locals.user)) {
			return fail(403, { operatingHoursError: '운영시간을 수정할 권한이 없습니다.' });
		}
		if (!env.DATABASE_URL) {
			return fail(500, { operatingHoursError: '데이터베이스 연결 정보가 없습니다.' });
		}

		const payload = parseOperatingHoursPayload(await request.formData());
		if (!payload) {
			return fail(400, { operatingHoursError: '운영시간 입력 형식이 올바르지 않습니다.' });
		}

		const validation = validateOperatingHoursInput(payload);
		if (!validation.ok) {
			return fail(400, { operatingHoursError: validation.message });
		}

		try {
			await replaceCafeteriaOperatingHours(
				env.DATABASE_URL,
				validation.value.cafeteriaCode,
				validation.value.rows
			);
		} catch (error) {
			console.error('학식 운영시간 저장 실패:', error);
			return fail(500, { operatingHoursError: '운영시간을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' });
		}

		throw redirect(303, '/cafeteria');
	}
};

function parseOperatingHoursPayload(formData: FormData): CafeteriaOperatingHoursInput | null {
	const raw = formData.get('operatingHours');
	if (typeof raw !== 'string') return null;

	try {
		const value: unknown = JSON.parse(raw);
		if (!value || typeof value !== 'object') return null;
		const payload = value as Record<string, unknown>;
		if (typeof payload.cafeteriaCode !== 'string' || !Array.isArray(payload.rows)) return null;
		if (
			payload.rows.some(
				(row) =>
					!row ||
					typeof row !== 'object' ||
					typeof (row as Record<string, unknown>).label !== 'string' ||
					!Array.isArray((row as Record<string, unknown>).daysOfWeek) ||
					typeof (row as Record<string, unknown>).opensAt !== 'string' ||
					typeof (row as Record<string, unknown>).closesAt !== 'string'
			)
		) {
			return null;
		}

		return payload as CafeteriaOperatingHoursInput;
	} catch {
		return null;
	}
}
