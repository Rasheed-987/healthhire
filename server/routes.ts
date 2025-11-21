// Local auth replacement
import {
  setupLocalSession,
  localAuthMiddleware,
  ensureAuthenticated,
  registerLocalAuthRoutes,
  checkSuspensionStatus,
  hashPassword,
  verifyPassword,
  findUserByEmail,
} from "./localAuth.js";
import type { Express, RequestHandler } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// Deprecated Replit auth removed
import {
  insertProfileSchema,
  insertApplicationSchema,
  insertDocumentSchema,
  insertStarExampleSchema,
  interviewSessions,
  interviewQuestions,
  interviewResponses,
  qaSessions,
  qaQuestions,
  qaProgress,
  aiUsageTracking,
  usageViolations,
  userRestrictions,
  users,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  registerPaymentRoutes,
  registerStripeWebhook,
} from "./routes/payments";
import { registerAuthRoutes } from "./routes/auth";
import { sendInvitationEmail } from "./email";
import aiGeminiRoutes from "./routes/ai-gemini";
import { aiService } from "./ai-service";
import { NhsJobsService } from "./nhs-jobs-service";
import { ScotNhsJobsService } from "./scot-nhs-service";
import { HealthJobsUkService } from "./healthjobs-uk-service";
import { AIDocumentService } from "./ai-document-service";
import { geminiService } from "./gemini-service";
import { paymentService } from "./payment-service";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import {
  checkUsageRestrictions,
  getUserUsageStats,
  type AuthenticatedRequest,
} from "./middleware/usageMonitoring";
import {
  auditDataAccess,
  logApiDataAccess,
  logGdprDataExport,
} from "./middleware/auditLogging";
import { validateCSRFToken } from "./middleware/security";
import { randomUUID } from "crypto";
import { users } from "@shared/schema";
import { eq as drEq } from "drizzle-orm";
import {
  upload,
  uploadFileToGCS,
  deleteFileFromGCS,
  extractPathFromUrl,
} from "./gcsStorage";
import path from "path";
import puppeteer from 'puppeteer';

const nhsJobsService = new NhsJobsService();
const scotNhsJobsService = new ScotNhsJobsService();
const healthJobsUkService = new HealthJobsUkService();

const aiDocumentService = new AIDocumentService(); // Use Gemini instead of OpenAI
const objectStorageService = new ObjectStorageService();

// Check if object storage is configured (for cloud deployments)
const isObjectStorageConfigured = !!process.env.PRIVATE_OBJECT_DIR;

// Format date to Month/Year format
function formatDateToMonthYear(dateStr: string): string {
  if (!dateStr) return "";

  // Handle YYYY-MM format
  if (dateStr.match(/^\d{4}-\d{2}$/)) {
    const [year, month] = dateStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date
      .toLocaleDateString("en-GB", { month: "2-digit", year: "numeric" })
      .replace("/", "/");
  }

  // Handle YYYY format
  if (dateStr.match(/^\d{4}$/)) {
    return dateStr;
  }

  // Handle other formats - try to parse and format
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date
        .toLocaleDateString("en-GB", { month: "2-digit", year: "numeric" })
        .replace("/", "/");
    }
  } catch (error) {
    console.warn(`Failed to parse date string "${dateStr}":`, error);
  }

  return dateStr; // Return as-is if can't parse
}

// Helper function to generate CV HTML for PDF download
function generateCVHTML(cvData: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>CV - ${cvData.personalInfo.name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
          font-family: 'Calibri', 'Arial', sans-serif; 
          font-size: 11pt; 
          line-height: 1.5; 
          color: #333; 
          max-width: 8.5in;
          margin: 0 auto;
          padding: 0.75in;
          background: white;
        }
        
        .header { 
          text-align: center; 
          margin-bottom: 32px; 
          border-bottom: 2px solid #2c5aa0;
          padding-bottom: 20px;
        }
        
        .name { 
          font-size: 24pt; 
          font-weight: bold; 
          color: #2c5aa0; 
          margin-bottom: 8px; 
          text-transform: uppercase;
        }
        
        .contact { 
          font-size: 10pt; 
          color: #555;
          line-height: 1.4;
        }
        
        .contact-line { 
          margin: 2px 0; 
        }
        
        .section { 
          margin-bottom: 24px; 
          page-break-inside: avoid;
        }
        
        .section-title { 
          font-size: 12pt; 
          font-weight: bold; 
          color: #2c5aa0; 
          text-transform: uppercase;
          border-bottom: 1px solid #2c5aa0; 
          margin-bottom: 12px; 
          padding-bottom: 2px;
        }
        
        .experience-item, .education-item { 
          margin-bottom: 16px; 
          page-break-inside: avoid;
        }
        
        .job-title { 
          font-size: 11pt;
          font-weight: bold; 
          color: #2c5aa0;
          margin-bottom: 2px;
        }
        
        .job-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2px;
        }
        
        .current-badge {
          background: #dcfce7;
          color: #166534;
          font-size: 8pt;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 12px;
          white-space: nowrap;
        }
        
        .company { 
          font-size: 10pt;
          font-weight: 600; 
          color: #333;
          margin-bottom: 2px;
        }
        
        .location-date {
          font-size: 9pt; 
          color: #666; 
          margin-bottom: 6px;
        }
        
        .duties { 
          margin-top: 4px; 
          padding-left: 16px;
        }
        
        .duties li { 
          margin-bottom: 3px; 
          line-height: 1.3;
          font-size: 10pt;
        }
        
        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 4px;
        }
        
        .skill-item { 
          background: #f0f0f0; 
          padding: 4px 8px; 
          border-radius: 4px;
          font-size: 9pt;
          font-weight: 500;
        }
        
        .registration-item {
          background: #f8f9fa;
          border-left: 3px solid #2c5aa0;
          padding: 8px 12px;
          margin-bottom: 6px;
        }
        
        .reg-type {
          font-weight: bold;
          color: #2c5aa0;
          margin-bottom: 2px;
          font-size: 10pt;
        }
        
        .reg-details {
          font-size: 9pt;
          color: #555;
        }

        @media print {
          body { margin: 0; padding: 0.5in; }
          .section { page-break-inside: avoid; }
          @page { margin: 0; }
        }
        
        @page {
          margin: 0;
          @top-left { content: none; }
          @top-center { content: none; }
          @top-right { content: none; }
          @bottom-left { content: none; }
          @bottom-center { content: none; }
          @bottom-right { content: none; }
        }
        
        .duties-list {
          margin-top: 6px;
          padding-left: 16px;
          font-size: 9pt;
          line-height: 1.4;
          color: #444;
        }
        
        .duties-list li {
          margin-bottom: 2px;
        }
        
        /* Add print button for easy PDF generation */
        .print-instructions {
          background: #e3f2fd;
          border: 2px solid #2196f3;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          text-align: center;
        }
        
        .print-button {
          background: #2196f3;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          margin-top: 8px;
        }
        
        .print-button:hover {
          background: #1976d2;
        }
        
        @media print {
          .print-instructions { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="print-instructions">
        <h3 style="margin: 0 0 8px 0; color: #1976d2;">📄 Print to PDF</h3>
        <p style="margin: 0; color: #666;">Press Ctrl+P (or Cmd+P on Mac) and select "Save as PDF" to download your CV</p>
        <button class="print-button" onclick="window.print()">🖨️ Print/Save as PDF</button>
      </div>
      
      <div class="header">
        <div class="name">${cvData.personalInfo.name || "Healthcare Professional"
    }</div>
        <div class="contact">
          ${cvData.personalInfo.location
      ? `<div class="contact-line">${cvData.personalInfo.location}</div>`
      : ""
    }
          ${cvData.personalInfo.phone
      ? `<div class="contact-line">${cvData.personalInfo.phone}</div>`
      : ""
    }
          ${cvData.personalInfo.email
      ? `<div class="contact-line">${cvData.personalInfo.email}</div>`
      : ""
    }
        </div>
      </div>

      ${cvData.registrations.length > 0
      ? `
        <div class="section">
          <div class="section-title">Professional Registration</div>
          ${cvData.registrations
        .map(
          (reg: any) => `
            <div class="registration-item">
              <div class="reg-type">${reg.type}</div>
              <div class="reg-details">Registration Number: ${reg.number}${reg.expiry ? ` • Expires: ${reg.expiry}` : ""
            }</div>
            </div>
          `
        )
        .join("")}
        </div>
      `
      : ""
    }

      ${cvData.experience.length > 0
      ? `
        <div class="section">
          <div class="section-title">Work Experience</div>
          ${[...cvData.experience]
        .sort((a: any, b: any) => {
          // Sort: current jobs first, then by start date (newest first)
          if (a.current && !b.current) return -1;
          if (!a.current && b.current) return 1;
          return (b.startDate || "").localeCompare(a.startDate || "");
        })
        .map(
          (exp: any) => `
            <div class="experience-item">
              <div class="job-header">
                <div class="job-title">${exp.jobTitle}</div>

              </div>
              <div class="company">${exp.employer || exp.company || ""}</div>
              <div class="location-date">
                ${exp.location ? `${exp.location} • ` : ""
            }${formatDateToMonthYear(exp.startDate)} - ${exp.current ? "Present" : formatDateToMonthYear(exp.endDate)
            }
              </div>
              ${exp.duties && exp.duties.length > 0
              ? `
                <ul class="duties-list">
                  ${exp.duties
                .map((duty: string) => `<li>${duty}</li>`)
                .join("")}
                </ul>
              `
              : exp.description
                ? `
                <ul class="duties-list">
                  ${exp.description
                  .split("\n")
                  .filter((line: string) => line.trim())
                  .map((duty: string) => `<li>${duty.trim()}</li>`)
                  .join("")}
                </ul>
              `
                : ""
            }
            </div>
          `
        )
        .join("")}
        </div>
      `
      : ""
    }

      ${cvData.education.length > 0
      ? `
        <div class="section">
          <div class="section-title">Education & Qualifications</div>
          ${cvData.education
        .map(
          (edu: any) => `
            <div class="education-item">
              <div class="job-title">${edu.qualification || edu.degree || "Qualification"
            }</div>
              <div class="company">${edu.institution || ""}</div>
              <div class="location-date">
                ${edu.location ? `${edu.location} • ` : ""
            }${formatDateToMonthYear(edu.year || edu.endDate || "")}${edu.grade ? ` • ${edu.grade}` : ""
            }
              </div>
            </div>
          `
        )
        .join("")}
        </div>
      `
      : ""
    }

      ${cvData.courses && cvData.courses.length > 0
      ? `
        <div class="section">
          <div class="section-title">Courses & Certifications</div>
          ${cvData.courses
        .map(
          (course: any) => `
            <div class="education-item">
              <div class="job-title">${course.name || ""}</div>
              <div class="company">${course.provider || ""}</div>
              <div class="location-date">
                ${formatDateToMonthYear(course.completionDate || "")}
              </div>
            </div>
          `
        )
        .join("")}
        </div>
      `
      : ""
    }

      ${cvData.skills.length > 0
      ? `
        <div class="section">
          <div class="section-title">Skills</div>
          <div class="skills-list">
            ${cvData.skills
        .map(
          (skill: string) => `<span class="skill-item">${skill}</span>`
        )
        .join("")}
          </div>
        </div>
      `
      : ""
    }

      <!-- References section -->
      <div class="section">
        <div class="section-title">References</div>
        <p style="margin: 8px 0; font-style: italic;">Available upon request</p>
      </div>
    </body>
    </html>
  `;
}

// Helper function to generate Q&A Session HTML for PDF download
function generateQASessionHTML(sessionData: any): string {
  const { session, questions } = sessionData;
  const createdDate = new Date(session.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Q&A Practice Session - ${session.jobTitle}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
          font-family: 'Calibri', 'Arial', sans-serif; 
          font-size: 11pt; 
          line-height: 1.6; 
          color: #333; 
          max-width: 8.5in;
          margin: 0 auto;
          padding: 0.75in;
          background: white;
        }
        
        .header { 
          text-align: center; 
          margin-bottom: 32px; 
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 20px;
        }
        
        .title { 
          font-size: 24pt; 
          font-weight: bold; 
          color: #1e40af; 
          margin-bottom: 8px; 
        }
        
        .subtitle {
          font-size: 14pt;
          color: #6b7280;
          margin-bottom: 4px;
        }
        
        .meta { 
          font-size: 10pt; 
          color: #6b7280;
          line-height: 1.4;
        }
        
        .section { 
          margin-bottom: 0; 
        }
        
        .question-container {
          background: #f8fafc;
          border-left: 4px solid #3b82f6;
          padding: 16px;
          margin-bottom: 16px;
          page-break-inside: avoid;
        }
        
        .question-number { 
          font-size: 12pt;
          font-weight: bold; 
          color: #3b82f6;
          margin-bottom: 8px;
        }
        
        .question-text {
          font-size: 11pt;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 12px;
          line-height: 1.5;
        }
        
        .answer-label {
          font-size: 10pt;
          font-weight: bold;
          color: #059669;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .answer-text {
          font-size: 10pt;
          color: #334155;
          line-height: 1.7;
          white-space: pre-wrap;
          background: white;
          padding: 12px;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }
        
        .disclaimer {
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 16px;
          font-size: 9pt;
          color: #92400e;
        }
        
        .disclaimer strong {
          color: #78350f;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 16px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          font-size: 9pt;
          color: #6b7280;
        }
        
        @media print {
          body { 
            padding: 0.5in; 
          }
          .question-container {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <div class="title">Interview Practice Q&A</div>
        <div class="subtitle">${session.sessionName}</div>
        <div class="meta">    
          Generated: ${createdDate} • ${questions.length} Questions
        </div>
      </div>

      <!-- Disclaimer -->
      <div class="disclaimer">
        <strong>⚠️ Disclaimer:</strong>  We cannot predict the exact questions you'll be asked in your interview. However, these questions generated by Henry from HealthHire Portal based on your job description will help you practice common healthcare interview themes and develop strong responses. Model answers may contain errors, so be sure to do research on top.
      </div>

      <!-- Questions & Answers -->
      <div class="section">
        ${questions.map((q: any, index: number) => `
          <div class="question-container">
            <div class="question-number">Question ${index + 1}</div>
            <div class="question-text">${q.questionText}</div>
            <div class="answer-label">Model Answer</div>
            <div class="answer-text">${q.modelAnswer || 'No model answer provided.'}</div>
          </div>
        `).join('')}
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>Generated by HealthHire Portal • For interview preparation purposes only</p>
        <p>© ${new Date().getFullYear()} HealthHire. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session & local auth
  setupLocalSession(app);
  app.use(localAuthMiddleware);
  app.use(checkSuspensionStatus);
  registerLocalAuthRoutes(app);

  // Payment routes
  // registerPaymentRoutes(app);

  // Auth routes (password reset, etc.)
  registerAuthRoutes(app);

  // Register Gemini AI routes
  app.use("/api/ai/gemini", aiGeminiRoutes);

  // Raw body middleware for Stripe webhooks (must be before express.json())
  // app.use('/api', express.raw({ type: 'application/json' }));

  // Auth routes
  app.get(
    "/api/auth/user",
    ensureAuthenticated,
    auditDataAccess("user_profile", "view", "User profile access"),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        const profile = await storage.getProfile(userId);

        const userWithProfile = {
          ...user,
          profile,
        };

        res.json(userWithProfile);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Failed to fetch user" });
      }
    }
  );

  // AI Usage Statistics
  app.get("/api/usage/stats", ensureAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await getUserUsageStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching usage stats:", error);
      res.status(500).json({ message: "Failed to fetch usage statistics" });
    }
  });

  // CSRF Token endpoint (session-based)
  app.get("/api/csrf-token", ensureAuthenticated, async (req: any, res) => {
    try {
      const { issueCSRFToken } = await import("./middleware/security");
      const token = issueCSRFToken(req);
      res.json({ csrfToken: token });
    } catch (error) {
      console.error("Error generating CSRF token:", error);
      res.status(500).json({ message: "Failed to generate CSRF token" });
    }
  });

  // =====================================================
  // GDPR COMPLIANCE ENDPOINTS
  // =====================================================

  // Record or update user consent
  app.post(
    "/api/gdpr/consent",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { consent_type, consent_given, legal_basis } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get("User-Agent");

        if (!consent_type || typeof consent_given !== "boolean") {
          return res.status(400).json({
            error: "consent_type and consent_given are required",
          });
        }

        const consent = await storage.updateConsent(
          userId,
          consent_type,
          consent_given,
          ipAddress,
          userAgent
        );

        res.json({
          success: true,
          message: consent_given ? "Consent recorded" : "Consent withdrawn",
          consent: {
            type: consent.consentType,
            given: consent.consentGiven,
            date: consent.consentDate,
          },
        });
      } catch (error) {
        console.error("Error updating consent:", error);
        res.status(500).json({ error: "Failed to update consent" });
      }
    }
  );

  // Get user's current consents
  app.get("/api/gdpr/consents", ensureAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const consents = await storage.getUserConsents(userId);

      // Get the latest consent for each type
      const latestConsents = consents.reduce((acc, consent) => {
        if (
          !acc[consent.consentType] ||
          (consent.consentDate &&
            acc[consent.consentType].consentDate &&
            new Date(consent.consentDate) >
            new Date(acc[consent.consentType].consentDate))
        ) {
          acc[consent.consentType] = consent;
        }
        return acc;
      }, {} as Record<string, any>);

      res.json({
        consents: Object.values(latestConsents).map((c) => ({
          type: c.consentType,
          given: c.consentGiven,
          date: c.consentDate,
          legalBasis: c.legalBasis,
          version: c.consentVersion,
        })),
      });
    } catch (error) {
      console.error("Error fetching consents:", error);
      res.status(500).json({ error: "Failed to fetch consents" });
    }
  });

  // Submit data subject access request
  app.post(
    "/api/gdpr/request/access",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { details } = req.body;

        const request = await storage.createDataSubjectRequest({
          userId,
          requestType: "access",
          requestDetails:
            details || "User requested access to all personal data",
          verificationMethod: "authenticated_session",
        });

        res.json({
          success: true,
          message: "Your data access request has been submitted.",
          referenceId: request.referenceId,
          expectedCompletion: "30 days from submission",
          requestId: request.id,
        });
      } catch (error) {
        console.error("Error submitting access request:", error);
        res.status(500).json({ error: "Failed to submit access request" });
      }
    }
  );

  // Submit data rectification request
  app.post(
    "/api/gdpr/request/rectification",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { field, currentValue, requestedValue, reason } = req.body;

        if (!field || !requestedValue) {
          return res.status(400).json({
            error: "field and requestedValue are required",
          });
        }

        const requestDetails = JSON.stringify({
          field,
          currentValue,
          requestedValue,
          reason,
        });

        const request = await storage.createDataSubjectRequest({
          userId,
          requestType: "rectification",
          requestDetails,
          verificationMethod: "authenticated_session",
        });

        res.json({
          success: true,
          message: "Rectification request submitted for review.",
          referenceId: request.referenceId,
          requestId: request.id,
        });
      } catch (error) {
        console.error("Error submitting rectification request:", error);
        res
          .status(500)
          .json({ error: "Failed to submit rectification request" });
      }
    }
  );

  // Submit data erasure request
  app.post(
    "/api/gdpr/request/erasure",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { reason, specificData } = req.body;

        // Basic validation for legitimate erasure grounds
        const validReasons = [
          "no_longer_necessary",
          "withdraw_consent",
          "unlawful_processing",
          "legal_obligation",
          "processed_as_child",
        ];

        if (reason && !validReasons.includes(reason)) {
          return res.status(400).json({
            error: "Invalid erasure reason provided",
          });
        }

        const requestDetails = JSON.stringify({
          reason: reason || "user_request",
          specificData: specificData || "all_personal_data",
        });

        const request = await storage.createDataSubjectRequest({
          userId,
          requestType: "erasure",
          requestDetails,
          verificationMethod: "authenticated_session",
        });

        res.json({
          success: true,
          message: "Erasure request submitted for processing.",
          referenceId: request.referenceId,
          note: "Account deletion will be processed within 30 days.",
          requestId: request.id,
        });
      } catch (error) {
        console.error("Error submitting erasure request:", error);
        res.status(500).json({ error: "Failed to submit erasure request" });
      }
    }
  );

  // Data portability request - immediate export
  app.post(
    "/api/gdpr/request/portability",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;

        // Log GDPR data export
        await logGdprDataExport(userId, "portability_request", req);

        // Generate portable data export
        const portableData = await storage.getUserDataExport(userId);

        // Log the request
        const request = await storage.createDataSubjectRequest({
          userId,
          requestType: "portability",
          requestDetails: "User requested portable data export",
          status: "completed",
          verificationMethod: "authenticated_session",
          responseData: {
            exportGenerated: true,
            exportDate: new Date().toISOString(),
          },
        });

        res.json({
          success: true,
          data: portableData,
          format: "structured_json",
          referenceId: request.referenceId,
          note: "This data is provided in a commonly used, machine-readable format.",
        });
      } catch (error) {
        console.error("Error generating portable data:", error);
        res.status(500).json({ error: "Failed to generate portable data" });
      }
    }
  );

  // Get user's GDPR requests
  app.get("/api/gdpr/requests", ensureAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getDataSubjectRequests(userId);

      res.json({
        requests: requests.map((r) => ({
          id: r.id,
          type: r.requestType,
          status: r.status,
          submittedDate: r.submittedDate,
          completedDate: r.completedDate,
          referenceId: r.referenceId,
          details: r.requestDetails,
        })),
      });
    } catch (error) {
      console.error("Error fetching GDPR requests:", error);
      res.status(500).json({ error: "Failed to fetch requests" });
    }
  });

  // Download data export (for completed access requests)
  app.get(
    "/api/gdpr/export/:requestId",
    ensureAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { requestId } = req.params;

        // Verify the request belongs to the user
        const requests = await storage.getDataSubjectRequests(userId);
        const request = requests.find(
          (r) => r.id === requestId && r.requestType === "access"
        );

        if (!request) {
          return res.status(404).json({ error: "Export request not found" });
        }

        if (request.status !== "completed") {
          return res.status(400).json({
            error: "Export not ready",
            status: request.status,
          });
        }

        // Log GDPR data export
        await logGdprDataExport(userId, "access_request", req);

        // Generate fresh export
        const exportData = await storage.getUserDataExport(userId);

        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="personal_data_export_${userId}.json"`
        );
        res.json(exportData);
      } catch (error) {
        console.error("Error downloading export:", error);
        res.status(500).json({ error: "Failed to download export" });
      }
    }
  );

  // Update user and profile route
  app.patch(
    "/api/auth/user",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;

        // Update user data (firstName, lastName)
        if (req.body.firstName || req.body.lastName) {
          await storage.updateUser(userId, {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
          });
        }

        // Fetch existing profile
        const existingProfile = await storage.getProfile(userId);

        // ✅ Correct — replaces instead of merging
        const mergedWorkExperience = req.body.workExperience || [];

        console.log("Received work experience data:", mergedWorkExperience); // Debug backend data

        // Update profile data
        const profileData = {
          userId,
          profession: req.body.profession,
          registrationNumber: req.body.registrationNumber,
          email: req.body.email,
          phone: req.body.phone,
          city: req.body.city,
          country: req.body.country,
          yearsExperience: req.body.yearsExperience,
          visaStatus: req.body.visaStatus,
          skills: req.body.skills || [],
          workExperience: mergedWorkExperience || [],
          education: req.body.education || [],
          courses: req.body.courses || [],
          specialties: req.body.specialties || [],
        };

        console.log(profileData);

        await storage.upsertProfile(profileData);

        // Return updated user data with profile
        const updatedUser = await storage.getUser(userId);
        const updatedProfile = await storage.getProfile(userId);

        const userWithProfile = {
          ...updatedUser,
          profile: updatedProfile,
        };

        res.json(userWithProfile);
      } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Failed to update user" });
      }
    }
  );

  app.delete(
    "/api/auth/user/work-experience/:index",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const index = parseInt(req.params.index, 10);

        const existingProfile = await storage.getProfile(userId);
        if (!existingProfile) {
          return res.status(404).json({ message: "Profile not found" });
        }

        const workArray = existingProfile.workExperience || [];
        if (index < 0 || index >= workArray.length) {
          return res.status(400).json({ message: "Invalid index" });
        }

        workArray.splice(index, 1);

        await storage.upsertProfile({
          ...existingProfile,
          workExperience: workArray,
        });

        res.json({
          message: "Work experience deleted successfully",
          workExperience: workArray,
        });
      } catch (error) {
        console.error("Error deleting work experience:", error);
        res.status(500).json({ message: "Failed to delete work experience" });
      }
    }
  );

  // Dashboard data route
  app.get("/api/dashboard", ensureAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Get user profile
      const profile = await storage.getProfile(userId);

      // Get applications
      const applications = await storage.getApplications(userId);
      const inProgressApplications = applications.filter((app) =>
        ["applied", "interview"].includes(app.status)
      );

      // Get latest interview score
      const latestScore = await storage.getLatestInterviewScore(userId);

      // Get latest documents
      const latestCV = await storage.getLatestDocument(userId, "cv");

      // Calculate stats
      const dashboardData = {
        profileCompletion: profile?.completionPercentage || 0,
        newJobMatches: 14, // This would come from job matching service
        applicationsInProgress: inProgressApplications.length,
        totalApplications: applications.length,
        latestInterviewScore: latestScore || 0,
        interviewsThisWeek: applications.filter(
          (app) =>
            app.interviewDate &&
            new Date(app.interviewDate) >
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        successRate:
          applications.length > 0
            ? Math.round(
              (applications.filter((app) => app.status === "offered").length /
                applications.length) *
              100
            )
            : 0,
        recentApplications: applications.slice(0, 3),
        latestDocument: latestCV,
      };

      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Profile routes
  app.get(
    "/api/profile",
    ensureAuthenticated,
    auditDataAccess("profile", "view", "Profile data access"),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const profile = await storage.getProfile(userId);
        res.json(profile);
      } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ message: "Failed to fetch profile" });
      }
    }
  );

  app.post(
    "/api/profile",
    ensureAuthenticated,
    validateCSRFToken,
    auditDataAccess("profile", "edit", "Profile data update"),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const validatedData = insertProfileSchema.parse({
          ...req.body,
          userId,
        });

        const profile = await storage.upsertProfile(validatedData);
        res.json(profile);
      } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Failed to update profile" });
      }
    }
  );

  app.put(
    "/api/profile",
    ensureAuthenticated,
    validateCSRFToken,
    auditDataAccess("profile", "edit", "Profile data update"),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const validatedData = insertProfileSchema.parse({
          ...req.body,
          userId,
        });

        const profile = await storage.upsertProfile(validatedData);
        res.json(profile);
      } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Failed to update profile" });
      }
    }
  );

  // Profile file upload routes (using Google Cloud Storage)
  app.post(
    "/api/profile/upload",
    ensureAuthenticated,
    validateCSRFToken,
    upload.single("file"),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const file = req.file;
        const { fileType } = req.body;

        if (!file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        // Validate file type category
        const allowedTypes = [
          "cv",
          "cover_letter",
          "certificate",
          "profile_photo",
        ];
        if (fileType && !allowedTypes.includes(fileType)) {
          return res.status(400).json({
            message:
              "Invalid file type. Allowed: cv, cover_letter, certificate, profile_photo",
          });
        }

        // Determine folder based on file type
        const folder =
          fileType === "profile_photo"
            ? "profile-photos"
            : fileType === "cv"
              ? "cvs"
              : fileType === "cover_letter"
                ? "cover-letters"
                : "certificates";

        // Upload to GCS and get public URL
        const fileUrl = await uploadFileToGCS(file, folder, userId);

        // Create file record in database
        const fileRecord = await storage.createUserFile({
          userId,
          fileName: file.originalname,
          fileType: fileType || "profile_photo",
          filePath: fileUrl,
          fileSize: file.size,
        });

        res.json(fileRecord);
      } catch (error: any) {
        console.error("Error uploading file:", error);
        res
          .status(500)
          .json({ message: error.message || "Failed to upload file" });
      }
    }
  );

  app.get(
    "/api/profile/files",
    ensureAuthenticated,
    auditDataAccess("user_files", "view", "User files access"),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const files = await storage.getUserFiles(userId);
        res.json(files);
      } catch (error) {
        console.error("Error fetching user files:", error);
        res.status(500).json({ message: "Failed to fetch user files" });
      }
    }
  );

  app.delete(
    "/api/profile/files/:id",
    ensureAuthenticated,
    validateCSRFToken,
    auditDataAccess("user_files", "delete", "User file deletion"),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const fileId = req.params.id;

        // Verify the file belongs to the user
        const files = await storage.getUserFiles(userId);
        const file = files.find((f) => f.id === fileId);

        if (!file) {
          return res.status(404).json({ message: "File not found" });
        }

        if (file.userId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        // Delete file from GCS
        if (file.filePath) {
          try {
            await deleteFileFromGCS(file.filePath);
          } catch (error) {
            console.error("Error deleting file from GCS:", error);
            // Continue with database deletion even if GCS deletion fails
          }
        }

        // Delete database record
        await storage.deleteUserFile(fileId);
        res.json({ message: "File deleted successfully" });
      } catch (error) {
        console.error("Error deleting user file:", error);
        res.status(500).json({ message: "Failed to delete file" });
      }
    }
  );

  // Files are now served from Google Cloud Storage (GCS)
  // No need for local static file serving

  // Job Application Routes - Track when users apply to jobs
  app.post(
    "/api/jobs/:jobId/apply",
    ensureAuthenticated,
    async (req: any, res) => {
      try {
        const { jobId } = req.params;
        const userId = req.user.claims.sub;

        // First, get the job details
        let job = null;

        // Try database first
        const dbJobs = await storage.getNhsJobs();
        const dbJob = dbJobs.find(
          (j) => j.id === jobId || j.externalId === jobId
        );

        if (dbJob) {
          job = {
            id: dbJob.id,
            title: dbJob.title,
            employer: dbJob.employer,
            location: dbJob.location,
            salaryMin: dbJob.salaryMin,
            salaryMax: dbJob.salaryMax,
          };
        }

        // Create application record
        const applicationData = {
          userId,
          jobTitle: job?.title || "Job Application",
          employer: job?.employer || "Unknown Employer",
          location: job?.location || "Unknown Location",
          salary:
            job?.salaryMin && job?.salaryMax
              ? `£${job.salaryMin.toLocaleString()} - £${job.salaryMax.toLocaleString()}`
              : job?.salaryMin
                ? `From £${job.salaryMin.toLocaleString()}`
                : "Competitive/Negotiable",
          status: "applied", // Mark as applied since user clicked apply
          appliedAt: new Date(),
        };

        await storage.createApplication(applicationData);

        // Log user activity
        await storage.logUserActivity({
          userId,
          activityType: "application_sent",
          description: `Applied for ${job?.title || "job"} at ${job?.employer || "employer"
            }`,
          metadata: { jobId, employer: job?.employer },
          ipAddress: req.ip,
        });

        res.json({
          success: true,
          message: "Application tracked successfully",
          application: applicationData,
        });
      } catch (error) {
        console.error("Error tracking application:", error);
        res.status(500).json({ message: "Failed to track application" });
      }
    }
  );

  // Application routes
  app.get(
    "/api/applications",
    ensureAuthenticated,
    auditDataAccess("applications", "view", "Job applications access"),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const applications = await storage.getApplications(userId);
        res.json(applications);
      } catch (error) {
        console.error("Error fetching applications:", error);
        res.status(500).json({ message: "Failed to fetch applications" });
      }
    }
  );

  app.post(
    "/api/applications",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const validatedData = insertApplicationSchema.parse({
          ...req.body,
          userId,
        });

        const application = await storage.createApplication(validatedData);
        res.json(application);
      } catch (error) {
        console.error("Error creating application:", error);
        res.status(500).json({ message: "Failed to create application" });
      }
    }
  );

  app.put(
    "/api/applications/:id",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const updates = req.body;

        const application = await storage.updateApplication(id, updates);
        res.json(application);
      } catch (error) {
        console.error("Error updating application:", error);
        res.status(500).json({ message: "Failed to update application" });
      }
    }
  );

  // Delete an application (user can only delete their own application)
  app.delete(
    "/api/applications/:id",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const userId = req.user.claims.sub;

        // Actually call the storage method to delete the application
        await storage.deleteApplication(id, userId);

        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting application:", error);
        const msg = (error && error.message) ? error.message.toLowerCase() : "";
        if (msg.includes("not found") || msg.includes("not authorized")) {
          return res.status(404).json({ message: "Application not found" });
        }
        res.status(500).json({ message: "Failed to delete application" });
      }
    }
  );

  // Update application notes specifically
  app.patch(
    "/api/applications/:id/notes",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const { notes } = req.body;
        const userId = req.user.claims.sub;

        const application = await storage.updateApplicationNotes(
          id,
          userId,
          notes
        );
        res.json(application);
      } catch (error) {
        console.error("Error updating application notes:", error);
        res.status(500).json({ message: "Failed to update application notes" });
      }
    }
  );

  // Update user profile photo
  app.patch(
    "/api/user/profile-photo",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { uploadURL } = req.body;

        // Allow empty string to remove photo
        if (uploadURL === "") {
          const updatedUser = await storage.updateUser(userId, {
            profileImageUrl: null,
          });
          return res.json({ success: true, user: updatedUser });
        }

        if (!uploadURL) {
          return res.status(400).json({ message: "Upload URL is required" });
        }

        // GCS URLs are stored directly as-is
        // They're already public and accessible
        const photoPath = uploadURL;

        const updatedUser = await storage.updateUser(userId, {
          profileImageUrl: photoPath,
        });
        res.json({ success: true, photoPath, user: updatedUser });
      } catch (error) {
        console.error("Error updating profile photo:", error);
        res.status(500).json({ message: "Failed to update profile photo" });
      }
    }
  );

  // Update user password
  app.patch(
    "/api/user/update-password",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { currentPassword, newPassword } = req.body;

        // Get user
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Verify current password
        if (!user.passwordHash) {
          return res.status(400).json({ message: "Current password verification failed" });
        }

        const isCurrentPasswordValid = await verifyPassword(
          currentPassword,
          user.passwordHash
        );

        if (!isCurrentPasswordValid) {
          return res.status(400).json({ message: "Current password is incorrect" });
        }

        // Validate new password
        if (!newPassword || newPassword.length < 8) {
          return res.status(400).json({ message: "Password must be at least 8 characters long" });
        }

        // Hash and update password
        const passwordHash = await hashPassword(newPassword);
        await storage.updateUser(userId, { passwordHash });

        res.json({ message: "Password updated successfully" });
      } catch (error) {
        console.error("Error updating password:", error);
        res.status(500).json({ message: "Failed to update password" });
      }
    }
  );

  // Get object upload URL
  app.post(
    "/api/objects/upload",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const uploadURL = await objectStorageService.getUserDocumentUploadURL(
          userId,
          "profile-photo"
        );
        res.json({ uploadURL });
      } catch (error) {
        console.error("Error generating upload URL:", error);
        res.status(500).json({ message: "Failed to generate upload URL" });
      }
    }
  );

  // Interview session routes
  app.get("/api/interviews", ensureAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getInterviewSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching interview sessions:", error);
      res.status(500).json({ message: "Failed to fetch interview sessions" });
    }
  });

  app.post(
    "/api/interviews",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const session = await storage.createInterviewSession({
          userId,
          score: req.body.score,
          duration: req.body.duration,
          feedback: req.body.feedback,
        });
        res.json(session);
      } catch (error) {
        console.error("Error creating interview session:", error);
        res.status(500).json({ message: "Failed to create interview session" });
      }
    }
  );

  // Documents routes
  app.get("/api/documents", ensureAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documents = await storage.getDocuments(userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post(
    "/api/documents",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const validatedData = insertDocumentSchema.parse({
          ...req.body,
          userId,
        });

        const document = await storage.createDocument(validatedData);
        res.json(document);
      } catch (error) {
        console.error("Error creating document:", error);
        res.status(500).json({ message: "Failed to create document" });
      }
    }
  );

  // AI Document Generation Routes
  app.post(
    "/api/documents/generate-cv",
    ensureAuthenticated,
    validateCSRFToken,
    checkUsageRestrictions("document_generation"),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;

        // Get user profile and STAR examples
        const profile = await storage.getProfile(userId);
        const starExamples = await storage.getStarExamples(userId);

        if (!profile) {
          return res
            .status(400)
            .json({ message: "Profile required for CV generation" });
        }

        // Prepare generation context
        const context = {
          userProfile: profile,
          starExamples,
          experienceLevel: req.body.experienceLevel || "mid",
          targetBand: req.body.targetBand || "Band 5",
          jobDescription: req.body.jobDescription,
        };

        // Generate CV using AI
        const cvContent = await aiService.generateCV(context);

        // Save generated document
        const document = await storage.createDocument({
          userId,
          type: "cv",
          title: `CV - ${new Date().toLocaleDateString()}`,
          content: cvContent,
          version: "1.0",
        });

        res.json(document);
      } catch (error) {
        console.error("Error generating CV:", error);
        res.status(500).json({ message: "Failed to generate CV" });
      }
    }
  );

  app.post(
    "/api/documents/generate-supporting-info",
    ensureAuthenticated,
    validateCSRFToken,
    checkUsageRestrictions("document_generation"),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;

        // Get user profile and STAR examples
        const profile = await storage.getProfile(userId);
        const starExamples = await storage.getStarExamples(userId);

        if (!profile) {
          return res.status(400).json({
            message: "Profile required for Supporting Information generation",
          });
        }

        if (!req.body.jobDescription) {
          return res.status(400).json({
            message: "Job description required for Supporting Information",
          });
        }

        // Prepare generation context
        const context = {
          userProfile: profile,
          starExamples,
          experienceLevel: req.body.experienceLevel || "mid",
          targetBand: req.body.targetBand || "Band 5",
          jobDescription: req.body.jobDescription,
        };

        // Generate Supporting Information using AI
        const supportingInfoContent = await aiService.generateSupportingInfo(
          context
        );

        // Save generated document
        const document = await storage.createDocument({
          userId,
          type: "supporting_info",
          title: `Supporting Information - ${req.body.jobTitle || "NHS Role"}`,
          content: supportingInfoContent,
          version: "1.0",
        });

        res.json(document);
      } catch (error) {
        console.error("Error generating Supporting Information:", error);
        res
          .status(500)
          .json({ message: "Failed to generate Supporting Information" });
      }
    }
  );

  // STAR Examples Routes
  app.get("/api/star-examples", ensureAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const examples = await storage.getStarExamples(userId);
      res.json(examples);
    } catch (error) {
      console.error("Error fetching STAR examples:", error);
      res.status(500).json({ message: "Failed to fetch STAR examples" });
    }
  });

  app.post(
    "/api/star-examples",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const validatedData = insertStarExampleSchema.parse({
          ...req.body,
          userId,
        });

        const example = await storage.createStarExample(validatedData);
        res.json(example);
      } catch (error) {
        console.error("Error creating STAR example:", error);
        res.status(500).json({ message: "Failed to create STAR example" });
      }
    }
  );

  app.put(
    "/api/star-examples/:id",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const updatedExample = await storage.updateStarExample(id, req.body);
        res.json(updatedExample);
      } catch (error) {
        console.error("Error updating STAR example:", error);
        res.status(500).json({ message: "Failed to update STAR example" });
      }
    }
  );

  app.delete(
    "/api/star-examples/:id",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        await storage.deleteStarExample(id);
        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting STAR example:", error);
        res.status(500).json({ message: "Failed to delete STAR example" });
      }
    }
  );

  // Interview Practice Routes
  app.post(
    "/api/interview/generate-questions",
    ensureAuthenticated,
    validateCSRFToken,
    checkUsageRestrictions("interview_practice"),
    async (req: any, res) => {
      try {
        const { jobDescription, difficulty = "mid" } = req.body;

        if (!jobDescription) {
          return res.status(400).json({ message: "Job description required" });
        }

        const questions = await aiService.generateInterviewQA(
          jobDescription,
          difficulty
        );
        res.json(questions);
      } catch (error) {
        console.error("Error generating interview questions:", error);
        res
          .status(500)
          .json({ message: "Failed to generate interview questions" });
      }
    }
  );

  app.post(
    "/api/interview/score-response",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const { question, userResponse } = req.body;

        if (!question || !userResponse) {
          return res
            .status(400)
            .json({ message: "Question and response required" });
        }

        const scoring = await aiService.scoreInterviewResponse(
          question,
          userResponse
        );
        res.json(scoring);
      } catch (error) {
        console.error("Error scoring interview response:", error);
        res.status(500).json({ message: "Failed to score interview response" });
      }
    }
  );

  // === Interview Practice Feature - As Per Specification ===

  // Start interview practice session
  app.post(
    "/api/generate-questions",
    ensureAuthenticated,
    validateCSRFToken,
    checkUsageRestrictions("interview_practice"),
    async (req: any, res) => {
      try {
        // Create session ID for the interview practice
        const sessionId = randomUUID();

        res.json({
          session_id: sessionId,
          message: "Interview practice session ready to start",
        });
      } catch (error) {
        console.error("Error starting interview practice:", error);
        res.status(500).json({ message: "Failed to start interview practice" });
      }
    }
  );

  // Start interview session with 5 random questions from the standard bank
  app.post(
    "/api/interview/start",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const { session_id } = req.body;

        if (!session_id) {
          return res.status(400).json({ message: "Session ID required" });
        }

        // Get all questions from database and select 5 random ones
        const allQuestions = await db
          .select()
          .from(interviewQuestions)
          .orderBy(sql`RANDOM()`)
          .limit(5);

        // Extract just the question text
        const selectedQuestions = allQuestions.map((q) => q.question);

        res.json({
          questions: selectedQuestions,
          time_limit: 600, // 10 minutes in seconds
        });
      } catch (error) {
        console.error("Error starting interview:", error);
        res.status(500).json({ message: "Failed to start interview" });
      }
    }
  );

  // Submit answers and get Henry's feedback
  app.post(
    "/api/interview/submit",
    ensureAuthenticated,
    validateCSRFToken,
    checkUsageRestrictions("interview_practice"),
    async (req: any, res) => {
      try {
        const userId = req.user!.claims!.sub;
        const { session_id, answers } = req.body;

        if (!answers || answers.length !== 5) {
          return res
            .status(400)
            .json({ message: "Must provide exactly 5 answers" });
        }

        // Generate feedback using Henry the Helper demo mode - more critical approach
        const score = Math.floor(Math.random() * 6) + 4; // Random score between 4-9 (more realistic range)

        const criticalFeedback = [
          "Your answer lacks specific examples. NHS interviewers want concrete evidence using the STAR method.",
          "You mentioned the topic but didn't demonstrate deep understanding. Provide more detail about your actual experience.",
          "Good start, but you need to connect your answer more clearly to NHS values and patient outcomes.",
          "Your response was too generic. NHS roles require specific, measurable examples of your impact.",
          "You touched on the right themes but need to show more critical thinking about the challenges involved.",
          "Adequate response but lacks the depth expected for this level. Consider the complexities of real healthcare scenarios.",
          "You need to be more specific about your role versus team achievements. What did YOU specifically do?",
          "Your answer shows awareness but doesn't demonstrate the level of insight needed for NHS interviews.",
        ];

        const feedback = {
          individual_feedback: answers.map((a: any, i: number) => ({
            question_num: i + 1,
            feedback:
              criticalFeedback[
              Math.floor(Math.random() * criticalFeedback.length)
              ],
          })),
          overall_feedback: `Your interview session is complete. Henry the Helper (Demo Mode) has scored your performance at ${score}/10. While you demonstrated some understanding of NHS values, there are significant areas for improvement. Your answers often lacked the specific, evidence-based examples that NHS interviewers expect. Healthcare interviews require concrete stories using the STAR method, measurable outcomes, and clear connections to patient care. You need to practice articulating your actual impact rather than describing general approaches.`,
          score: score,
          improvement_tips: [
            "Use the STAR method religiously - every answer needs Situation, Task, Action, Result",
            "Prepare 10-15 specific examples from your experience with measurable outcomes",
            "Research NHS values deeply and weave them authentically into your responses",
            "Practice explaining complex situations clearly and concisely",
            "Prepare for follow-up questions that probe deeper into your examples",
          ],
        };

        // Save session to database
        const [session] = await db
          .insert(interviewSessions)
          .values({
            userId,
            score: feedback.score,
            feedback: feedback.overall_feedback,
            duration: 10, // Default to 10 minutes
          })
          .returning();

        // Clean up old sessions - keep only the last 5 for this user
        const allUserSessions = await db
          .select({ id: interviewSessions.id })
          .from(interviewSessions)
          .where(eq(interviewSessions.userId, userId))
          .orderBy(desc(interviewSessions.createdAt));

        if (allUserSessions.length > 5) {
          const sessionsToDelete = allUserSessions.slice(5);
          const idsToDelete = sessionsToDelete.map((s) => s.id);

          await db
            .delete(interviewSessions)
            .where(
              sql`${interviewSessions.id} IN (${idsToDelete
                .map((id) => `'${id}'`)
                .join(",")})`
            );

          console.log(
            `Cleaned up ${idsToDelete.length} old interview sessions for user ${userId}`
          );
        }

        res.json(feedback);
      } catch (error) {
        console.error("Error submitting interview:", error);
        res.status(500).json({ message: "Failed to submit interview" });
      }
    }
  );

  // Get user interview history
  app.get(
    "/api/interview/history/:user_id",
    ensureAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.params.user_id;

        const sessions = await db
          .select()
          .from(interviewSessions)
          .where(eq(interviewSessions.userId, userId))
          .orderBy(sql`created_at DESC`);

        res.json({
          sessions: sessions.map((s) => ({
            date: s.createdAt?.toISOString().split("T")[0],
            score: s.score,
            feedback: s.feedback,
          })),
        });
      } catch (error) {
        console.error("Error fetching history:", error);
        res.status(500).json({ message: "Failed to fetch history" });
      }
    }
  );

  // Legacy endpoint - remove after testing new system
  app.post(
    "/api/interview-practice/submit-answers",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { answers } = req.body; // Array of {questionId, question, answer}

        if (!answers || answers.length !== 10) {
          return res
            .status(400)
            .json({ message: "Must provide exactly 10 answers" });
        }

        // Create session record
        const [session] = await db
          .insert(interviewSessions)
          .values({
            userId,
            score: 0, // Will be updated after Henry's feedback
            duration: 0,
            feedback: null, // Will be updated after Henry's feedback
          })
          .returning();

        // Get Henry's feedback using Gemini
        const prompt = `You are Henry the Helper, a friendly AI assistant helping NHS healthcare professionals with interview practice. 

Please review these 10 interview answers and provide:
1. An overall score out of 10
2. Constructive feedback on strengths and areas for improvement  
3. Specific tips for better answers

Questions and Answers:
${answers
            .map(
              (a: any, i: number) => `
${i + 1}. ${a.question}
Answer: ${a.answer}
`
            )
            .join("")}

Please respond in JSON format:
{
  "overallScore": number (1-10),
  "feedback": "detailed feedback string",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"]
}`;

        // Use Gemini for Henry's feedback
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY || "",
        });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                overallScore: { type: "number" },
                feedback: { type: "string" },
                strengths: { type: "array", items: { type: "string" } },
                improvements: { type: "array", items: { type: "string" } },
              },
              required: [
                "overallScore",
                "feedback",
                "strengths",
                "improvements",
              ],
            },
          },
          contents: prompt,
        });

        const henryFeedback = JSON.parse(response.text || "{}");

        // Update session with Henry's feedback
        const [updatedSession] = await db
          .update(interviewSessions)
          .set({
            score: henryFeedback.overallScore,
            feedback: JSON.stringify(henryFeedback),
          })
          .where(eq(interviewSessions.id, session.id))
          .returning();

        res.json({
          session: updatedSession,
          henryFeedback,
        });
      } catch (error) {
        console.error("Error processing answers:", error);
        res.status(500).json({ message: "Failed to process answers" });
      }
    }
  );

  // Submit answer for a question in session
  app.post(
    "/api/interview-practice/submit-answer",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { sessionId, questionId, response, timeSpent } = req.body;

        // Verify session belongs to user
        const [session] = await db
          .select()
          .from(interviewSessions)
          .where(
            and(
              eq(interviewSessions.id, sessionId),
              eq(interviewSessions.userId, userId)
            )
          );

        if (!session) {
          return res
            .status(403)
            .json({ message: "Session not found or unauthorized" });
        }

        // Generate score and feedback using Henry AI (placeholder for now)
        let score = Math.floor(Math.random() * 4) + 7; // 7-10 range for demo
        let feedback =
          "Great answer! Consider using the STAR method to structure your response more effectively.";

        // Try to use AI if available
        try {
          const question = await db
            .select()
            .from(interviewQuestions)
            .where(eq(interviewQuestions.id, questionId))
            .limit(1);

          if (question.length > 0) {
            const aiResult = await aiService.scoreInterviewResponse(
              question[0].question,
              response
            );
            if (aiResult && aiResult.score !== undefined) {
              score = aiResult.score;
              feedback = aiResult.feedback || feedback;
            }
          }
        } catch (aiError) {
          console.error("AI scoring failed, using fallback:", aiError);
        }

        // Save the response
        const [savedResponse] = await db
          .insert(interviewResponses)
          .values({
            sessionId,
            questionId,
            response,
            score,
            feedback,
            timeSpent,
          })
          .returning();

        res.json({
          response: savedResponse,
          score,
          feedback,
        });
      } catch (error) {
        console.error("Error submitting interview answer:", error);
        res.status(500).json({ message: "Failed to submit answer" });
      }
    }
  );

  // Complete interview session
  app.post(
    "/api/interview-practice/complete-session",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { sessionId, duration } = req.body;

        // Verify session belongs to user
        const [session] = await db
          .select()
          .from(interviewSessions)
          .where(
            and(
              eq(interviewSessions.id, sessionId),
              eq(interviewSessions.userId, userId)
            )
          );

        if (!session) {
          return res
            .status(403)
            .json({ message: "Session not found or unauthorized" });
        }

        // Get all responses for this session
        const responses = await db
          .select()
          .from(interviewResponses)
          .where(eq(interviewResponses.sessionId, sessionId));

        // Calculate overall score
        const totalScore = responses.reduce(
          (sum, r) => sum + (r.score || 0),
          0
        );
        const averageScore =
          responses.length > 0 ? Math.round(totalScore / responses.length) : 0;

        // Generate overall feedback
        let overallFeedback = `You completed ${responses.length} questions with an average score of ${averageScore}/10.`;

        if (averageScore >= 8) {
          overallFeedback +=
            " Excellent work! You demonstrated strong interview skills.";
        } else if (averageScore >= 6) {
          overallFeedback +=
            " Good effort! Focus on using the STAR method for more structured answers.";
        } else {
          overallFeedback +=
            " Keep practicing! Consider reviewing common NHS interview questions and the STAR method.";
        }

        // Update session with final score and feedback
        const [updatedSession] = await db
          .update(interviewSessions)
          .set({
            score: averageScore,
            duration: Math.round(duration / 60), // Convert to minutes
            feedback: overallFeedback,
          })
          .where(eq(interviewSessions.id, sessionId))
          .returning();

        res.json({
          session: updatedSession,
          responses,
          summary: {
            totalQuestions: responses.length,
            averageScore,
            timeSpent: duration,
            feedback: overallFeedback,
          },
        });
      } catch (error) {
        console.error("Error completing interview session:", error);
        res.status(500).json({ message: "Failed to complete session" });
      }
    }
  );

  // Get interview practice history (last 5 sessions only)
  app.get(
    "/api/interview-practice/history",
    ensureAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;

        // Only return the last 5 sessions
        const sessions = await db
          .select()
          .from(interviewSessions)
          .where(eq(interviewSessions.userId, userId))
          .orderBy(desc(interviewSessions.createdAt))
          .limit(5);

        res.json(sessions);
      } catch (error) {
        console.error("Error fetching interview history:", error);
        res.status(500).json({ message: "Failed to fetch interview history" });
      }
    }
  );

  // Admin route to seed general questions
  app.post(
    "/api/interview-practice/seed-questions",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const { questions } = req.body;

        if (!questions || !Array.isArray(questions)) {
          return res.status(400).json({ message: "Questions array required" });
        }

        const questionsToInsert = questions.map((q) => ({
          question: q,
          category: "general",
          difficulty: "mid",
          suggestedAnswer: null,
          tags: [],
        }));

        await db.insert(interviewQuestions).values(questionsToInsert);

        res.json({
          message: `Successfully added ${questions.length} general questions`,
          count: questions.length,
        });
      } catch (error) {
        console.error("Error seeding questions:", error);
        res.status(500).json({ message: "Failed to seed questions" });
      }
    }
  );

  // Get single job by ID - search database first, then external sources
  app.get("/api/jobs/:id", async (req: any, res) => {
    try {
      const jobId = req.params.id;
      let job = null;

      // First, try to find job in database
      try {
        const dbJobs = await storage.getNhsJobs();
        const dbJob = dbJobs.find(
          (j) => j.id === jobId || j.externalId === jobId
        );

        if (dbJob) {
          job = {
            id: dbJob.id,
            title: dbJob.title,
            employer: dbJob.employer,
            location: dbJob.location,
            band: dbJob.band,
            salaryMin: dbJob.salaryMin,
            salaryMax: dbJob.salaryMax,
            description: dbJob.description,
            personSpec: dbJob.personSpec,
            visaSponsorship: dbJob.visaSponsorship,
            featured: dbJob.featured,
            closingDate: dbJob.closingDate?.toISOString(),
            externalId: dbJob.externalId,
            source: "Database",
            createdAt: dbJob.createdAt?.toISOString(),
            updatedAt: dbJob.updatedAt?.toISOString(),
          };
        }
      } catch (dbError) {
        console.error("Database job lookup error:", dbError);
      }

      // If not found in database, try external sources
      if (!job) {
        if (jobId.startsWith("scot_")) {
          job = await scotNhsJobsService.getJobById(jobId);
        } else if (jobId.startsWith("hjuk_")) {
          job = await healthJobsUkService.getJobById(jobId);
        } else {
          // Try NHS Jobs first for regular IDs
          job = await nhsJobsService.getJobById(jobId);

          // If not found, try other sources
          if (!job) {
            job =
              (await scotNhsJobsService.getJobById(jobId)) ||
              (await healthJobsUkService.getJobById(jobId));
          }
        }
      }

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      res.json(job);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ message: "Failed to fetch job details" });
    }
  });

  // Multi-Source Job Discovery Routes - Prioritizes database, then external APIs
  app.get("/api/jobs", async (req: any, res) => {
    console.log("🚀 /api/jobs route hit with query");
    try {
      const { band, location, visa, search, page } = req.query;

      let allJobs: any[] = [];

      // First, get jobs from database (priority)
      try {
        const dbJobs = await storage.getNhsJobs({
          band: band && band !== "all-bands" ? band : undefined,
          location: location,
          visaSponsorship: visa === "true" ? true : undefined,
        });

        // Convert database jobs to consistent format
        const formattedDbJobs = dbJobs.map((job) => ({
          id: job.id,
          title: job.title,
          employer: job.employer,
          location: job.location,
          band: job.band,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          description: job.description,
          personSpec: job.personSpec,
          visaSponsorship: job.visaSponsorship,
          featured: job.featured,
          closingDate: job.closingDate?.toISOString(),
          source: "Database",
          externalId: job.externalId,
          createdAt: job.createdAt?.toISOString(),
          updatedAt: job.updatedAt?.toISOString(),
        }));

        allJobs.push(...formattedDbJobs);
      } catch (dbError) {
        console.error("Database jobs error:", dbError);
      }

      // If search query provided, also search in database
      if (search && search.trim()) {
        try {
          const searchResults = await storage.searchJobs(search.trim(), {
            band: band && band !== "all-bands" ? band : undefined,
          });

          // Add search results that aren't already included
          const newSearchResults = searchResults
            .filter(
              (dbJob) =>
                !allJobs.some(
                  (job) =>
                    job.id === dbJob.id || job.externalId === dbJob.externalId
                )
            )
            .map((job) => ({
              id: job.id,
              title: job.title,
              employer: job.employer,
              location: job.location,
              band: job.band,
              salaryMin: job.salaryMin,
              salaryMax: job.salaryMax,
              description: job.description,
              personSpec: job.personSpec,
              visaSponsorship: job.visaSponsorship,
              featured: job.featured,
              closingDate: job.closingDate?.toISOString(),
              source: "Database Search",
              externalId: job.externalId,
              createdAt: job.createdAt?.toISOString(),
              updatedAt: job.updatedAt?.toISOString(),
            }));

          allJobs.push(...newSearchResults);
        } catch (searchError) {
          console.error("Database search error:", searchError);
        }
      }

      // Prepare search parameters for external sources
      const searchParams = {
        keyword: search,
        location: location,
        page: page ? parseInt(page) : 1,
      };

      // Fetch jobs from external sources (as fallback/enhancement)
      const [nhsResults, scotNhsResults, healthJobsResults] = await Promise.all(
        [
          // 🏥 NHS Jobs England
          nhsJobsService
            .searchJobs({
              ...searchParams,
              payBandFilter: band && band !== "all-bands" ? band : undefined,
            })
            .then((res) => {
              console.log(
                "📦 NHS Jobs (England) Results:",
                res?.vacancies?.length || 0,
                "vacancies"
              );
              // if (res?.vacancies?.length > 0) {
              //   console.log("🔍 Sample NHS Job:", res.vacancies[0]);
              // }
              return res;
            })
            .catch((error) => {
              console.error("❌ NHS Jobs API error:", error);
              return { vacancies: [], totalResults: 0, totalPages: 0 };
            }),

          // 🏴 NHS Scotland
          scotNhsJobsService
            .searchJobs({
              ...searchParams,
              salaryBand: band && band !== "all-bands" ? band : undefined,
            })
            .then((res) => {
              console.log(
                "📦 NHS Scotland Results:",
                res?.jobs?.length || 0,
                "jobs"
              );
              // if (res?.jobs?.length > 0) {
              //   console.log("🔍 Sample Scotland Job:", res.jobs[0]);
              // }
              return res;
            })
            .catch((error) => {
              console.error("❌ Scottish NHS Jobs error:", error);
              return { jobs: [], totalResults: 0 };
            }),

          // 🌐 HealthJobsUK
          healthJobsUkService
            .searchJobs({
              ...searchParams,
            })
            .then((res) => {
              console.log(
                "📦 HealthJobsUK Results:",
                res?.jobs?.length || 0,
                "jobs"
              );
              if (res?.jobs?.length > 0) {
                console.log("🔍 Sample HealthJobsUK Job:", res.jobs[0]);
              }
              return res;
            })
            .catch((error) => {
              console.error("❌ HealthJobsUK error:", error);
              return { jobs: [], totalResults: 0 };
            }),
        ]
      );

      // Convert external API jobs to our internal format and add to existing results
      const externalJobs = [
        // NHS Jobs England
        ...nhsResults.vacancies.map((job) => {
          const converted = nhsJobsService.convertToInternalFormat(job);
          return {
            id: job.id,
            ...converted,
            source: "NHS Jobs England",
          };
        }),

        // NHS Scotland
        ...scotNhsResults.jobs.map((job) => {
          const converted = scotNhsJobsService.convertToInternalFormat(job);
          return {
            id: job.id,
            ...converted,
            source: "NHS Scotland",
          };
        }),

        // HealthJobsUK
        ...healthJobsResults.jobs.map((job) => {
          const converted = healthJobsUkService.convertToInternalFormat(job);
          return {
            id: job.id,
            ...converted,
            source: "HealthJobsUK",
          };
        }),
      ];

      // Combine external jobs with database jobs
      allJobs.push(...externalJobs);

      // Apply ALL filters to the combined results
      let filteredJobs = allJobs;

      // Filter by band if requested
      if (band && band !== "all-bands") {
        filteredJobs = filteredJobs.filter((job) => job.band === band);
      }

      // Filter by location if requested
      if (location) {
        filteredJobs = filteredJobs.filter((job) =>
          job.location?.toLowerCase().includes(location.toLowerCase())
        );
      }

      // Filter by visa sponsorship if requested
      if (visa === "true") {
        filteredJobs = filteredJobs.filter(
          (job) =>
            job.visaSponsorship ||
            job.description?.toLowerCase().includes("visa")
        );
      }

      // Sort by relevance (featured first, then by salary)
      const sortedJobs = filteredJobs.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        if (a.salaryMin && b.salaryMin) return b.salaryMin - a.salaryMin;
        return 0;
      });

      // Allow reasonable caching for job search results (5 minutes)
      res.set({
        "Cache-Control": "public, max-age=300",
        "Last-Modified": new Date().toUTCString(),
      });

      res.json(sortedJobs);
    } catch (error) {
      console.error("Error fetching jobs from multiple sources:", error);
      // Fallback to stored jobs if all APIs fail
      const fallbackJobs = await storage.getNhsJobs({
        band: req.query.band || undefined,
        location: req.query.location || undefined,
        visaSponsorship: req.query.visa === "true" || undefined,
      });
      res.json(fallbackJobs);
    }
  });

  app.get("/api/jobs/featured", async (req: any, res) => {
    try {
      // Get featured jobs from all sources
      const [nhsFeatured, scotNhsFeatured, healthJobsFeatured] =
        await Promise.all([
          nhsJobsService.getFeaturedJobs(3).catch((error) => {
            console.error("NHS Jobs featured error:", error);
            return [];
          }),
          scotNhsJobsService.getFeaturedJobs(3).catch((error) => {
            console.error("Scottish NHS featured error:", error);
            return [];
          }),
          healthJobsUkService.getFeaturedJobs(3).catch((error) => {
            console.error("HealthJobsUK featured error:", error);
            return [];
          }),
        ]);

      // Convert all featured jobs to our internal format
      const allFeaturedJobs = [
        ...nhsFeatured.map((job) => ({
          id: job.id,
          ...nhsJobsService.convertToInternalFormat(job),
          source: "NHS Jobs England",
          featured: true,
        })),
        ...scotNhsFeatured.map((job) => ({
          id: job.id,
          ...scotNhsJobsService.convertToInternalFormat(job),
          source: "NHS Scotland",
          featured: true,
        })),
        ...healthJobsFeatured.map((job) => ({
          id: job.id,
          ...healthJobsUkService.convertToInternalFormat(job),
          source: "HealthJobsUK",
          featured: true,
        })),
      ];

      // Sort by salary (highest first) and limit to 9 total
      const sortedFeatured = allFeaturedJobs
        .sort((a, b) => (b.salaryMin || 0) - (a.salaryMin || 0))
        .slice(0, 9);

      res.json(sortedFeatured);
    } catch (error) {
      console.error(
        "Error fetching featured jobs from multiple sources:",
        error
      );
      // Fallback to stored featured jobs
      const fallbackJobs = await storage.getFeaturedJobs();
      res.json(fallbackJobs);
    }
  });

  app.post(
    "/api/jobs/:jobId/calculate-fit",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { jobId } = req.params;

        // Get user profile
        const profile = await storage.getProfile(userId);
        if (!profile) {
          return res
            .status(400)
            .json({ message: "Profile required for job fit calculation" });
        }

        // Get job details
        const jobs = await storage.getNhsJobs();
        const job = jobs.find((j) => j.id === jobId);
        if (!job) {
          return res.status(404).json({ message: "Job not found" });
        }

        // Calculate job fit using AI with error handling
        try {
          const fitResult = await aiService.calculateJobFit(profile, job);

          // Store job match
          await storage.createJobMatch({
            userId,
            jobId,
            fitScore: fitResult.score,
            skillsMatch: fitResult.breakdown,
          });

          res.json(fitResult);
        } catch (aiError: any) {
          // Handle AI quota/API errors gracefully
          if (aiError.status === 429) {
            res.status(503).json({
              message:
                "AI service temporarily unavailable. Please try again later.",
              error: "quota_exceeded",
            });
          } else {
            throw aiError; // Re-throw other errors
          }
        }
      } catch (error) {
        console.error("Error calculating job fit:", error);
        res.status(500).json({ message: "Failed to calculate job fit" });
      }
    }
  );

  app.get("/api/job-matches", ensureAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const matches = await storage.getJobMatches(userId);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching job matches:", error);
      res.status(500).json({ message: "Failed to fetch job matches" });
    }
  });

  // Dashboard customization routes
  app.put(
    "/api/dashboard/card-order",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { cardOrder } = req.body;

        if (!Array.isArray(cardOrder)) {
          return res
            .status(400)
            .json({ message: "Card order must be an array" });
        }

        await storage.updateDashboardCardOrder(userId, cardOrder);
        res.json({ success: true });
      } catch (error) {
        console.error("Error updating dashboard card order:", error);
        res
          .status(500)
          .json({ message: "Failed to update dashboard card order" });
      }
    }
  );

  app.get(
    "/api/dashboard/card-order",
    ensureAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        let cardOrder = user?.dashboardCardOrder || [
          "profile",
          "jobs",
          "documents",
          "resources",
          "practice",
          "qa",
          "tracker",
          "news",
          "referrals",
          "support",
        ];

        // Ensure news is always included (for users who had saved order before news was added)
        if (!cardOrder.includes("news")) {
          cardOrder = [...cardOrder, "news"];
        }

        // Ensure referrals is always included (for users who had saved order before referrals was added)
        if (!cardOrder.includes("referrals")) {
          cardOrder = [...cardOrder, "referrals"];
        }

        // Ensure support is always included (for users who had saved order before support was added)
        if (!cardOrder.includes("support")) {
          cardOrder = [...cardOrder, "support"];
        }

        res.json(cardOrder);
      } catch (error) {
        console.error("Error fetching dashboard card order:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch dashboard card order" });
      }
    }
  );

  // Get onboarding status
  app.get(
    "/api/onboarding/status",
    ensureAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);

        res.json({
          hasCompletedOnboarding: user?.hasCompletedOnboarding || false,
          hasCompletedPremiumOnboarding:
            user?.hasCompletedPremiumOnboarding || false,
          subscriptionStatus: user?.subscriptionStatus || "free",
        });
      } catch (error) {
        console.error("Error fetching onboarding status:", error);
        res.status(500).json({ message: "Failed to fetch onboarding status" });
      }
    }
  );

  // Complete onboarding
  app.post(
    "/api/onboarding/complete",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { type } = req.body; // 'free' or 'premium'

        const user = await storage.getUser(userId);
        const isPremium = user?.subscriptionStatus === "paid";

        // Update onboarding status
        const updateData: any = {};
        if (type === "premium" && isPremium) {
          updateData.hasCompletedPremiumOnboarding = true;
          // Also mark basic onboarding as complete since premium includes everything
          updateData.hasCompletedOnboarding = true;
        } else {
          updateData.hasCompletedOnboarding = true;
        }

        await storage.updateUser(userId, updateData);
        res.json({ success: true });
      } catch (error) {
        console.error("Error completing onboarding:", error);
        res.status(500).json({ message: "Failed to complete onboarding" });
      }
    }
  );

  // ==================== ADMIN SETUP ROUTE ====================
  // One-time Master Admin setup - can only be used if no master admin exists
  app.post(
    "/api/setup-master-admin",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Check if any master admin already exists
        const existingAdmins = await storage.getAllUsers();
        const masterAdminExists = existingAdmins.some(
          (u) => u.adminRole === "master_admin"
        );

        if (masterAdminExists) {
          return res
            .status(403)
            .json({ message: "Master Admin already exists" });
        }

        // Make current user the Master Admin
        const masterAdmin = await storage.makeUserAdmin(userId, "master_admin");

        // Log the setup
        await storage.createAdminActivityLog({
          adminId: userId,
          action: "setup_master_admin",
          targetType: "system",
          description: `Master Admin account created for ${user.email}`,
          metadata: { setupTimestamp: new Date() },
        });

        res.json({
          success: true,
          message: "Master Admin account created successfully!",
          admin: {
            email: masterAdmin.email,
            role: masterAdmin.adminRole,
            createdAt: masterAdmin.adminCreatedAt,
          },
        });
      } catch (error) {
        console.error("Error setting up Master Admin:", error);
        res
          .status(500)
          .json({ message: "Failed to setup Master Admin account" });
      }
    }
  );

  // ==================== ADMIN ROUTES ====================
  // Import admin authentication middleware
  const {
    isAdmin: requireAdmin,
    isMasterAdmin: requireMasterAdmin,
    isSecondaryAdminOrHigher: requireSecondaryAdminOrHigher,
    AdminService,
  } = await import("./adminAuth.js");

  // Admin dashboard overview
  app.get("/api/admin/dashboard", validateCSRFToken, async (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    try {
      const stats = await AdminService.getDashboardStats();
      const systemAnalytics = await storage.getSystemAnalytics();

      res.json({
        ...systemAnalytics,
        adminInfo: {
          role: user.adminRole,
          isMasterAdmin: user.adminRole === "master_admin",
          isSecondaryAdmin: user.adminRole === "secondary_admin",
        },
      });
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
      res.status(500).json({ message: "Failed to fetch admin dashboard data" });
    }
  });

  // Admin endpoint to view email logs
  app.get("/api/admin/email-logs", validateCSRFToken, async (req: any, res) => {
    try {
      if (!req.user)
        return res.status(401).json({ message: "Authentication required" });
      const adminUser = await storage.getUser(req.user.claims.sub);
      if (!adminUser?.isAdmin)
        return res.status(403).json({ message: "Admin access required" });

      const { getEmailLogs } = await import("../email");
      const logs = getEmailLogs();

      res.json({
        logs: logs.slice(-50), // Return last 50 logs
        total: logs.length,
      });
    } catch (error) {
      console.error("Error fetching email logs:", error);
      res.status(500).json({ message: "Failed to fetch email logs" });
    }
  });

  // Admin endpoint to test email configuration
  app.post(
    "/api/admin/test-email",
    validateCSRFToken,
    async (req: any, res) => {
      try {
        if (!req.user)
          return res.status(401).json({ message: "Authentication required" });
        const adminUser = await storage.getUser(req.user.claims.sub);
        if (!adminUser?.isAdmin)
          return res.status(403).json({ message: "Admin access required" });

        const { testEmailConfiguration, sendWelcomeEmail } = await import(
          "../email"
        );

        // Test email configuration
        const configValid = await testEmailConfiguration();
        if (!configValid) {
          return res
            .status(500)
            .json({ message: "Email configuration is invalid" });
        }

        // Send test welcome email to admin
        const testEmail = adminUser.email || "test@example.com";
        await sendWelcomeEmail(testEmail, adminUser.firstName || "Admin");

        res.json({
          message: "Test email sent successfully",
          testEmail,
          configValid: true,
        });
      } catch (error) {
        console.error("Error testing email:", error);
        res.status(500).json({
          message: "Failed to test email",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // Test endpoint to manually trigger greeting email (for testing)
  app.post("/api/test/greeting-email", async (req: any, res) => {
    try {
      const { email, firstName } = req.body;
      if (!email) return res.status(400).json({ message: "Email required" });

      const { sendWelcomeEmail } = await import("../email");

      console.log(`🧪 TEST: Sending greeting email to: ${email}`);
      await sendWelcomeEmail(email, firstName || "Test User");
      console.log(`✅ TEST: Greeting email sent successfully to: ${email}`);

      res.json({
        message: "Test greeting email sent successfully",
        email,
        firstName: firstName || "Test User",
      });
    } catch (error) {
      console.error("❌ TEST: Error sending greeting email:", error);
      res.status(500).json({
        message: "Failed to send test greeting email",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
  // ===============================================
  // ADMIN USAGE MANAGEMENT ENDPOINTS
  // ===============================================

  // Get all users with their current usage counters
  app.get(
    "/api/admin/usage-overview",
    validateCSRFToken,
    async (req: any, res) => {
      try {
        if (!req.user)
          return res.status(401).json({ message: "Authentication required" });
        const adminUser = await storage.getUser(req.user.claims.sub);
        if (!adminUser?.isAdmin)
          return res.status(403).json({ message: "Admin access required" });

        const { USAGE_LIMITS } = await import("./config/usageLimits.js");

        // Get all users with their usage data
        const usersWithUsage = await db
          .select({
            userId: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            subscriptionStatus: users.subscriptionStatus,
            createdAt: users.createdAt,
            dailyCount: aiUsageTracking.dailyCount,
            weeklyCount: aiUsageTracking.weeklyCount,
            monthlyCount: aiUsageTracking.monthlyCount,
            featureType: aiUsageTracking.featureType,
            usageDate: aiUsageTracking.usageDate,
          })
          .from(users)
          .leftJoin(
            aiUsageTracking,
            and(
              eq(users.id, aiUsageTracking.userId),
              eq(
                aiUsageTracking.usageDate,
                new Date().toISOString().split("T")[0]
              )
            )
          )
          .orderBy(users.createdAt);

        // Group by user and calculate totals
        const userUsageMap = new Map();
        usersWithUsage.forEach((row) => {
          if (!userUsageMap.has(row.userId)) {
            userUsageMap.set(row.userId, {
              userId: row.userId,
              email: row.email,
              firstName: row.firstName,
              lastName: row.lastName,
              subscriptionStatus: row.subscriptionStatus,
              createdAt: row.createdAt,
              usage: {},
            });
          }

          if (row.featureType) {
            userUsageMap.get(row.userId).usage[row.featureType] = {
              daily: row.dailyCount || 0,
              weekly: row.weeklyCount || 0,
              monthly: row.monthlyCount || 0,
              limits:
                USAGE_LIMITS[row.featureType as keyof typeof USAGE_LIMITS],
            };
          }
        });

        const usersWithUsageData = Array.from(userUsageMap.values());

        res.json({
          users: usersWithUsageData,
          limits: USAGE_LIMITS,
          totalUsers: usersWithUsageData.length,
        });
      } catch (error) {
        console.error("Error fetching usage overview:", error);
        res.status(500).json({ message: "Failed to fetch usage overview" });
      }
    }
  );

  // Get detailed usage for a specific user
  app.get(
    "/api/admin/usage/user/:userId",
    validateCSRFToken,
    async (req: any, res) => {
      try {
        if (!req.user)
          return res.status(401).json({ message: "Authentication required" });
        const adminUser = await storage.getUser(req.user.claims.sub);
        if (!adminUser?.isAdmin)
          return res.status(403).json({ message: "Admin access required" });

        const { userId } = req.params;
        const { USAGE_LIMITS } = await import("./config/usageLimits.js");

        // Get user info
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));
        if (!user) return res.status(404).json({ message: "User not found" });

        // Get usage history (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const usageHistory = await db
          .select()
          .from(aiUsageTracking)
          .where(
            and(
              eq(aiUsageTracking.userId, userId),
              sql`${aiUsageTracking.usageDate} >= ${thirtyDaysAgo.toISOString().split("T")[0]
                }`
            )
          )
          .orderBy(aiUsageTracking.usageDate);

        // Get active restrictions
        const restrictions = await db
          .select()
          .from(userRestrictions)
          .where(
            and(
              eq(userRestrictions.userId, userId),
              eq(userRestrictions.isActive, true)
            )
          );

        // Get violations
        const violations = await db
          .select()
          .from(usageViolations)
          .where(eq(usageViolations.userId, userId))
          .orderBy(sql`${usageViolations.createdAt} DESC`)
          .limit(50);

        res.json({
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            subscriptionStatus: user.subscriptionStatus,
            createdAt: user.createdAt,
          },
          usageHistory,
          activeRestrictions: restrictions.filter(
            (r) => !r.endTime || r.endTime > new Date()
          ),
          violations,
          limits: USAGE_LIMITS,
        });
      } catch (error) {
        console.error("Error fetching user usage details:", error);
        res.status(500).json({ message: "Failed to fetch user usage details" });
      }
    }
  );

  // Reset usage counters for a specific user and feature
  app.post(
    "/api/admin/usage/reset",
    validateCSRFToken,
    async (req: any, res) => {
      try {
        if (!req.user)
          return res.status(401).json({ message: "Authentication required" });
        const adminUser = await storage.getUser(req.user.claims.sub);
        if (!adminUser?.isAdmin)
          return res.status(403).json({ message: "Admin access required" });

        const { userId, featureType, period } = req.body;

        if (!userId || !featureType) {
          return res
            .status(400)
            .json({ message: "userId and featureType are required" });
        }

        const today = new Date().toISOString().split("T")[0];

        // Get current usage record
        const [usageRecord] = await db
          .select()
          .from(aiUsageTracking)
          .where(
            and(
              eq(aiUsageTracking.userId, userId),
              eq(aiUsageTracking.featureType, featureType),
              eq(aiUsageTracking.usageDate, today)
            )
          );

        if (usageRecord) {
          // Reset specific counters based on period
          const updateData: any = { updatedAt: new Date() };

          if (period === "daily" || period === "all") {
            updateData.dailyCount = 0;
          }
          if (period === "weekly" || period === "all") {
            updateData.weeklyCount = 0;
          }
          if (period === "monthly" || period === "all") {
            updateData.monthlyCount = 0;
          }

          await db
            .update(aiUsageTracking)
            .set(updateData)
            .where(eq(aiUsageTracking.id, usageRecord.id));
        }

        // Also remove any active restrictions for this user/feature
        await db
          .update(userRestrictions)
          .set({ isActive: false, updatedAt: new Date() })
          .where(
            and(
              eq(userRestrictions.userId, userId),
              eq(userRestrictions.featureType, featureType),
              eq(userRestrictions.isActive, true)
            )
          );

        res.json({
          message: `Usage counters reset successfully for user ${userId}, feature ${featureType}, period ${period}`,
          userId,
          featureType,
          period,
        });
      } catch (error) {
        console.error("Error resetting usage counters:", error);
        res.status(500).json({ message: "Failed to reset usage counters" });
      }
    }
  );

  // Adjust quotas for a specific user
  app.post(
    "/api/admin/usage/adjust-quota",
    validateCSRFToken,
    async (req: any, res) => {
      try {
        if (!req.user)
          return res.status(401).json({ message: "Authentication required" });
        const adminUser = await storage.getUser(req.user.claims.sub);
        if (!adminUser?.isAdmin)
          return res.status(403).json({ message: "Admin access required" });

        const { userId, featureType, newLimits, reason } = req.body;

        if (!userId || !featureType || !newLimits) {
          return res.status(400).json({
            message: "userId, featureType, and newLimits are required",
          });
        }

        // In a full implementation, you might want to store custom limits per user
        console.log(
          `Admin ${adminUser.id} adjusted quota for user ${userId}:`,
          {
            featureType,
            newLimits,
            reason,
            timestamp: new Date(),
          }
        );

        res.json({
          message: `Quota adjustment logged for user ${userId}`,
          userId,
          featureType,
          newLimits,
          reason,
          adjustedBy: adminUser.id,
        });
      } catch (error) {
        console.error("Error adjusting quota:", error);
        res.status(500).json({ message: "Failed to adjust quota" });
      }
    }
  );

  // ===============================================
  // USAGE RESET ENDPOINTS (for testing and manual resets)
  // ===============================================

  // Manual daily reset
  app.post(
    "/api/admin/reset/daily",
    validateCSRFToken,
    async (req: any, res) => {
      try {
        if (!req.user)
          return res.status(401).json({ message: "Authentication required" });
        const adminUser = await storage.getUser(req.user.claims.sub);
        if (!adminUser?.isAdmin)
          return res.status(403).json({ message: "Admin access required" });

        console.log("🔄 Manual daily reset triggered by admin");
        const { UsageResetService } = await import(
          "./services/usageResetService.js"
        );
        await UsageResetService.resetDailyCounters();

        res.json({ message: "Daily usage counters reset successfully" });
      } catch (error) {
        console.error("Error resetting daily counters:", error);
        res.status(500).json({ message: "Failed to reset daily counters" });
      }
    }
  );

  // Manual weekly reset
  app.post(
    "/api/admin/reset/weekly",
    validateCSRFToken,
    async (req: any, res) => {
      try {
        if (!req.user)
          return res.status(401).json({ message: "Authentication required" });
        const adminUser = await storage.getUser(req.user.claims.sub);
        if (!adminUser?.isAdmin)
          return res.status(403).json({ message: "Admin access required" });

        const { UsageResetService } = await import(
          "./services/usageResetService.js"
        );
        await UsageResetService.resetWeeklyCounters();

        res.json({ message: "Weekly usage counters reset successfully" });
      } catch (error) {
        console.error("Error resetting weekly counters:", error);
        res.status(500).json({ message: "Failed to reset weekly counters" });
      }
    }
  );

  // Manual monthly reset
  app.post(
    "/api/admin/reset/monthly",
    validateCSRFToken,
    async (req: any, res) => {
      try {
        if (!req.user)
          return res.status(401).json({ message: "Authentication required" });
        const adminUser = await storage.getUser(req.user.claims.sub);
        if (!adminUser?.isAdmin)
          return res.status(403).json({ message: "Admin access required" });

        const { UsageResetService } = await import(
          "./services/usageResetService.js"
        );
        await UsageResetService.resetMonthlyCounters();

        res.json({ message: "Monthly usage counters reset successfully" });
      } catch (error) {
        console.error("Error resetting monthly counters:", error);
        res.status(500).json({ message: "Failed to reset monthly counters" });
      }
    }
  );

  // Cleanup expired restrictions
  app.post(
    "/api/admin/reset/cleanup",
    validateCSRFToken,
    async (req: any, res) => {
      try {
        if (!req.user)
          return res.status(401).json({ message: "Authentication required" });
        const adminUser = await storage.getUser(req.user.claims.sub);
        if (!adminUser?.isAdmin)
          return res.status(403).json({ message: "Admin access required" });

        const { UsageResetService } = await import(
          "./services/usageResetService.js"
        );
        await UsageResetService.cleanupExpiredRestrictions();

        res.json({ message: "Expired restrictions cleanup completed" });
      } catch (error) {
        console.error("Error cleaning up expired restrictions:", error);
        res
          .status(500)
          .json({ message: "Failed to cleanup expired restrictions" });
      }
    }
  );

  // Get reset schedule information
  app.get(
    "/api/admin/reset/schedule",
    validateCSRFToken,
    async (req: any, res) => {
      try {
        if (!req.user)
          return res.status(401).json({ message: "Authentication required" });
        const adminUser = await storage.getUser(req.user.claims.sub);
        if (!adminUser?.isAdmin)
          return res.status(403).json({ message: "Admin access required" });

        const { UsageResetService } = await import(
          "./services/usageResetService.js"
        );
        const schedule = UsageResetService.getResetSchedule();

        res.json(schedule);
      } catch (error) {
        console.error("Error getting reset schedule:", error);
        res.status(500).json({ message: "Failed to get reset schedule" });
      }
    }
  );

  // User management - Get all users
  app.get("/api/admin/users", validateCSRFToken, async (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    try {
      const users = await storage.getAllUsers();

      // Log admin activity
      await AdminService.logActivity(
        userId,
        "view_users",
        "users",
        undefined,
        "Viewed user list"
      );

      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Make user admin (Master Admin only)
  app.post(
    "/api/admin/users/:userId/make-admin",
    requireMasterAdmin,
    async (req: any, res) => {
      try {
        const { userId } = req.params;
        const { adminRole } = req.body; // 'secondary_admin'

        if (adminRole !== "secondary_admin") {
          return res
            .status(400)
            .json({ message: "Only secondary_admin role can be assigned" });
        }

        const updatedUser = await storage.makeUserAdmin(
          userId,
          adminRole,
          req.admin.userId
        );

        // Log admin activity
        await AdminService.logActivity(
          req.admin.userId,
          "create_admin",
          "user",
          userId,
          `Made user ${updatedUser.email} a secondary admin`
        );

        res.json(updatedUser);
      } catch (error) {
        console.error("Error making user admin:", error);
        res.status(500).json({ message: "Failed to make user admin" });
      }
    }
  );

  // Revoke user admin access (Master Admin only)
  app.post(
    "/api/admin/users/:userId/revoke-admin",
    requireMasterAdmin,
    async (req: any, res) => {
      try {
        const { userId } = req.params;

        const updatedUser = await storage.revokeUserAdmin(
          userId,
          req.admin.userId
        );

        // Log admin activity
        await AdminService.logActivity(
          req.admin.userId,
          "revoke_admin",
          "user",
          userId,
          `Revoked admin access from user ${updatedUser.email}`
        );

        res.json(updatedUser);
      } catch (error) {
        console.error("Error revoking user admin access:", error);
        res.status(500).json({ message: "Failed to revoke admin access" });
      }
    }
  );

  // Delete user (Master Admin only)
  app.delete(
    "/api/admin/users/:userId",
    requireMasterAdmin,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const { userId } = req.params;
        const adminUserId = req.admin.userId;

        // Prevent deleting self
        if (userId === adminUserId) {
          return res
            .status(400)
            .json({ message: "Cannot delete your own account" });
        }

        // Get user info for logging before deletion
        const userToDelete = await storage.getUser(userId);
        if (!userToDelete) {
          return res.status(404).json({ message: "User not found" });
        }

        await storage.deleteUser(userId);

        // Log admin activity
        await AdminService.logActivity(
          adminUserId,
          "delete_user",
          "user",
          userId,
          `Deleted user ${userToDelete.email}`
        );

        res.json({ message: "User deleted successfully" });
      } catch (error) {
        console.error("❌ Error deleting user:", error);
        console.error("Error details:", {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          message: "Failed to delete user",
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );

  // Suspend user
  app.post(
    "/api/admin/users/:userId/suspend",
    requireSecondaryAdminOrHigher,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const { userId } = req.params;
        const { reason } = req.body;
        const adminUserId = req.admin.userId;

        const suspendedUser = await storage.suspendUser(
          userId,
          reason,
          adminUserId
        );

        // Log admin activity
        await AdminService.logActivity(
          adminUserId,
          "suspend_user",
          "user",
          userId,
          `Suspended user ${suspendedUser.email}. Reason: ${reason || "No reason provided"
          }`
        );

        res.json(suspendedUser);
      } catch (error) {
        console.error("Error suspending user:", error);
        res.status(500).json({ message: "Failed to suspend user" });
      }
    }
  );

  // Unsuspend user
  app.post(
    "/api/admin/users/:userId/unsuspend",
    requireSecondaryAdminOrHigher,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const { userId } = req.params;
        const adminUserId = req.admin.userId;

        const unsuspendedUser = await storage.unsuspendUser(
          userId,
          adminUserId
        );

        // Log admin activity
        await AdminService.logActivity(
          adminUserId,
          "unsuspend_user",
          "user",
          userId,
          `Unsuspended user ${unsuspendedUser.email}`
        );

        res.json(unsuspendedUser);
      } catch (error) {
        console.error("Error unsuspending user:", error);
        res.status(500).json({ message: "Failed to unsuspend user" });
      }
    }
  );

  // Invite new user (Admin only)
  app.post(
    "/api/admin/users/invite",
    requireSecondaryAdminOrHigher,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const { email, userType, firstName, lastName } = req.body;
        const adminUserId = req.admin.userId;

        // Validate required fields
        if (!email || !userType) {
          return res.status(400).json({
            message: "Email and user type are required",
          });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            message: "Please provide a valid email address",
          });
        }

        // Validate user type
        if (!["applicant", "employer"].includes(userType)) {
          return res.status(400).json({
            message: "User type must be 'applicant' or 'employer'",
          });
        }

        // Check if user already exists
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser.length > 0) {
          return res.status(400).json({
            message: "A user with this email already exists",
          });
        }

        // Generate invitation token
        const invitationToken = randomUUID();
        const invitationExpires = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ); // 7 days

        // Create user record with invitation status
        const [newUser] = await db
          .insert(users)
          .values({
            email,
            firstName: firstName || null,
            lastName: lastName || null,
            userType,
            approvalStatus: userType === "employer" ? "pending" : "approved",
            verificationToken: invitationToken,
            verificationTokenExpires: invitationExpires,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        // Send invitation email
        try {
          await sendInvitationEmail({
            email,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            userType,
            invitationToken,
            appUrl: process.env.APP_URL || "http://localhost:3000",
          });

          // Log admin activity
          await AdminService.logActivity(
            adminUserId,
            "invite_user",
            "user",
            newUser.id,
            `Invited ${userType} user ${email}`
          );

          res.json({
            message: "Invitation sent successfully",
            user: {
              id: newUser.id,
              email: newUser.email,
              userType: newUser.userType,
              firstName: newUser.firstName,
              lastName: newUser.lastName,
            },
          });
        } catch (emailError) {
          console.error("Failed to send invitation email:", emailError);

          // If email fails, we should still return success but log the issue
          // The user was created and can still be invited manually
          res.json({
            message:
              "User created but invitation email failed to send. Please contact support.",
            user: {
              id: newUser.id,
              email: newUser.email,
              userType: newUser.userType,
              firstName: newUser.firstName,
              lastName: newUser.lastName,
            },
            warning: "Email delivery failed",
          });
        }
      } catch (error) {
        console.error("Error inviting user:", error);
        res.status(500).json({ message: "Failed to invite user" });
      }
    }
  );

  // Update user details
  app.patch(
    "/api/admin/users/:userId",
    requireSecondaryAdminOrHigher,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const { userId } = req.params;
        const updates = req.body;
        const adminUserId = req.admin.userId;

        const updatedUser = await storage.updateUserByAdmin(
          userId,
          updates,
          adminUserId
        );

        // Log admin activity
        await AdminService.logActivity(
          adminUserId,
          "update_user",
          "user",
          userId,
          `Updated user ${updatedUser.email}: ${JSON.stringify(updates)}`
        );

        res.json(updatedUser);
      } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Failed to update user" });
      }
    }
  );

  // System health monitoring
  app.get(
    "/api/admin/system-health",
    requireSecondaryAdminOrHigher,
    async (req: any, res) => {
      try {
        const health = await storage.getSystemHealth();
        res.json(health);
      } catch (error) {
        console.error("Error fetching system health:", error);
        res.status(500).json({
          dbStatus: "error",
          aiServiceStatus: "error",
          paymentServiceStatus: "error",
          errorCount: 0,
          avgResponseTime: 0,
          uptime: "0s",
        });
      }
    }
  );

  // Admin: Get all GDPR requests
  app.get(
    "/api/admin/gdpr-requests",
    requireSecondaryAdminOrHigher,
    async (req: any, res) => {
      try {
        const requests = await storage.getAllDataSubjectRequests();

        res.json({
          requests: requests.map((r) => ({
            id: r.id,
            userId: r.userId,
            userEmail: r.userEmail, // We'll need to join with users table
            type: r.requestType,
            status: r.status,
            submittedDate: r.submittedDate,
            completedDate: r.completedDate,
            referenceId: r.referenceId,
            details: r.requestDetails,
            adminNotes: r.adminNotes,
          })),
        });
      } catch (error) {
        console.error("Error fetching admin GDPR requests:", error);
        res.status(500).json({ error: "Failed to fetch GDPR requests" });
      }
    }
  );

  // Admin: Update GDPR request status
  app.patch(
    "/api/admin/gdpr-requests/:requestId",
    requireSecondaryAdminOrHigher,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const { requestId } = req.params;
        const { status, adminNotes } = req.body;
        const adminUserId = req.admin.userId;

        if (
          !["pending", "in_progress", "completed", "rejected"].includes(status)
        ) {
          return res.status(400).json({ error: "Invalid status" });
        }

        const updatedRequest = await storage.updateDataSubjectRequestStatus(
          requestId,
          status,
          adminNotes,
          adminUserId
        );

        // Log admin activity
        await AdminService.logActivity(
          adminUserId,
          "update_gdpr_request",
          "gdpr_request",
          requestId,
          `Updated GDPR request ${updatedRequest.referenceId} status to ${status}`
        );

        res.json(updatedRequest);
      } catch (error) {
        console.error("Error updating GDPR request:", error);
        res.status(500).json({ error: "Failed to update GDPR request" });
      }
    }
  );

  // Admin: Update own profile (email/password)
  app.put(
    "/api/admin/update-profile",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { currentPassword, newEmail, newPassword } = req.body;

        // Verify current user is admin
        const user = await storage.getUser(userId);
        if (!user?.isAdmin) {
          return res.status(403).json({ message: "Admin access required" });
        }

        // Verify current password
        if (!user.passwordHash) {
          return res.status(400).json({ message: "Current password verification failed" });
        }

        const isCurrentPasswordValid = await verifyPassword(
          currentPassword,
          user.passwordHash
        );

        if (!isCurrentPasswordValid) {
          return res.status(400).json({ message: "Current password is incorrect" });
        }

        // Prepare updates object
        const updates: any = {};

        // Update email if provided and different
        if (newEmail && newEmail !== user.email) {
          // Check if email is already taken by another user
          const existingUser = await findUserByEmail(newEmail);
          if (existingUser && existingUser.id !== userId) {
            return res.status(400).json({ message: "Email already in use" });
          }
          updates.email = newEmail;
        }

        // Update password if provided
        if (newPassword) {
          if (newPassword.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters long" });
          }
          updates.passwordHash = await hashPassword(newPassword);
        }

        // Only proceed if there are actual changes
        if (Object.keys(updates).length === 0) {
          return res.status(400).json({ message: "No changes provided" });
        }

        // Update the user
        await storage.updateUser(userId, updates);

        // Log admin activity
        const AdminService = await import("./admin");
        await AdminService.logActivity(
          userId,
          "update_profile",
          "admin_profile",
          userId,
          `Admin updated own profile: ${Object.keys(updates).join(", ")}`
        );

        // Return success (don't include password hash in response)
        const updatedUser = await storage.getUser(userId);
        const response = {
          id: updatedUser!.id,
          email: updatedUser!.email,
          firstName: updatedUser!.firstName,
          lastName: updatedUser!.lastName,
          isAdmin: updatedUser!.isAdmin,
          adminRole: updatedUser!.adminRole,
        };

        res.json({
          message: "Profile updated successfully",
          user: response,
        });
      } catch (error) {
        console.error("Error updating admin profile:", error);
        res.status(500).json({ message: "Failed to update profile" });
      }
    }
  );

  // Content management - Get all content
  app.get("/api/admin/content", validateCSRFToken, async (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    try {
      const content = await storage.getAdminContent();
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  // Content management - Update content
  app.put("/api/admin/content/:contentKey", async (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    try {
      const { contentKey } = req.params;
      const { title, content, contentType } = req.body;

      const updatedContent = await storage.updateAdminContent(
        contentKey,
        { title, content, contentType },
        userId
      );

      // Log admin activity
      await AdminService.logActivity(
        userId,
        "update_content",
        "content",
        contentKey,
        `Updated content: ${title}`
      );

      res.json(updatedContent);
    } catch (error) {
      console.error("Error updating content:", error);
      res.status(500).json({ message: "Failed to update content" });
    }
  });

  // ==================== LEARNING RESOURCES MANAGEMENT ====================

  // Get all learning resources
  app.get("/api/admin/resources", async (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user.claims.sub;

    try {
      const resources = await storage.getLearningResources();
      res.json(resources);
    } catch (error) {
      console.error("Error fetching learning resources:", error);
      res.status(500).json({ message: "Failed to fetch learning resources" });
    }
  });

  // Create new learning resource
  app.post("/api/admin/resources", validateCSRFToken, async (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { title, description, icon, type, fileUrl, videoUrl } = req.body;

      // Validation
      if (!title || !description || !icon || !type) {
        return res.status(400).json({
          message: "Title, description, icon, and type are required"
        });
      }

      if (type === "file" && !fileUrl) {
        return res.status(400).json({
          message: "File URL is required for file type resources"
        });
      }

      if (type === "video" && !videoUrl) {
        return res.status(400).json({
          message: "Video URL is required for video type resources"
        });
      }

      const resourceData = {
        title,
        description,
        icon,
        type,
        fileUrl: type === "file" ? fileUrl : null,
        videoUrl: type === "video" ? videoUrl : null,
        isPublished: true,
        createdBy: userId,
        updatedBy: userId,
      };

      const newResource = await storage.createLearningResource(resourceData);

      // Log admin activity
      await AdminService.logActivity(
        userId,
        "create_resource",
        "resource",
        newResource.id,
        `Created learning resource: ${title}`
      );

      res.status(201).json(newResource);
    } catch (error) {
      console.error("Error creating learning resource:", error);
      res.status(500).json({ message: "Failed to create learning resource" });
    }
  });

  // Update learning resource
  app.put("/api/admin/resources/:id", validateCSRFToken, async (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { id } = req.params;
      const updates = { ...req.body, updatedBy: userId };

      const updatedResource = await storage.updateLearningResource(id, updates);

      // Log admin activity
      await AdminService.logActivity(
        userId,
        "update_resource",
        "resource",
        id,
        `Updated learning resource: ${updates.title || 'Untitled'}`
      );

      res.json(updatedResource);
    } catch (error) {
      console.error("Error updating learning resource:", error);
      res.status(500).json({ message: "Failed to update learning resource" });
    }
  });

  // Delete learning resource
  app.delete("/api/admin/resources/:id", validateCSRFToken, async (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { id } = req.params;

      await storage.deleteLearningResource(id);

      // Log admin activity
      await AdminService.logActivity(
        userId,
        "delete_resource",
        "resource",
        id,
        "Deleted learning resource"
      );

      res.json({ message: "Learning resource deleted successfully" });
    } catch (error) {
      console.error("Error deleting learning resource:", error);
      res.status(500).json({ message: "Failed to delete learning resource" });
    }
  });

  // PUBLIC: Get published learning resources (no auth required)
  app.get("/api/resources", async (req: any, res) => {
    try {
      const allResources = await storage.getLearningResources();
      console.log("Fetched public learning resources:", allResources.length);
      res.json(allResources);
    } catch (error) {
      console.error("Error fetching public learning resources:", error);
      res.status(500).json({ message: "Failed to fetch learning resources" });
    }
  });

  // Resource file upload endpoint
  app.post(
    "/api/admin/resources/upload",
    ensureAuthenticated,
    validateCSRFToken,
    upload.single("file"),
    async (req: any, res) => {
      try {
        console.log("Resource upload endpoint hit");
        console.log("req.file:", req.file);
        console.log("req.body:", req.body);
        console.log("req.user exists:", !!req.user);

        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);

        if (!user?.isAdmin) {
          return res.status(403).json({ message: "Admin access required" });
        }

        const file = req.file;
        const { fileType } = req.body;

        if (!file) {
          console.error("No file in req.file");
          return res.status(400).json({ message: "No file uploaded" });
        }

        console.log("File detected:", {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        });

        // Validate file type for resources (PDF, DOC, DOCX)
        const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({
            message: "Invalid file type. Only PDF, DOC, and DOCX files are allowed for resources",
          });
        }

        // Upload to GCS in resources folder
        const fileUrl = await uploadFileToGCS(file, "resources", userId);

        // Return the file URL for frontend use
        res.json({
          url: fileUrl,
          filePath: fileUrl,
          fileName: file.originalname,
          fileSize: file.size,
          message: "Resource file uploaded successfully"
        });

      } catch (error) {
        console.error("Error uploading resource file:", error);
        res.status(500).json({ message: "Failed to upload resource file" });
      }
    }
  );

  // =============================================
  // NEWS ARTICLES MANAGEMENT ROUTES
  // =============================================

  // Get all news articles (Admin only)
  app.get("/api/admin/news", async (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const articles = await storage.getNewsArticles();
      res.json(articles);
    } catch (error) {
      console.error("Error fetching news articles:", error);
      res.status(500).json({ message: "Failed to fetch news articles" });
    }
  });

  // Create new news article
  app.post("/api/admin/news", validateCSRFToken, async (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {

      const { title, description, content, category, type, priority, readTime, publishDate } = req.body;

      // Validation
      if (!title || !content) {
        return res.status(400).json({
          message: "Title and content are required"
        });
      }

      // Helper function to handle empty strings and null values
      const sanitizeValue = (value: any) => {
        if (value === null || value === undefined) {
          return null;
        }
        if (typeof value === "string" && value.trim() === "") {
          return null;
        }
        return value;
      };

      const articleData = {
        title,
        description: sanitizeValue(description),
        content,
        category: sanitizeValue(category),
        type: sanitizeValue(type),
        priority: sanitizeValue(priority),
        read_time: sanitizeValue(readTime),  // Database column is read_time (snake_case)
        publishedAt: publishDate ? new Date(publishDate) : null,
        authorId: userId,
        isPublished: true,
      };

      const newArticle = await storage.createNewsArticle(articleData);

      // Log admin activity
      await AdminService.logActivity(
        userId,
        "create_news",
        "news",
        newArticle.id,
        `Created news article: ${title}`
      );

      res.status(201).json(newArticle);
    } catch (error) {
      console.error("Error creating news article:", error);
      res.status(500).json({ message: "Failed to create news article" });
    }
  });

  // Update news article
  app.put("/api/admin/news/:id", validateCSRFToken, async (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {

      const { id } = req.params;
      const { title, description, content, category, type, priority, readTime, publishDate } = req.body;

      console.log("Updating news article with data:", {
        title, description, content, category, type, priority,
        readTime, publishDate,
        readTimeType: typeof readTime,
        readTimeLength: readTime?.length
      });

      // Helper function to handle empty strings and null values
      const sanitizeValue = (value: any) => {
        if (value === null || value === undefined) {
          return null;
        }
        if (typeof value === "string" && value.trim() === "") {
          return null;
        }
        return value;
      };

      const updates: any = {
        title,
        description: sanitizeValue(description),
        content,
        category: sanitizeValue(category),
        type: sanitizeValue(type),
        priority: sanitizeValue(priority),
        read_time: sanitizeValue(readTime),  // Database column is read_time (snake_case)
      };

      if (publishDate) {
        updates.publishedAt = new Date(publishDate);
      }

      const updatedArticle = await storage.updateNewsArticle(id, updates);

      // Log admin activity
      await AdminService.logActivity(
        userId,
        "update_news",
        "news",
        id,
        `Updated news article: ${title || 'Untitled'}`
      );

      res.json(updatedArticle);
    } catch (error) {
      console.error("Error updating news article:", error);
      res.status(500).json({ message: "Failed to update news article" });
    }
  });

  // Delete news article
  app.delete("/api/admin/news/:id", validateCSRFToken, async (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { id } = req.params;

      await storage.deleteNewsArticle(id);

      // Log admin activity
      await AdminService.logActivity(
        userId,
        "delete_news",
        "news",
        id,
        "Deleted news article"
      );

      res.json({ message: "News article deleted successfully" });
    } catch (error) {
      console.error("Error deleting news article:", error);
      res.status(500).json({ message: "Failed to delete news article" });
    }
  });

  // PUBLIC: Get published news articles (no auth required)
  app.get("/api/news", async (req: any, res) => {
    try {
      const allArticles = await storage.getNewsArticles();
      console.log("Fetched public news articles:", allArticles.length);
      res.json(allArticles);
    } catch (error) {
      console.error("Error fetching public news articles:", error);
      res.status(500).json({ message: "Failed to fetch news articles" });
    }
  });

  // =============================================
  // SUPPORT ARTICLES MANAGEMENT ROUTES
  // =============================================

  // Get published support articles (Public access)
  app.get("/api/support", async (req: any, res) => {
    try {
      const articles = await storage.getSupportArticles();
      // Filter to only published articles for public access
      const publishedArticles = articles.filter(article => article.isPublished);
      res.json(publishedArticles);
    } catch (error) {
      console.error("Error fetching public support articles:", error);
      res.status(500).json({ message: "Failed to fetch support articles" });
    }
  });

  // Get all support articles (Admin only)
  app.get("/api/admin/support", async (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const articles = await storage.getSupportArticles();
      res.json(articles);
    } catch (error) {
      console.error("Error fetching support articles:", error);
      res.status(500).json({ message: "Failed to fetch support articles" });
    }
  });

  // Create new support article
  app.post("/api/admin/support", validateCSRFToken, async (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { title, description, content, category, icon } = req.body;

      // Validation
      if (!title || !content || !category) {
        return res.status(400).json({
          message: "Title, content, and category are required"
        });
      }

      const articleData = {
        title,
        description: description || null,
        content,
        category,
        icon: icon || null,
        createdBy: userId,
        updatedBy: userId,
        isPublished: true,
      };

      const newArticle = await storage.createSupportArticle(articleData);

      // Log admin activity
      await AdminService.logActivity(
        userId,
        "create_support",
        "support",
        newArticle.id,
        `Created support article: ${title}`
      );

      res.status(201).json(newArticle);
    } catch (error) {
      console.error("Error creating support article:", error);
      res.status(500).json({ message: "Failed to create support article" });
    }
  });

  // Update support article
  app.put("/api/admin/support/:id", validateCSRFToken, async (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { id } = req.params;
      const { title, description, content, category, icon } = req.body;

      const updates: any = {
        title,
        description: description || null,
        content,
        category,
        icon: icon || null,
        updatedBy: userId,
      };

      const updatedArticle = await storage.updateSupportArticle(id, updates);

      // Log admin activity
      await AdminService.logActivity(
        userId,
        "update_support",
        "support",
        id,
        `Updated support article: ${title || 'Untitled'}`
      );

      res.json(updatedArticle);
    } catch (error) {
      console.error("Error updating support article:", error);
      res.status(500).json({ message: "Failed to update support article" });
    }
  });

  // Delete support article
  app.delete("/api/admin/support/:id", validateCSRFToken, async (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { id } = req.params;

      await storage.deleteSupportArticle(id);

      // Log admin activity
      await AdminService.logActivity(
        userId,
        "delete_support",
        "support",
        id,
        "Deleted support article"
      );

      res.json({ message: "Support article deleted successfully" });
    } catch (error) {
      console.error("Error deleting support article:", error);
      res.status(500).json({ message: "Failed to delete support article" });
    }
  });

  app.get("/api/admin/prompts", validateCSRFToken, async (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    try {
      const { category } = req.query;
      const prompts = await storage.getAiPrompts(category as string);
      res.json(prompts);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      res.status(500).json({ message: "Failed to fetch prompts" });
    }
  });

  // AI Prompt management - Update prompt
  app.put("/api/admin/prompts/:promptKey", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    try {
      const { promptKey } = req.params;
      const {
        name,
        description,
        systemPrompt,
        userPromptTemplate,
        temperature,
        maxTokens,
        isActive,
      } = req.body;

      const updatedPrompt = await storage.updateAiPrompt(
        promptKey,
        {
          name,
          description,
          systemPrompt,
          userPromptTemplate,
          temperature,
          maxTokens,
          isActive,
        },
        userId
      );

      // Log admin activity
      await AdminService.logActivity(
        userId,
        "update_prompt",
        "prompt",
        promptKey,
        `Updated AI prompt: ${name}`
      );

      res.json(updatedPrompt);
    } catch (error) {
      console.error("Error updating prompt:", error);
      res.status(500).json({ message: "Failed to update prompt" });
    }
  });

  // Analytics endpoint
  app.get(
    "/api/admin/analytics",
    requireSecondaryAdminOrHigher,
    async (req: any, res) => {
      try {
        const analytics = await storage.getSystemAnalytics();
        const userStats = await storage.getUserStats();

        res.json({
          ...analytics,
          ...userStats,
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
        res.status(500).json({ message: "Failed to fetch analytics" });
      }
    }
  );

  // Premium Subscription Payment Routes
  app.post(
    "/api/create-payment-intent",
    ensureAuthenticated,
    async (req: any, res) => {
      try {
        const { amount, description } = req.body;
        const result = await paymentService.createPaymentIntent(
          amount || 70,
          description || "HealthHire Portal Premium - Lifetime Access"
        );
        res.json(result);
      } catch (error: any) {
        console.error("Payment intent creation error:", error);
        res
          .status(500)
          .json({ message: "Error creating payment intent: " + error.message });
      }
    }
  );

  app.post(
    "/api/payment/verify",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const { paymentIntentId } = req.body;
        const result = await paymentService.verifyPayment(paymentIntentId);

        if (result.success) {
          // Update user to premium status
          const userId = req.user.claims.sub;
          await storage.updateUserPremiumStatus(userId, true);
        }

        res.json(result);
      } catch (error) {
        console.error("Payment verification error:", error);
        res.status(500).json({ message: "Failed to verify payment" });
      }
    }
  );

  // Stripe webhook handler moved to payments.ts
  // app.use("/api/webhooks/stripe", express.raw({ type: "application/json" }));
  registerPaymentRoutes(app);
  registerStripeWebhook(app);

  // Document Generation Routes
  app.post(
    "/api/supporting-information",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { jobDescription, personSpec, tone, targetLength } = req.body;

        if (!jobDescription) {
          return res.status(400).json({ message: "Job description required" });
        }

        const profile = await storage.getProfile(userId);
        if (!profile) {
          return res
            .status(400)
            .json({ message: "Profile required for document generation" });
        }

        const document = await aiDocumentService.generateSupportingInformation({
          profile,
          jobDescription,
          personSpec,
          tone,
          targetLength,
        });

        res.json(document);
      } catch (error) {
        console.error("Error generating supporting information:", error);
        res
          .status(500)
          .json({ message: "Failed to generate supporting information" });
      }
    }
  );

  app.post(
    "/api/ai/generate-cv",
    ensureAuthenticated,
    validateCSRFToken,
    checkUsageRestrictions("cv_job_duties"),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { targetRoles, format } = req.body;

        const profile = await storage.getProfile(userId);
        if (!profile) {
          return res
            .status(400)
            .json({ message: "Profile required for CV generation" });
        }

        const document = await aiDocumentService.generateCV({
          profile,
          targetRoles,
          format,
        });

        res.json(document);
      } catch (error) {
        console.error("Error generating CV:", error);
        res.status(500).json({ message: "Failed to generate CV" });
      }
    }
  );

  // CV viewer endpoints
  app.get(
    "/api/cv/generate-from-profile",
    ensureAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;

        const profile = await storage.getProfile(userId);
        if (!profile) {
          return res
            .status(400)
            .json({ message: "Profile required for CV generation" });
        }

        // Get user data for name
        const user = await storage.getUser(userId);

        // Generate CV data from profile
        const cvData = {
          personalInfo: {
            name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
            email: profile.email || "",
            phone: profile.phone || "",
            location:
              profile.city && profile.country
                ? `${profile.city}, ${profile.country}`
                : profile.city || profile.country || "",
            summary: "", // Will be added when we add summary field to profile
          },
          experience: profile.workExperience || [],
          education: profile.education || [],
          skills: profile.skills || [],
          courses: profile.courses || [],
          registrations: profile.registrationNumber
            ? [
              {
                type: profile.profession || "Professional Registration",
                number: profile.registrationNumber,
                expiry: undefined, // Will be added when we add expiry field to profile
              },
            ]
            : [],
          lastUpdated: profile.updatedAt || new Date().toISOString(),
        };

        res.json(cvData);
      } catch (error) {
        console.error("Error generating CV from profile:", error);
        res.status(500).json({ message: "Failed to generate CV from profile" });
      }
    }
  );

  app.get(
    "/api/cv/download-pdf",
    ensureAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;

        const profile = await storage.getProfile(userId);
        if (!profile) {
          return res
            .status(400)
            .json({ message: "Profile required for CV PDF generation" });
        }

        // Get user data for name
        const user = await storage.getUser(userId);

        // Generate CV HTML content
        const cvData = {
          personalInfo: {
            name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
            email: profile.email || "",
            phone: profile.phone || "",
            location:
              profile.city && profile.country
                ? `${profile.city}, ${profile.country}`
                : profile.city || profile.country || "",
            summary: "", // Will be added when we add summary field to profile
          },
          experience: profile.workExperience || [],
          education: profile.education || [],
          skills: profile.skills || [],
          courses: profile.courses || [],
          registrations: profile.registrationNumber
            ? [
              {
                type: profile.profession || "Professional Registration",
                number: profile.registrationNumber,
                expiry: undefined, // Will be added when we add expiry field to profile
              },
            ]
            : [],
        };

        // Generate HTML content that's optimized for printing to PDF
        const htmlContent = generateCVHTML(cvData);

        // Return print-ready HTML file
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="my-cv.html"'
        );
        res.send(htmlContent);
      } catch (error) {
        console.error("Error downloading CV PDF:", error);
        res.status(500).json({ message: "Failed to download CV PDF" });
      }
    }
  );

  app.post(
    "/api/ai/map-person-spec",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { personSpec, jobDescription } = req.body;

        if (!personSpec || !jobDescription) {
          return res.status(400).json({
            message: "Person specification and job description required",
          });
        }

        const profile = await storage.getProfile(userId);
        if (!profile) {
          return res
            .status(400)
            .json({ message: "Profile required for person spec mapping" });
        }

        const mapping = await aiDocumentService.mapPersonSpec({
          profile,
          personSpec,
          jobDescription,
        });

        res.json(mapping);
      } catch (error) {
        console.error("Error mapping person spec:", error);
        res.status(500).json({ message: "Failed to map person specification" });
      }
    }
  );

  // Sample job duties database for demo mode
  const sampleJobDuties: Record<string, string[]> = {
    "staff nurse": [
      "Provided comprehensive patient care across medical wards, ensuring optimal health outcomes",
      "Administered medications safely and monitored patient responses to treatments",
      "Collaborated with multidisciplinary teams to develop and implement care plans",
      "Maintained accurate patient records and documentation in compliance with NHS standards",
    ],
    "healthcare assistant": [
      "Assisted patients with daily living activities while maintaining dignity and respect",
      "Supported qualified nurses with clinical tasks and patient monitoring",
      "Maintained clean and safe ward environments following infection control protocols",
      "Communicated effectively with patients, families, and healthcare team members",
    ],
    "senior nurse": [
      "Led nursing teams in delivering high-quality patient care across specialist units",
      "Mentored junior staff and coordinated professional development programs",
      "Implemented evidence-based practices to improve patient safety and care quality",
      "Managed ward operations including resource allocation and staff scheduling",
    ],
    "nurse practitioner": [
      "Conducted comprehensive patient assessments and developed treatment plans",
      "Prescribed medications and treatments within scope of practice guidelines",
      "Provided advanced clinical care for patients with complex health conditions",
      "Collaborated with consultants and GPs to ensure continuity of care",
    ],
    physiotherapist: [
      "Assessed and treated patients with mobility and movement disorders",
      "Developed personalized rehabilitation programs to optimize patient recovery",
      "Educated patients and families on exercise techniques and injury prevention",
      "Collaborated with occupational therapists and medical teams on treatment plans",
    ],
    "occupational therapist": [
      "Evaluated patients' functional abilities and designed intervention strategies",
      "Provided adaptive equipment training to enhance independence in daily activities",
      "Conducted home and workplace assessments for safe discharge planning",
      "Worked with patients to develop coping strategies for long-term conditions",
    ],
    radiographer: [
      "Performed diagnostic imaging procedures ensuring optimal image quality and patient safety",
      "Operated complex radiological equipment including X-ray, CT, and MRI machines",
      "Explained procedures to patients and provided reassurance during examinations",
      "Maintained equipment calibration and followed strict radiation safety protocols",
    ],
    pharmacist: [
      "Reviewed medication charts and provided clinical pharmacy services to wards",
      "Counseled patients on proper medication use and potential side effects",
      "Collaborated with medical teams to optimize drug therapy outcomes",
      "Conducted medication reconciliation and discharge planning activities",
    ],
  };

  // Function to get sample duties for a job title
  function getSampleDuties(jobTitle: string): string[] {
    const normalizedTitle = jobTitle.toLowerCase().trim();

    // Direct match
    if (sampleJobDuties[normalizedTitle]) {
      return sampleJobDuties[normalizedTitle];
    }

    // Partial matches for common roles
    for (const [key, duties] of Object.entries(sampleJobDuties)) {
      if (normalizedTitle.includes(key) || key.includes(normalizedTitle)) {
        return duties;
      }
    }

    // Generic healthcare professional duties as fallback
    return [
      "Delivered high-quality patient care in accordance with professional standards",
      "Collaborated effectively with multidisciplinary healthcare teams",
      "Maintained accurate documentation and followed clinical governance procedures",
      "Participated in continuous professional development and quality improvement initiatives",
    ];
  }

  // Henry the Helper - Generate Supporting Information
  app.post(
    "/api/henry/generate-supporting-info",
    ensureAuthenticated,
    validateCSRFToken,
    checkUsageRestrictions("supporting_info"),
    async (req: any, res) => {
      try {
        const { jobDescription, personSpecification } = req.body;

        if (
          !jobDescription ||
          typeof jobDescription !== "string" ||
          jobDescription.trim().length === 0
        ) {
          return res
            .status(400)
            .json({ message: "Job description is required" });
        }

        if (jobDescription.length > 10000) {
          return res.status(400).json({ message: "Job description too long" });
        }

        // Get user's CV information for personalization
        const userId = req.user?.claims?.sub;
        const user = await storage.getUser(userId);
        let cvInfo = "";

        try {
          // Get user profile information directly from database
          const profile = await storage.getProfile(userId);
          // Extract real name from user object (primary source)
          const firstName = user?.firstName || "Professional";
          const lastName = user?.lastName || "";
          const fullName = `${firstName} ${lastName}`.trim();

          // Handle JSONB work experience data
          let workExperience = [];
          if (profile?.workExperience) {
            if (Array.isArray(profile.workExperience)) {
              workExperience = profile.workExperience;
            } else if (typeof profile.workExperience === "object") {
              workExperience = Object.values(profile.workExperience);
            }
          }

          const experienceDetails = workExperience
            .sort((a: any, b: any) => {
              const aCurrent = !!a.current;
              const bCurrent = !!b.current;
              if (aCurrent && !bCurrent) return -1;
              if (!aCurrent && bCurrent) return 1;
              const aStart = (a.startDate || a.from || "").toString();
              const bStart = (b.startDate || b.from || "").toString();
              return bStart.localeCompare(aStart);
            })
            .map((exp) => {
              const position =
                exp.position || exp.jobTitle || exp.title || "Healthcare Role";
              const employer =
                exp.employer ||
                exp.company ||
                exp.organization ||
                "Healthcare Organization";
              const startDate = exp.startDate || exp.from || "Previous";
              const endDate =
                exp.endDate || exp.to || (exp.current ? "Present" : "Previous");
              const currentTag = exp.current ? " [CURRENT ROLE]" : "";
              const description =
                exp.description ||
                exp.duties ||
                "Patient care and clinical responsibilities";
              return `• ${position} at ${employer}${currentTag} (${startDate} - ${endDate}): ${description}`;
            })
            .join("\n");

          // Handle JSONB education data
          let education = [];
          if (profile?.education) {
            if (Array.isArray(profile.education)) {
              education = profile.education;
            } else if (typeof profile.education === "object") {
              education = Object.values(profile.education);
            }
          }

          const educationDetails = education
            .map((edu) => {
              const qualification =
                edu.degree ||
                edu.qualification ||
                edu.course ||
                "Healthcare Qualification";
              const institution =
                edu.institution ||
                edu.university ||
                edu.school ||
                "Accredited Institution";
              const year = edu.year || edu.graduationYear || "Completed";
              return `• ${qualification} from ${institution} (${year})`;
            })
            .join("\n");

          // Get actual skills from profile (should be array)
          const skills = Array.isArray(profile?.skills) ? profile.skills : [];
          const skillsList =
            skills.length > 0
              ? skills.join(", ")
              : "Clinical skills, patient care, teamwork, communication";

          // Handle JSONB courses data
          let courses = [];
          if (profile?.courses) {
            if (Array.isArray(profile.courses)) {
              courses = profile.courses;
            } else if (typeof profile.courses === "object") {
              courses = Object.values(profile.courses);
            }
          }

          const coursesDetails = courses
            .map((course) => {
              const name =
                course.name ||
                course.title ||
                course.course ||
                "Professional Development Course";
              const provider =
                course.provider || course.institution || "Accredited Provider";
              const year = course.year || course.completionYear || "Completed";
              return `• ${name} (${provider}, ${year})`;
            })
            .join("\n");

          cvInfo = `CANDIDATE PROFILE:
Full Name: ${fullName}
Profession: ${profile?.profession || "Healthcare Professional"}
Registration Number: ${profile?.registrationNumber || "Not specified"}
Current Location: ${profile?.city || ""} ${profile?.country || ""}

WORK EXPERIENCE:
${experienceDetails ||
            "• Healthcare professional with relevant NHS/clinical experience"
            }

EDUCATION & QUALIFICATIONS:
${educationDetails || "• Healthcare qualification from accredited institution"}

COURSES & CERTIFICATES:
${coursesDetails || "• Professional development courses completed"}

CORE SKILLS:
${skillsList}

SPECIALTIES: ${profile?.specialties?.join(", ") || "General healthcare"}`;
        } catch (error) {
          console.log("Error getting profile data:", error);
          cvInfo =
            "Healthcare professional with relevant NHS experience and qualifications";
        }

        // Use Gemini AI
        try {
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY || "",
          });

          const prompt = `You are writing a supporting information for an NHS job application. You MUST use the EXACT candidate information provided below - do not make up or generalize anything.

# FOLLOW THIS WRITING STYLE:

• Use clear, confident language suitable for NHS job applications.
• Maintain a professional, human tone — formal but natural.
• Prefer active voice and concise sentences.
• Allow occasional complex sentences for flow and readability.
• Use adjectives only when they add precision (e.g., clinical, multidisciplinary, evidence-based).
• AVOID clichés or exaggeration.
• AVOID generalizations.
• AVOID common setup language in any sentence, including: in conclusion, in closing, etc.
• AVOID unnecessary adjectives and adverbs.
• AVOID semicolons.
• AVOID markdown.
• AVOID asterisks.
• AVOID quotation marks.
• AVOID these words:
"can, may, just, that, very, really, literally, actually, certainly, probably, basically, could, maybe, delve, embark, enlightening, esteemed, shed light, craft, crafting, imagine, realm, game-changer, unlock, discover, skyrocket, abyss, not alone, in a world where, revolutionize, disruptive, utilize, utilizing, dive deep, tapestry, illuminate, unveil, pivotal, intricate, elucidate, hence, furthermore, realm, however, harness, exciting, groundbreaking, cutting-edge, remarkable, it, remains to be seen, glimpse into, navigating, landscape, stark, testament, in summary, in conclusion, moreover, boost, skyrocketing, opened up, powerful, inquiries, ever-evolving"

MANDATORY RULES:
1. Start with: "I am [insert their EXACT full name from profile], a [insert their exact profession]..."
2. Reference every work experience if 3 or less, or reference any relevant ones if more than 3 work experiences, using EXACT job titles and organizations in the same order provided.
3. Use the STAR (Situation, Task, Action, Result) method when giving examples from their experience.
4. Demonstrate understanding of NHS values, patient safety, quality improvement, and multidisciplinary working throughout.
5. Quote EXACT qualifications and institutions from their education and explain how they support the role.
6. Use first person "I" statements throughout.
7. Write between 800 and 1100 words, using UK English spelling.
8. Do NOT use headings, bold text, italics, bullet points, or formatting of any kind.
9. Keep it focused on how the candidate’s background matches the job description and person specification.
10. Maintain a natural, professional tone — clear, confident, and human.
11. Address every point in the person specification directly, using specific examples.
12. Only output the supporting information — no follow-up or meta text.


${cvInfo}

Job Description:
${jobDescription.trim()}

${personSpecification
              ? `Person Specification:
${personSpecification.trim()}`
              : ""
            }

CRITICAL: Copy the EXACT names, job titles, organizations, qualifications, and institutions from the candidate profile above. Do not paraphrase or generalize - use their precise details. When referencing experience, FOLLOW THE PROVIDED ORDER: start with the role tagged [CURRENT ROLE], then proceed to older roles.`;

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
          });

          const content = response.text;
          if (!content) {
            throw new Error("No response from Henry");
          }

          res.json({
            supportingInfo: content,
            message: "Henry generated this supporting information for you!",
            isDemo: false,
          });
        } catch (apiError: any) {
          // If Gemini fails, fall back to demo mode
          console.log(
            "Gemini API unavailable, falling back to demo mode:",
            apiError.message
          );

          const demoSupportingInfo = `Dear Hiring Manager,

I am writing to express my strong interest in this healthcare position within the NHS. As a dedicated healthcare professional, I am committed to delivering exceptional patient care and contributing positively to your team.

Throughout my career, I have developed strong clinical skills and a deep understanding of NHS values. I believe in treating every patient with dignity, respect, and compassion, ensuring they receive the highest standard of care possible.

My experience has taught me the importance of working collaboratively with multidisciplinary teams. I understand that effective healthcare delivery requires excellent communication, both with patients and colleagues from different professional backgrounds.

I am particularly drawn to this role because it aligns with my passion for making a real difference in people's lives. The NHS represents everything I value about healthcare - providing comprehensive, equitable care to all members of our community regardless of their background or circumstances.

In my previous roles, I have consistently demonstrated reliability, attention to detail, and the ability to work under pressure. I understand the demanding nature of healthcare work and am committed to maintaining high professional standards even in challenging situations.

I am eager to bring my skills, enthusiasm, and dedication to your team. I believe my experience and values make me well-suited for this position, and I am excited about the opportunity to contribute to the excellent care your organization provides.

I would welcome the opportunity to discuss how my background and passion for healthcare can benefit your team and the patients we serve.

Thank you for considering my application.

Yours sincerely,
Healthcare Professional`;

          res.json({
            supportingInfo: demoSupportingInfo,
            message:
              "Henry generated this supporting information for you! (Demo Mode)",
            isDemo: true,
          });
        }
      } catch (error) {
        console.error("Error generating supporting information:", error);
        res
          .status(500)
          .json({ message: "Failed to generate supporting information" });
      }
    }
  );

  // Henry the Helper - Generate Cover Letter
  app.post(
    "/api/henry/generate-cover-letter",
    ensureAuthenticated,
    validateCSRFToken,
    checkUsageRestrictions("cover_letter"),
    async (req: any, res) => {
      try {
        const { jobDescription, companyName, roleName } = req.body;

        if (
          !jobDescription ||
          typeof jobDescription !== "string" ||
          jobDescription.trim().length === 0
        ) {
          return res
            .status(400)
            .json({ message: "Job description is required" });
        }

        if (jobDescription.length > 10000) {
          return res.status(400).json({ message: "Job description too long" });
        }

        // Get user's detailed profile information (same as supporting information)
        const userId = req.user?.claims?.sub;
        const user = await storage.getUser(userId);
        let cvInfo = "";

        try {
          // Get user profile information directly from database
          const profile = await storage.getProfile(userId);

          // Extract real name from user object (primary source)
          const firstName = user?.firstName || "Professional";
          const lastName = user?.lastName || "";
          const fullName = `${firstName} ${lastName}`.trim();

          // Handle JSONB work experience data
          let workExperience = [];
          if (profile?.workExperience) {
            if (Array.isArray(profile.workExperience)) {
              workExperience = profile.workExperience;
            } else if (typeof profile.workExperience === "object") {
              workExperience = Object.values(profile.workExperience);
            }
          }

          const experienceDetails = workExperience
            .map((exp) => {
              const position =
                exp.position || exp.jobTitle || exp.title || "Healthcare Role";
              const employer =
                exp.employer ||
                exp.company ||
                exp.organization ||
                "Healthcare Organization";
              return `${position} at ${employer}`;
            })
            .join(", ");

          // Handle JSONB education data
          let education = [];
          if (profile?.education) {
            if (Array.isArray(profile.education)) {
              education = profile.education;
            } else if (typeof profile.education === "object") {
              education = Object.values(profile.education);
            }
          }

          const educationDetails = education
            .map((edu) => {
              const qualification =
                edu.degree ||
                edu.qualification ||
                edu.course ||
                "Healthcare Qualification";
              const institution =
                edu.institution ||
                edu.university ||
                edu.school ||
                "Accredited Institution";
              return `${qualification} from ${institution}`;
            })
            .join(", ");

          // Get actual skills from profile
          const skills = Array.isArray(profile?.skills) ? profile.skills : [];
          const skillsList =
            skills.length > 0
              ? skills.join(", ")
              : "Clinical skills, patient care, teamwork, communication";

          cvInfo = `CANDIDATE PROFILE:
Full Name: ${fullName}
Profession: ${profile?.profession || "Healthcare Professional"}
Registration Number: ${profile?.registrationNumber || "Not specified"}
Current Location: ${profile?.city || ""} ${profile?.country || ""}

WORK EXPERIENCE:
${experienceDetails ||
            "Healthcare professional with relevant NHS/clinical experience"
            }

EDUCATION & QUALIFICATIONS:
${educationDetails || "Healthcare qualification from accredited institution"}

CORE SKILLS:
${skillsList}

SPECIALTIES: ${profile?.specialties?.join(", ") || "General healthcare"}`;

          // Profile data prepared for cover letter generation
        } catch (error) {
          console.log("Error getting profile data:", error);
          cvInfo =
            "Healthcare professional with relevant experience and qualifications";
        }

        // Use Gemini AI
        try {
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY || "",
          });

          const prompt = `You are writing a professional cover letter for a private sector healthcare role. You MUST use the EXACT candidate information provided below but keep references brief and natural for a cover letter format.

MANDATORY RULES:
1. Use the candidate's EXACT name and profession from their profile
2. Briefly reference their specific work experience with EXACT job titles and organizations
3. Mention their EXACT qualifications and institutions
4. Keep it maximum 400 words - concise but compelling
5. Use simple, professional language that sounds natural and human
6. Show enthusiasm for the private sector opportunity
7. Only give the cover letter output - no additional text or instructions

# FOLLOW THIS WRITING STYLE:
• SHOULD use clear, simple language.
• SHOULD be spartan and informative.
• SHOULD use short, impactful sentences.
• SHOULD use active voice; avoid passive voice.
• SHOULD focus on practical, actionable insights.
• SHOULD use data and examples to support claims when possible.
• AVOID using em dashes (—) anywhere in your response. Use only commas, periods, or other standard punctuation. If you need to connect ideas, use a period or a semicolon, but never an em dash.
• AVOID constructions like "...not just this, but also this".
• AVOID metaphors and clichés.
• AVOID generalizations.
• AVOID quotation marks, bullet points, bold or italic text
• AVOID common setup language in any sentence, including: in conclusion, in closing, etc.
• AVOID output warnings or notes, just the output requested.
• AVOID unnecessary adjectives and adverbs.
• AVOID hashtags.
• AVOID semicolons.
• AVOID markdown.
• AVOID asterisks.
• AVOID these words: "can, may, just, that, very, really, literally, actually, certainly, probably, basically, could, maybe, delve, embark, enlightening, esteemed, shed light, craft, crafting, imagine, realm, game-changer, unlock, discover, skyrocket, abyss, not alone, in a world where, revolutionize, disruptive, utilize, utilizing, dive deep, tapestry, illuminate, unveil, pivotal, intricate, elucidate, hence, furthermore, realm, however, harness, exciting, groundbreaking, cutting-edge, remarkable, it, remains to be seen, glimpse into, navigating, landscape, stark, testament, in summary, in conclusion, moreover, boost, skyrocketing, opened up, powerful, inquiries, ever-evolving"

${cvInfo}

${companyName ? `Company: ${companyName}` : ""}
${roleName ? `Role: ${roleName}` : ""}

Job Description:
${jobDescription.trim()}

Write a compelling cover letter that briefly draws upon their actual experience, education, and skills to connect with this private sector role. Use their real details but keep it concise and professional.`;

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
          });

          const content = response.text;
          if (!content) {
            throw new Error("No response from Henry");
          }

          res.json({
            coverLetter: content,
            message: "Henry generated this cover letter for you!",
            isDemo: false,
          });
        } catch (apiError: any) {
          // If Gemini fails, fall back to demo mode
          console.log(
            "Gemini API unavailable, falling back to demo mode:",
            apiError.message
          );

          const demoCoverLetter = `Dear Hiring Manager,

I am writing to express my interest in this healthcare position with your organization. As a dedicated healthcare professional, I am excited about the opportunity to bring my clinical skills and experience to the private sector.

Throughout my healthcare career, I have developed strong clinical competencies and a deep commitment to patient-centered care. My experience in NHS settings has provided me with excellent communication skills, the ability to work under pressure, and a thorough understanding of healthcare best practices.

I am particularly drawn to private sector healthcare because of the opportunity to deliver personalized, high-quality care in a more focused environment. I believe my experience in clinical settings, combined with my dedication to continuous professional development, makes me well-suited for this role.

Your organization's reputation for excellence in healthcare delivery aligns perfectly with my professional values. I am eager to contribute to your team's success while continuing to develop my skills in a dynamic private healthcare environment.

I would welcome the opportunity to discuss how my background and enthusiasm can contribute to your organization's mission of providing exceptional patient care.

Thank you for considering my application. I look forward to hearing from you.

Yours sincerely,
Healthcare Professional`;

          res.json({
            coverLetter: demoCoverLetter,
            message: "Henry generated this cover letter for you! (Demo Mode)",
            isDemo: true,
          });
        }
      } catch (error) {
        console.error("Error generating cover letter:", error);
        res.status(500).json({ message: "Failed to generate cover letter" });
      }
    }
  );

  // Henry the Helper - Generate Job Duties
  app.post(
    "/api/henry/generate-duties",
    ensureAuthenticated,
    validateCSRFToken,
    checkUsageRestrictions("cv_job_duties"),
    async (req: any, res) => {
      try {
        const { jobTitle } = req.body;

        if (
          !jobTitle ||
          typeof jobTitle !== "string" ||
          jobTitle.trim().length === 0
        ) {
          return res.status(400).json({ message: "Job title is required" });
        }

        if (jobTitle.length > 100) {
          return res.status(400).json({ message: "Job title too long" });
        }

        // Use Gemini AI
        try {
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY || "",
          });

          const prompt = `CRITICAL: This is for a CV (resume). Write ONLY in past tense. NEVER use "You will" or "You'll" or any future tense.

You are Henry the Helper writing CV accomplishment statements for someone's previous work experience as a ${jobTitle.trim()}.

MANDATORY RULES:
1. Use PAST TENSE ONLY - "Delivered", "Maintained", "Assisted", "Provided", "Monitored"
2. NEVER use "You will", "You'll", "Will", or any future tense
3. These describe what they DID in a previous job, not what they will do
4. Start each statement with a past tense action verb
5. Keep sentences clear and concise
6. MAXIMUM 25 WORDS per statement - be concise and impactful

CORRECT EXAMPLES (past tense):
Delivered safe, patient-centred care including monitoring vital signs, assisting with daily activities, and supporting clinical procedures.
Maintained accurate patient records and documentation in line with NHS and regulatory standards.
Worked collaboratively within a multidisciplinary team to support treatment plans and ensure continuity of care.
Promoted health, safety, and infection control practices to protect patients, staff, and visitors.

WRONG EXAMPLES (never do this):
You will deliver safe care...
You'll maintain records...
Will provide patient support...

Create exactly 4 past tense accomplishment statements for the healthcare role "${jobTitle.trim()}". Start each with a strong past tense verb. Return only the 4 statements, one per line, no other text.`;

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
          });

          const content = response.text;
          if (!content) {
            throw new Error("No response from Henry");
          }

          // Parse the response into individual duties
          const duties = content
            .split("\n")
            .map((duty: string) => duty.trim())
            .filter((duty: string) => duty.length > 0)
            .slice(0, 4); // Ensure only 4 duties

          if (duties.length === 0) {
            throw new Error("Could not parse duties from response");
          }

          res.json({
            duties,
            jobTitle: jobTitle.trim(),
            message: "Henry generated these job duties for you!",
            isDemo: false,
          });
        } catch (apiError: any) {
          // If Gemini fails, fall back to demo mode
          console.log(
            "Gemini API unavailable, falling back to demo mode:",
            apiError.message
          );

          const sampleDuties = getSampleDuties(jobTitle);

          res.json({
            duties: sampleDuties,
            jobTitle: jobTitle.trim(),
            message:
              "Henry is showing sample duties (AI temporarily unavailable)",
            isDemo: true,
          });
        }
      } catch (error: any) {
        console.error("Henry encountered an error:", error);
        res.status(500).json({
          message: "Henry is taking a break. Please try again in a moment!",
        });
      }
    }
  );

  // Henry the Helper - Interview Practice
  app.post(
    "/api/henry/interview-practice",
    ensureAuthenticated,
    validateCSRFToken,
    checkUsageRestrictions("interview_practice"),
    async (req: any, res) => {
      try {
        const { jobTitle, question, userAnswer, timeSpent } = req.body;

        if (
          !jobTitle ||
          typeof jobTitle !== "string" ||
          jobTitle.trim().length === 0
        ) {
          return res.status(400).json({ message: "Job title is required" });
        }

        if (
          !question ||
          typeof question !== "string" ||
          question.trim().length === 0
        ) {
          return res
            .status(400)
            .json({ message: "Interview question is required" });
        }

        if (
          !userAnswer ||
          typeof userAnswer !== "string" ||
          userAnswer.trim().length === 0
        ) {
          return res.status(400).json({ message: "Your answer is required" });
        }

        if (userAnswer.length > 2000) {
          return res
            .status(400)
            .json({ message: "Answer too long (max 2000 characters)" });
        }

        // Use Gemini for harsh but constructive feedback
        try {
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY || "",
          });

          const prompt = `You are Henry the Helper, a supportive but honest interview coach for healthcare professionals. Give constructive feedback to help people improve their NHS interview skills.

CRITICAL: Do NOT use "SCORE:", "WHAT WENT WRONG:", "HOW TO IMPROVE:", or "ENCOURAGEMENT:" headings. Do NOT use bullet points or numbered lists.

# FOLLOW THIS WRITING STYLE:
• SHOULD use clear, simple language.
• SHOULD use short, impactful sentences.
• AVOID quotation marks, bullet points, bold or italic text
• AVOID output warnings or notes, just the output requested.
• Maximum 200 words total for all feedback

Job Role: ${jobTitle.trim()}
Interview Question: "${question.trim()}"
Candidate's Answer: "${userAnswer.trim()}"

Write feedback using this exact structure with NO headings or formatting:

How you performed overall: [Score out of 10 and brief assessment]

What could be improved: [Main areas needing work]

What you did well: [Positive aspects of the answer]

Keep feedback encouraging but honest. Use simple language. Do not use any headings, bullet points, or bold text.`;

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
          });

          const feedback = response.text;
          if (!feedback) {
            throw new Error("No feedback from Henry");
          }

          // Save interview attempt to database
          try {
            await storage.saveInterviewAttempt({
              userId: req.user.claims.sub,
              question: question.trim(),
              answer: userAnswer.trim(),
              feedback: feedback.trim(),
              timeSpent: timeSpent || null,
            });
          } catch (saveError) {
            console.error("Failed to save interview attempt:", saveError);
            // Don't fail the request if saving fails
          }

          res.json({
            feedback: feedback.trim(),
            jobTitle: jobTitle.trim(),
            question: question.trim(),
            userAnswer: userAnswer.trim(),
            message: "Henry reviewed your interview answer!",
            isDemo: false,
          });
        } catch (apiError: any) {
          // If Gemini fails, fall back to demo mode
          console.log(
            "Gemini API unavailable, falling back to demo feedback:",
            apiError.message
          );

          const demoFeedback = `How you performed overall: You scored 6 out of 10. Your answer shows basic understanding but needs more specific examples and clearer structure.

What could be improved: Add specific examples from your healthcare experience. Use the STAR method to structure your answer. Connect your response to NHS values like patient safety and teamwork.

What you did well: You demonstrated good understanding of the role requirements. Your answer was relevant to the question asked. You showed genuine interest in providing quality patient care.`;

          // Save interview attempt to database (even in demo mode)
          try {
            await storage.saveInterviewAttempt({
              userId: req.user.claims.sub,
              question: question.trim(),
              answer: userAnswer.trim(),
              feedback: demoFeedback,
              timeSpent: timeSpent || null,
            });
          } catch (saveError) {
            console.error("Failed to save interview attempt:", saveError);
            // Don't fail the request if saving fails
          }

          res.json({
            feedback: demoFeedback,
            jobTitle: jobTitle.trim(),
            question: question.trim(),
            userAnswer: userAnswer.trim(),
            message:
              "Henry is showing sample feedback (AI temporarily unavailable)",
            isDemo: true,
          });
        }
      } catch (error: any) {
        console.error("Henry interview practice error:", error);
        res.status(500).json({
          message: "Henry is taking a break. Please try again in a moment!",
        });
      }
    }
  );

  // Get Interview Practice History (last 3 attempts)
  app.get(
    "/api/henry/interview-history",
    ensureAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const attempts = await storage.getLastInterviewAttempts(userId, 3);

        res.json({
          attempts,
          message: "Interview history retrieved successfully",
        });
      } catch (error: any) {
        console.error("Error fetching interview history:", error);
        res.status(500).json({
          message: "Failed to fetch interview history",
        });
      }
    }
  );

  // Generate Interview Questions
  app.post(
    "/api/henry/generate-questions",
    ensureAuthenticated,
    validateCSRFToken,
    checkUsageRestrictions("qa_generator"),
    async (req: any, res) => {
      try {
        const { jobTitle, experienceLevel } = req.body;

        if (
          !jobTitle ||
          typeof jobTitle !== "string" ||
          jobTitle.trim().length === 0
        ) {
          return res.status(400).json({ message: "Job title is required" });
        }

        const level = experienceLevel || "mid";

        // Use Gemini to generate realistic interview questions
        try {
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY || "",
          });

          const prompt = `You are Henry the Helper generating realistic NHS interview questions for healthcare professionals.

Generate 3 challenging but realistic interview questions for a ${jobTitle.trim()} position at ${level} experience level.

GUIDELINES:
- Make questions NHS-specific and healthcare-focused
- Include competency-based questions (values, teamwork, patient safety)
- Mix different question types (scenario, experience, values)
- Keep questions clear and professional
- Focus on real situations healthcare professionals face
- Maximum 50 words per question

Experience Level: ${level}
Job Title: ${jobTitle.trim()}

Return exactly 3 questions, one per line, no numbering or extra text:`;

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
          });

          const content = response.text;
          if (!content) {
            throw new Error("No questions from Henry");
          }

          // Parse the response into individual questions
          const questions = content
            .split("\n")
            .map((q: string) => q.trim())
            .filter((q: string) => q.length > 0)
            .slice(0, 3); // Ensure only 3 questions

          if (questions.length === 0) {
            throw new Error("Could not parse questions from response");
          }

          res.json({
            questions,
            jobTitle: jobTitle.trim(),
            experienceLevel: level,
            message: "Henry generated interview questions for you!",
            isDemo: false,
          });
        } catch (apiError: any) {
          // If Gemini fails, fall back to demo questions
          console.log(
            "Gemini API unavailable, falling back to demo questions:",
            apiError.message
          );

          const demoQuestions = [
            "Tell me about a time when you had to deal with a difficult patient and how you handled the situation.",
            "How would you ensure patient safety while working under pressure in a busy healthcare environment?",
            "Describe a situation where you had to work as part of a multidisciplinary team to achieve a patient outcome.",
          ];

          res.json({
            questions: demoQuestions,
            jobTitle: jobTitle.trim(),
            experienceLevel: level,
            message:
              "Henry is showing sample questions (AI temporarily unavailable)",
            isDemo: true,
          });
        }
      } catch (error: any) {
        console.error("Henry question generation error:", error);
        res.status(500).json({
          message: "Henry is taking a break. Please try again in a moment!",
        });
      }
    }
  );

  // File Upload Routes for Documents and Certificates
  app.post(
    "/api/upload/document",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { documentType = "general" } = req.body;

        const uploadURL = await objectStorageService.getUserDocumentUploadURL(
          userId,
          documentType
        );
        res.json({ uploadURL });
      } catch (error) {
        console.error("Error getting upload URL:", error);
        res.status(500).json({ message: "Failed to get upload URL" });
      }
    }
  );

  app.post(
    "/api/documents/uploaded",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { fileName, uploadURL, documentType, fileSize } = req.body;

        if (!fileName || !uploadURL) {
          return res
            .status(400)
            .json({ message: "File name and upload URL required" });
        }

        // Create document record
        const document = await storage.createDocument({
          userId,
          title: fileName,
          type: documentType || "certificate",
          content: objectStorageService.normalizeObjectEntityPath(uploadURL), // Store file path in content field
        });

        res.json(document);
      } catch (error) {
        console.error("Error recording uploaded document:", error);
        res.status(500).json({ message: "Failed to record uploaded document" });
      }
    }
  );

  // Serve uploaded documents
  app.get(
    "/objects/:objectPath(*)",
    ensureAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const objectFile = await objectStorageService.getObjectEntityFile(
          req.path
        );

        // Basic access control - users can only access their own files
        const [metadata] = await objectFile.getMetadata();
        if (metadata.metadata?.userId && metadata.metadata.userId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        objectStorageService.downloadObject(objectFile, res);
      } catch (error) {
        console.error("Error downloading file:", error);
        if (error instanceof ObjectNotFoundError) {
          return res.status(404).json({ message: "File not found" });
        }
        return res.status(500).json({ message: "Failed to download file" });
      }
    }
  );

  // User activity tracking
  app.get("/api/user/activity", ensureAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activity = await storage.getUserActivity(userId, 20);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ message: "Failed to fetch user activity" });
    }
  });

  // Get user's subscription status
  app.get(
    "/api/user/subscription-status",
    ensureAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        console.log("Subscription status request for user:", {
          userId,
          subscriptionStatus: user.subscriptionStatus,
          paymentDate: user.paymentDate,
          stripeCustomerId: user.stripeCustomerId,
        });

        res.json({
          subscriptionStatus: user.subscriptionStatus || "free",
          paymentDate: user.paymentDate,
          stripeCustomerId: user.stripeCustomerId,
        });
      } catch (error) {
        console.error("Error getting subscription status:", error);
        res.status(500).json({ message: "Failed to get subscription status" });
      }
    }
  );

  // Check user's job viewing limits
  app.get(
    "/api/user/job-limits",
    ensureAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { FeatureGates } = await import("./lib/featureGates");
        const result = await FeatureGates.canViewJob(userId);
        res.json(result);
      } catch (error) {
        console.error("Error checking job limits:", error);
        res.status(500).json({ message: "Failed to check job limits" });
      }
    }
  );

  // Manual subscription status update (for testing)
  app.post(
    "/api/user/update-subscription-status",
    ensureAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { subscriptionStatus } = req.body;

        if (
          !subscriptionStatus ||
          !["free", "paid"].includes(subscriptionStatus)
        ) {
          return res
            .status(400)
            .json({ message: "Invalid subscription status" });
        }

        const [updatedUser] = await db
          .update(users)
          .set({
            subscriptionStatus,
            paymentDate: subscriptionStatus === "paid" ? new Date() : null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning();

        console.log(
          `Manually updated user ${userId} subscription status to ${subscriptionStatus}`
        );

        res.json({
          success: true,
          subscriptionStatus: updatedUser.subscriptionStatus,
          paymentDate: updatedUser.paymentDate,
        });
      } catch (error) {
        console.error("Error updating subscription status:", error);
        res
          .status(500)
          .json({ message: "Failed to update subscription status" });
      }
    }
  );

  // Quick upgrade to paid (for testing)
  app.post(
    "/api/user/upgrade-to-paid",
    ensureAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;

        console.log(`Attempting to upgrade user ${userId} to paid status...`);

        const [updatedUser] = await db
          .update(users)
          .set({
            subscriptionStatus: "paid",
            paymentDate: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning();

        console.log(`✅ Quick upgrade: User ${userId} set to paid status:`, {
          subscriptionStatus: updatedUser.subscriptionStatus,
          paymentDate: updatedUser.paymentDate,
          stripeCustomerId: updatedUser.stripeCustomerId,
        });

        res.json({
          success: true,
          message: "User upgraded to paid status",
          subscriptionStatus: updatedUser.subscriptionStatus,
          paymentDate: updatedUser.paymentDate,
          stripeCustomerId: updatedUser.stripeCustomerId,
        });
      } catch (error) {
        console.error("❌ Error upgrading user:", error);
        res.status(500).json({ message: "Failed to upgrade user" });
      }
    }
  );

  // Test database connection and user data
  app.get("/api/user/debug", ensureAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Get user data directly from database
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      console.log("Debug - User data from database:", {
        id: user?.id,
        email: user?.email,
        subscriptionStatus: user?.subscriptionStatus,
        paymentDate: user?.paymentDate,
        stripeCustomerId: user?.stripeCustomerId,
        updatedAt: user?.updatedAt,
      });

      res.json({
        user: {
          id: user?.id,
          email: user?.email,
          subscriptionStatus: user?.subscriptionStatus,
          paymentDate: user?.paymentDate,
          stripeCustomerId: user?.stripeCustomerId,
          updatedAt: user?.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error getting user debug data:", error);
      res.status(500).json({ message: "Failed to get user debug data" });
    }
  });

  // Weekly stats for rotating stats bar
  app.get(
    "/api/user/weekly-stats",
    ensureAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;

        // Calculate date ranges for this week and last week
        const now = new Date();
        const startOfThisWeek = new Date(now);
        startOfThisWeek.setDate(now.getDate() - now.getDay()); // Sunday
        startOfThisWeek.setHours(0, 0, 0, 0);

        const startOfLastWeek = new Date(startOfThisWeek);
        startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

        const endOfLastWeek = new Date(startOfThisWeek);
        endOfLastWeek.setTime(endOfLastWeek.getTime() - 1);

        // Get applications this week and last week
        const applications = await storage.getApplications(userId);
        const applicationsThisWeek = applications.filter(
          (app) => app.createdAt && new Date(app.createdAt) >= startOfThisWeek
        ).length;
        const applicationsLastWeek = applications.filter(
          (app) =>
            app.createdAt &&
            new Date(app.createdAt) >= startOfLastWeek &&
            new Date(app.createdAt) <= endOfLastWeek
        ).length;

        // Get job search activity (we'll use job matches as proxy for searches)
        const jobMatches = await storage.getJobMatches(userId);
        const jobSearchesThisWeek = jobMatches.filter(
          (match) =>
            match.createdAt && new Date(match.createdAt) >= startOfThisWeek
        ).length;
        const jobSearchesLastWeek = jobMatches.filter(
          (match) =>
            match.createdAt &&
            new Date(match.createdAt) >= startOfLastWeek &&
            new Date(match.createdAt) <= endOfLastWeek
        ).length;

        // Get interviews scheduled this week and last week
        const interviewsThisWeek = applications.filter(
          (app) =>
            app.interviewDate && new Date(app.interviewDate) >= startOfThisWeek
        ).length;
        const interviewsLastWeek = applications.filter(
          (app) =>
            app.interviewDate &&
            new Date(app.interviewDate) >= startOfLastWeek &&
            new Date(app.interviewDate) <= endOfLastWeek
        ).length;

        // Get documents created this week and last week
        const documents = await storage.getDocuments(userId);
        const documentsCreatedThisWeek = documents.filter(
          (doc) => doc.createdAt && new Date(doc.createdAt) >= startOfThisWeek
        ).length;
        const documentsCreatedLastWeek = documents.filter(
          (doc) =>
            doc.createdAt &&
            new Date(doc.createdAt) >= startOfLastWeek &&
            new Date(doc.createdAt) <= endOfLastWeek
        ).length;

        // Get practice sessions this week and last week
        const practiceSessions = await storage.getInterviewSessions(userId);
        const practiceSessionsThisWeek = practiceSessions.filter(
          (session) =>
            session.createdAt && new Date(session.createdAt) >= startOfThisWeek
        ).length;
        const practiceSessionsLastWeek = practiceSessions.filter(
          (session) =>
            session.createdAt &&
            new Date(session.createdAt) >= startOfLastWeek &&
            new Date(session.createdAt) <= endOfLastWeek
        ).length;

        const weeklyStats = {
          applicationsThisWeek,
          applicationsLastWeek,
          jobSearchesThisWeek,
          jobSearchesLastWeek,
          interviewsThisWeek,
          interviewsLastWeek,
          documentsCreatedThisWeek,
          documentsCreatedLastWeek,
          practiceSessionsThisWeek,
          practiceSessionsLastWeek,
        };

        res.json(weeklyStats);
      } catch (error) {
        console.error("Error fetching weekly stats:", error);
        res.status(500).json({ message: "Failed to fetch weekly stats" });
      }
    }
  );

  // ===============================================
  // Q&A GENERATOR DEMO QUESTIONS FUNCTION
  // ===============================================

  function generateDemoQuestions(jobTitle: string) {
    const sanitizedJobTitle = jobTitle.toLowerCase();
    const isNurse =
      sanitizedJobTitle.includes("nurse") ||
      sanitizedJobTitle.includes("nursing");
    const isDoctor =
      sanitizedJobTitle.includes("doctor") ||
      sanitizedJobTitle.includes("physician") ||
      sanitizedJobTitle.includes("consultant");
    const isTherapist =
      sanitizedJobTitle.includes("therapist") ||
      sanitizedJobTitle.includes("therapy");
    const isAdmin =
      sanitizedJobTitle.includes("admin") ||
      sanitizedJobTitle.includes("manager") ||
      sanitizedJobTitle.includes("coordinator");

    const baseQuestions = [
      {
        question:
          "Tell me about yourself and why you're interested in working for the NHS.",
        model_answer:
          "I am a dedicated healthcare professional with [X years] of experience in [specialty]. I'm passionate about the NHS's core values, particularly caring and compassion, and I believe in providing excellent patient care that's free at the point of delivery. I'm excited about this opportunity because it allows me to contribute to a service that truly makes a difference in people's lives while working alongside committed professionals who share these values.",
        category: "General",
      },
      {
        question:
          "How do you demonstrate the NHS value of compassion in your daily work?",
        model_answer:
          "Compassion means understanding patients' needs and responding with kindness and empathy. In practice, I demonstrate this by actively listening to patients' concerns, explaining procedures clearly, and providing emotional support during difficult times. For example, I always ensure patients feel comfortable asking questions and take time to address their fears or worries, recognizing that healthcare can be a vulnerable experience for many people.",
        category: "NHS Values",
      },
      {
        question:
          "Describe a challenging situation you faced with a patient and how you handled it.",
        model_answer:
          "I once cared for an elderly patient who was very anxious about a procedure. Using the STAR framework: Situation - Patient was extremely fearful and refusing treatment. Task - I needed to gain their trust and ensure they received necessary care. Action - I sat with them, listened to their concerns, explained the procedure in simple terms, and involved their family in discussions. I also coordinated with the medical team to adjust our approach. Result - The patient agreed to treatment, which was successful, and they thanked me for taking the time to understand their fears.",
        category: "Clinical Care",
      },
      {
        question:
          "How do you prioritize your workload when faced with multiple urgent tasks?",
        model_answer:
          "I use a systematic approach to prioritization, considering patient safety first, followed by clinical urgency and time-sensitivity. I assess each situation quickly, delegate appropriate tasks to qualified team members, and communicate clearly about priorities. For example, I would address life-threatening situations immediately, followed by time-critical medications, then routine care. I also keep colleagues informed about my priorities and ask for support when needed to ensure no patient needs are overlooked.",
        category: "Professional Skills",
      },
      {
        question:
          "What does dignity mean to you in healthcare, and how do you ensure patients are treated with dignity?",
        model_answer:
          "Dignity in healthcare means respecting patients as individuals, protecting their privacy, and maintaining their self-respect throughout their care journey. I ensure dignity by always knocking before entering rooms, explaining what I'm doing before touching patients, covering them appropriately during examinations, and speaking to them respectfully regardless of their condition or background. I also advocate for patients' rights and preferences, ensuring they're involved in decisions about their care.",
        category: "NHS Values",
      },
    ];

    let roleSpecificQuestions: Array<{
      question: string;
      model_answer: string;
      category: string;
    }> = [];

    if (isNurse) {
      roleSpecificQuestions = [
        {
          question:
            "How would you manage a situation where you disagreed with a doctor's treatment plan?",
          model_answer:
            "As a nurse, I have a professional duty to advocate for patient safety. I would first discuss my concerns directly with the doctor in a respectful, professional manner, presenting evidence-based reasoning. If concerns persist, I would follow the escalation procedures outlined in trust policies, potentially involving senior nursing staff or the consultant. Throughout this process, I would document my concerns and ensure patient safety remains the priority while maintaining professional relationships.",
          category: "Professional Practice",
        },
        {
          question:
            "Describe your approach to patient education and health promotion.",
          model_answer:
            "Patient education is crucial for better outcomes and self-management. I assess each patient's learning needs, preferred learning style, and health literacy level. I use clear, jargon-free language, visual aids when helpful, and check understanding by asking patients to explain back key points. I provide written materials for reference and connect patients with additional resources. I also tailor education to be culturally sensitive and involve family members when appropriate and with patient consent.",
          category: "Patient Care",
        },
      ];
    } else if (isDoctor) {
      roleSpecificQuestions = [
        {
          question:
            "How do you approach clinical decision-making when evidence is unclear or conflicting?",
          model_answer:
            "When facing clinical uncertainty, I gather all available information including patient history, examination findings, and relevant investigations. I consult current evidence-based guidelines and, when appropriate, seek senior colleague input. I discuss uncertainties honestly with patients, explaining different options and their risks/benefits. I also consider patient preferences and values in decision-making. I document my reasoning clearly and monitor outcomes closely, being prepared to modify my approach if new information emerges.",
          category: "Clinical Excellence",
        },
        {
          question:
            "Describe a time when you had to deliver difficult news to a patient or family.",
          model_answer:
            "I had to inform a family that their relative's condition had deteriorated significantly. Using the SPIKES framework, I ensured we had privacy, assessed what they already understood, provided information clearly and compassionately, responded to their emotions with empathy, and discussed next steps. I allowed time for questions, provided written information, and arranged follow-up support including liaison with specialist nurses. I also ensured the team was aware of the family's emotional needs for ongoing care.",
          category: "Communication",
        },
      ];
    } else if (isTherapist) {
      roleSpecificQuestions = [
        {
          question:
            "How do you motivate patients who are struggling to engage with their rehabilitation program?",
          model_answer:
            "I start by understanding the barriers to engagement, whether they're physical, psychological, or social. I work with patients to set realistic, achievable goals that are meaningful to them. I use motivational interviewing techniques to explore their concerns and highlight their strengths. I adapt treatment approaches to suit their preferences and capabilities, celebrate small victories, and involve family support where appropriate. Regular reassessment and goal adjustment help maintain momentum and hope.",
          category: "Patient Engagement",
        },
      ];
    } else if (isAdmin) {
      roleSpecificQuestions = [
        {
          question:
            "How would you improve team communication and efficiency in a busy healthcare environment?",
          model_answer:
            "I would implement regular team briefings to share important information and identify priorities. I'd establish clear communication channels and protocols, potentially using digital tools for non-urgent communications. Regular team meetings would address ongoing issues and share good practice. I'd also create feedback mechanisms for team members to suggest improvements and ensure everyone understands their roles and responsibilities. Training in effective communication techniques would support these initiatives.",
          category: "Leadership",
        },
      ];
    }

    // Add more general questions to reach 25 total
    const additionalQuestions = [
      {
        question:
          "Why do you want to work in this particular department/specialty?",
        model_answer:
          "I'm drawn to this specialty because it aligns with my passion for [specific aspect of care]. I've developed skills and experience in this area through [relevant experience], and I'm excited by the challenges and learning opportunities it offers. I particularly value the opportunity to make a meaningful difference in patients' lives at [specific situation related to specialty]. The department's reputation for excellence and innovation also attracts me, and I believe I can contribute positively to the team.",
        category: "Motivation",
      },
      {
        question:
          "How do you handle stress and maintain work-life balance in healthcare?",
        model_answer:
          "I recognize that healthcare can be emotionally and physically demanding, so I've developed healthy coping strategies. I practice mindfulness and ensure I take regular breaks during shifts. I maintain physical fitness and have hobbies that help me unwind. I also seek support from colleagues when needed and participate in reflective practice sessions. I believe maintaining my own wellbeing is essential for providing quality patient care, so I prioritize sleep, nutrition, and time with family and friends.",
        category: "Wellbeing",
      },
      {
        question:
          "Describe a time when you worked effectively as part of a multidisciplinary team.",
        model_answer:
          "I participated in weekly MDT meetings for complex patient cases. In one instance, we had a patient with multiple comorbidities requiring coordinated care. I contributed my [professional perspective], listened to colleagues' expertise, and helped develop a comprehensive care plan. I took responsibility for specific actions, communicated regularly with team members about progress, and adapted our approach based on patient response. This collaborative approach resulted in improved patient outcomes and discharge planning.",
        category: "Teamwork",
      },
      {
        question:
          "How do you stay updated with current best practices and evidence in your field?",
        model_answer:
          "I'm committed to lifelong learning and maintaining current knowledge. I regularly read professional journals, attend conferences and training sessions, and participate in online learning modules. I'm part of professional networks where we share best practices and discuss emerging evidence. I also engage in reflective practice with colleagues and seek feedback on my performance. When new evidence emerges, I evaluate its relevance to my practice and implement changes appropriately.",
        category: "Professional Development",
      },
      {
        question:
          "What would you do if you witnessed a colleague making an error?",
        model_answer:
          "Patient safety is paramount, so I would immediately assess if there's any immediate risk to the patient and take appropriate action to ensure their safety. I would then speak privately with my colleague about what I observed, giving them the opportunity to address the issue themselves. If the error had clinical implications, I would ensure it was properly reported through incident reporting systems. I would approach this with compassion, recognizing that errors can happen to anyone, while maintaining professional accountability.",
        category: "Professional Standards",
      },
      {
        question: "How do you ensure you provide culturally sensitive care?",
        model_answer:
          "I recognize that effective healthcare must be culturally competent. I make an effort to understand patients' cultural backgrounds, beliefs, and preferences that might affect their care. I use professional interpreters when needed and avoid making assumptions about patients based on their appearance or background. I respect religious practices and dietary requirements, and I'm sensitive to different attitudes toward healthcare, family involvement, and decision-making. I continue to educate myself about different cultures and seek guidance when unsure.",
        category: "Equality and Diversity",
      },
      {
        question:
          "Describe a situation where you had to adapt quickly to unexpected changes.",
        model_answer:
          "During a shift, we received multiple emergency admissions that stretched our resources. I quickly assessed the situation, reprioritized my workload, and communicated with the team about the changing demands. I delegated appropriate tasks, requested additional support, and ensured all patients received necessary care despite the increased pressure. I remained calm and focused, kept colleagues informed, and after the situation stabilized, we debriefed as a team to identify any learning points for future similar situations.",
        category: "Adaptability",
      },
      {
        question:
          "What do you think are the biggest challenges facing the NHS today?",
        model_answer:
          "The NHS faces several significant challenges including increasing demand from an aging population, funding constraints, staff shortages, and the need for digital transformation. COVID-19 has highlighted both the resilience of NHS staff and the system's vulnerabilities. I believe addressing these challenges requires innovative approaches, better integration between services, investment in staff wellbeing and development, and leveraging technology to improve efficiency. As healthcare professionals, we all have a role in finding solutions and advocating for sustainable healthcare delivery.",
        category: "NHS Awareness",
      },
      {
        question:
          "How would you handle a complaint from a patient or their family?",
        model_answer:
          "I would listen actively and empathetically to understand their concerns without becoming defensive. I would acknowledge their feelings and apologize for any distress caused, regardless of whether an error occurred. I would gather all relevant information, investigate the issue thoroughly, and provide a clear explanation of what happened. If an error was made, I would explain what steps are being taken to prevent recurrence. I would also inform them about formal complaints procedures if they wished to pursue the matter further.",
        category: "Communication",
      },
      {
        question: "What motivates you to provide excellent patient care?",
        model_answer:
          "I'm motivated by the profound impact healthcare professionals can have on people during their most vulnerable moments. Seeing patients recover, helping families through difficult times, and being trusted with people's health and wellbeing is both humbling and inspiring. I believe everyone deserves compassionate, high-quality care regardless of their background or circumstances. The NHS values resonate deeply with me, particularly the commitment to providing care free at the point of delivery and treating everyone with dignity and respect.",
        category: "Motivation",
      },
      {
        question:
          "How do you approach continuous learning and professional development?",
        model_answer:
          "I view learning as a continuous journey rather than a destination. I actively seek feedback from colleagues and supervisors to identify areas for improvement. I set specific learning goals aligned with my role and career aspirations, and I track my progress regularly. I participate in formal training programs, attend workshops and conferences, and engage in peer learning opportunities. I also reflect on challenging cases and experiences to extract learning points. I believe sharing knowledge with colleagues also enhances my own understanding.",
        category: "Professional Development",
      },
      {
        question:
          "Describe your understanding of confidentiality in healthcare.",
        model_answer:
          "Confidentiality is fundamental to the trust between patients and healthcare providers. I understand that patient information should only be shared with those directly involved in their care and with appropriate consent. I'm familiar with Data Protection Act requirements and understand when information can be shared without consent, such as safeguarding situations or serious crime prevention. I ensure private conversations occur in appropriate settings, secure handling of records, and I'm aware of the consequences of confidentiality breaches for both patients and professionals.",
        category: "Professional Standards",
      },
      {
        question:
          "How would you contribute to infection prevention and control?",
        model_answer:
          "Infection prevention is everyone's responsibility. I would adhere strictly to hand hygiene protocols, use PPE appropriately, and follow isolation procedures when required. I would ensure proper cleaning and decontamination of equipment, and I'd educate patients and families about infection control measures. I would promptly report any infections or outbreaks and participate in audits and training programs. I believe leading by example and encouraging colleagues to maintain high standards is crucial for protecting both patients and staff.",
        category: "Safety",
      },
      {
        question: "What are your career aspirations within the NHS?",
        model_answer:
          "I'm committed to growing within the NHS and contributing to its mission of providing excellent healthcare. In the short term, I want to excel in this role, develop my clinical skills, and contribute positively to the team. Medium-term, I'm interested in [specific development opportunities related to the role], potentially including mentoring newer staff or taking on additional responsibilities. Long-term, I aspire to [relevant leadership or specialist goals] while always maintaining focus on patient care and the NHS values.",
        category: "Career Development",
      },
      {
        question: "How do you ensure patient safety in your daily practice?",
        model_answer:
          "Patient safety is my top priority. I follow established protocols and guidelines, complete thorough assessments, and maintain accurate documentation. I practice the 'five rights' for medication administration, use proper identification procedures, and report incidents or near misses promptly. I participate in safety briefings and huddles, stay alert to potential risks, and speak up when I have concerns. I also believe in continuous learning from incidents and participating in quality improvement initiatives to enhance safety culture.",
        category: "Safety",
      },
      {
        question:
          "How would you handle working with limited resources while maintaining quality care?",
        model_answer:
          "I would focus on efficient resource utilization while never compromising patient safety. I would prioritize care based on clinical need, look for opportunities to reduce waste, and ensure equipment is used appropriately. I would communicate openly with the team about resource constraints and collaborate to find creative solutions. I would also advocate appropriately for additional resources when patient care could be compromised, while being resourceful and innovative in my approach to delivering care within available means.",
        category: "Resource Management",
      },
    ];

    // Combine questions to reach exactly 25
    const allQuestions = [
      ...baseQuestions,
      ...roleSpecificQuestions,
      ...additionalQuestions,
    ];
    return allQuestions.slice(0, 25);
  }

  // ===============================================
  // Q&A GENERATOR ENDPOINTS - FLASHCARD SYSTEM
  // ===============================================

  // Generate Q&A session from job description
  app.post(
    "/api/qa/generate",
    ensureAuthenticated,
    validateCSRFToken,
    checkUsageRestrictions("qa_generator"),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { jobDescription, jobTitle } = req.body;
        console.log("Received jobDescription length:", jobDescription.length);
        if (!jobDescription || jobDescription.trim().length < 100) {
          return res.status(400).json({
            error:
              "Please provide a detailed job description (minimum 100 characters)",
          });
        }

        // Create session first
        const [session] = await db
          .insert(qaSessions)
          .values({
            userId,
            jobDescription: jobDescription.trim(),
            jobTitle: jobTitle.trim(),
            sessionName: jobTitle.trim(), // Initialize sessionName with jobTitle
            totalQuestions: 25,
          })
          .returning();

        // Generate questions using Gemini AI
        const geminiQuestions = await geminiService.generateQAFlashcards({
          jobTitle: jobTitle.trim(),
          jobDescription: jobDescription.trim(),
        });

        // Fallback to demo if Gemini fails
        const questionsToSave =
          geminiQuestions.length > 0
            ? geminiQuestions
            : generateDemoQuestions(jobTitle.trim());

        // Save questions to database
        const questionPromises = questionsToSave.map((q: any, index: number) =>
          db
            .insert(qaQuestions)
            .values({
              sessionId: session.id,
              questionText: q.question,
              modelAnswer: q.modelAnswer || q.model_answer,
              category: q.category,
              questionOrder: index + 1,
            })
            .returning()
        );

        const savedQuestions = await Promise.all(questionPromises);
        console.log(
          "Saved jobDescription length:",
          session.jobDescription?.length
        );

        res.json({
          session_id: session.id,
          questions: savedQuestions.map(([q], index) => ({
            id: q.id,
            question: q.questionText,
            answer: q.modelAnswer,
            category: q.category,
            order: q.questionOrder,
          })),
          total_questions: 25,
          disclaimer:
            "These questions are generated based on your job description and are designed to help you prepare. Actual interview questions may differ, but practicing with these will help you develop strong responses to common healthcare interview themes.",
        });
      } catch (error) {
        console.error("Error generating Q&A session:", error);
        res.status(500).json({ error: "Failed to generate questions" });
      }
    }
  );

  // Get user's Q&A sessions
  app.get("/api/qa/sessions", ensureAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const sessions = await db
        .select()
        .from(qaSessions)
        .where(eq(qaSessions.userId, userId))
        .orderBy(desc(qaSessions.createdAt))
        .limit(10);

      res.json(sessions);
    } catch (error) {
      console.error("Error fetching Q&A sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  // Update Q&A session name
  app.patch("/api/qa/session/:sessionId/name", ensureAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionId = req.params.sessionId;
      const { sessionName } = req.body;

      if (!sessionName || sessionName.trim().length === 0) {
        return res.status(400).json({ error: "Session name is required" });
      }

      if (sessionName.trim().length > 255) {
        return res.status(400).json({ error: "Session name is too long (max 255 characters)" });
      }

      // Verify session belongs to user
      const [session] = await db
        .select()
        .from(qaSessions)
        .where(
          and(eq(qaSessions.id, sessionId), eq(qaSessions.userId, userId))
        )
        .limit(1);

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Update session name
      const [updatedSession] = await db
        .update(qaSessions)
        .set({ sessionName: sessionName.trim() })
        .where(eq(qaSessions.id, sessionId))
        .returning();

      res.json({ success: true, session: updatedSession });
    } catch (error) {
      console.error("Error updating session name:", error);
      res.status(500).json({ error: "Failed to update session name" });
    }
  });

  app.get(
    "/api/qa/session/:sessionId/download-pdf",
    ensureAuthenticated,
    async (req: any, res) => {
      let browser;
      try {
        const userId = req.user.claims.sub;
        const sessionId = req.params.sessionId;

        // Verify session belongs to user and is completed
        const [session] = await db
          .select()
          .from(qaSessions)
          .where(
            and(eq(qaSessions.id, sessionId), eq(qaSessions.userId, userId))
          );

        if (!session) {
          return res.status(404).json({ message: "Session not found" });
        }

        if (!session.completedAt) {
          return res.status(400).json({
            message: "Session must be completed before downloading PDF"
          });
        }

        // Get all questions for this session
        const questions = await db
          .select()
          .from(qaQuestions)
          .where(eq(qaQuestions.sessionId, sessionId))
          .orderBy(qaQuestions.questionOrder);

        if (!questions || questions.length === 0) {
          return res.status(404).json({ message: "No questions found for this session" });
        }

        console.log(`✅ Found ${questions.length} questions for session`);

        // Generate HTML content
        const htmlContent = generateQASessionHTML({
          session,
          questions
        });


        // --------- UNIVERSAL PUPPETEER SECTION (Local & Production) ---------
        const isProd = process.env.NODE_ENV === "production";

        const chromiumModule = await import("@sparticuz/chromium");
        const puppeteerModule = isProd
          ? await import("puppeteer-core")
          : await import("puppeteer");

        const chromium = chromiumModule.default ?? chromiumModule;
        const puppeteerLib = puppeteerModule.default ?? puppeteerModule;

        browser = await puppeteerLib.launch({
          headless: true,
          executablePath: isProd ? await chromium.executablePath() : undefined,
          args: isProd
            ? [
              ...chromium.args,
              "--no-sandbox",
              "--disable-setuid-sandbox",
              "--disable-dev-shm-usage",
              "--disable-gpu",
              "--disable-web-security",
            ]
            : ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        });

        const page = await browser.newPage();

        // Use domcontentloaded instead of networkidle0 for faster, more reliable loading
        await page.setContent(htmlContent, {
          waitUntil: 'domcontentloaded',
          timeout: 10000,
        });

        // Small delay to ensure CSS is applied
        await new Promise(resolve => setTimeout(resolve, 500));

        // const pdfData = await page.pdf({
        //   format: 'A4',
        //   printBackground: true,
        //   margin: {
        //     top: '20mm',
        //     right: '15mm',
        //     bottom: '20mm',
        //     left: '15mm',
        //   },
        // });
        const pdfData = await page.pdf({
          format: 'A4',
          printBackground: true,
          displayHeaderFooter: true,

          headerTemplate: `<div></div>`, // empty header

          footerTemplate: `
    <div style="
      font-size:10px;
      width:100%;
      text-align:center;
      color:#6b7280;
      padding:5px 0;
    ">
      Page <span class="pageNumber"></span> of <span class="totalPages"></span>
    </div>
  `,

          margin: {
            top: '20mm',
            right: '15mm',
            bottom: '25mm',   // increased for footer
            left: '15mm',
          },
        });


        // Convert Uint8Array to Buffer
        const pdfBuffer = Buffer.from(pdfData);
        console.log('✅ PDF generated, size:', pdfBuffer.length, 'bytes');

        await browser.close();
        browser = null;

        // ---------- SEND PDF RESPONSE ----------
        const safeJobTitle = session.sessionName
          ? session.sessionName.replace(/[^a-z0-9]/gi, "_").substring(0, 50)
          : "QandA_Session";

        const filename = `QA-${safeJobTitle}.pdf`;

        // Use writeHead and end for proper binary handling
        res.writeHead(200, {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": pdfBuffer.length,
          "Cache-Control": "no-cache"
        });

        return res.end(pdfBuffer, 'binary');
      } catch (error) {
        console.error("Error downloading Q&A session PDF:", error);

        // Ensure browser is closed on error
        if (browser) {
          try {
            await browser.close();
          } catch (closeError) {
            console.error("Error closing browser:", closeError);
          }
        }

        res.status(500).json({
          message: "Failed to download Q&A session PDF",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  );

  // Get session with questions and progress
  app.get(
    "/api/qa/session/:sessionId",
    ensureAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const sessionId = req.params.sessionId;

        // Get session
        const [session] = await db
          .select()
          .from(qaSessions)
          .where(
            and(eq(qaSessions.id, sessionId), eq(qaSessions.userId, userId))
          );

        if (!session) {
          return res.status(404).json({ error: "Session not found" });
        }

        // Get questions
        const questions = await db
          .select()
          .from(qaQuestions)
          .where(eq(qaQuestions.sessionId, sessionId))
          .orderBy(qaQuestions.questionOrder);

        // Get progress
        const progress = await db
          .select()
          .from(qaProgress)
          .where(eq(qaProgress.sessionId, sessionId));

        res.json({
          session,
          questions,
          progress,
        });
      } catch (error) {
        console.error("Error fetching session:", error);
        res.status(500).json({ error: "Failed to fetch session" });
      }
    }
  );

  // Update question progress (confidence level)
  app.post(
    "/api/qa/progress",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { session_id, question_id, confidence_level } = req.body;

        if (!session_id || !question_id || !confidence_level) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        if (confidence_level < 1 || confidence_level > 3) {
          return res
            .status(400)
            .json({ error: "Confidence level must be 1, 2, or 3" });
        }

        // Verify session belongs to user
        const [session] = await db
          .select()
          .from(qaSessions)
          .where(
            and(eq(qaSessions.id, session_id), eq(qaSessions.userId, userId))
          );

        if (!session) {
          return res.status(404).json({ error: "Session not found" });
        }

        // Check if progress already exists
        const [existingProgress] = await db
          .select()
          .from(qaProgress)
          .where(
            and(
              eq(qaProgress.sessionId, session_id),
              eq(qaProgress.questionId, question_id)
            )
          );

        if (existingProgress) {
          // Update existing progress
          await db
            .update(qaProgress)
            .set({
              confidenceLevel: confidence_level,
              attempts: (existingProgress.attempts || 0) + 1,
              lastReviewed: new Date(),
            })
            .where(eq(qaProgress.id, existingProgress.id));
        } else {
          // Create new progress record
          await db.insert(qaProgress).values({
            sessionId: session_id,
            questionId: question_id,
            confidenceLevel: confidence_level,
            attempts: 1,
          });
        }

        res.json({ success: true });
      } catch (error) {
        console.error("Error updating progress:", error);
        res.status(500).json({ error: "Failed to update progress" });
      }
    }
  );

  // Complete Q&A session
  app.post(
    "/api/qa/session/:sessionId/complete",
    ensureAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const sessionId = req.params.sessionId;

        // Verify session belongs to user
        const [session] = await db
          .select()
          .from(qaSessions)
          .where(
            and(eq(qaSessions.id, sessionId), eq(qaSessions.userId, userId))
          );

        if (!session) {
          return res.status(404).json({ error: "Session not found" });
        }

        // Mark session as completed
        await db
          .update(qaSessions)
          .set({ completedAt: new Date() })
          .where(eq(qaSessions.id, sessionId));

        // Get completion stats
        const progress = await db
          .select()
          .from(qaProgress)
          .where(eq(qaProgress.sessionId, sessionId));

        const stats = {
          total_questions: session.totalQuestions,
          total_attempts: progress.reduce(
            (sum, p) => sum + (p.attempts || 0),
            0
          ),
          final_mastery: {
            confident: progress.filter((p) => p.confidenceLevel === 3).length,
            somewhat_confident: progress.filter((p) => p.confidenceLevel === 2)
              .length,
            not_confident: progress.filter((p) => p.confidenceLevel === 1)
              .length,
          },
        };

        res.json({
          success: true,
          summary: stats,
        });
      } catch (error) {
        console.error("Error completing session:", error);
        res.status(500).json({ error: "Failed to complete session" });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
