ALTER TABLE "campus_events" ADD COLUMN "external_url" text;--> statement-breakpoint
UPDATE "campus_events"
SET
	"category" = '박람회',
	"external_url" = 'https://kusejong-jobfair.com/',
	"is_visible" = true,
	"updated_at" = now()
WHERE "title" = '2026 고려대학교 세종캠퍼스 채용박람회';
