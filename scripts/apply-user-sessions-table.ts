import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { createDb } from '../src/lib/server/db';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required.');

const db = createDb(databaseUrl);

await db.execute(sql.raw(`
	CREATE TABLE IF NOT EXISTS "user_sessions" (
		"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
		"token_hash" varchar(64) NOT NULL,
		"user_id" integer NOT NULL,
		"expires_at" timestamp with time zone NOT NULL,
		"created_at" timestamp with time zone DEFAULT now() NOT NULL,
		CONSTRAINT "user_sessions_user_id_users_id_fk"
			FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
			ON DELETE cascade ON UPDATE no action
	);
`));

await db.execute(sql.raw(`
	CREATE UNIQUE INDEX IF NOT EXISTS "user_sessions_token_hash_unique"
		ON "user_sessions" USING btree ("token_hash");
`));

await db.execute(sql.raw(`
	CREATE INDEX IF NOT EXISTS "user_sessions_user_idx"
		ON "user_sessions" USING btree ("user_id");
`));

await db.execute(sql.raw(`
	CREATE INDEX IF NOT EXISTS "user_sessions_expires_idx"
		ON "user_sessions" USING btree ("expires_at");
`));

console.log('user_sessions table is ready.');
