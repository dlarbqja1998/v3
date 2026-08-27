ALTER TABLE "places" ALTER COLUMN "zone_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "scope" varchar(20) DEFAULT 'outside' NOT NULL;--> statement-breakpoint
UPDATE "places" SET "scope" = 'campus', "zone_id" = NULL WHERE "type" = 'cafeteria';--> statement-breakpoint
UPDATE "places"
SET "scope" = 'campus', "zone_id" = NULL
WHERE "type" = 'shuttle_stop'
  AND "latitude" BETWEEN 36.605 AND 36.615
  AND "longitude" BETWEEN 127.28 AND 127.295;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "location_guide" varchar(160);--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "operating_hours" varchar(240);--> statement-breakpoint
INSERT INTO "place_categories" ("name", "slug", "icon", "color", "display_order", "is_visible") VALUES
  ('편의점', 'convenience-store', 'convenience_store_GS', '#a51c45', 10, true),
  ('카페', 'cafe', 'cafe', '#a51c45', 11, true),
  ('복사실', 'copy-room', 'print', '#a51c45', 12, true),
  ('크림슨스토어', 'crimson-store', 'crimson_store', '#a51c45', 13, true),
  ('헬스장', 'gym', 'gym', '#a51c45', 14, true),
  ('우체국', 'post-office', 'post_office', '#a51c45', 15, true)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "icon" = EXCLUDED."icon",
  "color" = EXCLUDED."color",
  "display_order" = EXCLUDED."display_order",
  "is_visible" = EXCLUDED."is_visible",
  "updated_at" = now();
