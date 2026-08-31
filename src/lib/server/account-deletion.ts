import { eq } from 'drizzle-orm';
import { createDb, type Db } from '$lib/server/db';
import { supportInquiries, users } from '$lib/server/db/schema';

type AccountDeletionDb = Pick<Db, 'delete' | 'batch'>;

export async function deleteUserAccount(databaseUrl: string, userId: number, providedDb?: AccountDeletionDb) {
	const db = providedDb ?? createDb(databaseUrl);
	const inquiriesDelete = db.delete(supportInquiries).where(eq(supportInquiries.userId, userId));
	const userDelete = db.delete(users).where(eq(users.id, userId));
	await db.batch([inquiriesDelete, userDelete]);
}
