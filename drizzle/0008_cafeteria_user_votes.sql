DELETE FROM "cafeteria_menu_votes";--> statement-breakpoint
DROP INDEX "cafeteria_menu_votes_offering_voter_unique";--> statement-breakpoint
ALTER TABLE "cafeteria_menu_votes" ADD COLUMN "user_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "cafeteria_menu_votes" ADD CONSTRAINT "cafeteria_menu_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cafeteria_menu_votes_offering_user_unique" ON "cafeteria_menu_votes" USING btree ("offering_id","user_id");--> statement-breakpoint
ALTER TABLE "cafeteria_menu_votes" DROP COLUMN "voter_hash";--> statement-breakpoint
UPDATE "cafeteria_menu_offerings"
SET "is_votable" = true, "updated_at" = now()
WHERE "cafeteria_code" IN ('jinri', 'faculty');
