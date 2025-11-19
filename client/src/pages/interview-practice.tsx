import { HenryInterviewPractice } from "@/components/HenryInterviewPractice";
import Header from "@/components/dashboard/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { FeatureGate } from "@/components/feature-gate";
import { FEATURES } from "@shared/schema";
import { useLocation } from "wouter";
import { AlertCircle } from "lucide-react";

export default function InterviewPracticePage() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="outline"
          onClick={() => setLocation("/")}
          className="mb-6"
          data-testid="button-back-dashboard"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
        <div className="text-blue-800 text-sm">
          <h1 className="text-lg font-semibold mb-1">Interview Practice</h1>
          <p>
            Please note that the interview answers and feedback provided by{" "}
            <strong>Henry the Helper</strong> are for guidance only and may not
            always be accurate or reflect actual interview expectations. While
            we aim to provide helpful support, Henry sometimes gets things wrong,
            so please use your own judgment and verify any important information.
          </p>
        </div>
      </div>
    </div>

        <FeatureGate feature={FEATURES.INTERVIEW_PRACTICE}>
          <HenryInterviewPractice />
        </FeatureGate>
      </main>
      <Footer />
    </div>
  );
}
