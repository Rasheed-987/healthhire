import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { PublicFooter } from "@/components/public-footer";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  User, 
  Search, 
  BarChart3, 
  FileText, 
  Mic, 
  MessageCircleQuestion,
  BookOpen,
  Users,
  ArrowRight,
  Check,
  Play,
  Clock,
  Target,
  Shield,
  X,
  Zap,
  Building,
  Bell,
  Sparkles,
  Wrench,
  ChartLine,
  HelpCircle,
  DollarSign,
  Bot,
  Globe,
  Briefcase,
  Lock
} from "lucide-react";
import logoHealthhire from "@assets/Portal (1)_1757252217793.png";
import henryAvatar from "@assets/Green Simple Woman Doctor Avatar_1757246695018.png";

export default function Landing() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogin = () => {
    setLocation("/login");
  };

  const handleGetStarted = () => {
    // Don't proceed if auth is still loading
    if (authLoading) return;
    
    if (!isAuthenticated) {
      setLocation("/register?redirect=/pricing");
    } else {
      setLocation("/pricing");
    }
  };

  const handleGetFullAccess = () => {
    // Don't proceed if auth is still loading
    if (authLoading) {
      console.log('[Get Full Access] Auth still loading, waiting...');
      return;
    }
    
    console.log('[Get Full Access] Auth loaded. isAuthenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      console.log('[Get Full Access] User not authenticated, redirecting to login');
      setLocation("/login?redirect=/pricing");
    } else {
      console.log('[Get Full Access] User authenticated, redirecting to pricing');
      setLocation("/pricing");
    }
  };

  // Announcement bar state and rotation
  const [currentAnnouncement, setCurrentAnnouncement] = useState(0);
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  const announcements = [
    {
      text: "New: Timed interview practice with feedback.",
      cta: "Try it",
      action: () => setLocation("/login")
    },
    {
      text: "New: Job Tracker—keep every application organised.",
      cta: "Open tracker", 
      action: () => setLocation("/login")
    },
    {
      text: "See everything in one place—upgrade when ready.",
      cta: "See plans",
      action: () => {
        if (authLoading) return;
        if (!isAuthenticated) {
          setLocation("/login?redirect=/pricing");
        } else {
          setLocation("/pricing");
        }
      }
    },
    {
      text: "Fast-track your application journey today.",
      cta: "Unlock Full Access",
      action: () => {
        if (authLoading) return;
        if (!isAuthenticated) {
          setLocation("/login?redirect=/pricing");
        } else {
          setLocation("/pricing");
        }
      }
    }
  ];

  // Auto-rotate announcements every 5 seconds
  useEffect(() => {
    if (!showAnnouncement) return;
    
    const interval = setInterval(() => {
      setCurrentAnnouncement((prev) => (prev + 1) % announcements.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [showAnnouncement, announcements.length]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img src={logoHealthhire} alt="HealthHire Portal" className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">HealthHire Portal</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Your career toolkit for healthcare success</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              {isAuthenticated ? (
                <Button onClick={() => setLocation('/')}>
                  Go to Dashboard
                </Button>
              ) : (
                <Link href={'/login'} >
                  <Button >
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Announcement Bar */}
      {showAnnouncement && (
        <div className="bg-primary text-primary-foreground py-2 px-4 relative">
          <div className="max-w-7xl mx-auto flex items-center justify-center text-center">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {announcements[currentAnnouncement].text}
              </span>
              <button
                onClick={announcements[currentAnnouncement].action}
                className="text-sm font-semibold underline hover:no-underline transition-all"
              >
                {announcements[currentAnnouncement].cta}
              </button>
            </div>
            <button
              onClick={() => setShowAnnouncement(false)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-primary-foreground/20 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10"></div>
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-10 left-10 w-20 h-20 bg-primary/20 rounded-full blur-xl"></div>
            <div className="absolute top-32 right-20 w-32 h-32 bg-primary/15 rounded-full blur-2xl"></div>
            <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-primary/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-40 right-1/3 w-16 h-16 bg-primary/25 rounded-full blur-lg"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8 border border-primary/20">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                Trusted by applicants across the UK
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold text-foreground mb-8 leading-tight">
                Your job journey
                <span className="block text-primary">in one place.</span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
                Build your profile, find roles, craft supporting information with Henry the Helper, track applications, and get interview-ready — 
                <span className="font-semibold text-foreground">all in one portal.</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                <Button 
                  onClick={handleGetStarted} 
                  size="lg" 
                  className="text-lg px-10 py-4 shadow-lg hover:shadow-xl transition-shadow" 
                  data-testid="button-create-account"
                >
                  Create free account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  onClick={handleGetFullAccess} 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-10 py-4 border-2" 
                  data-testid="button-get-full-access"
                >
                  Get Full Access
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-16 mt-8">
                <div className="flex flex-col items-center text-center max-w-[200px]">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
                    <Sparkles className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Start Free</span>
                </div>
                <div className="flex flex-col items-center text-center max-w-[200px]">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
                    <Wrench className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Stronger Applications, Faster</span>
                </div>
                <div className="flex flex-col items-center text-center max-w-[200px]">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-3">
                    <ChartLine className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Built in Job Tracker</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Value Grid - The One-Stop Shop */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-16 lg:pb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              The one-stop shop
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need for your NHS career journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Top Row - Core Features */}
            <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-lg font-bold">Candidate Profile</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Keep a clean, reusable profile that powers your CV and applications.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Search className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle className="text-lg font-bold">Find & Save Jobs</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Search NHS roles, save favourites, and apply with confidence.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-lg font-bold">Job Tracker</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Track every application, interview, and outcome - all in one view.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="h-8 w-8 text-amber-600 dark:text-amber-500" />
                </div>
                <CardTitle className="text-lg font-bold">Supporting Information</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Use Henry the Helper to generate strong, role-matched documents.
                </p>
              </CardContent>
            </Card>

            {/* Bottom Row - Enhanced Features */}
            <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/20">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Mic className="h-8 w-8 text-rose-600 dark:text-rose-400" />
                </div>
                <CardTitle className="text-lg font-bold">Interview Practice</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Timed Q&A with structured feedback and model answers.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/30 dark:to-cyan-900/20">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <MessageCircleQuestion className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
                </div>
                <CardTitle className="text-lg font-bold">Role-Specific Questions</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ask Henry for likely questions by role and see example responses.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-900/20">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle className="text-lg font-bold">Resource Library</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Guides, templates, and checklists built by NHS-experienced experts.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950/30 dark:to-teal-900/20">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-teal-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                </div>
                <CardTitle className="text-lg font-bold">Referral Programme</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Invite friends, support each other, and earn rewards.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center space-x-4">
            <Button onClick={handleGetFullAccess} size="lg" data-testid="button-get-started">
              Get started
            </Button>
            <Button variant="outline" size="lg" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
              See how it works
            </Button>
          </div>
        </section>

        {/* Henry Intro Banner */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20">
            <div className="flex items-center justify-center gap-6 max-w-4xl mx-auto">
              <img src={henryAvatar} alt="Henry the Helper" className="w-20 h-20 rounded-full shadow-lg flex-shrink-0" />
              <div className="text-center">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Meet Henry, your smart career assistant
                </h3>
                <p className="text-lg text-muted-foreground mb-4">
                  From tailoring supporting information to practice interviews - Henry guides you through every step of your NHS application
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Badge variant="secondary" className="text-sm">
                    Personalised guidance
                  </Badge>
                  <Badge variant="secondary" className="text-sm">
                    NHS-specific expertise
                  </Badge>
                  <Badge variant="secondary" className="text-sm">
                    24/7 available
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="bg-gradient-to-b from-muted/20 to-muted/40 py-16 lg:py-24 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-20 right-10 w-24 h-24 bg-primary/15 rounded-full blur-xl"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                How it works
              </h2>
              <p className="text-xl text-muted-foreground">
                Three simple steps to transform your NHS career journey
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
              {/* Connecting lines */}
              <div className="hidden md:block absolute top-24 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30 transform -translate-y-1/2"></div>
              
              {/* Step 1 */}
              <div className="text-center relative">
                <div className="relative inline-block mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                    <User className="h-8 w-8" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">1</span>
                  </div>
                </div>
                <h3 className="text-xl lg:text-2xl font-bold mb-4 text-foreground">Build your profile</h3>
                <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  Add your experience, education, and key skills once. Create a comprehensive professional foundation.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center relative">
                <div className="relative inline-block mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                    <FileText className="h-8 w-8" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">2</span>
                  </div>
                </div>
                <h3 className="text-xl lg:text-2xl font-bold mb-4 text-foreground">Find roles & tailor documents</h3>
                <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  Search jobs, then let Henry the Helper shape supporting information to the person specification.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center relative">
                <div className="relative inline-block mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                    <Target className="h-8 w-8" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">3</span>
                  </div>
                </div>
                <h3 className="text-xl lg:text-2xl font-bold mb-4 text-foreground">Apply, track, and prepare</h3>
                <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  Use the job tracker and interview practice to stay organised and confident throughout your journey.
                </p>
              </div>
            </div>

            <div className="text-center mt-16">
              <Button onClick={handleGetStarted} size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
                Start in 2 minutes
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Henry the Helper Spotlight */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-16 lg:py-24">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-20 left-10 w-32 h-32 bg-blue-300/20 rounded-full blur-2xl"></div>
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-300/20 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-emerald-300/20 rounded-full blur-xl"></div>
          </div>

          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 border border-primary/20">
                  <Bot className="h-4 w-4" />
                  Your Smart Career Assistant
                </div>

                <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
                  Meet Henry the Helper — your
                  <span className="text-primary block">smart assistant</span>
                </h2>
                
                <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                  Henry helps you turn your profile and the job's criteria into clear, tailored documents and interview prep. No jargon, just practical guidance when you need it.
                </p>

                {/* Example prompts */}
                <div className="space-y-4 mb-10">
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-foreground font-medium text-sm leading-relaxed">
                        "Tailor my supporting information for Band 5 Radiographer in Leeds."
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MessageCircleQuestion className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <p className="text-foreground font-medium text-sm leading-relaxed">
                        "Give me likely interview questions for an HCA role in London."
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Wrench className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-foreground font-medium text-sm leading-relaxed">
                        "Turn these bullet points into a concise cover letter."
                      </p>
                    </div>
                  </div>
                </div>

                <Button onClick={handleGetStarted} size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
                  Try Henry the Helper
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              {/* Henry Avatar with enhanced styling */}
              <div className="flex justify-center lg:justify-end relative">
                <div className="relative">
                  {/* Background glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-400/20 rounded-full blur-2xl scale-110"></div>
                  
                  {/* Main avatar */}
                  <div className="relative w-80 h-80 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-full p-4 shadow-2xl">
                    <img 
                      src={henryAvatar} 
                      alt="Henry the Helper" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>

                  {/* Floating elements */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary/20 rounded-full animate-bounce delay-100"></div>
                  <div className="absolute -bottom-6 -left-6 w-8 h-8 bg-blue-400/30 rounded-full animate-pulse"></div>
                  <div className="absolute top-1/4 -left-8 w-6 h-6 bg-emerald-400/40 rounded-full animate-ping delay-300"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-gradient-to-b from-muted/10 to-muted/30 py-16 lg:py-24 relative">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-20 w-32 h-32 bg-primary/15 rounded-full blur-2xl"></div>
          </div>
          
          <div className="max-w-5xl mx-auto px-6 lg:px-8 relative">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 border border-primary/20">
                <HelpCircle className="h-4 w-4" />
                Got questions? We've got answers
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-muted-foreground">
                Everything you need to know about HealthHire Portal
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* FAQ Item 1 */}
              <div className="bg-background/80 backdrop-blur-sm border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-3">
                      Is HealthHire Portal free to use?
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Yes, you can create a free account and access basic features. Premium features are available with our paid plans.
                    </p>
                  </div>
                </div>
              </div>

              {/* FAQ Item 2 */}
              <div className="bg-background/80 backdrop-blur-sm border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-3">
                      How does Henry the Helper work?
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Henry analyzes your profile and job requirements to provide tailored supporting information, interview questions, and career guidance specific to NHS roles.
                    </p>
                  </div>
                </div>
              </div>

              {/* FAQ Item 3 */}
              <div className="bg-background/80 backdrop-blur-sm border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-3">
                      Is this suitable for overseas healthcare professionals?
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Absolutely. HealthHire Portal includes specific guidance for IMGs (International Medical Graduates) and overseas professionals transitioning to NHS roles.
                    </p>
                  </div>
                </div>
              </div>

              {/* FAQ Item 4 */}
              <div className="bg-background/80 backdrop-blur-sm border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-3">
                      What types of NHS roles does this support?
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      We support all NHS roles including doctors, nurses, HCAs, radiographers, biomedical scientists, and many other healthcare positions across all bands.
                    </p>
                  </div>
                </div>
              </div>

              {/* FAQ Item 5 */}
              <div className="bg-background/80 backdrop-blur-sm border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-3">
                      Can I track multiple job applications?
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Yes, our job tracker lets you monitor multiple applications, interviews, and outcomes all in one place with notes and deadlines.
                    </p>
                  </div>
                </div>
              </div>

              {/* FAQ Item 6 */}
              <div className="bg-background/80 backdrop-blur-sm border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-3">
                      Is my data secure and private?
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Yes, we follow strict data protection standards and your personal information is encrypted and secure. We never share your data with third parties.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <PublicFooter />
    </div>
  );
}