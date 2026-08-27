import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import { DELETE_ACCOUNT_CONFIRMATION } from '$lib/domain/account-deletion';
import { deleteUserAccount } from '$lib/server/account-deletion';
import { hashVoterId } from '$lib/server/cafeteria-feedback';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => { if (!locals.user) throw redirect(303, '/login?next=/my/withdraw'); return {}; };
export const actions: Actions = {
	withdraw: async ({ locals, request, cookies }) => {
		if (!locals.user) throw redirect(303, '/login?next=/my/withdraw');
		const form = await request.formData();
		if (String(form.get('confirmation') ?? '').trim() !== DELETE_ACCOUNT_CONFIRMATION) return fail(400, { message: `“${DELETE_ACCOUNT_CONFIRMATION}”를 정확히 입력해 주세요.` });
		const voterId = cookies.get('cafeteria_voter');
		const voterHash = voterId ? await hashVoterId(voterId) : undefined;
		await deleteUserAccount(env.DATABASE_URL, locals.user.id, voterHash);
		cookies.delete('session_id', { path: '/' });
		cookies.delete('cafeteria_voter', { path: '/' });
		throw redirect(303, '/');
	}
};
