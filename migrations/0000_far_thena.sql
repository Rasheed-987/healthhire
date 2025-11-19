CREATE TABLE "admin_activity_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" varchar NOT NULL,
	"action" varchar NOT NULL,
	"target_type" varchar,
	"target_id" varchar,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admin_content" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_key" varchar NOT NULL,
	"title" varchar NOT NULL,
	"content" text NOT NULL,
	"content_type" varchar DEFAULT 'text' NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_edited_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admin_content_content_key_unique" UNIQUE("content_key")
);
--> statement-breakpoint
CREATE TABLE "admin_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" varchar NOT NULL,
	"action" varchar NOT NULL,
	"target_type" varchar,
	"target_id" varchar,
	"details" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"role" varchar NOT NULL,
	"permissions" jsonb,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "ai_prompts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_key" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"system_prompt" text NOT NULL,
	"user_prompt_template" text,
	"is_active" boolean DEFAULT true,
	"category" varchar NOT NULL,
	"temperature" integer DEFAULT 70,
	"max_tokens" integer DEFAULT 1000,
	"last_edited_by" varchar NOT NULL,
	"version" varchar DEFAULT '1.0',
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ai_prompts_prompt_key_unique" UNIQUE("prompt_key")
);
--> statement-breakpoint
CREATE TABLE "ai_usage_tracking" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"feature_type" varchar NOT NULL,
	"usage_date" varchar NOT NULL,
	"hourly_count" integer DEFAULT 0,
	"daily_count" integer DEFAULT 0,
	"weekly_count" integer DEFAULT 0,
	"monthly_count" integer DEFAULT 0,
	"last_hour" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"job_title" varchar NOT NULL,
	"employer" varchar NOT NULL,
	"location" varchar,
	"salary" varchar,
	"status" varchar DEFAULT 'draft' NOT NULL,
	"applied_at" timestamp,
	"interview_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "data_access_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"accessed_by" varchar,
	"access_type" varchar NOT NULL,
	"data_type" varchar NOT NULL,
	"ip_address" varchar,
	"user_agent" text,
	"purpose" text,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "data_breaches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"breach_type" varchar NOT NULL,
	"description" text NOT NULL,
	"affected_users" integer,
	"data_categories" text[],
	"risk_level" varchar NOT NULL,
	"discovered_date" timestamp DEFAULT now(),
	"contained_date" timestamp,
	"authority_notified" boolean DEFAULT false,
	"authority_notification_date" timestamp,
	"users_notified" boolean DEFAULT false,
	"user_notification_date" timestamp,
	"remedial_actions" text,
	"status" varchar DEFAULT 'open',
	"reported_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "data_subject_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"request_type" varchar NOT NULL,
	"request_details" text,
	"status" varchar DEFAULT 'pending',
	"submitted_date" timestamp DEFAULT now(),
	"completed_date" timestamp,
	"admin_notes" text,
	"verification_method" varchar,
	"response_data" jsonb,
	"reference_id" varchar DEFAULT 'DSR-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(EXTRACT(DOY FROM NOW())::text, 3, '0') || '-' || LPAD(EXTRACT(HOUR FROM NOW())::text, 2, '0') || LPAD(EXTRACT(MINUTE FROM NOW())::text, 2, '0') || '-' || LPAD((RANDOM() * 999)::int::text, 3, '0'),
	"admin_updated_by" varchar,
	"admin_updated_at" timestamp,
	CONSTRAINT "data_subject_requests_reference_id_unique" UNIQUE("reference_id")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"content" text,
	"version" varchar DEFAULT '1.0',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gdpr_consents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"consent_type" varchar NOT NULL,
	"legal_basis" varchar NOT NULL,
	"consent_given" boolean NOT NULL,
	"consent_date" timestamp DEFAULT now(),
	"consent_withdrawn_date" timestamp,
	"consent_version" varchar DEFAULT '1.0',
	"ip_address" varchar,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "interview_attempts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"feedback" text NOT NULL,
	"time_spent" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "interview_questions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" varchar NOT NULL,
	"difficulty" varchar NOT NULL,
	"question" text NOT NULL,
	"suggested_answer" text,
	"tags" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "interview_responses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"question_id" varchar NOT NULL,
	"response" text,
	"score" integer,
	"feedback" text,
	"time_spent" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "interview_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"score" integer,
	"duration" integer,
	"feedback" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_matches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"job_id" varchar NOT NULL,
	"fit_score" integer,
	"skills_match" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "learning_resources" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"icon" varchar NOT NULL,
	"type" varchar NOT NULL,
	"file_url" varchar,
	"video_url" varchar,
	"is_published" boolean DEFAULT false,
	"created_by" varchar NOT NULL,
	"updated_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "news_articles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"content" text NOT NULL,
	"description" text,
	"category" varchar,
	"type" varchar,
	"priority" varchar,
	"read_time" varchar,
	"is_published" boolean DEFAULT false,
	"published_at" timestamp,
	"author_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "nhs_jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" varchar,
	"title" varchar NOT NULL,
	"employer" varchar NOT NULL,
	"location" varchar,
	"band" varchar,
	"salary_min" integer,
	"salary_max" integer,
	"description" text,
	"person_spec" text,
	"closing_date" timestamp,
	"is_active" boolean DEFAULT true,
	"featured" boolean DEFAULT false,
	"visa_sponsorship" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "nhs_jobs_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "processing_activities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_name" varchar NOT NULL,
	"purpose" text NOT NULL,
	"legal_basis" varchar NOT NULL,
	"data_categories" text[],
	"data_subjects" text[],
	"recipients" text[],
	"retention_period" integer,
	"security_measures" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"profession" text,
	"registration_number" varchar,
	"specialties" text[],
	"years_experience" integer,
	"visa_status" varchar,
	"email" varchar,
	"phone" varchar,
	"city" varchar,
	"country" varchar,
	"skills" text[],
	"work_experience" jsonb,
	"education" jsonb,
	"courses" jsonb,
	"completion_percentage" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "qa_progress" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"question_id" varchar NOT NULL,
	"confidence_level" integer NOT NULL,
	"attempts" integer DEFAULT 1,
	"last_reviewed" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "qa_questions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"question_text" text NOT NULL,
	"model_answer" text NOT NULL,
	"category" varchar(100),
	"question_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qa_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"job_description" text NOT NULL,
	"job_title" varchar(255),
	"total_questions" integer DEFAULT 25,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "star_examples" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"situation" text NOT NULL,
	"task" text NOT NULL,
	"action" text NOT NULL,
	"result" text NOT NULL,
	"category" varchar,
	"nhs_value" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "support_articles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"icon" varchar NOT NULL,
	"category" varchar NOT NULL,
	"content" jsonb NOT NULL,
	"is_published" boolean DEFAULT true,
	"created_by" varchar NOT NULL,
	"updated_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"total_users" integer DEFAULT 0,
	"free_users" integer DEFAULT 0,
	"premium_users" integer DEFAULT 0,
	"daily_active_users" integer DEFAULT 0,
	"new_signups" integer DEFAULT 0,
	"premium_conversions" integer DEFAULT 0,
	"total_applications" integer DEFAULT 0,
	"total_interview_sessions" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "usage_appeals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"restriction_id" varchar NOT NULL,
	"appeal_reason" text,
	"status" varchar DEFAULT 'pending',
	"admin_response" text,
	"reviewed_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "usage_violations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"violation_type" varchar NOT NULL,
	"feature_type" varchar NOT NULL,
	"violation_details" jsonb,
	"warning_sent" boolean DEFAULT false,
	"restriction_applied" boolean DEFAULT false,
	"resolved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_activity" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"activity_type" varchar NOT NULL,
	"details" jsonb,
	"ip_address" varchar,
	"user_agent" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_files" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"file_name" varchar NOT NULL,
	"file_type" varchar NOT NULL,
	"file_path" varchar NOT NULL,
	"file_size" integer,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_providers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"provider" varchar NOT NULL,
	"provider_user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_restrictions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"feature_type" varchar NOT NULL,
	"restriction_type" varchar NOT NULL,
	"start_time" timestamp DEFAULT now(),
	"end_time" timestamp,
	"reason" text,
	"can_appeal" boolean DEFAULT true,
	"appeal_submitted" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"user_type" varchar DEFAULT 'applicant',
	"approval_status" varchar DEFAULT 'pending',
	"approval_date" timestamp,
	"password_hash" varchar,
	"email_verified_at" timestamp,
	"verification_token" varchar,
	"verification_token_expires" timestamp,
	"reset_token" varchar,
	"reset_token_expires" timestamp,
	"last_login_at" timestamp,
	"subscription_status" varchar DEFAULT 'free',
	"stripe_customer_id" varchar,
	"payment_date" timestamp,
	"free_tier_limits" jsonb DEFAULT '{"jobs_viewed_today": 0, "last_reset": "2024-01-01"}',
	"dashboard_card_order" text[] DEFAULT '{"profile","jobs","documents","resources","practice","qa","tracker","news"}',
	"is_admin" boolean DEFAULT false,
	"admin_role" varchar,
	"admin_created_by" varchar,
	"admin_created_at" timestamp,
	"is_suspended" boolean DEFAULT false,
	"suspended_by" varchar,
	"suspended_at" timestamp,
	"suspension_reason" text,
	"previous_subscription_status" varchar,
	"admin_updated_by" varchar,
	"admin_updated_at" timestamp,
	"has_completed_onboarding" boolean DEFAULT false,
	"has_completed_premium_onboarding" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "values_assessment" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"compassion_score" integer,
	"respect_score" integer,
	"dignity_score" integer,
	"commitment_score" integer,
	"quality_score" integer,
	"integrity_score" integer,
	"overall_score" integer,
	"completed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "admin_activity_logs" ADD CONSTRAINT "admin_activity_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_content" ADD CONSTRAINT "admin_content_last_edited_by_users_id_fk" FOREIGN KEY ("last_edited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_admin_id_admin_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_prompts" ADD CONSTRAINT "ai_prompts_last_edited_by_users_id_fk" FOREIGN KEY ("last_edited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_tracking" ADD CONSTRAINT "ai_usage_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_access_logs" ADD CONSTRAINT "data_access_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_access_logs" ADD CONSTRAINT "data_access_logs_accessed_by_users_id_fk" FOREIGN KEY ("accessed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_breaches" ADD CONSTRAINT "data_breaches_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_subject_requests" ADD CONSTRAINT "data_subject_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gdpr_consents" ADD CONSTRAINT "gdpr_consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_attempts" ADD CONSTRAINT "interview_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_responses" ADD CONSTRAINT "interview_responses_session_id_interview_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_responses" ADD CONSTRAINT "interview_responses_question_id_interview_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."interview_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_job_id_nhs_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."nhs_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_resources" ADD CONSTRAINT "learning_resources_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_resources" ADD CONSTRAINT "learning_resources_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qa_progress" ADD CONSTRAINT "qa_progress_session_id_qa_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."qa_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qa_progress" ADD CONSTRAINT "qa_progress_question_id_qa_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."qa_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qa_questions" ADD CONSTRAINT "qa_questions_session_id_qa_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."qa_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qa_sessions" ADD CONSTRAINT "qa_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "star_examples" ADD CONSTRAINT "star_examples_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_articles" ADD CONSTRAINT "support_articles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_articles" ADD CONSTRAINT "support_articles_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_appeals" ADD CONSTRAINT "usage_appeals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_appeals" ADD CONSTRAINT "usage_appeals_restriction_id_user_restrictions_id_fk" FOREIGN KEY ("restriction_id") REFERENCES "public"."user_restrictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_appeals" ADD CONSTRAINT "usage_appeals_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_violations" ADD CONSTRAINT "usage_violations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_files" ADD CONSTRAINT "user_files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_providers" ADD CONSTRAINT "user_providers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_restrictions" ADD CONSTRAINT "user_restrictions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "values_assessment" ADD CONSTRAINT "values_assessment_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_usage_user_feature_date" ON "ai_usage_tracking" USING btree ("user_id","feature_type","usage_date");--> statement-breakpoint
CREATE INDEX "idx_access_logs_user_date" ON "data_access_logs" USING btree ("user_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_access_logs_accessed_by" ON "data_access_logs" USING btree ("accessed_by");--> statement-breakpoint
CREATE INDEX "idx_dsr_user_status" ON "data_subject_requests" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_consent_user_type" ON "gdpr_consents" USING btree ("user_id","consent_type");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "idx_violations_user_feature" ON "usage_violations" USING btree ("user_id","feature_type");--> statement-breakpoint
CREATE INDEX "IDX_user_providers_user" ON "user_providers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_user_providers_provider" ON "user_providers" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "idx_restrictions_user_active" ON "user_restrictions" USING btree ("user_id","is_active");