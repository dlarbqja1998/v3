CREATE TABLE "cafeteria_menu_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cafeteria_code" varchar(40) NOT NULL,
	"normalized_name" varchar(160) NOT NULL,
	"display_name" varchar(160) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cafeteria_menu_offerings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"cafeteria_code" varchar(40) NOT NULL,
	"menu_date" date NOT NULL,
	"meal_slot" varchar(20) NOT NULL,
	"menu_section" varchar(40) NOT NULL,
	"display_name" varchar(160) NOT NULL,
	"is_votable" boolean DEFAULT false NOT NULL,
	"source" varchar(20) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cafeteria_menu_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offering_id" uuid NOT NULL,
	"voter_hash" varchar(64) NOT NULL,
	"reaction" varchar(10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cafeteria_menu_offerings" ADD CONSTRAINT "cafeteria_menu_offerings_menu_item_id_cafeteria_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."cafeteria_menu_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cafeteria_menu_votes" ADD CONSTRAINT "cafeteria_menu_votes_offering_id_cafeteria_menu_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."cafeteria_menu_offerings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cafeteria_menu_items_code_name_unique" ON "cafeteria_menu_items" USING btree ("cafeteria_code","normalized_name");--> statement-breakpoint
CREATE UNIQUE INDEX "cafeteria_menu_offerings_unique" ON "cafeteria_menu_offerings" USING btree ("menu_item_id","menu_date","meal_slot","menu_section");--> statement-breakpoint
CREATE UNIQUE INDEX "cafeteria_menu_votes_offering_voter_unique" ON "cafeteria_menu_votes" USING btree ("offering_id","voter_hash");