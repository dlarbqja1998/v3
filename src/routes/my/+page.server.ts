import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import { APP_VERSION } from '$lib/config/app-version';
import { buildMyPageRows } from '$lib/domain/my-page';
import { countUnreadInquiryAnswers } from '$lib/server/support-inquiries';

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

	return {
		user: locals.user,
		rows: buildMyPageRows(locals.user),
		appVersion: APP_VERSION,
		unreadInquiryCount
	};
};

export const actions: Actions = {
	logout: async ({ cookies }) => {
		cookies.delete('session_id', { path: '/' });
		throw redirect(303, '/');
	}
};
