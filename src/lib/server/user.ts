import { and, eq, gt } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { createDb } from '$lib/server/db';
import { userSessions, users } from '$lib/server/db/schema';

export type User = typeof users.$inferSelect;
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type SessionRecord = {
	tokenHash: string;
	userId: number;
	expiresAt: Date;
	createdAt: Date;
};

export interface UserSessionStore {
	create(record: SessionRecord): Promise<void>;
	findActiveUser(tokenHash: string, now: Date): Promise<User | null>;
	delete(tokenHash: string): Promise<void>;
}

function bytesToHex(bytes: ArrayBuffer | Uint8Array) {
	const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
	return [...view].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashSessionToken(token: string) {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
	return bytesToHex(digest);
}

function createDbSessionStore(databaseUrl: string): UserSessionStore {
	const db = createDb(databaseUrl);
	return {
		async create(record) {
			await db.insert(userSessions).values(record);
		},
		async findActiveUser(tokenHash, now) {
			const [row] = await db
				.select({ user: users })
				.from(userSessions)
				.innerJoin(users, eq(userSessions.userId, users.id))
				.where(and(eq(userSessions.tokenHash, tokenHash), gt(userSessions.expiresAt, now)))
				.limit(1);
			return row?.user ?? null;
		},
		async delete(tokenHash) {
			await db.delete(userSessions).where(eq(userSessions.tokenHash, tokenHash));
		}
	};
}

export async function createUserSessionToken(
	userId: number,
	databaseUrl = env.DATABASE_URL,
	providedStore?: UserSessionStore,
	now = new Date()
) {
	if (!databaseUrl) throw new Error('DATABASE_URL이 필요합니다.');
	const token = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
	const tokenHash = await hashSessionToken(token);
	const store = providedStore ?? createDbSessionStore(databaseUrl);
	await store.create({
		tokenHash,
		userId,
		createdAt: now,
		expiresAt: new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000)
	});
	return token;
}

export async function getUserBySessionToken(
	sessionToken: string,
	databaseUrl = env.DATABASE_URL,
	providedStore?: UserSessionStore,
	now = new Date()
) {
	if (!databaseUrl) return null;
	if (!/^[0-9a-f]{64}$/i.test(sessionToken)) return null;
	const tokenHash = await hashSessionToken(sessionToken);
	const user = await (providedStore ?? createDbSessionStore(databaseUrl)).findActiveUser(tokenHash, now);
	if (!user || user.status !== 'ACTIVE' || user.isBanned) return null;
	return user;
}

export async function revokeUserSessionToken(
	sessionToken: string,
	databaseUrl = env.DATABASE_URL,
	providedStore?: UserSessionStore
) {
	if (!databaseUrl || !/^[0-9a-f]{64}$/i.test(sessionToken)) return;
	const tokenHash = await hashSessionToken(sessionToken);
	await (providedStore ?? createDbSessionStore(databaseUrl)).delete(tokenHash);
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
