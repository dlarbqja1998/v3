import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import { and, eq, ne } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { validateNickname, validateOnboardingInput } from '$lib/domain/onboarding';
import { createDb } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { normalizeInternalRedirect } from '$lib/server/security';

function getOnboardingValues(data: FormData) {
	return {
		nickname: data.get('nickname')?.toString() ?? '',
		college: data.get('college')?.toString() ?? '',
		department: data.get('department')?.toString() ?? '',
		studentYear: data.get('studentYear')?.toString() ?? '',
		gender: data.get('gender')?.toString() ?? ''
	};
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const next = normalizeInternalRedirect(url.searchParams.get('next'));
	if (!locals.user) {
		throw redirect(303, `/login?next=${encodeURIComponent(next)}`);
	}

	if (locals.user.isOnboarded) {
		throw redirect(303, next);
	}

	return {
		user: locals.user,
		next
	};
};

export const actions: Actions = {
	checkNickname: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(303, '/login');
		}

		const data = await request.formData();
		const values = getOnboardingValues(data);
		const next = normalizeInternalRedirect(data.get('next'));
		const nicknameError = validateNickname(values.nickname);

		if (nicknameError) {
			return fail(400, {
				nicknameCheck: { nickname: values.nickname, status: 'invalid' as const, message: nicknameError },
				values,
				next
			});
		}

		const databaseUrl = env.DATABASE_URL;
		if (!databaseUrl) {
			return fail(500, {
				nicknameCheck: {
					nickname: values.nickname,
					status: 'error' as const,
					message: '중복 확인에 실패했어요. 다시 시도해 주세요.'
				},
				values,
				next
			});
		}

		try {
			const db = createDb(databaseUrl);
			const duplicateNickname = await db.query.users.findFirst({
				where: and(eq(users.nickname, values.nickname), ne(users.id, locals.user.id))
			});

			return {
				nicknameCheck: duplicateNickname
					? {
							nickname: values.nickname,
							status: 'duplicate' as const,
							message: '이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해 주세요.'
						}
					: { nickname: values.nickname, status: 'available' as const, message: '사용 가능한 닉네임입니다.' },
				values,
				next
			};
		} catch {
			return fail(500, {
				nicknameCheck: {
					nickname: values.nickname,
					status: 'error' as const,
					message: '중복 확인에 실패했어요. 다시 시도해 주세요.'
				},
				values,
				next
			});
		}
	},
	complete: async ({ request, locals, url, platform }) => {
		void platform;
		if (!locals.user) {
			throw redirect(303, '/login');
		}

		const databaseUrl = env.DATABASE_URL;
		if (!databaseUrl) {
			return fail(500, { message: '데이터베이스 연결 정보가 없습니다.' });
		}

		const data = await request.formData();
		const result = validateOnboardingInput(getOnboardingValues(data));

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

		throw redirect(303, normalizeInternalRedirect(data.get('next') ?? url.searchParams.get('next')));
	}
};
