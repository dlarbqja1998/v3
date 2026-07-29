import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { createDb } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { createSessionToken, getUserIdFromSessionToken } from '$lib/server/auth';

export type User = typeof users.$inferSelect;

export function getSessionSecret() {
	const secret = env.SESSION_SECRET || env.AUTH_SECRET || env.AUTH_KAKAO_SECRET;
	if (!secret) {
		throw new Error('SESSION_SECRET, AUTH_SECRET 또는 AUTH_KAKAO_SECRET이 필요합니다.');
	}
	return secret;
}

export async function createUserSessionToken(userId: number) {
	return createSessionToken(getSessionSecret(), userId);
}

export async function getUserBySessionToken(sessionToken: string, databaseUrl = env.DATABASE_URL) {
	if (!databaseUrl) return null;

	const userId = await getUserIdFromSessionToken(getSessionSecret(), sessionToken);
	if (!userId) return null;

	const numericUserId = Number.parseInt(userId, 10);
	if (Number.isNaN(numericUserId)) return null;

	const db = createDb(databaseUrl);
	const user = await db.query.users.findFirst({
		where: eq(users.id, numericUserId)
	});

	if (!user || user.status !== 'ACTIVE' || user.isBanned) return null;
	return user;
}

export function toSafeUser(user: User) {
	return {
		id: user.id,
		email: user.email,
		nickname: user.nickname,
		profileImg: user.profileImg,
		isOnboarded: user.isOnboarded,
		role: user.role,
		college: user.college,
		department: user.department,
		grade: user.grade,
		gender: user.gender
	};
}
