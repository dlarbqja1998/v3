import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import { getInquiryCategoryLabel, normalizeInquiryInput } from '$lib/domain/support-inquiries';
import { notifyDiscordOfInquiry } from '$lib/server/discord-inquiry';
import { createInquiry, listUserInquiries } from '$lib/server/support-inquiries';
import type { Actions, PageServerLoad } from './$types';

function requireUser(user: App.Locals['user']) {
	if (!user) throw redirect(303, '/login?next=/my/inquiries');
	return user;
}

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals.user);
	return { inquiries: await listUserInquiries(env.DATABASE_URL, user.id) };
};

export const actions: Actions = {
	create: async ({ locals, request, platform }) => {
		const user = requireUser(locals.user);
		const parsed = normalizeInquiryInput(await request.formData());
		if (!parsed.ok) return fail(400, { message: parsed.message });
		const created = await createInquiry(env.DATABASE_URL, user.id, parsed.value);
		if (!created.ok) return fail(429, { message: '문의는 한 시간에 3건까지 작성할 수 있습니다.' });

		const notification = notifyDiscordOfInquiry(env.DISCORD_WEBHOOK_URL, {
			id: created.inquiry.id,
			categoryLabel: getInquiryCategoryLabel(created.inquiry.category),
			title: created.inquiry.title,
			content: created.inquiry.content
		});
		if (platform?.context?.waitUntil) platform.context.waitUntil(notification);
		else void notification;
		return { success: true, message: '문의를 등록했습니다.' };
	}
};
