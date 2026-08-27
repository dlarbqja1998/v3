import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import { and, eq, ne } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { validateNickname } from '$lib/domain/onboarding';
import { createDb } from '$lib/server/db';
import { users } from '$lib/server/db/schema';

function getPreviewValues(data: FormData) {
	return {
		nickname: data.get('nickname')?.toString() ?? '',
		college: data.get('college')?.toString() ?? '',
		department: data.get('department')?.toString() ?? '',
		studentYear: data.get('studentYear')?.toString() ?? '',
		gender: data.get('gender')?.toString() ?? ''
	};
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login?next=/admin/onboarding-preview');
	if (locals.user.role !== 'admin') throw redirect(303, '/');

	return { preview: true };
};

export const actions: Actions = {
	checkNickname: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login?next=/admin/onboarding-preview');
		if (locals.user.role !== 'admin') throw redirect(303, '/');

		const data = await request.formData();
		const values = getPreviewValues(data);
		const nicknameError = validateNickname(values.nickname);

		if (nicknameError) {
			return fail(400, {
				nicknameCheck: { nickname: values.nickname, status: 'invalid' as const, message: nicknameError },
				values
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
				values
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
					: {
							nickname: values.nickname,
							status: 'available' as const,
							message: '사용 가능한 닉네임입니다.'
						},
				values
			};
		} catch {
			return fail(500, {
				nicknameCheck: {
					nickname: values.nickname,
					status: 'error' as const,
					message: '중복 확인에 실패했어요. 다시 시도해 주세요.'
				},
				values
			});
		}
	}
};
