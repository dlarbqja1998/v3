import { env } from '$env/dynamic/private';
import { error, fail, redirect } from '@sveltejs/kit';
import { normalizeInquiryAnswer } from '$lib/domain/support-inquiries';
import { answerInquiry, getAdminInquiry } from '$lib/server/support-inquiries';
import type { Actions, PageServerLoad } from './$types';
function requireAdmin(user: App.Locals['user']) { if (!user || user.role !== 'admin') throw redirect(303, '/my'); return user; }
export const load: PageServerLoad = async ({ locals, params }) => { requireAdmin(locals.user); const inquiry = await getAdminInquiry(env.DATABASE_URL, params.id); if (!inquiry) throw error(404, '문의를 찾을 수 없습니다.'); return { inquiry }; };
export const actions: Actions = { answer: async ({ locals, params, request }) => { const admin = requireAdmin(locals.user); const parsed = normalizeInquiryAnswer(await request.formData()); if (!parsed.ok) return fail(400, { message: parsed.message }); const updated = await answerInquiry(env.DATABASE_URL, params.id, admin.id, parsed.value.answer); if (!updated) throw error(404, '문의를 찾을 수 없습니다.'); return { success: true, message: '답변을 저장했습니다.' }; } };
