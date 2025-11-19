import { GoogleGenAI } from "@google/genai";
import { storage } from "./storage";
import type { Profile, StarExample, NhsJob } from "@shared/schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface DocumentGenerationContext {
  userProfile: Profile;
  starExamples: StarExample[];
  jobDescription?: NhsJob;
  experienceLevel: "junior" | "mid" | "senior";
  targetBand?: string;
}

export class AIService {
  // Get hidden AI prompt (never exposed to users)
  async getPrompt(promptName: string): Promise<string | null> {
    const prompt = await storage.getActivePrompt(promptName);
    return prompt?.prompt || null;
  }

  // Generate CV with AI using hidden prompts
  async generateCV(context: DocumentGenerationContext): Promise<string> {
    const basePrompt = await this.getPrompt("cv_generation");
    if (!basePrompt) {
      throw new Error("CV generation prompt not found");
    }

    // Inject user context into hidden prompt
    const prompt = this.interpolatePrompt(basePrompt, context);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      config: {
        systemInstruction: prompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            cv_content: { type: "string" },
          },
          required: ["cv_content"],
        },
      },
      contents: "Generate CV content based on the provided context.",
    });

    const result = JSON.parse(response.text || '{"cv_content": ""}');
    return result.cv_content || "";
  }

  // Generate Supporting Information with NHS values mapping
  async generateSupportingInfo(
    context: DocumentGenerationContext
  ): Promise<string> {
    const basePrompt = await this.getPrompt("supporting_info_generation");
    if (!basePrompt) {
      throw new Error("Supporting Information generation prompt not found");
    }

    const prompt = this.interpolatePrompt(basePrompt, context);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",

      config: {
        systemInstruction: prompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            supporting_info_content: { type: "string" },
          },
          required: ["supporting_info_content"],
        },
      },
      contents:
        "Generate supporting information based on the provided context.",
    });

    const result = JSON.parse(
      response.text || '{"supporting_info_content": ""}'
    );
    return result.supporting_info_content || "";
  }

  // Generate interview Q&A for specific job/role
  async generateInterviewQA(
    jobDescription: string,
    difficulty: string
  ): Promise<{
    questions: Array<{ question: string; suggestedAnswer: string }>;
  }> {
    const basePrompt = await this.getPrompt("interview_qa_generation");
    if (!basePrompt) {
      throw new Error("Interview Q&A generation prompt not found");
    }

    const prompt = basePrompt
      .replace("{JOB_DESCRIPTION}", jobDescription)
      .replace("{DIFFICULTY_LEVEL}", difficulty);

    const response = await ai.models.generateContent({
      // model: "gemini-2.5-flash-lite",
      model: "gemini-2.5-pro",

      config: {
        systemInstruction: prompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  suggestedAnswer: { type: "string" },
                },
                required: ["question", "suggestedAnswer"],
              },
            },
          },
          required: ["questions"],
        },
      },
      contents: "Generate interview questions and answers for this position.",
    });

    const result = JSON.parse(response.text || '{"questions": []}');
    return result;
  }

  // Analyze and score interview response
  async scoreInterviewResponse(
    question: string,
    userResponse: string
  ): Promise<{ score: number; feedback: string; improvements: string[] }> {
    const basePrompt = await this.getPrompt("interview_scoring");
    if (!basePrompt) {
      throw new Error("Interview scoring prompt not found");
    }

    const prompt = basePrompt
      .replace("{QUESTION}", question)
      .replace("{USER_RESPONSE}", userResponse);

    const response = await ai.models.generateContent({
      // model: "gemini-2.5-flash-lite",
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: prompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            score: { type: "number" },
            feedback: { type: "string" },
            improvements: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["score", "feedback", "improvements"],
        },
      },
      contents: "Score this interview response and provide feedback.",
    });

    const result = JSON.parse(
      response.text || '{"score": 0, "feedback": "", "improvements": []}'
    );
    return {
      score: Math.max(0, Math.min(10, result.score || 0)),
      feedback: result.feedback || "",
      improvements: result.improvements || [],
    };
  }

  // Calculate job fit score using AI
  async calculateJobFit(
    userProfile: Profile,
    jobDescription: NhsJob
  ): Promise<{ score: number; breakdown: any }> {
    const basePrompt = await this.getPrompt("job_fit_scoring");
    if (!basePrompt) {
      throw new Error("Job fit scoring prompt not found");
    }

    const prompt = basePrompt
      .replace("{USER_PROFILE}", JSON.stringify(userProfile))
      .replace("{JOB_DESCRIPTION}", JSON.stringify(jobDescription));

    const response = await ai.models.generateContent({
      // model: "gemini-2.5-flash-lite",
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: prompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            score: { type: "number" },
            breakdown: { type: "object" },
          },
          required: ["score", "breakdown"],
        },
      },
      contents: "Calculate job fit score based on profile and job description.",
    });

    const result = JSON.parse(response.text || '{"score": 0, "breakdown": {}}');
    return {
      score: Math.max(0, Math.min(100, result.score || 0)),
      breakdown: result.breakdown || {},
    };
  }

  // Private helper to inject context into prompts
  private interpolatePrompt(
    prompt: string,
    context: DocumentGenerationContext
  ): string {
    return prompt
      .replace("{USER_PROFILE}", JSON.stringify(context.userProfile))
      .replace("{STAR_EXAMPLES}", JSON.stringify(context.starExamples))
      .replace(
        "{JOB_DESCRIPTION}",
        JSON.stringify(context.jobDescription || {})
      )
      .replace("{EXPERIENCE_LEVEL}", context.experienceLevel)
      .replace("{TARGET_BAND}", context.targetBand || "Not specified");
  }
}

export const aiService = new AIService();
