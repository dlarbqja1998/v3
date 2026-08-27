import { eq } from 'drizzle-orm';
import { createDb, type Db } from '$lib/server/db';
import { cafeteriaMenuVotes, supportInquiries, users } from '$lib/server/db/schema';

type AccountDeletionDb = Pick<Db, 'delete' | 'batch'>;

export async function deleteUserAccount(databaseUrl: string, userId: number, voterHash?: string, providedDb?: AccountDeletionDb) {
	const db = providedDb ?? createDb(databaseUrl);
	const inquiriesDelete = db.delete(supportInquiries).where(eq(supportInquiries.userId, userId));
	const votesDelete = db.delete(cafeteriaMenuVotes).where(eq(cafeteriaMenuVotes.voterHash, voterHash || '__none__'));
	const userDelete = db.delete(users).where(eq(users.id, userId));
	await db.batch([inquiriesDelete, votesDelete, userDelete]);
}
