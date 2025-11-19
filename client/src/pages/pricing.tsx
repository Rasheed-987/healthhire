import { PublicHeader } from "@/components/public-header";
import { Header } from "@/components/header";
import { useAuth } from "@/hooks/useAuth";
import { PublicFooter } from "@/components/public-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  User,
  Search,
  ClipboardList,
  FileText,
  MessageSquare,
  HelpCircle,
  BookOpen,
  Users,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { Link } from "wouter";
import henryHelperImage from "@assets/Henry Helper (1)_1757337880712.png";
import { useLocation } from "wouter";

export default function Pricing() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isPaid } = useSubscription();

  const handleFreePlan = () => {
    // Free plan - just show success message and redirect to dashboard
    toast({
      title: "You're all set! 🎉",
      description:
        "You have been subscribed successfully to the Free Plan. Redirecting to your dashboard...",
      duration: 3000,
    });

    // Redirect to dashboard after a short delay
    setTimeout(() => {
      setLocation("/");
    }, 2000);
  };

  const handleUpgrade = async () => {
    setIsLoading(true);
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }
    try {
      const response = await apiRequest(
        "POST",
        "/api/payments/create-checkout",
        {}
      );
      const data = await response.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const freeFeatures = [
    "Complete Candidate Profile management",
    "Full access to NHS News & Updates",
    "Basic dashboard overview",
    "Account creation and profile setup",
  ];

  const paidFeatures = [
    "Unlimited NHS job searching with intelligent matching",
    "Complete Application Documents with CV and Supporting Information generation",
    "Full Interview Practice with expert feedback and scoring",
    "Advanced Q&A Generator for specific NHS roles and bands",
    "Comprehensive Job Application Tracker with analytics",
    "Complete Resources Hub with downloadable guides and courses",
    "All premium features unlocked forever",
    "Lifetime access - no recurring fees",
  ];

  const blockedFeatures = [
    "Job Finder (preview only)",
    "Application Documents (limited preview)",
    "Interview Practice (preview mode only)",
    "Q&A Generator (sample questions only)",
    "Job Tracker (preview interface only)",
    "Resources Hub (no downloads)",
  ];

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // If not authenticated redirect to /login
  // useEffect(() => {
  //   if (!authLoading && !isAuthenticated) {
  //     setLocation("/login?redirect=/pricing");
  //   }
  // }, [isAuthenticated, authLoading, setLocation]);

  // If we returned from Stripe with a session_id, refresh the user
  // so subscription status is reflected immediately.
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const sessionId = qs.get("session_id");
    if (sessionId) {
      // Re-fetch the current user to update subscription state.
      (async () => {
        try {
          await apiRequest("GET", "/api/auth/user");
        } catch (e) {
          // ignore
        } finally {
          // Remove session_id from URL
          qs.delete("session_id");
          const newUrl =
            window.location.pathname +
            (qs.toString() ? `?${qs.toString()}` : "");
          window.history.replaceState({}, "", newUrl);
          // force a small reload to ensure UI updates if needed
          window.location.reload();
        }
      })();
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {isAuthenticated ? <Header /> : <PublicHeader />}

      <main className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        {/* Back to Dashboard Button */}
        {isAuthenticated && (
          <div className="mb-8">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        )}

        {/* Page Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="w-4 h-4 mr-2" />
            Simple, Fair Pricing
          </Badge>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Accelerate Your NHS Career
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose between our free starter plan or unlock all professional
            features with a single payment
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-2xl">Free Starter</CardTitle>
              <div className="text-3xl font-bold">£0</div>
              <p className="text-muted-foreground">
                Perfect for exploring NHS opportunities
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {freeFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
                {blockedFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 opacity-60"
                  >
                    <X className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {!isAuthenticated ? (
                // If not logged in
                <Button variant="outline" className="w-full" disabled>
                  Sign in to continue
                </Button>
              ) : isPaid ? (
                // If user has paid plan
                <Button variant="outline" className="w-full" disabled>
                  <Check className="w-4 h-4 mr-2" />
                  Included in your plan
                </Button>
              ) : (
                // If user already has free plan (default), show non-clickable button
                <Button
                  variant="outline"
                  className="w-full cursor-not-allowed opacity-80"
                  disabled
                >
                  <Check className="w-4 h-4 mr-2" />
                  Current Plan (Free)
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Paid Plan */}
          <Card className="relative border-primary shadow-lg">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              Most Popular
            </Badge>
            <CardHeader>
              <CardTitle className="text-2xl">Full Access</CardTitle>
              <div className="text-3xl font-bold">
                £70
                <span className="text-lg font-normal text-muted-foreground ml-2">
                  one-time
                </span>
              </div>
              <p className="text-muted-foreground">
                Lifetime access to all professional tools
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {paidFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              {isPaid ? (
                <Button className="w-full" disabled>
                  <Check className="w-4 h-4 mr-2" />
                  Current Plan
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={handleUpgrade}
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Subscribe Now"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Still Unsure Button */}
        {!isPaid && (
          <div className="text-center mb-16">
            <Button
              variant="outline"
              size="lg"
              onClick={() =>
                document
                  .getElementById("features-showcase")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="text-lg px-8 py-6 border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            >
              Still unsure? See what's included ↓
            </Button>
          </div>
        )}

        {/* Features Showcase Section */}
        <div id="features-showcase" className="mb-16">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              Everything Included
            </Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Your Complete NHS Career Toolkit
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              8 powerful tools designed specifically for healthcare
              professionals. One payment, lifetime access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Candidate Profile */}
            <Card className="group p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                    Candidate Profile
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Keep a clean, reusable profile that powers your CV and
                    applications.
                  </p>
                </div>
              </div>
            </Card>

            {/* Find & Save Jobs */}
            <Card className="group p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                    Find & Save Jobs
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Search NHS roles, save favourites, and apply with
                    confidence.
                  </p>
                </div>
              </div>
            </Card>

            {/* Job Tracker */}
            <Card className="group p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <ClipboardList className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                    Job Tracker
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Track every application, interview, and outcome — all in one
                    view.
                  </p>
                </div>
              </div>
            </Card>

            {/* Supporting Information & Cover Letters */}
            <Card className="group p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                    Supporting Information & Cover Letters
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Use Henry the Helper to tailor strong, role-matched
                    documents.
                  </p>
                </div>
              </div>
            </Card>

            {/* Interview Practice */}
            <Card className="group p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                    Interview Practice
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Timed Q&A with structured feedback and model answers.
                  </p>
                </div>
              </div>
            </Card>

            {/* Role-Specific Questions */}
            <Card className="group p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <HelpCircle className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                    Role-Specific Questions
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Ask Henry for likely questions by role and see example
                    responses.
                  </p>
                </div>
              </div>
            </Card>

            {/* Resource Library */}
            <Card className="group p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                    Resource Library
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Guides, templates, and checklists built by NHS-experienced
                    experts.
                  </p>
                </div>
              </div>
            </Card>

            {/* Referral Programme */}
            <Card className="group p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                    Referral Programme
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Invite friends, support each other, and earn rewards.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Support Section with Henry */}
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-3xl border border-blue-200/50 dark:border-blue-800/50 overflow-hidden">
            <div className="relative p-8 md:p-12">
              <div className="flex flex-col items-center gap-8 max-w-lg mx-auto text-center">
                {/* Henry Image */}
                <div className="relative">
                  <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-full p-6 shadow-2xl border-4 border-white dark:border-gray-700">
                    <img
                      src={henryHelperImage}
                      alt="Henry the Helper"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="outline"
                    className="border-2 hover:bg-primary/5 px-6 py-3 rounded-xl font-medium h-auto"
                    onClick={() =>
                      window.open("mailto:hello@healthhireportal.com", "_blank")
                    }
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Email Support
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
