CREATE TABLE "campus_event_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"object_key" text NOT NULL,
	"content_type" varchar(40) NOT NULL,
	"byte_size" integer NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_cover" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campus_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(120) NOT NULL,
	"category" varchar(20) NOT NULL,
	"organizer" varchar(120) NOT NULL,
	"description" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"location_name" varchar(160) NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"is_visible" boolean DEFAULT false NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campus_event_images" ADD CONSTRAINT "campus_event_images_event_id_campus_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."campus_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campus_events" ADD CONSTRAINT "campus_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "campus_event_images_object_key_unique" ON "campus_event_images" USING btree ("object_key");--> statement-breakpoint
CREATE INDEX "campus_event_images_event_order_idx" ON "campus_event_images" USING btree ("event_id","display_order");--> statement-breakpoint
CREATE INDEX "campus_events_public_idx" ON "campus_events" USING btree ("is_visible","starts_at","ends_at");