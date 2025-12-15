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
    freeDescription: "Your profile is the foundation of your NHS career success! As a premium user, you can create a detailed profile that showcases your full healthcare expertise. The system uses this information for CV generation, supporting information and interview preparation.",
    premiumDescription: "Your profile is the foundation of your NHS career success! As a premium user, you can create a detailed profile that showcases your full healthcare expertise. The system uses this information for CV generation, supporting information and interview preparation.",
    cardSelector: '[data-testid="sortable-card-profile"]',
    position: "bottom"
  },
  {
    id: "jobs",
    title: "Intelligent Job Finder",
    freeDescription: "Welcome to the Job Finder, search for jobs here and see what other jobs boards you should use as part of your job strategy.",
    premiumDescription: "Welcome to the Job Finder, search for jobs here and see what other jobs boards you should use as part of your job strategy.",
    cardSelector: '[data-testid="sortable-card-jobs"]',
    position: "bottom"
  },
  {
    id: "documents",
    title: "AI Document Generation",
    freeDescription: "This is where the magic happens! I'll generate tailored Supporting Information documents for every NHS application. Each document is customized to the specific job description, incorporating your experience and demonstrating how you meet every requirement. No more spending hours writing applications!",
    premiumDescription: "This is where the magic happens! I'll generate tailored Supporting Information documents for every NHS application. Each document is customized to the specific job description, incorporating your experience and demonstrating how you meet every requirement. No more spending hours writing applications!",
    cardSelector: '[data-testid="sortable-card-documents"]',
    position: "bottom"
  },
  {
    id: "resources",
    title: "NHS Career Resources",
    freeDescription: "Your comprehensive NHS career toolkit! Access exclusive videos, interview success frameworks and general advice. I've curated the most effective resources to accelerate your NHS career at every stage.",
    premiumDescription: "Your comprehensive NHS career toolkit! Access exclusive videos, interview success frameworks and general advice. I've curated the most effective resources to accelerate your NHS career at every stage.",
    cardSelector: '[data-testid="sortable-card-resources"]',
    position: "bottom"
  },
  {
    id: "practice",
    title: "Interview Practice Studio",
    freeDescription: "Master NHS interviews with personalized practice sessions! I'll conduct mock interviews tailored to your target roles, provide detailed feedback on your STAR responses, and help you align with NHS values. Practice makes perfect, and this system ensures you're ready for success!",
    premiumDescription: "Master NHS interviews with personalized practice sessions! I'll conduct mock interviews tailored to your target roles, provide detailed feedback on your STAR responses, and help you align with NHS values. Practice makes perfect, and this system ensures you're ready for success!",
    cardSelector: '[data-testid="sortable-card-practice"]',
    position: "bottom"
  },
  {
    id: "qa",
    title: "Interview Q&A Generator",
    freeDescription: "Never be caught off-guard in interviews again! I generate role-specific interview questions with detailed model answers. Each question is crafted based on NHS competency frameworks and your target positions, ensuring comprehensive preparation.",
    premiumDescription: "Never be caught off-guard in interviews again! I generate role-specific interview questions with detailed model answers. Each question is crafted based on NHS competency frameworks and your target positions, ensuring comprehensive preparation.",
    cardSelector: '[data-testid="sortable-card-qa"]',
    position: "bottom"
  },
  {
    id: "tracker",
    title: "Application Tracker & Analytics",
    freeDescription: "Transform your job search with the ultimate organisation! Track every application through our Kanban board, monitor success rates and optimise your approach. The analytics dashboard shows the whole picture in one easy to use dashboard so you don't get lost.",
    premiumDescription: "Transform your job search with the ultimate organisation! Track every application through our Kanban board, monitor success rates and optimise your approach. The analytics dashboard shows the whole picture in one easy to use dashboard so you don't get lost.",
    cardSelector: '[data-testid="sortable-card-tracker"]',
    position: "bottom"
  },
  {
    id: "news",
    title: "NHS News & Updates",
    freeDescription: "Stay ahead with the latest news! I monitor policy changes, new opportunities, and industry trends that directly impact your career. This intelligence helps you make informed decisions and impress in interviews with current knowledge.",
    premiumDescription: "Stay ahead with the latest news! I monitor policy changes, new opportunities, and industry trends that directly impact your career. This intelligence helps you make informed decisions and impress in interviews with current knowledge.",
    cardSelector: '[data-testid="sortable-card-news"]',
    position: "bottom"
  },
  {
    id: "referrals",
    title: "Referral Rewards Program",
    freeDescription: "As a premium member, you'll earn enhanced rewards for referring friends, colleagues or family. Build your network while earning exclusive benefits and helping others advance their careers.",
    premiumDescription: "As a premium member, you'll earn enhanced rewards for referring friends, colleagues or family. Build your network while earning exclusive benefits and helping others advance their careers.",
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