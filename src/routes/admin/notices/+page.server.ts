import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import { normalizeNoticeInput } from '$lib/domain/notices';
import { createNotice, listAdminNotices, updateNotice } from '$lib/server/notices';
import type { Actions, PageServerLoad } from './$types';

function requireAdmin(user: App.Locals['user']) {
	if (!user || user.role !== 'admin') throw redirect(303, '/my');
	return user;
}

export const load: PageServerLoad = async ({ locals }) => {
	requireAdmin(locals.user);
	return { notices: await listAdminNotices(env.DATABASE_URL) };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const admin = requireAdmin(locals.user);
		const parsed = normalizeNoticeInput(await request.formData());
		if (!parsed.ok) return fail(400, { message: parsed.message });
		await createNotice(env.DATABASE_URL, admin.id, parsed.value);
		return { success: true, message: '공지를 저장했습니다.' };
	},
	update: async ({ request, locals }) => {
		requireAdmin(locals.user);
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		if (!id) return fail(400, { message: '수정할 공지를 선택해 주세요.' });
		const parsed = normalizeNoticeInput(formData);
		if (!parsed.ok) return fail(400, { message: parsed.message });
		const updated = await updateNotice(env.DATABASE_URL, id, parsed.value);
		if (!updated) return fail(404, { message: '수정할 공지를 찾지 못했습니다.' });
		return { success: true, message: '공지를 수정했습니다.' };
	}
};
