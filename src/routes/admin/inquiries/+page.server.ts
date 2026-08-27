import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';
import { listAdminInquiries } from '$lib/server/support-inquiries';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'admin') throw redirect(303, '/my');
	return { inquiries: await listAdminInquiries(env.DATABASE_URL) };
};
