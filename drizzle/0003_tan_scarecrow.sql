CREATE TABLE "campus_spots" (
	"id" varchar(120) PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"type" varchar(20) NOT NULL,
	"center_latitude" double precision NOT NULL,
	"center_longitude" double precision NOT NULL,
	"boundary" jsonb NOT NULL,
	"source" varchar(20) NOT NULL,
	"osm_id" varchar(120),
	"description" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
