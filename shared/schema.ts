import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // User type and approval status
  userType: varchar("user_type").default("applicant"), // 'applicant' or 'employer'
  approvalStatus: varchar("approval_status").default("pending"), // 'pending', 'approved', or 'rejected'
  approvalDate: timestamp("approval_date"),
  // Local auth fields (replacing Replit OIDC)
  passwordHash: varchar("password_hash"),
  emailVerifiedAt: timestamp("email_verified_at"),
  verificationToken: varchar("verification_token"),
  verificationTokenExpires: timestamp("verification_token_expires"),
  resetToken: varchar("reset_token"),
  resetTokenExpires: timestamp("reset_token_expires"),
  lastLoginAt: timestamp("last_login_at"),
  // Payment-related columns
  subscriptionStatus: varchar("subscription_status").default("free"), // 'free' | 'paid'
  stripeCustomerId: varchar("stripe_customer_id"),
  paymentDate: timestamp("payment_date"),
  freeTierLimits: jsonb("free_tier_limits").default(sql`'{"jobs_viewed_today": 0, "last_reset": "2024-01-01"}'`),
  // Dashboard customization
  dashboardCardOrder: text("dashboard_card_order").array().default(sql`'{"profile","jobs","documents","resources","practice","qa","tracker","news"}'`),
  // Admin role - Two-tier system
  isAdmin: boolean("is_admin").default(false),
  adminRole: varchar("admin_role"), // 'master_admin', 'secondary_admin'
  adminCreatedBy: varchar("admin_created_by"), // Reference to who created this admin
  adminCreatedAt: timestamp("admin_created_at"),
  // Suspension fields
  isSuspended: boolean("is_suspended").default(false),
  suspendedBy: varchar("suspended_by"), // Reference to admin who suspended
  suspendedAt: timestamp("suspended_at"),
  suspensionReason: text("suspension_reason"),
  previousSubscriptionStatus: varchar("previous_subscription_status"), // Store previous status before suspension
  // Admin update tracking
  adminUpdatedBy: varchar("admin_updated_by"),
  adminUpdatedAt: timestamp("admin_updated_at"),
  // Onboarding tracking
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),
  hasCompletedPremiumOnboarding: boolean("has_completed_premium_onboarding").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Linked social / external providers (future-ready)
export const userProviders = pgTable("user_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  provider: varchar("provider").notNull(),
  providerUserId: varchar("provider_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_user_providers_user").on(table.userId),
  index("IDX_user_providers_provider").on(table.provider),
]);

// Healthcare professional profiles
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  // Basic Information
  profession: text("profession"), // Free text input for any profession
  registrationNumber: varchar("registration_number"), // GMC/NMC/HCPC numbers
  specialties: text("specialties").array(), // areas of expertise
  yearsExperience: integer("years_experience"),
  visaStatus: varchar("visa_status"),
  // Contact Information
  email: varchar("email"),
  phone: varchar("phone"),
  city: varchar("city"),
  country: varchar("country"),
  // Skills (7 main skills)
  skills: text("skills").array(),
  // Work Experience (JSON array of experience objects)
  workExperience: jsonb("work_experience"),
  // Education (JSON array of education objects) 
  education: jsonb("education"),
  // Courses & Certifications (JSON array of course objects)
  courses: jsonb("courses"),
  // Completion tracking
  completionPercentage: integer("completion_percentage").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job applications tracking
export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  jobTitle: varchar("job_title").notNull(),
  employer: varchar("employer").notNull(),
  location: varchar("location"),
  salary: varchar("salary"),
  status: varchar("status").notNull().default("draft"), // draft, applied, interview, offered, rejected
  appliedAt: timestamp("applied_at"),
  interviewDate: timestamp("interview_date"),
  notes: text("notes"), // Personal notes for this application
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Interview practice sessions (keeping original structure)
export const interviewSessions = pgTable("interview_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  score: integer("score"), // out of 10
  duration: integer("duration"), // in minutes
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual interview responses within sessions (new table)
export const interviewResponses = pgTable("interview_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => interviewSessions.id).notNull(),
  questionId: varchar("question_id").references(() => interviewQuestions.id).notNull(),
  response: text("response"), // user's written response
  score: integer("score"), // out of 10
  feedback: text("feedback"), // Henry's feedback on this specific response
  timeSpent: integer("time_spent"), // seconds spent on this question
  createdAt: timestamp("created_at").defaultNow(),
});

// User documents (CVs, Supporting Information)
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: varchar("type").notNull(), // cv, supporting_info, cover_letter
  title: varchar("title").notNull(),
  content: text("content"),
  version: varchar("version").default("1.0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// STAR examples for reusable content
export const starExamples = pgTable("star_examples", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  situation: text("situation").notNull(),
  task: text("task").notNull(),
  action: text("action").notNull(),
  result: text("result").notNull(),
  category: varchar("category"), // e.g., "leadership", "clinical_care", "teamwork"
  nhsValue: varchar("nhs_value"), // which NHS value this demonstrates
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// NHS Jobs for discovery and matching
export const nhsJobs = pgTable("nhs_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  externalId: varchar("external_id").unique(), // from NHS Jobs API
  title: varchar("title").notNull(),
  employer: varchar("employer").notNull(),
  location: varchar("location"),
  band: varchar("band"), // NHS pay band
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  description: text("description"),
  personSpec: text("person_spec"),
  closingDate: timestamp("closing_date"),
  isActive: boolean("is_active").default(true),
  featured: boolean("featured").default(false),
  visaSponsorship: boolean("visa_sponsorship").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job matches and scoring
export const jobMatches = pgTable("job_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  jobId: varchar("job_id").references(() => nhsJobs.id).notNull(),
  fitScore: integer("fit_score"), // 0-100 match percentage
  skillsMatch: jsonb("skills_match"), // detailed breakdown
  createdAt: timestamp("created_at").defaultNow(),
});

// File uploads for certificates, existing CVs, etc.
export const userFiles = pgTable("user_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  fileName: varchar("file_name").notNull(),
  fileType: varchar("file_type").notNull(), // cv, certificate, qualification
  filePath: varchar("file_path").notNull(),
  fileSize: integer("file_size"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// NHS Values Assessment
export const valuesAssessment = pgTable("values_assessment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  compassionScore: integer("compassion_score"),
  respectScore: integer("respect_score"),
  dignityScore: integer("dignity_score"),
  commitmentScore: integer("commitment_score"),
  qualityScore: integer("quality_score"),
  integrityScore: integer("integrity_score"),
  overallScore: integer("overall_score"),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Enhanced Interview Q&A Bank
export const interviewQuestions = pgTable("interview_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: varchar("category").notNull(), // clinical, behavioral, nhs_values, general
  difficulty: varchar("difficulty").notNull(), // junior, senior, specialist
  question: text("question").notNull(),
  suggestedAnswer: text("suggested_answer"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Q&A Generator Sessions - Flashcard-style study system
export const qaSessions = pgTable("qa_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  jobDescription: text("job_description").notNull(),
  jobTitle: varchar("job_title", { length: 255 }),
  sessionName: varchar("session_name", { length: 255 }),
  totalQuestions: integer("total_questions").default(25),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  
});

// Generated Q&A Questions for flashcard sessions
export const qaQuestions = pgTable("qa_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => qaSessions.id, { onDelete: 'cascade' }).notNull(),
  questionText: text("question_text").notNull(),
  modelAnswer: text("model_answer").notNull(),
  category: varchar("category", { length: 100 }),
  questionOrder: integer("question_order").notNull(),
});

// User Progress Tracking for Q&A sessions - spaced repetition
export const qaProgress = pgTable("qa_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => qaSessions.id, { onDelete: 'cascade' }).notNull(),
  questionId: varchar("question_id").references(() => qaQuestions.id, { onDelete: 'cascade' }).notNull(),
  confidenceLevel: integer("confidence_level").notNull(), // 1=not confident, 2=somewhat confident, 3=confident
  attempts: integer("attempts").default(1),
  lastReviewed: timestamp("last_reviewed").defaultNow(),
});

// Interview practice attempts - stores individual attempts for history
export const interviewAttempts = pgTable("interview_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  feedback: text("feedback").notNull(),
  timeSpent: integer("time_spent"), // time in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin users for platform management
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  role: varchar("role").notNull(), // super_admin, content_admin, support_admin
  permissions: jsonb("permissions"), // detailed permissions object
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Hidden AI prompts (not exposed to users)
// AI Prompt Management (Enhanced for Admin)
export const aiPrompts = pgTable("ai_prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  promptKey: varchar("prompt_key").notNull().unique(), // 'cv_generation', 'interview_feedback', etc.
  name: varchar("name").notNull(),
  description: text("description"),
  systemPrompt: text("system_prompt").notNull(),
  userPromptTemplate: text("user_prompt_template"),
  isActive: boolean("is_active").default(true),
  category: varchar("category").notNull(), // document_generation, henry_responses, interview_practice
  temperature: integer("temperature").default(70), // 0-100, will be divided by 100
  maxTokens: integer("max_tokens").default(1000),
  lastEditedBy: varchar("last_edited_by").references(() => users.id).notNull(),
  version: varchar("version").default("1.0"),
  metadata: jsonb("metadata"), // additional settings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin activity logs
export const adminLogs = pgTable("admin_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").references(() => adminUsers.id).notNull(),
  action: varchar("action").notNull(),
  targetType: varchar("target_type"), // user, prompt, job, etc.
  targetId: varchar("target_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User activity tracking
export const userActivity = pgTable("user_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  activityType: varchar("activity_type").notNull(), // 'login', 'job_search', 'application_sent', 'document_generated', 'interview_practiced'
  details: jsonb("details"), // additional activity data
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// News and announcements management
export const newsArticles = pgTable("news_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  description: text("description"),
  category: varchar("category"), // e.g., "Platform Update"
  type: varchar("type"), // e.g., "feature"
  priority: varchar("priority"), // e.g., "medium"
  read_time: varchar("read_time"), // e.g., "2 min read" - property and column name must match
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  authorId: varchar("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Learning Resources Management
export const learningResources = pgTable("learning_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  icon: varchar("icon").notNull(), // 'guide', 'video', 'checklist', 'book'
  type: varchar("type").notNull(), // 'file', 'video'
  fileUrl: varchar("file_url"), // For uploaded files
  videoUrl: varchar("video_url"), // For video links
  isPublished: boolean("is_published").default(false),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Support Articles Management
export const supportArticles = pgTable("support_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  icon: varchar("icon").notNull(), // Dynamic based on category: 'profile', 'search', 'documents', 'privacy', 'account', 'troubleshooting', 'payments'
  category: varchar("category").notNull(), // 'general', 'account', 'technical', 'billing'
  content: jsonb("content").notNull(), // Array of content items (bullet points)
  isPublished: boolean("is_published").default(true),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Type definitions
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect & {
  userType: 'applicant' | 'employer';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvalDate?: Date;
};

// Admin Content Management System
export const adminContent = pgTable("admin_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentKey: varchar("content_key").notNull().unique(), // 'homepage_hero', 'homepage_description', etc.
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  contentType: varchar("content_type").notNull().default("text"), // 'text', 'html', 'markdown'
  isActive: boolean("is_active").default(true),
  lastEditedBy: varchar("last_edited_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


// System Analytics Tracking
export const systemAnalytics = pgTable("system_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull().defaultNow(),
  totalUsers: integer("total_users").default(0),
  freeUsers: integer("free_users").default(0),
  premiumUsers: integer("premium_users").default(0),
  dailyActiveUsers: integer("daily_active_users").default(0),
  newSignups: integer("new_signups").default(0),
  premiumConversions: integer("premium_conversions").default(0),
  totalApplications: integer("total_applications").default(0),
  totalInterviewSessions: integer("total_interview_sessions").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin Activity Logs
export const adminActivityLogs = pgTable("admin_activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").references(() => users.id).notNull(),
  action: varchar("action").notNull(), // 'user_created', 'content_updated', 'prompt_modified', etc.
  targetType: varchar("target_type"), // 'user', 'content', 'prompt', 'system'
  targetId: varchar("target_id"),
  description: text("description"),
  metadata: jsonb("metadata"), // Additional data about the action
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin Insert/Select Types
export type AdminContent = typeof adminContent.$inferSelect;
export type InsertAdminContent = typeof adminContent.$inferInsert;
export type AiPrompt = typeof aiPrompts.$inferSelect;
export type InsertAiPrompt = typeof aiPrompts.$inferInsert;
export type SystemAnalytics = typeof systemAnalytics.$inferSelect;
export type InsertSystemAnalytics = typeof systemAnalytics.$inferInsert;
export type AdminActivityLog = typeof adminActivityLogs.$inferSelect;
export type InsertAdminActivityLog = typeof adminActivityLogs.$inferInsert;
export type InsertProfile = typeof profiles.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type InsertInterviewSession = typeof interviewSessions.$inferInsert;
export type InterviewQuestion = typeof interviewQuestions.$inferSelect;
export type InterviewSession = typeof interviewSessions.$inferSelect;
export type InterviewResponse = typeof interviewResponses.$inferSelect;
export type InsertInterviewQuestion = typeof interviewQuestions.$inferInsert;
export type InsertInterviewResponse = typeof interviewResponses.$inferInsert;
export type InsertDocument = typeof documents.$inferInsert;
export type Document = typeof documents.$inferSelect;

// New type definitions
export type InsertStarExample = typeof starExamples.$inferInsert;
export type StarExample = typeof starExamples.$inferSelect;
export type InsertNhsJob = typeof nhsJobs.$inferInsert;
export type NhsJob = typeof nhsJobs.$inferSelect;
export type InsertJobMatch = typeof jobMatches.$inferInsert;
export type JobMatch = typeof jobMatches.$inferSelect;
export type InsertUserFile = typeof userFiles.$inferInsert;
export type UserFile = typeof userFiles.$inferSelect;
export type InsertValuesAssessment = typeof valuesAssessment.$inferInsert;
export type ValuesAssessment = typeof valuesAssessment.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminLog = typeof adminLogs.$inferInsert;
export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertUserActivity = typeof userActivity.$inferInsert;
export type UserActivity = typeof userActivity.$inferSelect;
export type InsertNewsArticle = typeof newsArticles.$inferInsert;
export type NewsArticle = typeof newsArticles.$inferSelect;
export type InsertLearningResource = typeof learningResources.$inferInsert;
export type LearningResource = typeof learningResources.$inferSelect;
export type InsertSupportArticle = typeof supportArticles.$inferInsert;
export type SupportArticle = typeof supportArticles.$inferSelect;

// Q&A Generator types
export type InsertQaSession = typeof qaSessions.$inferInsert;
export type QaSession = typeof qaSessions.$inferSelect;
export type InsertQaQuestion = typeof qaQuestions.$inferInsert;
export type QaQuestion = typeof qaQuestions.$inferSelect;
export type InsertQaProgress = typeof qaProgress.$inferInsert;
export type QaProgress = typeof qaProgress.$inferSelect;

// Interview Attempts types
export type InsertInterviewAttempt = typeof interviewAttempts.$inferInsert;
export type InterviewAttempt = typeof interviewAttempts.$inferSelect;

// Zod schemas
export type InsertInterviewSessionType = z.infer<typeof insertInterviewSessionSchema>;
export type InsertDocumentType = z.infer<typeof insertDocumentSchema>;
export type InsertProfileType = z.infer<typeof insertProfileSchema>;
export type InsertStarExampleType = z.infer<typeof insertStarExampleSchema>;
export type InsertNhsJobType = z.infer<typeof insertNhsJobSchema>;
export type InsertQaSessionType = z.infer<typeof insertQaSessionSchema>;
export type InsertQaQuestionType = z.infer<typeof insertQaQuestionSchema>;
export type InsertQaProgressType = z.infer<typeof insertQaProgressSchema>;

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInterviewSessionSchema = createInsertSchema(interviewSessions).omit({
  id: true,
  createdAt: true,
});

export const insertInterviewResponseSchema = createInsertSchema(interviewResponses).omit({
  id: true,
  createdAt: true,
});

export const insertStarExampleSchema = createInsertSchema(starExamples).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNhsJobSchema = createInsertSchema(nhsJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobMatchSchema = createInsertSchema(jobMatches).omit({
  id: true,
  createdAt: true,
});

export const insertUserFileSchema = createInsertSchema(userFiles).omit({
  id: true,
  uploadedAt: true,
});

export const insertValuesAssessmentSchema = createInsertSchema(valuesAssessment).omit({
  id: true,
  completedAt: true,
});

export const insertAiPromptSchema = createInsertSchema(aiPrompts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserActivitySchema = createInsertSchema(userActivity).omit({
  id: true,
  createdAt: true,
});

export const insertNewsArticleSchema = createInsertSchema(newsArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLearningResourceSchema = createInsertSchema(learningResources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupportArticleSchema = createInsertSchema(supportArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Q&A Generator schemas
export const insertQaSessionSchema = createInsertSchema(qaSessions).omit({
  id: true,
  createdAt: true,
});

export const insertQaQuestionSchema = createInsertSchema(qaQuestions).omit({
  id: true,
});

export const insertQaProgressSchema = createInsertSchema(qaProgress).omit({
  id: true,
  lastReviewed: true,
});

export const insertInterviewAttemptSchema = createInsertSchema(interviewAttempts).omit({
  id: true,
  createdAt: true,
});

// Dashboard data interface
export interface DashboardData {
  profileCompletion: number;
  newJobMatches: number;
  applicationsInProgress: number;
  totalApplications: number;
  latestInterviewScore: number;
  interviewsThisWeek: number;
  successRate: number;
  recentApplications: Application[];
  latestDocument: Document | null;
}

// Extended user type with dashboard data
export interface UserWithProfile extends User {
  profile?: Profile;
  profileCompletionPercentage?: number;
  totalApplications?: number;
  interviewsScheduled?: number;
  profession?: string;
}

// Feature gates for subscription tiers
export type SubscriptionStatus = 'free' | 'paid';

export interface FreeTierLimits {
  jobs_viewed_today: number;
  last_reset: string;
}

// Feature access control
export const FEATURES = {
  AI_GENERATION: 'ai_generation',
  INTERVIEW_PRACTICE: 'interview_practice', 
  JOB_TRACKING: 'job_tracking',
  UNLIMITED_SEARCH: 'unlimited_search',
  QA_GENERATOR: 'qa_generator',
  BASIC_PROFILE: 'basic_profile',
  LIMITED_JOB_VIEW: 'limited_job_view',
} as const;

export type Feature = typeof FEATURES[keyof typeof FEATURES];

export const FEATURE_ACCESS: Record<Feature, SubscriptionStatus[]> = {
  [FEATURES.AI_GENERATION]: ['paid'],
  [FEATURES.INTERVIEW_PRACTICE]: ['paid'],
  [FEATURES.JOB_TRACKING]: ['paid'],
  [FEATURES.UNLIMITED_SEARCH]: ['paid'],
  [FEATURES.QA_GENERATOR]: ['paid'],
  [FEATURES.BASIC_PROFILE]: ['free', 'paid'],
  [FEATURES.LIMITED_JOB_VIEW]: ['free', 'paid'],
};

// AI Usage Monitoring Tables
export const aiUsageTracking = pgTable("ai_usage_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  featureType: varchar("feature_type").notNull(), // 'interview_practice', 'qa_generator', 'henry_feedback', 'document_generation'
  usageDate: varchar("usage_date").notNull(), // YYYY-MM-DD format
  hourlyCount: integer("hourly_count").default(0),
  dailyCount: integer("daily_count").default(0),
  weeklyCount: integer("weekly_count").default(0),
  monthlyCount: integer("monthly_count").default(0),
  lastHour: integer("last_hour").default(0), // Hour of last request (0-23)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_usage_user_feature_date").on(table.userId, table.featureType, table.usageDate),
]);

export const usageViolations = pgTable("usage_violations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  violationType: varchar("violation_type").notNull(), // 'excessive_usage', 'rapid_requests', 'suspicious_pattern'
  featureType: varchar("feature_type").notNull(),
  violationDetails: jsonb("violation_details"),
  warningSent: boolean("warning_sent").default(false),
  restrictionApplied: boolean("restriction_applied").default(false),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_violations_user_feature").on(table.userId, table.featureType),
]);

export const userRestrictions = pgTable("user_restrictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  featureType: varchar("feature_type").notNull(),
  restrictionType: varchar("restriction_type").notNull(), // 'rate_limit', 'temporary_ban', 'under_review'
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  reason: text("reason"),
  canAppeal: boolean("can_appeal").default(true),
  appealSubmitted: boolean("appeal_submitted").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_restrictions_user_active").on(table.userId, table.isActive),
]);

export const usageAppeals = pgTable("usage_appeals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  restrictionId: varchar("restriction_id").references(() => userRestrictions.id).notNull(),
  appealReason: text("appeal_reason"),
  status: varchar("status").default("pending"), // 'pending', 'approved', 'rejected'
  adminResponse: text("admin_response"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// AI Usage Monitoring Types
export type AiUsageTracking = typeof aiUsageTracking.$inferSelect;
export type InsertAiUsageTracking = typeof aiUsageTracking.$inferInsert;

export type UsageViolation = typeof usageViolations.$inferSelect;
export type InsertUsageViolation = typeof usageViolations.$inferInsert;

export type UserRestriction = typeof userRestrictions.$inferSelect;
export type InsertUserRestriction = typeof userRestrictions.$inferInsert;

export type UsageAppeal = typeof usageAppeals.$inferSelect;
export type InsertUsageAppeal = typeof usageAppeals.$inferInsert;

// Insert schemas for AI usage monitoring
export const insertAiUsageTrackingSchema = createInsertSchema(aiUsageTracking).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUsageViolationSchema = createInsertSchema(usageViolations).omit({
  id: true,
  createdAt: true,
});

export const insertUserRestrictionSchema = createInsertSchema(userRestrictions).omit({
  id: true,
  createdAt: true,
});

export const insertUsageAppealSchema = createInsertSchema(usageAppeals).omit({
  id: true,
  createdAt: true,
});

// GDPR Compliance Tables
export const gdprConsents = pgTable("gdpr_consents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  consentType: varchar("consent_type").notNull(), // 'marketing', 'analytics', 'ai_processing', 'essential'
  legalBasis: varchar("legal_basis").notNull(), // 'consent', 'legitimate_interest', 'contract', 'legal_obligation'
  consentGiven: boolean("consent_given").notNull(),
  consentDate: timestamp("consent_date").defaultNow(),
  consentWithdrawnDate: timestamp("consent_withdrawn_date"),
  consentVersion: varchar("consent_version").default("1.0"), // Track policy version
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_consent_user_type").on(table.userId, table.consentType),
]);

export const processingActivities = pgTable("processing_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  activityName: varchar("activity_name").notNull(),
  purpose: text("purpose").notNull(),
  legalBasis: varchar("legal_basis").notNull(),
  dataCategories: text("data_categories").array(), // ['personal_data', 'special_category', 'criminal']
  dataSubjects: text("data_subjects").array(), // ['users', 'job_seekers', 'healthcare_professionals']
  recipients: text("recipients").array(), // Who data is shared with
  retentionPeriod: integer("retention_period"), // In days
  securityMeasures: text("security_measures"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dataSubjectRequests = pgTable("data_subject_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  requestType: varchar("request_type").notNull(), // 'access', 'rectification', 'erasure', 'portability', 'restriction', 'objection'
  requestDetails: text("request_details"),
  status: varchar("status").default("pending"), // 'pending', 'in_progress', 'completed', 'rejected'
  submittedDate: timestamp("submitted_date").defaultNow(),
  completedDate: timestamp("completed_date"),
  adminNotes: text("admin_notes"),
  verificationMethod: varchar("verification_method"),
  responseData: jsonb("response_data"), // Store the response for audit
  referenceId: varchar("reference_id").unique().default(sql`'DSR-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(EXTRACT(DOY FROM NOW())::text, 3, '0') || '-' || LPAD(EXTRACT(HOUR FROM NOW())::text, 2, '0') || LPAD(EXTRACT(MINUTE FROM NOW())::text, 2, '0') || '-' || LPAD((RANDOM() * 999)::int::text, 3, '0')`),
  adminUpdatedBy: varchar("admin_updated_by"),
  adminUpdatedAt: timestamp("admin_updated_at"),
}, (table) => [
  index("idx_dsr_user_status").on(table.userId, table.status),
]);

export const dataBreaches = pgTable("data_breaches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  breachType: varchar("breach_type").notNull(),
  description: text("description").notNull(),
  affectedUsers: integer("affected_users"),
  dataCategories: text("data_categories").array(),
  riskLevel: varchar("risk_level").notNull(), // 'low', 'medium', 'high'
  discoveredDate: timestamp("discovered_date").defaultNow(),
  containedDate: timestamp("contained_date"),
  authorityNotified: boolean("authority_notified").default(false),
  authorityNotificationDate: timestamp("authority_notification_date"),
  usersNotified: boolean("users_notified").default(false),
  userNotificationDate: timestamp("user_notification_date"),
  remedialActions: text("remedial_actions"),
  status: varchar("status").default("open"), // 'open', 'investigating', 'contained', 'closed'
  reportedBy: varchar("reported_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dataAccessLogs = pgTable("data_access_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  accessedBy: varchar("accessed_by").references(() => users.id), // Staff member who accessed data
  accessType: varchar("access_type").notNull(), // 'view', 'edit', 'delete', 'export'
  dataType: varchar("data_type").notNull(), // 'profile', 'cv', 'applications', 'interview_data'
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  purpose: text("purpose"),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => [
  index("idx_access_logs_user_date").on(table.userId, table.timestamp),
  index("idx_access_logs_accessed_by").on(table.accessedBy),
]);

// GDPR Types
export type GdprConsent = typeof gdprConsents.$inferSelect;
export type InsertGdprConsent = typeof gdprConsents.$inferInsert;

export type ProcessingActivity = typeof processingActivities.$inferSelect;
export type InsertProcessingActivity = typeof processingActivities.$inferInsert;

export type DataSubjectRequest = typeof dataSubjectRequests.$inferSelect;
export type InsertDataSubjectRequest = typeof dataSubjectRequests.$inferInsert;

export type DataBreach = typeof dataBreaches.$inferSelect;
export type InsertDataBreach = typeof dataBreaches.$inferInsert;

export type DataAccessLog = typeof dataAccessLogs.$inferSelect;
export type InsertDataAccessLog = typeof dataAccessLogs.$inferInsert;

// GDPR Schemas
export const insertGdprConsentSchema = createInsertSchema(gdprConsents).omit({
  id: true,
  createdAt: true,
});

export const insertProcessingActivitySchema = createInsertSchema(processingActivities).omit({
  id: true,
  createdAt: true,
});

export const insertDataSubjectRequestSchema = createInsertSchema(dataSubjectRequests).omit({
  id: true,
  submittedDate: true,
  referenceId: true,
});

export const insertDataBreachSchema = createInsertSchema(dataBreaches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDataAccessLogSchema = createInsertSchema(dataAccessLogs).omit({
  id: true,
  timestamp: true,
});
