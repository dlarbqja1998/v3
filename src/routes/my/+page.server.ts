import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { buildMyPageRows } from '$lib/domain/my-page';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login?next=/my');
	}

	return {
		user: locals.user,
		rows: buildMyPageRows(locals.user)
	};
};

export const actions: Actions = {
	logout: async ({ cookies }) => {
		cookies.delete('session_id', { path: '/' });
		throw redirect(303, '/');
	}
};
