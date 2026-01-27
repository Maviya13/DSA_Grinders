CREATE TABLE "daily_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" varchar(16) NOT NULL,
	"easy" integer DEFAULT 0,
	"medium" integer DEFAULT 0,
	"hard" integer DEFAULT 0,
	"total" integer DEFAULT 0,
	"ranking" integer DEFAULT 0,
	"avatar" varchar(255) DEFAULT '',
	"country" varchar(64) DEFAULT '',
	"streak" integer DEFAULT 0,
	"last_submission" varchar(64),
	"recent_problems" jsonb DEFAULT '[]'::jsonb,
	"previous_total" integer DEFAULT 0,
	"today_points" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"group_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	CONSTRAINT "group_members_group_id_user_id_pk" PRIMARY KEY("group_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(32) NOT NULL,
	"description" text,
	"owner" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "groups_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(32) NOT NULL,
	"name" varchar(255) NOT NULL,
	"subject" varchar(255),
	"content" text NOT NULL,
	"variables" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"automation_enabled" boolean DEFAULT true,
	"email_automation_enabled" boolean DEFAULT true,
	"whatsapp_automation_enabled" boolean DEFAULT true,
	"email_schedule" jsonb DEFAULT '["09:00"]'::jsonb,
	"whatsapp_schedule" jsonb DEFAULT '["09:30"]'::jsonb,
	"timezone" varchar(64) DEFAULT 'Asia/Kolkata',
	"max_daily_emails" integer DEFAULT 1,
	"max_daily_whatsapp" integer DEFAULT 1,
	"emails_sent_today" integer DEFAULT 0,
	"whatsapp_sent_today" integer DEFAULT 0,
	"last_email_sent" timestamp with time zone,
	"last_whatsapp_sent" timestamp with time zone,
	"last_reset_date" timestamp with time zone DEFAULT now(),
	"skip_weekends" boolean DEFAULT false,
	"skip_holidays" boolean DEFAULT false,
	"custom_skip_dates" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255),
	"leetcode_username" varchar(255) NOT NULL,
	"github" varchar(255) NOT NULL,
	"linkedin" varchar(255),
	"phone_number" varchar(32),
	"role" varchar(16) DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_leetcode_username_unique" UNIQUE("leetcode_username")
);
--> statement-breakpoint
ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_owner_users_id_fk" FOREIGN KEY ("owner") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_date_idx" ON "daily_stats" USING btree ("user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "type_name_idx" ON "message_templates" USING btree ("type","name");