CREATE TABLE "event_candidate_sources" (
	"identity" text PRIMARY KEY NOT NULL,
	"candidate_id" uuid NOT NULL,
	"content_hash" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dedup_key" text,
	"draft" jsonb NOT NULL,
	"suggested_draft" jsonb,
	"sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"state" varchar(20) DEFAULT 'pending' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"cover_image" jsonb,
	"cover_approved" boolean DEFAULT false NOT NULL,
	"review_flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"manually_edited" boolean DEFAULT false NOT NULL,
	"published_event_id" uuid,
	"published_at" timestamp with time zone,
	"reviewed_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_candidates_dedup_key_unique" UNIQUE("dedup_key")
);
--> statement-breakpoint
CREATE TABLE "event_import_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot" text NOT NULL,
	"status" varchar(20) DEFAULT 'running' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"new_count" integer DEFAULT 0 NOT NULL,
	"changed_count" integer DEFAULT 0 NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"checked_boards" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"checkpoint" jsonb,
	CONSTRAINT "event_import_runs_slot_unique" UNIQUE("slot")
);
--> statement-breakpoint
CREATE TABLE "event_notification_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_notification_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
ALTER TABLE "event_candidate_sources" ADD CONSTRAINT "event_candidate_sources_candidate_id_event_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."event_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_candidates" ADD CONSTRAINT "event_candidates_published_event_id_campus_events_id_fk" FOREIGN KEY ("published_event_id") REFERENCES "public"."campus_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_candidates" ADD CONSTRAINT "event_candidates_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_notification_subscriptions" ADD CONSTRAINT "event_notification_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_candidates_state_updated_idx" ON "event_candidates" USING btree ("state","updated_at");--> statement-breakpoint
CREATE INDEX "event_import_runs_started_idx" ON "event_import_runs" USING btree ("started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "event_import_runs_one_active" ON "event_import_runs" USING btree ((1)) WHERE "event_import_runs"."status" = 'running';--> statement-breakpoint
CREATE INDEX "event_notification_subscriptions_user_idx" ON "event_notification_subscriptions" USING btree ("user_id");
