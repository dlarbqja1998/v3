DELETE FROM "cafeteria_operating_hours"
WHERE "cafeteria_code" IN ('jinri', 'faculty');
--> statement-breakpoint
INSERT INTO "cafeteria_operating_hours" (
	"cafeteria_code",
	"label",
	"days_of_week",
	"opens_at",
	"closes_at",
	"display_order"
) VALUES
	('jinri', '조식', '[1, 2, 3, 4, 5]'::jsonb, '07:30', '09:00', 1),
	('jinri', '중식', '[1, 2, 3, 4, 5]'::jsonb, '11:30', '13:30', 2),
	('jinri', '석식', '[1, 2, 3, 4, 5]'::jsonb, '17:00', '18:30', 3);
--> statement-breakpoint
CREATE UNIQUE INDEX "cafeteria_operating_hours_code_order_unique" ON "cafeteria_operating_hours" USING btree ("cafeteria_code","display_order");
