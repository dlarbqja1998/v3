CREATE TABLE "cafeteria_menus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cafeteria_id" uuid NOT NULL,
	"menu_date" varchar(10) NOT NULL,
	"meal_type" varchar(40) NOT NULL,
	"items" jsonb NOT NULL,
	"source" varchar(80) DEFAULT 'manual' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cafeterias" (
	"place_id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"type" varchar(40) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "place_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(80) NOT NULL,
	"slug" varchar(80) NOT NULL,
	"icon" varchar(40) NOT NULL,
	"color" varchar(20) NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "place_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "place_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid NOT NULL,
	"provider" varchar(40) NOT NULL,
	"provider_place_id" varchar(120),
	"provider_url" text,
	"raw_payload" jsonb,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(40) NOT NULL,
	"name" varchar(120) NOT NULL,
	"category_id" uuid NOT NULL,
	"zone_id" uuid NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"address" text,
	"road_address" text,
	"phone" varchar(40),
	"description" text DEFAULT '' NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"display_priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurant_profiles" (
	"place_id" uuid PRIMARY KEY NOT NULL,
	"price_level" integer,
	"opening_hours" jsonb,
	"menu_summary" text,
	"naver_place_url" text,
	"kakao_place_url" text,
	"rating_avg" double precision,
	"review_count" integer DEFAULT 0 NOT NULL,
	"last_verified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "shuttle_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stop_id" uuid NOT NULL,
	"day_type" varchar(40) NOT NULL,
	"departure_time" time NOT NULL,
	"route_name" varchar(120) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shuttle_stops" (
	"place_id" uuid PRIMARY KEY NOT NULL,
	"stop_code" varchar(80) NOT NULL,
	"direction" varchar(80) NOT NULL,
	"memo" text
);
--> statement-breakpoint
CREATE TABLE "zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(80) NOT NULL,
	"slug" varchar(80) NOT NULL,
	"center_latitude" double precision NOT NULL,
	"center_longitude" double precision NOT NULL,
	"polygon" jsonb,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "zones_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "cafeteria_menus" ADD CONSTRAINT "cafeteria_menus_cafeteria_id_cafeterias_place_id_fk" FOREIGN KEY ("cafeteria_id") REFERENCES "public"."cafeterias"("place_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cafeterias" ADD CONSTRAINT "cafeterias_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_sources" ADD CONSTRAINT "place_sources_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_category_id_place_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."place_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_profiles" ADD CONSTRAINT "restaurant_profiles_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shuttle_schedules" ADD CONSTRAINT "shuttle_schedules_stop_id_shuttle_stops_place_id_fk" FOREIGN KEY ("stop_id") REFERENCES "public"."shuttle_stops"("place_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shuttle_stops" ADD CONSTRAINT "shuttle_stops_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE no action ON UPDATE no action;