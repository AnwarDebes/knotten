CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"lead_id" uuid,
	"detail" text,
	"actor" text DEFAULT 'system' NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"interest" text,
	"source" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"consent_text" text NOT NULL,
	"consent_version" text NOT NULL,
	"consent_at" timestamp with time zone NOT NULL,
	"confirm_token" text,
	"confirmed_at" timestamp with time zone,
	"unsub_token" text NOT NULL,
	"withdrawn_at" timestamp with time zone,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leads_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "leads_email_idx" ON "leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leads_token_idx" ON "leads" USING btree ("confirm_token");--> statement-breakpoint
CREATE INDEX "leads_unsub_idx" ON "leads" USING btree ("unsub_token");