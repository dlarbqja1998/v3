CREATE TABLE "cafeteria_operating_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cafeteria_code" varchar(40) NOT NULL,
	"label" varchar(40) NOT NULL,
	"days_of_week" jsonb NOT NULL,
	"opens_at" time NOT NULL,
	"closes_at" time NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "cafeteria_operating_hours" ("cafeteria_code", "label", "days_of_week", "opens_at", "closes_at", "display_order") VALUES
	('jinri', '조식', '[1, 2, 3, 4, 5]'::jsonb, '07:30', '09:30', 1),
	('jinri', '중식', '[1, 2, 3, 4, 5]'::jsonb, '11:30', '13:30', 2),
	('jinri', '석식', '[1, 2, 3, 4, 5]'::jsonb, '17:00', '18:30', 3),
	('faculty', '중식', '[1, 2, 3, 4, 5]'::jsonb, '11:30', '14:00', 1);
