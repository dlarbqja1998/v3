import 'dotenv/config';
import { and, eq, or } from 'drizzle-orm';
import { hashAdminPassword } from '../src/lib/server/auth';
import { parseAdminProvisioningInput } from '../src/lib/server/admin-login';
import { createDb } from '../src/lib/server/db';
import { users } from '../src/lib/server/db/schema';

const databaseUrl = process.env.DATABASE_URL ?? '';
if (!databaseUrl) throw new Error('DATABASE_URL 환경변수가 필요합니다.');

const parsed = parseAdminProvisioningInput(process.argv.slice(2), process.env.ADMIN_LOGIN_PASSWORD);
if (!parsed.ok) throw new Error(parsed.message);

const { loginId, email, nickname, password } = parsed.value;
const db = createDb(databaseUrl);
const passwordHash = await hashAdminPassword(password);
const existing = await db.query.users.findFirst({
	where: or(
		and(eq(users.provider, 'local'), eq(users.providerId, loginId)),
		eq(users.email, email)
	)
});

if (existing) {
	await db
		.update(users)
		.set({
			email,
			nickname,
			password: passwordHash,
			provider: 'local',
			providerId: loginId,
			role: 'admin',
			isOnboarded: true,
			isBanned: false,
			status: 'ACTIVE',
			updatedAt: new Date()
		})
		.where(eq(users.id, existing.id));
} else {
	await db.insert(users).values({
		email,
		nickname,
		password: passwordHash,
		provider: 'local',
		providerId: loginId,
		role: 'admin',
		isOnboarded: true,
		isBanned: false,
		status: 'ACTIVE'
	});
}

console.log(`관리자 계정 '${loginId}'을 DB에 등록했습니다.`);
