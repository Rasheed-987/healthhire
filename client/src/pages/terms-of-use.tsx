import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import DashboardHeader from "@/components/dashboard/header";
import { Footer } from "@/components/footer";

export default function TermsOfUse() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const handleBack = () => {
    // If user is authenticated, go to dashboard, otherwise go to homepage
    if (isAuthenticated) {
      setLocation("/");
    } else {
      setLocation("/landing");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {isAuthenticated ? (
        <DashboardHeader user={user} profileCompletion={0} />
      ) : (
        <PublicHeader />
      )}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="space-y-2">
          {/* Back Button */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          {/* Terms of Use Content */}
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h1 className="text-justify">
              Disclaimer and Terms of Use – HealthHire Portal
            </h1>
            <p className="text-end">
              <strong>Last updated: 8 September 2025</strong>
            </p>

            <section className="mb-8">
              <h2 className="text-lg text-justify font-semibold mb-3">
                1) Lifetime Access
              </h2>
              <p className="mb-4 text-justify">
                {/* <strong>HealthHire Portal</strong> (run by 🔷{" "}
                <em>HealthHire UK</em> "we", "us") provides online tools to */}
                “Lifetime access” to the <strong> HealthHire Portal </strong>
                refers to continued access to the platform and its features for
                as long as HealthHire maintains and operates the service. It
                does not guarantee perpetual access or access for the lifetime
                of any individual user. <strong>HealthHire</strong> reserves the
                right to modify, suspend, or discontinue any part of the
                platform or its features at any time, for any reason, without
                prior notice
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg text-justify font-semibold mb-3">
                2) Use of AI Features
              </h2>
              <p className="mb-4 text-justify">
                The <strong>HealthHire Portal</strong> includes AI-assisted
                tools designed to enhance your experience, such as job
                recommendations, CV feedback, and communication support. These
                AI features are provided to assist users, but: They may have
                usage limits to prevent misuse or system overload. These limits
                are automatically reset periodically. AI-generated outputs are
                not factual statements or professional advice and may contain
                errors or inaccuracies. Users are encouraged to review, verify,
                and use their own judgment when relying on AI-generated content.
                HealthHire provides guidelines and best practices to help users
                get the most from AI features, but these should not be seen as
                guarantees of accuracy or outcomes
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg text-justify font-semibold mb-3">
                3) No Guarantee of Employment
              </h2>
              <p className="mb-4 text-justify ">
                Use of the <strong>HealthHire Portal</strong>, including AI
                tools, job listings, or recruiter interactions, does not
                guarantee employment or any specific job outcome. HealthHire
                facilitates connections between candidates and employers but is
                not responsible for hiring decisions made by third parties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg text-justify font-semibold mb-3">
                4) General Disclaimer
              </h2>
              <p className="mb-4 text-justify">
                While <strong>HealthHire</strong> strives to maintain a reliable
                and high-quality platform, we make no warranties or
                representations regarding the accuracy, completeness, or
                reliability of any content or service provided. By using the
                portal, you acknowledge that you do so at your own discretion
                and risk.
              </p>
            </section>
          </div>
        </div>
      </div>
      {isAuthenticated ? <Footer /> : <PublicFooter />}
    </div>
  );
}
