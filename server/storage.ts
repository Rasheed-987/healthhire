import {
  users,
  profiles,
  applications,
  interviewSessions,
  interviewAttempts,
  documents,
  starExamples,
  nhsJobs,
  jobMatches,
  userFiles,
  valuesAssessment,
  interviewQuestions,
  qaSessions,
  qaQuestions,
  qaProgress,
  aiPrompts,
  userActivity,
  newsArticles,
  learningResources,
  supportArticles,
  gdprConsents,
  dataSubjectRequests,
  dataAccessLogs,
  adminActivityLogs,
  adminContent,
  aiUsageTracking,
  usageViolations,
  userRestrictions,
  type User,
  type UpsertUser,
  type Profile,
  type InsertProfile,
  type Application,
  type InsertApplication,
  type InterviewSession,
  type InsertInterviewSession,
  type InterviewAttempt,
  type InsertInterviewAttempt,
  type Document,
  type InsertDocument,
  type StarExample,
  type InsertStarExample,
  type NhsJob,
  type InsertNhsJob,
  type JobMatch,
  type InsertJobMatch,
  type UserFile,
  type InsertUserFile,
  type ValuesAssessment,
  type InsertValuesAssessment,
  type InterviewQuestion,
  type InsertInterviewQuestion,
  type AiPrompt,
  type InsertAiPrompt,
  type UserActivity,
  type InsertUserActivity,
  type NewsArticle,
  type InsertNewsArticle,
  type LearningResource,
  type InsertLearningResource,
  type SupportArticle,
  type InsertSupportArticle,
  type GdprConsent,
  type InsertGdprConsent,
  type DataSubjectRequest,
  type InsertDataSubjectRequest,
  type DataAccessLog,
  type InsertDataAccessLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, ilike, or, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  updateUserLimits(userId: string, limits: any): Promise<void>;
  upgradeUserToPaid(userId: string, stripeCustomerId: string): Promise<User>;
  updateUserPremiumStatus(userId: string, isPremium: boolean): Promise<User>;
  updateDashboardCardOrder(userId: string, cardOrder: string[]): Promise<void>;
  suspendUser(
    userId: string,
    reason?: string,
    suspendedBy?: string
  ): Promise<User>;
  unsuspendUser(userId: string, unsuspendedBy?: string): Promise<User>;

  // Profile operations
  getProfile(userId: string): Promise<Profile | undefined>;
  upsertProfile(profile: InsertProfile): Promise<Profile>;

  // Application operations
  getApplications(userId: string): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(
    id: string,
    updates: Partial<Application>
  ): Promise<Application>;
  updateApplicationNotes(
    id: string,
    userId: string,
    notes: string
  ): Promise<Application>;
  deleteApplication(id: string, userId: string): Promise<void>;

  // Interview session operations
  getInterviewSessions(userId: string): Promise<InterviewSession[]>;
  createInterviewSession(
    session: InsertInterviewSession
  ): Promise<InterviewSession>;
  getLatestInterviewScore(userId: string): Promise<number | undefined>;

  // Interview attempt operations
  saveInterviewAttempt(
    attempt: InsertInterviewAttempt
  ): Promise<InterviewAttempt>;
  getLastInterviewAttempts(
    userId: string,
    limit?: number
  ): Promise<InterviewAttempt[]>;

  // Document operations
  getDocuments(userId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  getLatestDocument(
    userId: string,
    type: string
  ): Promise<Document | undefined>;

  // STAR examples operations
  getStarExamples(userId: string): Promise<StarExample[]>;
  createStarExample(example: InsertStarExample): Promise<StarExample>;
  updateStarExample(
    id: string,
    updates: Partial<StarExample>
  ): Promise<StarExample>;
  deleteStarExample(id: string): Promise<void>;

  // NHS Jobs operations
  getNhsJobs(filters?: any): Promise<NhsJob[]>;
  createNhsJob(job: InsertNhsJob): Promise<NhsJob>;
  updateNhsJob(id: string, updates: Partial<NhsJob>): Promise<NhsJob>;
  getFeaturedJobs(): Promise<NhsJob[]>;
  searchJobs(query: string, filters?: any): Promise<NhsJob[]>;

  // Job matching operations
  getJobMatches(userId: string): Promise<JobMatch[]>;
  createJobMatch(match: InsertJobMatch): Promise<JobMatch>;
  getJobMatchScore(userId: string, jobId: string): Promise<number | undefined>;

  // File operations
  getUserFiles(userId: string): Promise<UserFile[]>;
  createUserFile(file: InsertUserFile): Promise<UserFile>;
  deleteUserFile(id: string): Promise<void>;

  // Values assessment operations
  getValuesAssessment(userId: string): Promise<ValuesAssessment | undefined>;
  createValuesAssessment(
    assessment: InsertValuesAssessment
  ): Promise<ValuesAssessment>;

  // Interview questions operations
  getInterviewQuestions(
    category?: string,
    difficulty?: string
  ): Promise<InterviewQuestion[]>;
  createInterviewQuestion(
    question: InsertInterviewQuestion
  ): Promise<InterviewQuestion>;

  // AI prompts operations (admin only)
  getActivePrompt(name: string): Promise<AiPrompt | undefined>;
  createAiPrompt(prompt: InsertAiPrompt): Promise<AiPrompt>;
  updateAiPrompt(id: string, updates: Partial<AiPrompt>): Promise<AiPrompt>;
  getAllPrompts(): Promise<AiPrompt[]>;

  // Admin operations
  makeUserAdmin(
    userId: string,
    adminRole: string,
    createdBy?: string
  ): Promise<User>;
  revokeUserAdmin(userId: string, revokedBy?: string): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUserStats(): Promise<any>;
  getSystemAnalytics(): Promise<any>;
  createAdminActivityLog(log: any): Promise<any>;

  // Content management
  getAdminContent(contentKey?: string): Promise<any>;
  updateAdminContent(
    contentKey: string,
    content: any,
    editedBy: string
  ): Promise<any>;

  // AI Prompt management
  getAiPrompts(category?: string): Promise<any>;
  updateAiPrompt(
    promptKey: string,
    prompt: any,
    editedBy: string
  ): Promise<any>;
  createAiPrompt(prompt: any): Promise<any>;

  // User activity tracking
  logUserActivity(activity: InsertUserActivity): Promise<UserActivity>;
  getUserActivity(userId: string, limit?: number): Promise<UserActivity[]>;
  getActivityStats(days?: number): Promise<any>;

  // News management
  getNewsArticles(): Promise<NewsArticle[]>;
  createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle>;
  updateNewsArticle(
    id: string,
    updates: Partial<NewsArticle>
  ): Promise<NewsArticle>;
  deleteNewsArticle(id: string): Promise<void>;

  // GDPR Compliance operations
  recordConsent(consent: InsertGdprConsent): Promise<GdprConsent>;
  getUserConsents(userId: string): Promise<GdprConsent[]>;
  updateConsent(
    userId: string,
    consentType: string,
    consentGiven: boolean,
    ipAddress?: string,
    userAgent?: string
  ): Promise<GdprConsent>;
  withdrawConsent(
    userId: string,
    consentType: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<GdprConsent>;

  // Data Subject Requests
  createDataSubjectRequest(
    request: InsertDataSubjectRequest
  ): Promise<DataSubjectRequest>;
  getDataSubjectRequests(userId: string): Promise<DataSubjectRequest[]>;
  updateDataSubjectRequest(
    id: string,
    updates: Partial<DataSubjectRequest>
  ): Promise<DataSubjectRequest>;
  getAllDataSubjectRequests(): Promise<any[]>;

  // Data Access Logging
  logDataAccess(log: InsertDataAccessLog): Promise<DataAccessLog>;
  getDataAccessLogs(userId: string): Promise<DataAccessLog[]>;

  // Data Export for GDPR requests
  getUserDataExport(userId: string): Promise<any>;
  anonymizeUserData(userId: string): Promise<void>;
  deleteUserData(userId: string): Promise<void>;

  // Learning Resources operations
  getLearningResources(): Promise<LearningResource[]>;
  createLearningResource(resource: InsertLearningResource): Promise<LearningResource>;
  updateLearningResource(id: string, updates: Partial<LearningResource>): Promise<LearningResource>;
  deleteLearningResource(id: string): Promise<void>;

  // News Articles operations
  getNewsArticles(): Promise<NewsArticle[]>;
  createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle>;
  updateNewsArticle(id: string, updates: Partial<NewsArticle>): Promise<NewsArticle>;
  deleteNewsArticle(id: string): Promise<void>;

  // Support Articles operations
  getSupportArticles(): Promise<SupportArticle[]>;
  createSupportArticle(article: InsertSupportArticle): Promise<SupportArticle>;
  updateSupportArticle(id: string, updates: Partial<SupportArticle>): Promise<SupportArticle>;
  deleteSupportArticle(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserLimits(userId: string, limits: any): Promise<void> {
    await db
      .update(users)
      .set({
        freeTierLimits: limits,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async upgradeUserToPaid(
    userId: string,
    stripeCustomerId: string
  ): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        subscriptionStatus: "paid",
        stripeCustomerId,
        paymentDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserPremiumStatus(
    userId: string,
    isPremium: boolean
  ): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        subscriptionStatus: isPremium ? "paid" : "free",
        paymentDate: isPremium ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateDashboardCardOrder(
    userId: string,
    cardOrder: string[]
  ): Promise<void> {
    await db
      .update(users)
      .set({
        dashboardCardOrder: cardOrder,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId));
    return profile;
  }

  async upsertProfile(profileData: InsertProfile): Promise<Profile> {
    const existing = await this.getProfile(profileData.userId);

    // Calculate completion percentage based on filled fields
    const completion = this.calculateProfileCompletion(profileData);
    const dataWithCompletion = {
      ...profileData,
      completionPercentage: completion,
    };

    if (existing) {
      const [profile] = await db
        .update(profiles)
        .set({ ...dataWithCompletion, updatedAt: new Date() })
        .where(eq(profiles.userId, profileData.userId))
        .returning();
      return profile;
    } else {
      const [profile] = await db
        .insert(profiles)
        .values(dataWithCompletion)
        .returning();
      return profile;
    }
  }

  private calculateProfileCompletion(profileData: any): number {
    // Core sections with different weights
    const sections = {
      // Basic Information (30% weight)
      basicInfo: {
        weight: 30,
        fields: [
          profileData.profession,
          profileData.registrationNumber,
          profileData.email,
          profileData.phone,
          profileData.city,
          profileData.country,
          profileData.yearsExperience,
          profileData.visaStatus,
        ],
      },
      // Skills (20% weight)
      skills: {
        weight: 20,
        filled: profileData.skills && profileData.skills.length > 0,
      },
      // Work Experience (25% weight)
      workExperience: {
        weight: 25,
        filled:
          profileData.workExperience && profileData.workExperience.length > 0,
      },
      // Education (15% weight)
      education: {
        weight: 15,
        filled: profileData.education && profileData.education.length > 0,
      },
      // Courses (10% weight)
      courses: {
        weight: 10,
        filled: profileData.courses && profileData.courses.length > 0,
      },
    };

    let totalScore = 0;

    // Calculate basic info score
    const filledBasicFields = sections.basicInfo.fields.filter(
      (field) => field !== null && field !== undefined && field !== ""
    ).length;
    const basicInfoScore =
      (filledBasicFields / sections.basicInfo.fields.length) *
      sections.basicInfo.weight;
    totalScore += basicInfoScore;

    // Add scores for other sections
    if (sections.skills.filled) totalScore += sections.skills.weight;
    if (sections.workExperience.filled)
      totalScore += sections.workExperience.weight;
    if (sections.education.filled) totalScore += sections.education.weight;
    if (sections.courses.filled) totalScore += sections.courses.weight;

    return Math.round(totalScore);
  }

  async getApplications(userId: string): Promise<Application[]> {
    return await db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.createdAt));
  }

  async createApplication(
    applicationData: InsertApplication
  ): Promise<Application> {
    const [application] = await db
      .insert(applications)
      .values(applicationData)
      .returning();
    return application;
  }

  async updateApplication(
    id: string,
    updates: Partial<Application>
  ): Promise<Application> {
    const [application] = await db
      .update(applications)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();
    return application;
  }

  async updateApplicationNotes(
    id: string,
    userId: string,
    notes: string
  ): Promise<Application> {
    const [application] = await db
      .update(applications)
      .set({ notes: notes || null, updatedAt: new Date() })
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .returning();
    if (!application) {
      throw new Error("Application not found or not authorized");
    }
    return application;
  }

  async deleteApplication(id: string, userId: string): Promise<void> {
    // Ensure the application exists and belongs to the user before deleting.
    const [existing] = await db
      .select()
      .from(applications)
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new Error("Application not found or not authorized");
    }

    // Perform the delete; this should remove the row for real.
    await db.delete(applications).where(and(eq(applications.id, id), eq(applications.userId, userId)));
  }



  async getInterviewSessions(userId: string): Promise<InterviewSession[]> {
    return await db
      .select()
      .from(interviewSessions)
      .where(eq(interviewSessions.userId, userId))
      .orderBy(desc(interviewSessions.createdAt));
  }

  async createInterviewSession(
    sessionData: InsertInterviewSession
  ): Promise<InterviewSession> {
    const [session] = await db
      .insert(interviewSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async getLatestInterviewScore(userId: string): Promise<number | undefined> {
    const [session] = await db
      .select()
      .from(interviewSessions)
      .where(eq(interviewSessions.userId, userId))
      .orderBy(desc(interviewSessions.createdAt))
      .limit(1);
    return session?.score || undefined;
  }

  async saveInterviewAttempt(
    attemptData: InsertInterviewAttempt
  ): Promise<InterviewAttempt> {
    const [attempt] = await db
      .insert(interviewAttempts)
      .values(attemptData)
      .returning();
    return attempt;
  }

  async getLastInterviewAttempts(
    userId: string,
    limit: number = 3
  ): Promise<InterviewAttempt[]> {
    return await db
      .select()
      .from(interviewAttempts)
      .where(eq(interviewAttempts.userId, userId))
      .orderBy(desc(interviewAttempts.createdAt))
      .limit(limit);
  }

  async getDocuments(userId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(and(eq(documents.userId, userId), eq(documents.isActive, true)))
      .orderBy(desc(documents.createdAt));
  }

  async createDocument(documentData: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(documentData)
      .returning();
    return document;
  }

  async getLatestDocument(
    userId: string,
    type: string
  ): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.userId, userId),
          eq(documents.type, type),
          eq(documents.isActive, true)
        )
      )
      .orderBy(desc(documents.createdAt))
      .limit(1);
    return document;
  }

  // STAR examples operations
  async getStarExamples(userId: string): Promise<StarExample[]> {
    return await db
      .select()
      .from(starExamples)
      .where(eq(starExamples.userId, userId))
      .orderBy(desc(starExamples.createdAt));
  }

  async createStarExample(
    exampleData: InsertStarExample
  ): Promise<StarExample> {
    const [example] = await db
      .insert(starExamples)
      .values(exampleData)
      .returning();
    return example;
  }

  async updateStarExample(
    id: string,
    updates: Partial<StarExample>
  ): Promise<StarExample> {
    const [example] = await db
      .update(starExamples)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(starExamples.id, id))
      .returning();
    return example;
  }

  async deleteStarExample(id: string): Promise<void> {
    await db.delete(starExamples).where(eq(starExamples.id, id));
  }

  // NHS Jobs operations
  async getNhsJobs(filters?: any): Promise<NhsJob[]> {
    const conditions = [eq(nhsJobs.isActive, true)];

    if (filters?.band) {
      conditions.push(eq(nhsJobs.band, filters.band));
    }
    if (filters?.location) {
      conditions.push(like(nhsJobs.location, `%${filters.location}%`));
    }
    if (filters?.visaSponsorship) {
      conditions.push(eq(nhsJobs.visaSponsorship, true));
    }

    return await db
      .select()
      .from(nhsJobs)
      .where(and(...conditions))
      .orderBy(desc(nhsJobs.createdAt))
      .limit(50);
  }

  async createNhsJob(jobData: InsertNhsJob): Promise<NhsJob> {
    const [job] = await db.insert(nhsJobs).values(jobData).returning();
    return job;
  }

  async updateNhsJob(id: string, updates: Partial<NhsJob>): Promise<NhsJob> {
    const [job] = await db
      .update(nhsJobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(nhsJobs.id, id))
      .returning();
    return job;
  }

  async getFeaturedJobs(): Promise<NhsJob[]> {
    return await db
      .select()
      .from(nhsJobs)
      .where(and(eq(nhsJobs.isActive, true), eq(nhsJobs.featured, true)))
      .orderBy(desc(nhsJobs.createdAt))
      .limit(10);
  }

  async searchJobs(query: string, filters?: any): Promise<NhsJob[]> {
    const conditions = [
      eq(nhsJobs.isActive, true),
      or(
        like(nhsJobs.title, `%${query}%`),
        like(nhsJobs.description, `%${query}%`),
        like(nhsJobs.employer, `%${query}%`)
      ),
    ];

    if (filters?.band) {
      conditions.push(eq(nhsJobs.band, filters.band));
    }

    return await db
      .select()
      .from(nhsJobs)
      .where(and(...conditions))
      .orderBy(desc(nhsJobs.createdAt))
      .limit(50);
  }

  // Job matching operations
  async getJobMatches(userId: string): Promise<JobMatch[]> {
    return await db
      .select()
      .from(jobMatches)
      .where(eq(jobMatches.userId, userId))
      .orderBy(desc(jobMatches.fitScore));
  }

  async createJobMatch(matchData: InsertJobMatch): Promise<JobMatch> {
    const [match] = await db.insert(jobMatches).values(matchData).returning();
    return match;
  }

  async getJobMatchScore(
    userId: string,
    jobId: string
  ): Promise<number | undefined> {
    const [match] = await db
      .select()
      .from(jobMatches)
      .where(and(eq(jobMatches.userId, userId), eq(jobMatches.jobId, jobId)))
      .limit(1);
    return match?.fitScore || undefined;
  }

  // File operations
  async getUserFiles(userId: string): Promise<UserFile[]> {
    return await db
      .select()
      .from(userFiles)
      .where(eq(userFiles.userId, userId))
      .orderBy(desc(userFiles.uploadedAt));
  }

  async createUserFile(fileData: InsertUserFile): Promise<UserFile> {
    const [file] = await db.insert(userFiles).values(fileData).returning();
    return file;
  }

  async deleteUserFile(id: string): Promise<void> {
    await db.delete(userFiles).where(eq(userFiles.id, id));
  }

  // Values assessment operations
  async getValuesAssessment(
    userId: string
  ): Promise<ValuesAssessment | undefined> {
    const [assessment] = await db
      .select()
      .from(valuesAssessment)
      .where(eq(valuesAssessment.userId, userId))
      .orderBy(desc(valuesAssessment.completedAt))
      .limit(1);
    return assessment;
  }

  async createValuesAssessment(
    assessmentData: InsertValuesAssessment
  ): Promise<ValuesAssessment> {
    const [assessment] = await db
      .insert(valuesAssessment)
      .values(assessmentData)
      .returning();
    return assessment;
  }

  // Interview questions operations
  async getInterviewQuestions(
    category?: string,
    difficulty?: string
  ): Promise<InterviewQuestion[]> {
    const conditions = [];
    if (category) conditions.push(eq(interviewQuestions.category, category));
    if (difficulty)
      conditions.push(eq(interviewQuestions.difficulty, difficulty));

    if (conditions.length > 0) {
      return await db
        .select()
        .from(interviewQuestions)
        .where(and(...conditions))
        .orderBy(desc(interviewQuestions.createdAt));
    } else {
      return await db
        .select()
        .from(interviewQuestions)
        .orderBy(desc(interviewQuestions.createdAt));
    }
  }

  async createInterviewQuestion(
    questionData: InsertInterviewQuestion
  ): Promise<InterviewQuestion> {
    const [question] = await db
      .insert(interviewQuestions)
      .values(questionData)
      .returning();
    return question;
  }

  // AI prompts operations (admin only)
  async getActivePrompt(name: string): Promise<AiPrompt | undefined> {
    const [prompt] = await db
      .select()
      .from(aiPrompts)
      .where(and(eq(aiPrompts.name, name), eq(aiPrompts.isActive, true)))
      .orderBy(desc(aiPrompts.createdAt))
      .limit(1);
    return prompt;
  }

  async createAiPrompt(promptData: InsertAiPrompt): Promise<AiPrompt> {
    const [prompt] = await db.insert(aiPrompts).values(promptData).returning();
    return prompt;
  }

  async updateAiPrompt(
    promptKey: string,
    updates: Partial<AiPrompt>,
    editedBy: string
  ): Promise<AiPrompt> {
    const [prompt] = await db
      .update(aiPrompts)
      .set({ ...updates, lastEditedBy: editedBy, updatedAt: new Date() })
      .where(eq(aiPrompts.promptKey, promptKey))
      .returning();
    return prompt;
  }

  async getAllPrompts(): Promise<AiPrompt[]> {
    return await db.select().from(aiPrompts).orderBy(desc(aiPrompts.createdAt));
  }

  // Admin operations
  async makeUserAdmin(
    userId: string,
    adminRole: string,
    createdBy?: string
  ): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        isAdmin: true,
        adminRole,
        adminCreatedBy: createdBy,
        adminCreatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async revokeUserAdmin(userId: string, revokedBy?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        isAdmin: false,
        adminRole: null,
        adminCreatedBy: null,
        adminCreatedAt: null,
        adminUpdatedBy: revokedBy,
        adminUpdatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete user data in proper order to maintain referential integrity
    await db.transaction(async (tx) => {
      // Delete user files first
      await tx.delete(userFiles).where(eq(userFiles.userId, userId));
      
      // Delete job matches
      await tx.delete(jobMatches).where(eq(jobMatches.userId, userId));
      
      // Delete values assessment
      await tx.delete(valuesAssessment).where(eq(valuesAssessment.userId, userId));
      
      // Delete interview attempts
      await tx.delete(interviewAttempts).where(eq(interviewAttempts.userId, userId));
      
      // Delete related records
      await tx.delete(userActivity).where(eq(userActivity.userId, userId));
      await tx.delete(applications).where(eq(applications.userId, userId));
      await tx.delete(documents).where(eq(documents.userId, userId));
      await tx.delete(starExamples).where(eq(starExamples.userId, userId));
      await tx
        .delete(interviewSessions)
        .where(eq(interviewSessions.userId, userId));
      
      // Q&A generator data
      await tx
        .delete(qaProgress)
        .where(
          sql`${qaProgress.sessionId} IN (SELECT id FROM ${qaSessions} WHERE ${qaSessions.userId} = ${userId})`
        );
      await tx
        .delete(qaQuestions)
        .where(
          sql`${qaQuestions.sessionId} IN (SELECT id FROM ${qaSessions} WHERE ${qaSessions.userId} = ${userId})`
        );
      await tx.delete(qaSessions).where(eq(qaSessions.userId, userId));
      await tx.delete(profiles).where(eq(profiles.userId, userId));

      // Delete GDPR and data access logs
      await tx.delete(dataAccessLogs).where(eq(dataAccessLogs.userId, userId));
      await tx
        .delete(dataSubjectRequests)
        .where(eq(dataSubjectRequests.userId, userId));
      await tx.delete(gdprConsents).where(eq(gdprConsents.userId, userId));

      // Delete usage tracking data
      await tx
        .delete(aiUsageTracking)
        .where(eq(aiUsageTracking.userId, userId));
      await tx
        .delete(usageViolations)
        .where(eq(usageViolations.userId, userId));
      await tx
        .delete(userRestrictions)
        .where(eq(userRestrictions.userId, userId));

      // Delete admin activity logs (both as admin and as target)
      await tx
        .delete(adminActivityLogs)
        .where(eq(adminActivityLogs.adminId, userId));
      await tx
        .delete(adminActivityLogs)
        .where(eq(adminActivityLogs.targetId, userId));

      // Finally delete the user
      await tx.delete(users).where(eq(users.id, userId));
    });
  }

  async suspendUser(
    userId: string,
    reason?: string,
    suspendedBy?: string
  ): Promise<User> {
    // First get the current user to store their previous subscription status
    const currentUser = await this.getUser(userId);
    if (!currentUser) {
      throw new Error("User not found");
    }

    const [user] = await db
      .update(users)
      .set({
        isSuspended: true,
        suspendedBy,
        suspendedAt: new Date(),
        suspensionReason: reason,
        previousSubscriptionStatus: currentUser.subscriptionStatus, // Store previous status
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async unsuspendUser(userId: string, unsuspendedBy?: string): Promise<User> {
    // Get the current user to restore their previous subscription status
    const currentUser = await this.getUser(userId);
    if (!currentUser) {
      throw new Error("User not found");
    }

    const [user] = await db
      .update(users)
      .set({
        isSuspended: false,
        suspendedBy: null,
        suspendedAt: null,
        suspensionReason: null,
        subscriptionStatus: currentUser.previousSubscriptionStatus || "free", // Restore previous status
        previousSubscriptionStatus: null, // Clear the stored status
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserByAdmin(
    userId: string,
    updates: Partial<User>,
    updatedBy: string
  ): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        adminUpdatedBy: updatedBy,
        adminUpdatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getSystemHealth(): Promise<any> {
    try {
      // Check database connectivity
      const dbTest = await db.select({ count: sql`count(*)` }).from(users);
      const dbStatus = dbTest ? "healthy" : "error";

      // Get error count from last 24 hours (if we had error logs table)
      const errorCount = 0; // Placeholder

      // Calculate uptime (simplified)
      const uptimeMs = process.uptime() * 1000;
      const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
      const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
      const uptime = `${hours}h ${minutes}m`;

      return {
        dbStatus,
        aiServiceStatus: "healthy", // We'd check Gemini API if needed
        paymentServiceStatus: "healthy", // We'd check Stripe if needed
        errorCount,
        avgResponseTime: 150, // Placeholder - would calculate from logs
        uptime,
      };
    } catch (error) {
      console.error("System health check error:", error);
      return {
        dbStatus: "error",
        aiServiceStatus: "unknown",
        paymentServiceStatus: "unknown",
        errorCount: 1,
        avgResponseTime: 0,
        uptime: "0h 0m",
      };
    }
  }

  async getUserStats(): Promise<any> {
    const totalUsers = await db.select({ count: sql`count(*)` }).from(users);

    const activeUsers = await db.select({ count: sql`count(*)` }).from(users);

    const paidUsers = await db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(eq(users.subscriptionStatus, "paid"));

    return {
      totalUsers: totalUsers[0]?.count || 0,
      activeUsers: activeUsers[0]?.count || 0,
      paidUsers: paidUsers[0]?.count || 0,
    };
  }

  // User activity tracking
  async logUserActivity(activity: InsertUserActivity): Promise<UserActivity> {
    const [userActivityRecord] = await db
      .insert(userActivity)
      .values(activity)
      .returning();
    return userActivityRecord;
  }

  async getUserActivity(
    userId: string,
    limit: number = 50
  ): Promise<UserActivity[]> {
    return await db
      .select()
      .from(userActivity)
      .where(eq(userActivity.userId, userId))
      .orderBy(desc(userActivity.createdAt))
      .limit(limit);
  }

  async getActivityStats(days: number = 7): Promise<any> {
    const startDate = sql`NOW() - INTERVAL '${days} days'`;

    const loginCount = await db
      .select({ count: sql`count(*)` })
      .from(userActivity)
      .where(
        and(
          eq(userActivity.activityType, "login"),
          sql`created_at > ${startDate}`
        )
      );

    const jobSearchCount = await db
      .select({ count: sql`count(*)` })
      .from(userActivity)
      .where(
        and(
          eq(userActivity.activityType, "job_search"),
          sql`created_at > ${startDate}`
        )
      );

    const applicationsSent = await db
      .select({ count: sql`count(*)` })
      .from(userActivity)
      .where(
        and(
          eq(userActivity.activityType, "application_sent"),
          sql`created_at > ${startDate}`
        )
      );

    return {
      logins: loginCount[0]?.count || 0,
      jobSearches: jobSearchCount[0]?.count || 0,
      applicationsSent: applicationsSent[0]?.count || 0,
    };
  }

  // News management
  async getNewsArticles(): Promise<NewsArticle[]> {
    return await db
      .select()
      .from(newsArticles)
      .orderBy(desc(newsArticles.createdAt));
  }

  async createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle> {
    const [newsArticle] = await db
      .insert(newsArticles)
      .values(article)
      .returning();
    return newsArticle;
  }

  async updateNewsArticle(
    id: string,
    updates: Partial<NewsArticle>
  ): Promise<NewsArticle> {
    const [newsArticle] = await db
      .update(newsArticles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(newsArticles.id, id))
      .returning();
    return newsArticle;
  }

  async deleteNewsArticle(id: string): Promise<void> {
    await db.delete(newsArticles).where(eq(newsArticles.id, id));
  }

  // Support management
  async getSupportArticles(): Promise<SupportArticle[]> {
    return await db
      .select()
      .from(supportArticles)
      .orderBy(desc(supportArticles.createdAt));
  }

  async createSupportArticle(article: InsertSupportArticle): Promise<SupportArticle> {
    const [supportArticle] = await db
      .insert(supportArticles)
      .values(article)
      .returning();
    return supportArticle;
  }

  async updateSupportArticle(
    id: string,
    updates: Partial<SupportArticle>
  ): Promise<SupportArticle> {
    const [supportArticle] = await db
      .update(supportArticles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(supportArticles.id, id))
      .returning();
    return supportArticle;
  }

  async deleteSupportArticle(id: string): Promise<void> {
    await db.delete(supportArticles).where(eq(supportArticles.id, id));
  }

  // GDPR Compliance implementations
  async recordConsent(consent: InsertGdprConsent): Promise<GdprConsent> {
    const [gdprConsent] = await db
      .insert(gdprConsents)
      .values(consent)
      .returning();
    return gdprConsent;
  }

  async getUserConsents(userId: string): Promise<GdprConsent[]> {
    return await db
      .select()
      .from(gdprConsents)
      .where(eq(gdprConsents.userId, userId))
      .orderBy(desc(gdprConsents.consentDate));
  }

  async updateConsent(
    userId: string,
    consentType: string,
    consentGiven: boolean,
    ipAddress?: string,
    userAgent?: string
  ): Promise<GdprConsent> {
    // First, mark the previous consent as withdrawn if consent is being withdrawn
    if (!consentGiven) {
      await db
        .update(gdprConsents)
        .set({ consentWithdrawnDate: new Date() })
        .where(
          and(
            eq(gdprConsents.userId, userId),
            eq(gdprConsents.consentType, consentType),
            eq(gdprConsents.consentGiven, true)
          )
        );
    }

    // Create new consent record
    const [consent] = await db
      .insert(gdprConsents)
      .values({
        userId,
        consentType,
        consentGiven,
        legalBasis: consentGiven ? "consent" : "consent",
        ipAddress,
        userAgent,
        consentVersion: "1.0",
      })
      .returning();

    return consent;
  }

  async withdrawConsent(
    userId: string,
    consentType: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<GdprConsent> {
    return this.updateConsent(userId, consentType, false, ipAddress, userAgent);
  }

  async createDataSubjectRequest(
    request: InsertDataSubjectRequest
  ): Promise<DataSubjectRequest> {
    const [dataRequest] = await db
      .insert(dataSubjectRequests)
      .values(request)
      .returning();
    return dataRequest;
  }

  async getDataSubjectRequests(userId: string): Promise<DataSubjectRequest[]> {
    return await db
      .select()
      .from(dataSubjectRequests)
      .where(eq(dataSubjectRequests.userId, userId))
      .orderBy(desc(dataSubjectRequests.submittedDate));
  }

  async getAllDataSubjectRequests(): Promise<any[]> {
    return await db
      .select({
        id: dataSubjectRequests.id,
        userId: dataSubjectRequests.userId,
        userEmail: users.email,
        userName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, 'Unknown User')`,
        requestType: dataSubjectRequests.requestType,
        requestDetails: dataSubjectRequests.requestDetails,
        status: dataSubjectRequests.status,
        submittedDate: dataSubjectRequests.submittedDate,
        completedDate: dataSubjectRequests.completedDate,
        adminNotes: dataSubjectRequests.adminNotes,
        referenceId: dataSubjectRequests.referenceId,
        verificationMethod: dataSubjectRequests.verificationMethod,
      })
      .from(dataSubjectRequests)
      .leftJoin(users, eq(dataSubjectRequests.userId, users.id))
      .orderBy(desc(dataSubjectRequests.submittedDate));
  }

  async updateDataSubjectRequestStatus(
    requestId: string,
    status: string,
    adminNotes?: string,
    adminUserId?: string
  ): Promise<DataSubjectRequest> {
    const [updated] = await db
      .update(dataSubjectRequests)
      .set({
        status,
        adminNotes,
        completedDate: status === "completed" ? new Date() : undefined,
        adminUpdatedBy: adminUserId,
        adminUpdatedAt: new Date(),
      })
      .where(eq(dataSubjectRequests.id, requestId))
      .returning();
    return updated;
  }

  async updateDataSubjectRequest(
    id: string,
    updates: Partial<DataSubjectRequest>
  ): Promise<DataSubjectRequest> {
    const [request] = await db
      .update(dataSubjectRequests)
      .set(updates)
      .where(eq(dataSubjectRequests.id, id))
      .returning();
    return request;
  }

  async logDataAccess(log: InsertDataAccessLog): Promise<DataAccessLog> {
    const [accessLog] = await db.insert(dataAccessLogs).values(log).returning();
    return accessLog;
  }

  async getDataAccessLogs(userId: string): Promise<DataAccessLog[]> {
    return await db
      .select()
      .from(dataAccessLogs)
      .where(eq(dataAccessLogs.userId, userId))
      .orderBy(desc(dataAccessLogs.timestamp));
  }

  async getUserDataExport(userId: string): Promise<any> {
    // Comprehensive data export for GDPR requests - optimized with parallel queries
    const [
      user,
      profile,
      applications,
      documents,
      starExamples,
      interviewSessions,
      consents,
      dataRequests,
      accessLogs,
      userFiles,
      activity,
    ] = await Promise.all([
      this.getUser(userId),
      this.getProfile(userId),
      this.getApplications(userId),
      this.getDocuments(userId),
      this.getStarExamples(userId),
      this.getInterviewSessions(userId),
      this.getUserConsents(userId),
      this.getDataSubjectRequests(userId),
      this.getDataAccessLogs(userId),
      this.getUserFiles(userId),
      this.getUserActivity(userId),
    ]);

    return {
      exportDate: new Date().toISOString(),
      personalInformation: {
        user,
        profile,
        consents: consents.map((c) => ({
          consentType: c.consentType,
          consentGiven: c.consentGiven,
          consentDate: c.consentDate,
          consentWithdrawnDate: c.consentWithdrawnDate,
          legalBasis: c.legalBasis,
        })),
      },
      applicationData: applications,
      documents: documents.map((d) => ({
        type: d.type,
        title: d.title,
        version: d.version,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
      starExamples,
      interviewData: interviewSessions,
      userFiles: userFiles.map((f) => ({
        fileName: f.fileName,
        fileType: f.fileType,
        uploadedAt: f.uploadedAt,
      })),
      gdprRequests: dataRequests,
      accessHistory: accessLogs,
      activityHistory: activity,
      dataProcessingInfo: {
        purposes: [
          "Job matching",
          "CV generation",
          "Interview practice",
          "Application tracking",
        ],
        legalBasis: "Consent and legitimate interest",
        retention: "Data retained for 7 years or until account deletion",
        thirdPartySharing: "No data shared with third parties without consent",
      },
    };
  }

  async anonymizeUserData(userId: string): Promise<void> {
    // Anonymize sensitive data while preserving statistical data
    await db.transaction(async (tx) => {
      // Anonymize user record
      await tx
        .update(users)
        .set({
          email: `anonymized_${userId}@deleted.local`,
          firstName: "Deleted",
          lastName: "User",
          profileImageUrl: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Anonymize profile
      await tx
        .update(profiles)
        .set({
          email: `anonymized_${userId}@deleted.local`,
          phone: null,
          registrationNumber: null,
          updatedAt: new Date(),
        })
        .where(eq(profiles.userId, userId));

      // Remove documents content but keep metadata for statistics
      await tx
        .update(documents)
        .set({
          content: null,
          title: "Deleted Document",
          updatedAt: new Date(),
        })
        .where(eq(documents.userId, userId));

      // Remove STAR examples content
      await tx
        .update(starExamples)
        .set({
          title: "Deleted Example",
          situation: "Content deleted",
          task: "Content deleted",
          action: "Content deleted",
          result: "Content deleted",
          updatedAt: new Date(),
        })
        .where(eq(starExamples.userId, userId));
    });
  }

  async deleteUserData(userId: string): Promise<void> {
    // Complete data deletion for erasure requests
    await db.transaction(async (tx) => {
      // Delete in order to respect foreign key constraints
      await tx.delete(dataAccessLogs).where(eq(dataAccessLogs.userId, userId));
      await tx
        .delete(dataSubjectRequests)
        .where(eq(dataSubjectRequests.userId, userId));
      await tx.delete(gdprConsents).where(eq(gdprConsents.userId, userId));
      await tx.delete(userActivity).where(eq(userActivity.userId, userId));
      await tx.delete(userFiles).where(eq(userFiles.userId, userId));
      await tx.delete(jobMatches).where(eq(jobMatches.userId, userId));
      await tx.delete(starExamples).where(eq(starExamples.userId, userId));
      await tx.delete(documents).where(eq(documents.userId, userId));
      await tx
        .delete(interviewSessions)
        .where(eq(interviewSessions.userId, userId));
      // Q&A generator data
      await tx
        .delete(qaProgress)
        .where(
          sql`${qaProgress.sessionId} IN (SELECT id FROM ${qaSessions} WHERE ${qaSessions.userId} = ${userId})`
        );
      await tx
        .delete(qaQuestions)
        .where(
          sql`${qaQuestions.sessionId} IN (SELECT id FROM ${qaSessions} WHERE ${qaSessions.userId} = ${userId})`
        );
      await tx.delete(qaSessions).where(eq(qaSessions.userId, userId));
      await tx.delete(applications).where(eq(applications.userId, userId));
      await tx.delete(profiles).where(eq(profiles.userId, userId));
      await tx.delete(users).where(eq(users.id, userId));
    });
  }

  // Additional Admin Methods
  async getSystemAnalytics(): Promise<any> {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalUsers = await db.select({ count: sql`count(*)` }).from(users);
    const paidUsers = await db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(eq(users.subscriptionStatus, "paid"));
    const freeUsers = await db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(eq(users.subscriptionStatus, "free"));
    const recentUsers = await db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(sql`created_at > ${thirtyDaysAgo}`);
    const totalApplications = await db
      .select({ count: sql`count(*)` })
      .from(applications);
    const totalInterviews = await db
      .select({ count: sql`count(*)` })
      .from(interviewSessions);

    return {
      totalUsers: totalUsers[0]?.count || 0,
      freeUsers: freeUsers[0]?.count || 0,
      premiumUsers: paidUsers[0]?.count || 0,
      newSignups: recentUsers[0]?.count || 0,
      totalApplications: totalApplications[0]?.count || 0,
      totalInterviewSessions: totalInterviews[0]?.count || 0,
      lastUpdated: new Date(),
    };
  }

  async createAdminActivityLog(logData: any): Promise<any> {
    const [log] = await db
      .insert(adminActivityLogs)
      .values(logData)
      .returning();
    return log;
  }

  async getAdminContent(contentKey?: string): Promise<any> {
    if (contentKey) {
      const [content] = await db
        .select()
        .from(adminContent)
        .where(eq(adminContent.contentKey, contentKey));
      return content;
    }
    return await db.select().from(adminContent).orderBy(adminContent.title);
  }

  async updateAdminContent(
    contentKey: string,
    contentData: any,
    editedBy: string
  ): Promise<any> {
    const [content] = await db
      .update(adminContent)
      .set({ ...contentData, lastEditedBy: editedBy, updatedAt: new Date() })
      .where(eq(adminContent.contentKey, contentKey))
      .returning();
    return content;
  }

  async getAiPrompts(category?: string): Promise<any> {
    const query = db.select().from(aiPrompts);
    if (category && category !== "all") {
      return await query
        .where(eq(aiPrompts.category, category))
        .orderBy(aiPrompts.name);
    }
    return await query.orderBy(aiPrompts.category, aiPrompts.name);
  }

  // Learning Resources implementation
  async getLearningResources(): Promise<LearningResource[]> {
    return await db
      .select()
      .from(learningResources)
      .orderBy(desc(learningResources.createdAt));
  }

  async createLearningResource(resource: InsertLearningResource): Promise<LearningResource> {
    const [newResource] = await db
      .insert(learningResources)
      .values(resource)
      .returning();
    return newResource;
  }

  async updateLearningResource(
    id: string, 
    updates: Partial<LearningResource>
  ): Promise<LearningResource> {
    const [updatedResource] = await db
      .update(learningResources)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(learningResources.id, id))
      .returning();
    return updatedResource;
  }

  async deleteLearningResource(id: string): Promise<void> {
    await db
      .delete(learningResources)
      .where(eq(learningResources.id, id));
  }
}

export const storage = new DatabaseStorage();
