import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ArrowLeft, ArrowRight, Crown } from "lucide-react";
import henryAvatar from "@assets/Green Simple Woman Doctor Avatar_1756985658118.png";

interface OnboardingStep {
  id: string;
  title: string;
  freeDescription: string;
  premiumDescription: string;
  cardSelector: string;
  position: "top" | "bottom" | "left" | "right";
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: "profile",
    title: "Your Candidate Profile",
    freeDescription: "This is where you'll build your comprehensive healthcare professional profile. Add your qualifications, experience, and key skills. A complete profile is essential for job matching and helps you stand out to NHS employers.",
    premiumDescription: "Your profile is the foundation of your NHS career success! As a premium user, you can create detailed profiles that showcase your full healthcare expertise. The system uses this information for intelligent job matching, CV generation, and interview preparation. Complete profiles get 3x more job matches!",
    cardSelector: '[data-testid="sortable-card-profile"]',
    position: "bottom"
  },
  {
    id: "jobs",
    title: "Intelligent Job Finder",
    freeDescription: "Discover NHS jobs from multiple sources with basic filtering. See job titles and locations to get started with your search. This gives you a preview of the powerful job matching capabilities available with premium access.",
    premiumDescription: "Welcome to the most advanced NHS job matching system! I analyze your profile against thousands of NHS positions daily, providing compatibility scores, salary insights, and eligibility filtering. You'll get unlimited searches, advanced filters, and personalized job recommendations that match your exact skills and career goals.",
    cardSelector: '[data-testid="sortable-card-jobs"]',
    position: "bottom"
  },
  {
    id: "documents",
    title: "AI Document Generation",
    freeDescription: "Preview our AI-powered document generation system that creates tailored Supporting Information for NHS applications. See sample outputs and understand how AI can transform your job application process.",
    premiumDescription: "This is where the magic happens! I'll generate perfectly tailored Supporting Information documents for every NHS application. Each document is customized to the specific job description, incorporating your experience and demonstrating how you meet every requirement. No more spending hours writing applications!",
    cardSelector: '[data-testid="sortable-card-documents"]',
    position: "bottom"
  },
  {
    id: "resources",
    title: "NHS Career Resources",
    freeDescription: "Access our library of NHS career guides and resources. Get insights into NHS application processes, interview techniques, and career progression paths to help you succeed in healthcare.",
    premiumDescription: "Your comprehensive NHS career toolkit! Access exclusive guides, interview success frameworks, CPD tracking tools, and mini-courses. I've curated the most effective resources to accelerate your NHS career at every stage.",
    cardSelector: '[data-testid="sortable-card-resources"]',
    position: "bottom"
  },
  {
    id: "practice",
    title: "Interview Practice Studio",
    freeDescription: "Preview our mock interview system that helps healthcare professionals practice for NHS interviews. See how AI feedback can improve your interview performance and confidence.",
    premiumDescription: "Master NHS interviews with personalized practice sessions! I'll conduct mock interviews tailored to your target roles, provide detailed feedback on your STAR responses, and help you align with NHS values. Practice makes perfect, and this system ensures you're ready for success!",
    cardSelector: '[data-testid="sortable-card-practice"]',
    position: "bottom"
  },
  {
    id: "qa",
    title: "Interview Q&A Generator",
    freeDescription: "Discover how our AI generates role-specific interview questions with model answers. This tool helps you prepare for common NHS interview scenarios and understand what employers are looking for.",
    premiumDescription: "Never be caught off-guard in interviews again! I generate unlimited, role-specific interview questions with detailed model answers. Each question is crafted based on NHS competency frameworks and your target positions, ensuring comprehensive preparation.",
    cardSelector: '[data-testid="sortable-card-qa"]',
    position: "bottom"
  },
  {
    id: "tracker",
    title: "Application Tracker & Analytics",
    freeDescription: "Preview our application tracking system that helps you organize your job search. See how analytics can provide insights into your application success rates and areas for improvement.",
    premiumDescription: "Transform your job search with data-driven insights! Track every application through our Kanban board, monitor success rates, identify patterns, and optimize your approach. The analytics dashboard shows exactly what's working and what needs adjustment.",
    cardSelector: '[data-testid="sortable-card-tracker"]',
    position: "bottom"
  },
  {
    id: "news",
    title: "NHS News & Updates",
    freeDescription: "Stay informed about the latest NHS developments, policy changes, and healthcare industry news. Knowledge is power in your career journey, and staying updated gives you an edge in interviews and applications.",
    premiumDescription: "Stay ahead with curated NHS insights! I monitor policy changes, new opportunities, and industry trends that directly impact your career. This intelligence helps you make informed decisions and impress in interviews with current knowledge.",
    cardSelector: '[data-testid="sortable-card-news"]',
    position: "bottom"
  },
  {
    id: "referrals",
    title: "Referral Rewards Program",
    freeDescription: "Coming soon! Our referral program will reward you for helping fellow healthcare professionals discover HealthHire Portal. Earn benefits while building your professional network.",
    premiumDescription: "Coming soon! As a premium member, you'll earn enhanced rewards for referring healthcare professionals. Build your network while earning exclusive benefits and helping others advance their NHS careers.",
    cardSelector: '[data-testid="sortable-card-referrals"]',
    position: "bottom"
  }
];

interface HenryOnboardingProps {
  isPremium: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function HenryOnboarding({ isPremium, onComplete, onSkip }: HenryOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const currentStepData = onboardingSteps[currentStep];
  const totalSteps = onboardingSteps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  // Highlight the current card
  useEffect(() => {
    // Remove previous highlights
    const previousHighlights = document.querySelectorAll('.onboarding-highlight');
    previousHighlights.forEach(el => el.classList.remove('onboarding-highlight'));

    // Add highlight to current card
    const currentCard = document.querySelector(currentStepData.cardSelector);
    if (currentCard) {
      currentCard.classList.add('onboarding-highlight');
      currentCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return () => {
      // Cleanup on unmount
      const highlights = document.querySelectorAll('.onboarding-highlight');
      highlights.forEach(el => el.classList.remove('onboarding-highlight'));
    };
  }, [currentStep, currentStepData.cardSelector]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (isFirstStep) {
      return;
    }
    setCurrentStep(prev => prev - 1);
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        {/* Onboarding Card */}
        <Card className="max-w-2xl w-full bg-white dark:bg-gray-900 shadow-2xl">
          <CardContent className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <img 
                  src={henryAvatar} 
                  alt="Henry the Helper"
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    {currentStepData.title}
                    {isPremium && <Crown className="h-5 w-5 text-yellow-500" />}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Step {currentStep + 1} of {totalSteps}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                data-testid="button-skip-onboarding"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Henry's Message */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-6">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                </div>
                <div>
                  <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                    {isPremium ? currentStepData.premiumDescription : currentStepData.freeDescription}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(((currentStep + 1) / totalSteps) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isFirstStep}
                data-testid="button-onboarding-previous"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  data-testid="button-onboarding-skip"
                >
                  Skip Tour
                </Button>
                <Button
                  onClick={handleNext}
                  data-testid="button-onboarding-next"
                >
                  {isLastStep ? "Get Started!" : "Next"}
                  {!isLastStep && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom CSS for highlighting */}
      <style>{`
        .onboarding-highlight {
          position: relative;
          z-index: 45 !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3) !important;
          border-radius: 12px !important;
          transition: all 0.3s ease-in-out !important;
        }
        
        .onboarding-highlight::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 16px;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          z-index: -1;
          animation: pulse-glow 2s infinite;
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </>
  );
}