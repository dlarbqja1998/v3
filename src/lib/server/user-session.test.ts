import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'postgresql://test' } }));

import {
	SESSION_MAX_AGE_SECONDS,
	createUserSessionToken,
	getUserBySessionToken,
	revokeUserSessionToken,
	type UserSessionStore
} from './user';

const activeUser = {
	id: 7,
	email: 'user@example.com',
	password: null,
	nickname: '학생',
	profileImg: null,
	provider: 'kakao',
	providerId: '123',
	college: null,
	department: null,
	grade: null,
	gender: null,
	isOnboarded: true,
	role: 'user',
	isBanned: false,
	status: 'ACTIVE',
	createdAt: new Date('2026-01-01T00:00:00Z'),
	updatedAt: new Date('2026-01-01T00:00:00Z')
};

describe('서버 저장형 사용자 세션', () => {
	let records: Array<{ tokenHash: string; userId: number; expiresAt: Date; createdAt: Date }>;
	let store: UserSessionStore;

	beforeEach(() => {
		records = [];
		store = {
			create: vi.fn(async (record) => {
				records.push(record);
			}),
			findActiveUser: vi.fn(async (tokenHash, now) => {
				const record = records.find((item) => item.tokenHash === tokenHash && item.expiresAt > now);
				return record ? activeUser : null;
			}),
			delete: vi.fn(async (tokenHash) => {
				records = records.filter((item) => item.tokenHash !== tokenHash);
			})
		};
	});

	it('매 로그인마다 새 난수 토큰을 만들고 DB에는 해시만 저장한다', async () => {
		const now = new Date('2026-08-31T00:00:00Z');
		const first = await createUserSessionToken(7, 'postgresql://test', store, now);
		const second = await createUserSessionToken(7, 'postgresql://test', store, now);

		expect(first).not.toBe(second);
		expect(first.length).toBeGreaterThanOrEqual(43);
		expect(records[0].tokenHash).not.toBe(first);
		expect(records[0].tokenHash).toMatch(/^[0-9a-f]{64}$/);
		expect(records[0].expiresAt.getTime() - now.getTime()).toBe(SESSION_MAX_AGE_SECONDS * 1000);
	});

	it('DB에 남아 있고 만료되지 않은 세션만 사용자로 복원한다', async () => {
		const now = new Date('2026-08-31T00:00:00Z');
		const token = await createUserSessionToken(7, 'postgresql://test', store, now);

		await expect(getUserBySessionToken(token, 'postgresql://test', store, now)).resolves.toEqual(activeUser);
		await expect(getUserBySessionToken('unknown', 'postgresql://test', store, now)).resolves.toBeNull();
		await expect(
			getUserBySessionToken(token, 'postgresql://test', store, new Date('2026-09-08T00:00:01Z'))
		).resolves.toBeNull();
	});

	it('로그아웃하면 서버 세션을 폐기해 복사된 토큰도 거부한다', async () => {
		const now = new Date('2026-08-31T00:00:00Z');
		const token = await createUserSessionToken(7, 'postgresql://test', store, now);

		await revokeUserSessionToken(token, 'postgresql://test', store);

		await expect(getUserBySessionToken(token, 'postgresql://test', store, now)).resolves.toBeNull();
	});
});
