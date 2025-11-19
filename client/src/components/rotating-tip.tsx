import { useState, useEffect } from "react";
import { X } from "lucide-react";

// NHS Career Tips Database
const healthHireTips = [
  // CV & Supporting Information Tips
  "💡 Tip: Quantify your achievements - write 'Reduced wait times by 20%' instead of just 'improved efficiency'",
  "💡 Tip: Avoid jargon in your applications – write in plain English that any panel member can understand",
  "💡 Tip: Always double-check spelling of Trust names and hospitals - spelling errors can cost you the interview",
  "💡 Tip: Highlight NHS values (compassion, respect, dignity, commitment, quality, integrity) in your supporting information",
  "💡 Tip: Keep sentences concise but specific - every word should add value to your application",

  // NHS Values & Person Specification Tips  
  "💡 Tip: Read the person specification line by line and directly match each point in your response",
  "💡 Tip: Use the STAR method: Situation, Task, Action, Result - it makes your examples much stronger",
  "💡 Tip: Show evidence of continuous professional development - mention recent courses and training",
  "💡 Tip: Always address essential criteria first, then desirable ones - don't leave any gaps",
  "💡 Tip: Don't just state your skills - evidence them with specific examples and outcomes",

  // Supporting Information Tips
  "💡 Tip: Write in paragraphs, not bullet points - NHS panels prefer flowing narrative text",
  "💡 Tip: Keep supporting information around 500-1000 words depending on the role level",
  "💡 Tip: End with a strong closing statement about your motivation and commitment",
  "💡 Tip: Use 'I' statements and take ownership - show confidence in your abilities",
  "💡 Tip: Mention working across MDTs (multidisciplinary teams) - it's essential in NHS roles",
  "💡 Tip: Show awareness of NHS pressures like workload, waiting lists, and patient safety",

  // Motivation & Career Tips
  "💡 Tip: Be specific about why you want THIS Trust - research their values and recent achievements",
  "💡 Tip: Share a personal experience that shaped your healthcare career choice - make it authentic",
  "💡 Tip: Explain how this role fits your long-term career development plan",
  "💡 Tip: Stay positive in applications - never criticise previous employers or experiences",
  "💡 Tip: Demonstrate enthusiasm for NHS training and progression opportunities",

  // Skills & Experience Tips
  "💡 Tip: Highlight communication skills with both patients and colleagues - it's crucial",
  "💡 Tip: Mention specific IT systems you've used: EPR, PACS, Lorenzo, SystmOne",
  "💡 Tip: Evidence teamwork, especially examples of working under pressure",
  "💡 Tip: Show understanding of safeguarding principles - it's essential for all NHS roles",
  "💡 Tip: Demonstrate flexibility with shifts and rota changes - NHS values adaptability",

  // Clinical Knowledge Tips
  "💡 Tip: Reference relevant guidelines: NICE, NMC Code, GMC Good Practice, IR(ME)R",
  "💡 Tip: Mention any audit, quality improvement, or service improvement involvement",
  "💡 Tip: Show evidence of documentation accuracy - it's critical for patient safety",
  "💡 Tip: Demonstrate how you prioritise tasks in busy clinical settings",

  // Interview Preparation Tips
  "💡 Tip: Research the Trust's values and recent CQC inspection ratings before interviews",
  "💡 Tip: Prepare STAR answers for NHS values-based questions - practice them aloud",
  "💡 Tip: Have one strong example ready for teamwork and one for leadership/initiative",
  "💡 Tip: Be ready for scenario questions: 'What would you do if a patient complained?'",

  // Application Process Tips
  "💡 Tip: Don't wait until closing date to apply - submit early to avoid system crashes",
  "💡 Tip: Save copies of your supporting information to adapt for future roles",
  "💡 Tip: Apply widely - NHS, private sector, agency, and bank positions",
  "💡 Tip: Always personalise applications - never copy and paste blindly",
  "💡 Tip: Check visa sponsorship requirements early in your application process",

  // Motivation & Mindset Tips
  "💡 Tip: Rejection is redirection - learn from feedback and improve your next application",
  "💡 Tip: Every application is practice - you're sharpening your skills each time",
  "💡 Tip: Persistence beats perfection - keep applying and improving",
  "💡 Tip: Request feedback after every rejection - it's fuel for improvement",
  "💡 Tip: Celebrate small wins like getting shortlisted or reaching interview stage",

  // Practical Tips
  "💡 Tip: Follow NHS Trusts on LinkedIn to see their values and culture in action",
  "💡 Tip: Network with current NHS staff online - they can provide insider insights",
  "💡 Tip: Tailor applications to specific departments (e.g., radiology vs cardiology)",
  "💡 Tip: Keep your CPD portfolio ready to show at interviews",
  "💡 Tip: The NHS needs people like you - believe in your ability to succeed"
];

export const RotatingTip = () => {
  const [currentTip, setCurrentTip] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Select random tip on component mount
    const randomTip = healthHireTips[Math.floor(Math.random() * healthHireTips.length)];
    setCurrentTip(randomTip);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg shadow-sm" data-testid="rotating-tip">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3 flex-1">
          <p className="text-blue-800 font-medium leading-relaxed">{currentTip}</p>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-blue-400 hover:text-blue-600 transition-colors flex-shrink-0 mt-1"
          data-testid="close-tip"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};