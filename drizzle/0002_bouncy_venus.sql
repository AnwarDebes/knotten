CREATE TABLE "content_blocks" (
	"key" text PRIMARY KEY NOT NULL,
	"body_no" text NOT NULL,
	"body_en" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text NOT NULL,
	"snapshot" text NOT NULL,
	"editor" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard_params" (
	"key" text PRIMARY KEY NOT NULL,
	"mode" text DEFAULT 'illustrative' NOT NULL,
	"values" text DEFAULT '{}' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faq" (
	"id" uuid PRIMARY KEY NOT NULL,
	"question_no" text NOT NULL,
	"question_en" text NOT NULL,
	"answer_no" text NOT NULL,
	"answer_en" text NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "image_slots" (
	"slot_key" text PRIMARY KEY NOT NULL,
	"asset_ref" text,
	"alt_no" text DEFAULT '' NOT NULL,
	"alt_en" text DEFAULT '' NOT NULL,
	"forbehold_text" text,
	"is_ai_or_illustration" boolean DEFAULT false NOT NULL,
	"disclosure_text" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title_no" text NOT NULL,
	"title_en" text NOT NULL,
	"body_no" text NOT NULL,
	"body_en" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "news_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "plots" (
	"id" uuid PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"size_m2" integer,
	"orientation" text,
	"status" text DEFAULT 'ledig' NOT NULL,
	"price_indicative" integer,
	"gnr_bnr" text,
	"position_x" real,
	"position_z" real,
	"sightline_bearing" real,
	"note" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeline_stages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label_no" text NOT NULL,
	"label_en" text NOT NULL,
	"date_or_stage" text,
	"is_current" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "content_versions_entity_idx" ON "content_versions" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "news_status_idx" ON "news" USING btree ("status");--> statement-breakpoint
CREATE INDEX "plots_status_idx" ON "plots" USING btree ("status");