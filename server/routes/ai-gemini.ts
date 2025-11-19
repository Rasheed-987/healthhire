import { Router } from "express";
import { geminiService } from "../gemini-service";
import { isAuthenticated } from "../replitAuth";

const router = Router();

// Test endpoint for Gemini career advice
router.post("/career-advice", isAuthenticated, async (req: any, res) => {
  try {
    const { careerGoals, currentChallenges } = req.body;
    
    if (!careerGoals) {
      return res.status(400).json({ error: "Career goals are required" });
    }

    const advice = await geminiService.generateCareerAdvice({
      userProfile: req.user || {},
      careerGoals,
      currentChallenges: currentChallenges || []
    });

    res.json({ advice });
  } catch (error) {
    console.error("Error generating career advice:", error);
    res.status(500).json({ error: "Failed to generate career advice" });
  }
});

// Test endpoint for job analysis
router.post("/analyze-job", isAuthenticated, async (req: any, res) => {
  try {
    const { jobDescription } = req.body;
    
    if (!jobDescription) {
      return res.status(400).json({ error: "Job description is required" });
    }

    const analysis = await geminiService.analyzeJobDescription(jobDescription);
    res.json({ analysis });
  } catch (error) {
    console.error("Error analyzing job:", error);
    res.status(500).json({ error: "Failed to analyze job description" });
  }
});

// Example prompts and their structures
router.get("/prompt-examples", isAuthenticated, async (req: any, res) => {
  const examples = {
    careerAdvice: {
      description: "Generate personalized career advice for healthcare professionals",
      structure: {
        systemInstruction: "You are a senior NHS career advisor with 20+ years of experience",
        userContext: {
          userProfile: "Professional details, experience, qualifications",
          careerGoals: "Specific career objectives",
          currentChallenges: "Array of current challenges or obstacles"
        },
        promptGuidelines: [
          "Be encouraging and practical",
          "Focus on NHS-specific advice",
          "Provide actionable steps with timelines",
          "Include professional development suggestions",
          "Address challenges with specific solutions"
        ]
      },
      example: {
        careerGoals: "I want to become a Band 7 nurse manager within 2 years",
        currentChallenges: [
          "Lack of management experience",
          "Need leadership training",
          "Limited budget for courses"
        ]
      }
    },
    
    cvGeneration: {
      description: "Generate tailored CV content for NHS positions",
      structure: {
        requiredContext: {
          jobTitle: "Target position title",
          jobDescription: "Full job description and requirements",
          userProfile: "Complete professional profile",
          experience: "Array of relevant experience",
          skills: "Array of relevant skills"
        },
        promptFocus: [
          "NHS values alignment",
          "Patient care excellence",
          "Clinical competency demonstration",
          "Professional development commitment",
          "Evidence-based practice examples"
        ]
      }
    },

    interviewQuestions: {
      description: "Generate realistic NHS interview questions and model answers",
      structure: {
        questionCategories: [
          "Clinical competency and patient safety",
          "NHS values alignment",
          "Teamwork and communication",
          "Conflict resolution",
          "Professional development",
          "Diversity and inclusion",
          "Service improvement",
          "Leadership and accountability"
        ],
        answerStructure: "STAR method (Situation, Task, Action, Result)",
        responseFormat: "JSON with questions and answers arrays"
      }
    },

    supportingInformation: {
      description: "Generate NHS job application supporting information",
      structure: {
        keyElements: [
          "Direct person specification addressing",
          "NHS values demonstration with examples",
          "STAR method examples",
          "Patient safety and quality focus",
          "Professional development commitment",
          "Motivation and fit for role/trust"
        ],
        writingGuidelines: [
          "First person narrative",
          "Professional but personable tone",
          "Specific measurable examples",
          "Plain English, avoid jargon",
          "Strong opening and closing"
        ]
      }
    },

    promptTips: {
      bestPractices: [
        "Always provide specific context about the NHS role and trust",
        "Include relevant healthcare terminology and standards",
        "Reference NHS values and priorities",
        "Use structured prompts with clear instructions",
        "Specify desired output format (JSON, text, word count)",
        "Include examples when possible",
        "Set appropriate temperature (0.3 for analysis, 0.7 for creative content)",
        "Use system instructions to set the AI's role and expertise"
      ],
      
      commonMistakes: [
        "Being too vague about requirements",
        "Not providing enough context",
        "Forgetting to specify NHS-specific focus",
        "Not setting appropriate response format",
        "Ignoring the importance of healthcare values",
        "Missing patient safety considerations"
      ]
    }
  };

  res.json(examples);
});

export default router;