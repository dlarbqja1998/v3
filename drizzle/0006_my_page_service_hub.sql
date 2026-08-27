CREATE TABLE "notices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(100) NOT NULL,
	"content" text NOT NULL,
	"status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"show_on_home" boolean DEFAULT false NOT NULL,
	"author_id" integer,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"category" varchar(40) NOT NULL,
	"title" varchar(60) NOT NULL,
	"content" text NOT NULL,
	"status" varchar(20) DEFAULT 'WAITING' NOT NULL,
	"answer" text,
	"answered_by" integer,
	"answered_at" timestamp with time zone,
	"answer_updated_at" timestamp with time zone,
	"answer_read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_inquiries" ADD CONSTRAINT "support_inquiries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_inquiries" ADD CONSTRAINT "support_inquiries_answered_by_users_id_fk" FOREIGN KEY ("answered_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notices_public_idx" ON "notices" USING btree ("status","is_pinned","published_at");--> statement-breakpoint
CREATE INDEX "notices_home_idx" ON "notices" USING btree ("status","show_on_home","published_at");--> statement-breakpoint
CREATE INDEX "support_inquiries_user_idx" ON "support_inquiries" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "support_inquiries_status_idx" ON "support_inquiries" USING btree ("status","created_at");