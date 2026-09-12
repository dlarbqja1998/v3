import { env } from '$env/dynamic/private';
import { error, fail, redirect } from '@sveltejs/kit';
import { parseFestivalArea, readFestivalDraft, saveFestivalArea } from '$lib/server/festival-editor';
import type { Actions, PageServerLoad } from './$types';

function requireAdmin(user: App.Locals['user']) {
	if (!user) redirect(303, '/login?next=/admin/festival');
	if (user.role !== 'admin') error(403, '관리자만 축제를 편집할 수 있습니다.');
	return user;
}

export const load: PageServerLoad = async ({ locals, platform }) => {
	requireAdmin(locals.user);
	return { draft: await readFestivalDraft(platform?.env?.GOLABAU_CACHE), naverMapClientId: env.NAVER_MAP_CLIENT_ID ?? '' };
};

export const actions: Actions = {
	default: async ({ request, locals, platform }) => {
		const user = requireAdmin(locals.user);
		const input = parseFestivalArea(await request.formData());
		if (!input.ok) return fail(400, { message: input.message });
		const store = platform?.env?.GOLABAU_CACHE;
		if (!store) return fail(503, { message: '축제 저장소를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.' });
		try {
			const result = await saveFestivalArea(store, input.value, user.id);
			if (!result.ok) return fail(409, { message: result.message });
			return { saved: true, revision: result.draft.revision, message: '축제 설정을 저장했어요.' };
		} catch { return fail(500, { message: '저장하지 못했습니다. 편집 내용은 유지되니 다시 시도해 주세요.' }); }
	}
};
