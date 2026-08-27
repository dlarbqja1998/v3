import { env } from '$env/dynamic/private';
import { error, redirect } from '@sveltejs/kit';
import { getUserInquiry, markInquiryAnswerRead } from '$lib/server/support-inquiries';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(303, `/login?next=/my/inquiries/${params.id}`);
	const inquiry = await getUserInquiry(env.DATABASE_URL, locals.user.id, params.id);
	if (!inquiry) throw error(404, '문의를 찾을 수 없습니다.');
	if (inquiry.answer && !inquiry.answerReadAt) await markInquiryAnswerRead(env.DATABASE_URL, locals.user.id, params.id);
	return { inquiry };
};
