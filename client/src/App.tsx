import { Switch, Route, useLocation } from "wouter";
import { useEffect, useLayoutEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/theme-context";
import { useAuth } from "@/hooks/useAuth";
import { FullscreenLoader } from "@/components/fullscreen-loader";
import { GlobalLoader } from "@/components/global-loader";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Pricing from "@/pages/pricing";
import Documents from "@/pages/documents";
import InterviewPractice from "@/pages/interview-practice";
import QAGenerator from "@/pages/qa-generator";
import QASession from "@/pages/qa-session";
import ApplicationTracker from "@/pages/tracker";
import PaymentSuccess from "@/pages/payment-success";
import Profile from "@/pages/profile";
import JobFinder from "@/pages/job-finder";
import Resources from "@/pages/resources";
import NewsAndUpdates from "@/pages/news";
import AdminDashboard from "@/pages/admin";
import Checkout from "@/pages/checkout";
import DocumentGeneration from "@/pages/ai-documents";
import DocumentsEnhanced from "@/pages/documents-enhanced";
import JobDetail from "@/pages/job-detail";
import CVViewer from "@/pages/cv-viewer";
import PrivacySettings from "@/pages/privacy-settings";
import PrivacyNotice from "@/pages/privacy-notice";
import TermsOfUse from "@/pages/terms-of-use";
import CookiePolicy from "@/pages/cookie-policy";
import Referrals from "@/pages/referrals";
import Login from "@/pages/login";
import Register from "@/pages/register";
import VerifyEmail from "@/pages/verify-email";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import AcceptInvite from "@/pages/accept-invite";
import Support from "./pages/support";

function Root() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && (user as any).isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  if (isLoading) return <FullscreenLoader show />;
  if (!isAuthenticated) return <Landing />;
  // Authenticated non-admin users land on Dashboard
  return <Dashboard />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  // Global scroll-to-top on route change
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/landing" component={Landing} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/payment-success/job" component={PaymentSuccess} />
      <Route path="/checkout" component={Checkout} />
  <Route path="/verify-email" component={VerifyEmail} />
  <Route path="/forgot-password" component={ForgotPassword} />
  <Route path="/reset-password" component={ResetPassword} />
  <Route path="/accept-invite" component={AcceptInvite} />
      <Route path="/privacy-notice" component={PrivacyNotice} />
      <Route path="/terms-of-use" component={TermsOfUse} />
      <Route path="/cookie-policy" component={CookiePolicy} />

      {/* Admin route - page enforces its own access check */}
      <Route path="/admin" component={AdminDashboard} />

      {/* Protected routes (individual pages handle their own authentication) */}
      <Route path="/profile" component={Profile} />
      <Route path="/jobs" component={JobFinder} />
      <Route path="/jobs/:id" component={JobDetail} />
      <Route path="/documents" component={DocumentsEnhanced} />
      <Route path="/resources" component={Resources} />
      <Route path="/interview-practice" component={InterviewPractice} />
      <Route path="/qa-generator" component={QAGenerator} />
      <Route path="/tracker" component={ApplicationTracker} />
      <Route path="/news" component={NewsAndUpdates} />
      <Route path="/practice" component={InterviewPractice} />
      <Route path="/qa" component={QAGenerator} />
      <Route path="/qa/session/:sessionId" component={QASession} />
      <Route path="/ai-documents" component={DocumentGeneration} />
      <Route path="/cv-viewer" component={CVViewer} />
      <Route path="/cv" component={CVViewer} />
      <Route path="/privacy" component={PrivacySettings} />
      <Route path="/privacy-settings" component={PrivacySettings} />
      <Route path="/referrals" component={Referrals} />
      <Route path="/support" component={Support} />
      <Route path="/dashboard" component={Dashboard}/>

      {/* Root path - redirects admins to /admin */}
      <Route path="/" component={Root} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="healthhire-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          {/* <GlobalLoader /> */}
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
