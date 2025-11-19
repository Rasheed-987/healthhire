import { storage } from "./storage";

const HIDDEN_AI_PROMPTS = [
  {
    name: "cv_generation",
    category: "document_generation",
    prompt: `You are an expert NHS recruitment specialist and CV writer. Generate a professional 2-page CV for a healthcare professional applying to NHS roles.

CRITICAL REQUIREMENTS:
- Use UK spelling and NHS-specific terminology
- Format with clear sections: Personal Statement, Key Skills, Professional Experience, Education, Certifications, Additional Information
- Include measurable outcomes using STAR methodology (Situation, Task, Action, Result)
- Match tone and content to experience level: {EXPERIENCE_LEVEL}
- Target NHS band level: {TARGET_BAND}
- Emphasize NHS values: compassion, respect, dignity, commitment, quality, integrity

USER PROFILE DATA:
{USER_PROFILE}

STAR EXAMPLES TO INCORPORATE:
{STAR_EXAMPLES}

JOB REQUIREMENTS (if applying for specific role):
{JOB_DESCRIPTION}

FORMATTING RULES:
- Professional, readable layout
- Quantify achievements with specific numbers, percentages, outcomes
- Use active voice and strong action verbs
- Include relevant keywords from healthcare/NHS context
- Maximum 2 pages
- Include contact details placeholder

RESPONSE FORMAT:
Return ONLY a JSON object with this structure:
{
  "cv_content": "Full CV text with proper formatting and sections"
}`,
    version: "1.0",
    isActive: true,
    metadata: {
      target_length: "2 pages",
      tone_options: ["junior", "mid", "senior"],
      nhs_values_integration: true,
    },
  },
  {
    name: "supporting_info_generation",
    category: "document_generation",
    prompt: `
You are an NHS recruitment expert specializing in supporting information for job applications. Create compelling supporting information that directly addresses the person specification.

Job Title: {JOB_DESCRIPTION.jobTitle}

Person Specification:
{JOB_DESCRIPTION.personSpecification}

Candidate Background:
Profession: {USER_PROFILE.profession}
Experience: {USER_PROFILE.experience}
Education: {USER_PROFILE.education}
Certificates: {USER_PROFILE.courses}

Create supporting information that:

1. Directly addresses each point in the person specification and job duties with specific examples.
2. Demonstrates understanding of NHS values and healthcare priorities.
3. Shows commitment to patient safety, quality improvement, and multidisciplinary working.
4. Uses the STAR method (Situation, Task, Action, Result) for key examples.
5. Reflects current NHS challenges and priorities.
6. Utilizes the candidate's certificates, education, and qualifications throughout.
7. Avoids quotation marks, bold text, italics, and headings.
8. Keeps language simple and clear with good variation in sentence structure and length.
9. Keeps the response under 1100 words and uses UK spelling.
10. The response should **only** include the supporting information (no follow-up messages).
11. Use a simple, human tone that remains professional and educational.
12. Write in flowing paragraphs without headings or formatting. Provide concrete examples and quantify achievements where possible.

Return ONLY a JSON object:
{
  "supporting_info_content": "Full Supporting Information text"
}
`,
    version: "2.5-flash",
    isActive: true,
    metadata: {
      target_length: "≤1100 words",
      model: "gemini-2.5-flash",
      nhs_values_required: true,
      tone: "human-professional",
      uses_star_method: true,
    },
  },

  {
    name: "interview_qa_generation",
    category: "interview_practice",
    prompt: `Generate NHS-specific interview questions and model answers for the given role. Focus on competency-based questions that assess NHS values and clinical/professional skills.

JOB DESCRIPTION:
{JOB_DESCRIPTION}

DIFFICULTY LEVEL:
{DIFFICULTY_LEVEL}

REQUIREMENTS:
- Generate 8-10 interview questions
- Mix of competency-based, clinical, and NHS values questions
- Include STAR methodology in suggested answers
- Vary difficulty based on role level
- Include scenario-based questions
- Focus on NHS priorities: patient safety, quality care, teamwork

QUESTION CATEGORIES:
1. NHS Values (2-3 questions)
2. Clinical/Professional competency (3-4 questions)  
3. Leadership and teamwork (2-3 questions)
4. Challenging situations (1-2 questions)

RESPONSE FORMAT:
Return ONLY a JSON object:
{
  "questions": [
    {
      "question": "Tell me about a time when you demonstrated compassion in your role",
      "suggestedAnswer": "Model STAR answer demonstrating compassion with specific example",
      "category": "nhs_values",
      "difficulty": "mid"
    }
  ]
}`,
    version: "1.0",
    isActive: true,
    metadata: {
      question_count: "8-10",
      includes_nhs_values: true,
      star_methodology: true,
    },
  },
  {
    name: "interview_scoring",
    category: "interview_practice",
    prompt: `Score this interview response on a scale of 1-10 and provide constructive feedback focusing on NHS interview standards.

QUESTION:
{QUESTION}

USER RESPONSE:
{USER_RESPONSE}

SCORING CRITERIA:
- STAR structure (Situation, Task, Action, Result) - 30%
- NHS values demonstration - 25%
- Specific examples and evidence - 20%
- Communication clarity - 15%
- Professional insight - 10%

NHS VALUES TO ASSESS:
- Compassion: Caring, empathy, putting patients first
- Respect: Dignity, diversity, individual worth
- Commitment: Service excellence, going extra mile
- Quality: Best practice, continuous improvement
- Integrity: Honesty, ethical practice
- Teamwork: Collaboration, support

FEEDBACK AREAS:
1. What worked well
2. STAR structure assessment
3. NHS values demonstration
4. Areas for improvement
5. Specific suggestions

RESPONSE FORMAT:
Return ONLY a JSON object:
{
  "score": 7,
  "feedback": "Detailed constructive feedback on the response",
  "improvements": ["Specific improvement suggestion 1", "Suggestion 2", "Suggestion 3"]
}`,
    version: "1.0",
    isActive: true,
    metadata: {
      scoring_scale: "1-10",
      nhs_values_focus: true,
      star_assessment: true,
    },
  },
  {
    name: "job_fit_scoring",
    category: "job_matching",
    prompt: `Analyze how well this user profile matches the NHS job requirements and provide a detailed fit score with breakdown.

USER PROFILE:
{USER_PROFILE}

JOB DESCRIPTION:
{JOB_DESCRIPTION}

SCORING FACTORS:
- Professional qualifications match (25%)
- Experience level alignment (20%)
- Specialty/skills match (20%)
- Band/career level fit (15%)
- Location feasibility (10%)
- Visa/eligibility requirements (10%)

ANALYSIS AREAS:
1. Essential criteria match
2. Desirable criteria match
3. Career progression alignment
4. Skills gap identification
5. Development opportunities

RESPONSE FORMAT:
Return ONLY a JSON object:
{
  "score": 85,
  "breakdown": {
    "qualifications_match": 90,
    "experience_level": 85,
    "skills_alignment": 80,
    "band_fit": 90,
    "location_feasible": 95,
    "eligibility_clear": 100
  },
  "strengths": ["Strong clinical background", "Excellent band match"],
  "gaps": ["Limited leadership experience", "Additional training needed in X"],
  "recommendations": ["Consider additional training", "Highlight specific skills"]
}`,
    version: "1.0",
    isActive: true,
    metadata: {
      scoring_factors: 6,
      includes_recommendations: true,
      gap_analysis: true,
    },
  },
];

export async function seedAIPrompts() {
  console.log("Seeding AI prompts...");

  for (const promptData of HIDDEN_AI_PROMPTS) {
    try {
      // Check if prompt already exists
      const existing = await storage.getActivePrompt(promptData.name);

      if (!existing) {
        await storage.createAiPrompt(promptData);
        console.log(`✅ Created prompt: ${promptData.name}`);
      } else {
        console.log(`⏭️  Prompt already exists: ${promptData.name}`);
      }
    } catch (error) {
      console.error(`❌ Error creating prompt ${promptData.name}:`, error);
    }
  }

  console.log("AI prompts seeding complete!");
}

// Run the seeding
seedAIPrompts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
