import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export class GeminiService {
  /**
   * Generate CV content using Gemini
   */
  async generateCV(context: {
    jobTitle: string;
    jobDescription: string;
    userProfile: any;
    experience: string[];
    skills: string[];
  }): Promise<string> {
    const prompt = `You are an expert NHS recruitment consultant and CV writer. Create a professional CV tailored for NHS healthcare positions.

Job Title: ${context.jobTitle}
Job Description: ${context.jobDescription}

User Profile:
- Name: ${context.userProfile.firstName} ${context.userProfile.lastName}
- Profession: ${context.userProfile.profession}
- Registration Number: ${context.userProfile.registrationNumber || "Not provided"
      }
- Email: ${context.userProfile.email}
- Phone: ${context.userProfile.phone || "Not provided"}

Experience:
${context.experience.map((exp) => `- ${exp}`).join("\n")}

Skills:
${context.skills.map((skill) => `- ${skill}`).join("\n")}

Create a compelling CV that:
1. Highlights relevant NHS experience and healthcare qualifications
2. Demonstrates patient care excellence and clinical competency
3. Shows alignment with NHS values: care and compassion, respect and dignity, commitment to quality of care, improving lives, working together for patients, everyone counts
4. Uses healthcare-specific terminology and demonstrates understanding of NHS standards
5. Emphasizes continuous professional development and evidence-based practice

Format the CV with clear sections: Personal Statement, Professional Experience, Education & Qualifications, Key Skills, Professional Development, and References.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    return response.text || "Error generating CV content";
  }

  /**
   * Generate supporting information for NHS job applications
   */
  async generateSupportingInformation(context: {
    jobTitle: string;
    personSpecification: string;
    userProfile: any;
    experience: string[];
  }): Promise<string> {
    const prompt = `You are an NHS recruitment expert specializing in supporting information for job applications. Create compelling supporting information that directly addresses the person specification.

Job Title: ${context.jobTitle}
Person Specification:
${context.personSpecification}

Candidate Background:
- Profession: ${context.userProfile.profession}
- Experience: ${context.experience.join(", ")}
- Education: ${Array.isArray(context.userProfile.education)
        ? context.userProfile.education
          .map(
            (edu: any) =>
              `${edu.degree} from ${edu.institution} (${edu.year})`
          )
          .join(", ")
        : "Not specified"
      }
- Certificates: ${Array.isArray(context.userProfile.courses)
        ? context.userProfile.courses
          .map(
            (course: any) =>
              `${course.name} (${course.provider}, ${course.year})`
          )
          .join(", ")
        : "Not specified"
      }

Create supporting information that:
1. Directly addresses each point in the person specification with specific examples
2. Demonstrates understanding of NHS values and healthcare priorities
3. Shows commitment to patient safety, quality improvement, and multidisciplinary working
4. Uses the STAR method (Situation, Task, Action, Result) for key examples
5. Reflects current NHS challenges and priorities
6. Demonstrates cultural competency and inclusive practice
7. Utilizes the candidate's certificates, education, and qualifications throughout
8. Avoids quotation marks, bold text, italics, and headings
9. Keep language simple and clear with varying sentence structure and length

Write as flowing paragraphs without headings or formatting. Provide concrete examples and quantify achievements where possible.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Error generating supporting information";
  }

  /**
   * Generate interview questions and answers
   */
  async generateInterviewQA(context: {
    jobTitle: string;
    jobDescription: string;
    experienceLevel: string;
  }): Promise<{ questions: string[]; answers: string[] }> {
    const systemPrompt = `You are an NHS interview panel expert. Generate realistic interview questions and model answers for NHS healthcare positions.

Job Title: ${context.jobTitle}
Job Description: ${context.jobDescription}
Experience Level: ${context.experienceLevel}

Generate 8-10 interview questions that NHS panels commonly ask, covering:
1. Clinical competency and patient safety
2. NHS values alignment
3. Teamwork and communication
4. Conflict resolution and challenging situations
5. Professional development and learning
6. Diversity, equality, and inclusion
7. Service improvement and innovation
8. Leadership and accountability

For each question, provide a structured model answer using healthcare examples. Answers should demonstrate NHS values, patient-centered care, and professional competency.

Respond with JSON format:
{
  "questions": ["question1", "question2", ...],
  "answers": ["answer1", "answer2", ...]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: { type: "string" },
            },
            answers: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["questions", "answers"],
        },
      },
      contents:
        "Generate interview questions and answers for this NHS position.",
    });

    const result = JSON.parse(
      response.text || '{"questions": [], "answers": []}'
    );
    return result;
  }

  /**
   * Score interview responses and provide feedback
   */
  async scoreInterviewResponse(context: {
    question: string;
    answer: string;
    jobTitle: string;
  }): Promise<{ score: number; feedback: string; improvements: string[] }> {
    const systemPrompt = `You are an NHS interview assessor. Score the candidate's response and provide constructive feedback.

Interview Question: ${context.question}
Candidate's Answer: ${context.answer}
Job Title: ${context.jobTitle}

Evaluate the response on:
1. Relevance to the question (25%)
2. NHS values demonstration (25%)
3. Clinical knowledge/competency (20%)
4. Communication clarity (15%)
5. Specific examples provided (15%)

Provide a score out of 10, constructive feedback explaining strengths and areas for improvement, and 3-5 specific improvement suggestions.

Respond with JSON format:
{
  "score": number,
  "feedback": "detailed feedback text",
  "improvements": ["improvement1", "improvement2", "improvement3"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      config: {
        systemInstruction: systemPrompt,
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

  /**
   * Analyze job descriptions and extract key requirements
   */
  async analyzeJobDescription(jobDescription: string): Promise<{
    keyRequirements: string[];
    skillsNeeded: string[];
    experienceLevel: string;
    nhsValues: string[];
  }> {
    const systemPrompt = `Analyze this NHS job description and extract key information to help candidates prepare their applications.

Job Description:
${jobDescription}

Extract:
1. Essential requirements and qualifications
2. Key skills and competencies needed
3. Experience level required (entry, mid, senior)
4. Which NHS values are most relevant

Respond with JSON format:
{
  "keyRequirements": ["requirement1", "requirement2"],
  "skillsNeeded": ["skill1", "skill2"],
  "experienceLevel": "entry/mid/senior",
  "nhsValues": ["value1", "value2"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            keyRequirements: {
              type: "array",
              items: { type: "string" },
            },
            skillsNeeded: {
              type: "array",
              items: { type: "string" },
            },
            experienceLevel: { type: "string" },
            nhsValues: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: [
            "keyRequirements",
            "skillsNeeded",
            "experienceLevel",
            "nhsValues",
          ],
        },
      },
      contents: "Analyze this job description.",
    });

    const result = JSON.parse(
      response.text ||
      '{"keyRequirements": [], "skillsNeeded": [], "experienceLevel": "mid", "nhsValues": []}'
    );
    return result;
  }

  /**
   * Generate 25 Q&A flashcards for interview preparation
   */
  async generateQAFlashcards(context: {
    jobTitle: string;
    jobDescription: string;
  }): Promise<
    Array<{ question: string; modelAnswer: string; category: string }>
  > {
    const systemPrompt = `You are Henry the Helper, an expert NHS recruitment specialist and interview coach. Generate exactly 25 interview questions and model answers for NHS healthcare positions.

Job Title: ${context.jobTitle}
Job Description: ${context.jobDescription}

Create 25 questions covering these categories (distribute evenly):
1. Clinical Competency & Patient Safety (5 questions)
2. NHS Values & Patient Care (5 questions) 
3. Teamwork & Communication (4 questions)
4. Challenging Situations & Problem Solving (4 questions)
5. Professional Development & Learning (3 questions)
6. Leadership & Accountability (2 questions)
7. Diversity & Inclusion (2 questions)

Writing Guidelines:
- Use simple, clear language
- Keep sentences short and direct
- Avoid quotation marks, bullet points, bold or italic text
- Write in past tense when describing duties or actions
- Be professional but approachable

For each question, provide:
- A realistic NHS interview question specific to the role
- A comprehensive model answer that demonstrates NHS values
- Clear category classification

Model answers should:
- Be 150-250 words each
- Include specific examples relevant to the role
- Demonstrate NHS values: care and compassion, respect and dignity, commitment to quality care, improving lives, working together for patients, everyone counts
- Show understanding of patient safety, multidisciplinary working, and continuous improvement
- Use the STAR method where appropriate (Situation, Task, Action, Result)

Respond with JSON format:
{
  "questions": [
    {
      "question": "question text",
      "modelAnswer": "detailed answer text",
      "category": "category name"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      config: {
        systemInstruction: systemPrompt,
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
                  modelAnswer: { type: "string" },
                  category: { type: "string" },
                },
                required: ["question", "modelAnswer", "category"],
              },
            },
          },
          required: ["questions"],
        },
      },
      contents: "Generate 25 interview Q&A flashcards for this NHS position.",
    });

    const result = JSON.parse(response.text || '{"questions": []}');
    return result.questions || [];
  }

  /**
   * Generate personalized career advice
   */
  async generateCareerAdvice(context: {
    userProfile: any;
    careerGoals: string;
    currentChallenges: string[];
  }): Promise<string> {
    const prompt = `You are a senior NHS career advisor with 20+ years of experience guiding healthcare professionals. Provide personalized career advice.

Professional Profile:
- Profession: ${context.userProfile.profession}
- Experience Level: ${context.userProfile.experienceYears || "Not specified"
      } years
- Current Role: ${context.userProfile.currentRole || "Not specified"}
- Specializations: ${context.userProfile.specializations?.join(", ") || "Not specified"
      }

Career Goals: ${context.careerGoals}

Current Challenges:
${context.currentChallenges.map((challenge) => `- ${challenge}`).join("\n")}

Provide actionable career advice that includes:
1. Specific steps to achieve their career goals within the NHS
2. Professional development opportunities and courses
3. Networking strategies within healthcare
4. How to overcome current challenges
5. Timeline and milestones to track progress
6. Additional qualifications or certifications to consider

Be encouraging, practical, and NHS-focused in your advice.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    return response.text || "Unable to generate career advice at this time.";
  }
}

export const geminiService = new GeminiService();
