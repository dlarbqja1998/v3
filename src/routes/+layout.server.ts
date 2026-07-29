import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user
			? {
					id: locals.user.id,
					nickname: locals.user.nickname,
					profileImg: locals.user.profileImg,
					isOnboarded: locals.user.isOnboarded,
					role: locals.user.role
				}
			: null
	};
};
