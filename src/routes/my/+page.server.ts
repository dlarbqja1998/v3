import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import { APP_VERSION } from '$lib/config/app-version';
import { buildMyPageRows } from '$lib/domain/my-page';
import { countUnreadInquiryAnswers } from '$lib/server/support-inquiries';
import { revokeUserSessionToken } from '$lib/server/user';
import { countPendingEventCandidates } from '$lib/server/event-candidates';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login?next=/my');
	}

	let unreadInquiryCount = 0;
	if (env.DATABASE_URL) {
		try {
			unreadInquiryCount = await countUnreadInquiryAnswers(env.DATABASE_URL, locals.user.id);
		} catch (error) {
			console.error('읽지 않은 문의 답변 수 조회 실패:', error);
		}
	}

	const pendingEventCount = locals.user.role === 'admin' ? await countPendingEventCandidates(env.DATABASE_URL).catch(() => 0) : 0;
	return {
		user: locals.user,
		rows: buildMyPageRows(locals.user),
		appVersion: APP_VERSION,
		unreadInquiryCount,
		pendingEventCount
	};
};

export const actions: Actions = {
	logout: async ({ cookies }) => {
		const sessionToken = cookies.get('session_id');
		if (sessionToken) await revokeUserSessionToken(sessionToken, env.DATABASE_URL);
		cookies.delete('session_id', { path: '/' });
		throw redirect(303, '/');
	}
};
