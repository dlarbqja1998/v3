import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import { and, eq, ne } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { validateOnboardingInput } from '$lib/domain/onboarding';
import { createDb } from '$lib/server/db';
import { users } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(303, `/login?next=${encodeURIComponent(url.searchParams.get('next') || '/')}`);
	}

	if (locals.user.isOnboarded) {
		throw redirect(303, url.searchParams.get('next') || '/');
	}

	return {
		user: locals.user,
		next: url.searchParams.get('next') || '/'
	};
};

export const actions: Actions = {
	default: async ({ request, locals, url, platform }) => {
		void platform;
		if (!locals.user) {
			throw redirect(303, '/login');
		}

		const databaseUrl = env.DATABASE_URL;
		if (!databaseUrl) {
			return fail(500, { message: '데이터베이스 연결 정보가 없습니다.' });
		}

		const data = await request.formData();
		const result = validateOnboardingInput({
			nickname: data.get('nickname')?.toString() ?? '',
			college: data.get('college')?.toString() ?? '',
			department: data.get('department')?.toString() ?? '',
			studentYear: data.get('studentYear')?.toString() ?? '',
			gender: data.get('gender')?.toString() ?? ''
		});

		if (!result.ok) {
			return fail(400, { message: result.message, values: result.value });
		}

		const db = createDb(databaseUrl);
		const duplicateNickname = await db.query.users.findFirst({
			where: and(eq(users.nickname, result.value.nickname), ne(users.id, locals.user.id))
		});

		if (duplicateNickname) {
			return fail(400, {
				message: '이미 사용 중인 닉네임입니다.',
				values: result.value
			});
		}

		await db
			.update(users)
			.set({
				nickname: result.value.nickname,
				college: result.value.college,
				department: result.value.department,
				grade: result.value.studentYear,
				gender: result.value.gender,
				isOnboarded: true
			})
			.where(eq(users.id, locals.user.id));

		throw redirect(303, url.searchParams.get('next') || '/');
	}
};
