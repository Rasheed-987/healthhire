import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { getQueryFn } from "@/lib/queryClient";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/ui/upgrade-prompt";
import Header from "@/components/dashboard/header";
import SectionCard from "@/components/dashboard/section-card";
import RecentActivity from "@/components/dashboard/recent-activity";
import { Footer } from "@/components/footer";
import { HenryChat } from "@/components/henry-chat";
import { MarketingConsentWidget } from "@/components/marketing-consent-widget";
import { AnalyticsConsentWidget } from "@/components/analytics-consent-widget";
import { HenryOnboarding } from "@/components/henry-onboarding";
import { Button } from "@/components/ui/button";
import {
  User,
  Search,
  FileText,
  BookOpen,
  Mic,
  MessageCircleQuestion,
  BarChart3,
  Settings,
  GripVertical,
  Newspaper,
  Crown,
  HelpCircle,
  Users
} from "lucide-react";
import type { DashboardData, UserWithProfile } from "@shared/schema";
import { FEATURES } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { getPersonalizedGreeting, getGreetingSubtext } from "@/lib/greeting-utils";
import { RotatingStatsBar } from "@/components/rotating-stats-bar";
import { RotatingTip } from "@/components/rotating-tip";
import { FullscreenLoader } from "@/components/fullscreen-loader";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable Card Component
function SortableCard({ card, isCustomizing }: { card: any; isCustomizing: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative h-full ${isDragging ? 'z-50' : ''}`}
      data-testid={`sortable-card-${card.id}`}
    >
      {isCustomizing && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 z-10 p-1 bg-white rounded shadow-md cursor-move hover:bg-gray-50"
          data-testid={`drag-handle-${card.id}`}
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      )}
      <SectionCard {...card} />
    </div>
  );
}

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { isPaid, jobViewsRemaining, hasJobViewsLeft, canAccessFeature } = useSubscription();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [localCardOrder, setLocalCardOrder] = useState<string[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCompletedOnboardingThisSession, setHasCompletedOnboardingThisSession] = useState(false);
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    retry: false,
    enabled: isAuthenticated,
  });

  // Use on401: "returnNull" to handle unauthenticated state gracefully
  const { data: user } = useQuery<UserWithProfile>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    enabled: isAuthenticated,
  });

  // Fetch onboarding status
  const { data: onboardingStatus } = useQuery<{ hasCompletedOnboarding: boolean, hasCompletedPremiumOnboarding: boolean, subscriptionStatus: string }>({
    queryKey: ["/api/onboarding/status"],
    retry: false,
    enabled: isAuthenticated,
  });

  // Fetch dashboard card order
  const { data: cardOrder } = useQuery<string[]>({
    queryKey: ["/api/dashboard/card-order"],
    retry: false,
    enabled: isAuthenticated,
  });

  // Update card order mutation
  const updateCardOrder = useMutation({
    mutationFn: async (newOrder: string[]) => {
      const response = await apiRequest('PUT', '/api/dashboard/card-order', { cardOrder: newOrder });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/card-order"] });
      toast({
        title: "Dashboard Updated",
        description: "Your dashboard layout has been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save dashboard layout.",
        variant: "destructive",
      });
    }
  });

  // Initialize local card order when data loads
  useEffect(() => {
    if (cardOrder && cardOrder.length > 0) {
      setLocalCardOrder(cardOrder);
    }
  }, [cardOrder]);

  // Complete onboarding mutation
  const completeOnboardingMutation = useMutation({
    mutationFn: async (type: 'free' | 'premium') => {
      const response = await apiRequest('POST', '/api/onboarding/complete', { type });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/status"] });
      toast({
        title: "Welcome to HealthHire Portal!",
        description: "You're all set to accelerate your NHS career journey.",
      });
    },
  });

  // Check if user needs onboarding
  useEffect(() => {
    if (!onboardingStatus || !user) return;

    // If user has already seen onboarding this session, don't show it again
    if (hasCompletedOnboardingThisSession) return;

    // Check the appropriate onboarding flag based on user type
    const hasCompletedAppropriateOnboarding = isPaid
      ? onboardingStatus.hasCompletedPremiumOnboarding
      : onboardingStatus.hasCompletedOnboarding;

    // If user has already completed the appropriate onboarding, never show it again
    if (hasCompletedAppropriateOnboarding) {
      setShowOnboarding(false);
      return;
    }

    const needsOnboarding = isPaid
      ? !onboardingStatus.hasCompletedPremiumOnboarding
      : !onboardingStatus.hasCompletedOnboarding;

    if (needsOnboarding && !showOnboarding) {
      // Small delay to let dashboard load first
      setTimeout(() => {
        setShowOnboarding(true);
      }, 1000);
    }
  }, [onboardingStatus, user, isPaid, showOnboarding, hasCompletedOnboardingThisSession]);

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localCardOrder.indexOf(active.id as string);
      const newIndex = localCardOrder.indexOf(over.id as string);
      const newOrder = arrayMove(localCardOrder, oldIndex, newIndex);
      setLocalCardOrder(newOrder);
    }
  }

  // Save customization
  const saveCustomization = () => {
    updateCardOrder.mutate(localCardOrder);
    setIsCustomizing(false);
  };

  // Cancel customization
  const cancelCustomization = () => {
    setLocalCardOrder(cardOrder || []);
    setIsCustomizing(false);
  };

  if (isLoading || isDashboardLoading) {
    return <FullscreenLoader show={isLoading || isDashboardLoading} />;

  }

  const sectionCards = [
    {
      id: "profile",
      title: "Candidate Profile",
      description: "Build your comprehensive professional profile that powers your applications",
      icon: User,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100 dark:bg-blue-900",
      value: null,
      label: null,
      valueColor: "text-accent",
      actionText: "Complete your profile",
      actionSubtext: "Add your qualifications and experience",
      href: "/profile",
      isPremium: false,
      feature: null
    },
    {
      id: "jobs",
      title: "Job Finder",
      description: "Search for roles and find out which websites to use so you don't miss a role",
      icon: Search,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-100 dark:bg-emerald-900",
      value: null,
      label: null,
      valueColor: "text-secondary",
      actionText: isPaid ? "NHS healthcare roles available" : "Preview job matching features",
      actionSubtext: isPaid ? "Find your perfect NHS position" : "Upgrade to unlock full search",
      href: "/jobs",
      isPremium: true,
      feature: FEATURES.UNLIMITED_SEARCH
    },
    {
      id: "documents",
      title: "Application Documents",
      description: "Generate tailored Supporting Information, Cover Letters for NHS applications and view your master CV",
      icon: FileText,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-100 dark:bg-amber-900",
      value: null,
      label: null,
      valueColor: null,
      actionText: isPaid ? (dashboardData?.latestDocument ? `Latest: ${dashboardData.latestDocument.title}` : "No Supporting Information yet") : "Preview document generation",
      actionSubtext: isPaid ? (dashboardData?.latestDocument ? "Ready for job applications" : "Generate job-specific Supporting Information") : "Upgrade to unlock document generation",
      href: "/ai-documents",
      isPremium: true,
      feature: FEATURES.AI_GENERATION
    },
    {
      id: "resources",
      title: "Resources Hub",
      description: "NHS guides, walkthroughs and additional guidance for your career",
      icon: BookOpen,
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-100 dark:bg-indigo-900",
      value: null,
      label: null,
      valueColor: null,
      actionText: isPaid ? "Interview Success Guide" : "Preview resource library",
      actionSubtext: isPaid ? "Master NHS values-based interviews" : "Upgrade to download resources",
      href: "/resources",
      isPremium: true,
      feature: "resources_hub"
    },
    {
      id: "practice",
      title: "Interview Practice",
      description: "Get realistic interview questions with harsh but constructive timed feedback from Henry the Helper",
      icon: Mic,
      iconColor: "text-rose-600",
      iconBg: "bg-rose-100 dark:bg-rose-900",
      value: null,
      label: null,
      valueColor: "text-accent",
      actionText: isPaid ? "Practice with Henry" : "Preview interview practice",
      actionSubtext: isPaid ? "Get honest feedback to improve your skills" : "Upgrade to unlock interview practice",
      href: "/interview-practice",
      isPremium: true,
      feature: FEATURES.INTERVIEW_PRACTICE
    },
    {
      id: "qa",
      title: "Q&A Generator",
      description: "Role-specific interview questions with model answers (flashcard revision style)",
      icon: MessageCircleQuestion,
      iconColor: "text-cyan-600",
      iconBg: "bg-cyan-100 dark:bg-cyan-900",
      value: null,
      label: null,
      valueColor: null,
      actionText: isPaid ? "Generate practice questions" : "Preview question generation",
      actionSubtext: isPaid ? "Tailored to your target roles" : "Upgrade to generate custom Q&As",
      href: "/qa",
      isPremium: true,
      feature: FEATURES.QA_GENERATOR
    },
    {
      id: "tracker",
      title: "Job Tracker & Analytics",
      description: "Kanban board for applications with KPIs and clean dashboard",
      icon: BarChart3,
      iconColor: "text-violet-600",
      iconBg: "bg-violet-100 dark:bg-violet-900",
      value: null,
      label: null,
      valueColor: "text-primary",
      actionText: isPaid ? `${dashboardData?.successRate || 0}% success rate` : "Preview application tracking",
      actionSubtext: isPaid ? `${dashboardData?.interviewsThisWeek || 0} interviews scheduled` : "Upgrade to track applications",
      href: "/tracker",
      isPremium: true,
      feature: FEATURES.JOB_TRACKING
    },
    {
      id: "news",
      title: "News & Updates",
      description: "Latest NHS updates, policy changes, and platform announcements to keep you informed",
      icon: Newspaper,
      iconColor: "text-teal-600",
      iconBg: "bg-teal-100 dark:bg-teal-900",
      value: null,
      label: null,
      valueColor: null,
      actionText: "Latest: New NHS Pay Framework",
      actionSubtext: "Stay updated with important changes",
      href: "/news",
      isPremium: false,
      feature: null
    },
    {
      id: "support",
      title: "Support",
      description: "Get help from Henry the Helper, browse common issues, or talk to the team",
      icon: HelpCircle,
      iconColor: "text-teal-600",
      iconBg: "bg-teal-100 dark:bg-teal-900",
      value: null,
      label: null,
      valueColor: null,
      actionText: "Chat with Henry the Helper",
      actionSubtext: "Get instant answers to common questions",
      href: "/support",
      isPremium: false,
      feature: null
    },
    {
      id: "referrals",
      title: "Referral Program",
      description: "Earn exciting rewards by referring others to HealthHire Portal",
      icon: Users,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100 dark:bg-purple-900",
      value: null,
      label: null,
      valueColor: null,
      actionText: "Refer friends and earn rewards",
      actionSubtext: "",
      href: "/referrals",
      isPremium: true,
      feature: "referral_program"
    }
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-page">
      <Header
        user={user ? {
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          profileImageUrl: user.profileImageUrl || undefined,
          email: user.email || undefined,
          isAdmin: user.isAdmin || undefined,
          adminRole: user.adminRole || undefined
        } : undefined}
        profileCompletion={dashboardData?.profileCompletion || 0}
      />

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Enhanced Welcome Section */}
        <div className="relative mb-16">
          {/* Enhanced Background decoration with more dynamic elements */}
          <div className="absolute inset-0 -top-8 -bottom-8 opacity-40">
            <div className="absolute top-0 right-20 w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-0 left-20 w-24 h-24 bg-gradient-to-tr from-accent/15 to-primary/10 rounded-full blur-xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-to-bl from-secondary/10 to-accent/5 rounded-full blur-lg animate-pulse delay-500"></div>
            <div className="absolute bottom-1/3 left-1/4 w-20 h-20 bg-gradient-to-tl from-primary/5 to-secondary/15 rounded-full blur-xl animate-pulse delay-1500"></div>
          </div>

          <div className="relative bg-gradient-to-br from-card via-card/98 to-card/95 backdrop-blur-md border border-border/40 rounded-3xl p-10 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:scale-[1.02] group">
            {/* Animated border glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/20 via-transparent to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10 blur-xl"></div>

            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center shadow-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full animate-pulse shadow-md"></div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground via-primary/80 to-foreground bg-clip-text text-transparent mb-3 leading-tight" data-testid="text-greeting">
                  {getPersonalizedGreeting(user)}
                </h2>
                <p className="text-muted-foreground text-lg lg:text-xl leading-relaxed font-medium">
                  {getGreetingSubtext()}
                </p>
              </div>
            </div>

            {/* Enhanced accent elements */}
            <div className="absolute bottom-0 left-10 right-10 h-1 bg-gradient-to-r from-transparent via-primary/30 through-accent/20 to-transparent rounded-full"></div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-2 bg-gradient-to-r from-transparent via-primary/20 to-transparent rounded-full blur-sm"></div>
          </div>
        </div>

        {/* Free Tier Status Banner */}
        {!isPaid && (
          <UpgradePrompt
            title="Limited Access - Upgrade to Unlock All Features"
            description="Get unlimited job searching, AI document generation, interview practice, and more for £70 one-time"
            variant="banner"
            className="mb-8"
          />
        )}

        {/* Marketing Consent Widget */}
        <div className="mb-6">
          <MarketingConsentWidget />
        </div>

        {/* NHS Career Tips */}
        <RotatingTip />

        {/* Weekly Activity Stats Bar */}
        <RotatingStatsBar />

        {/* Enhanced Dashboard Customization Controls */}
        <div className="flex justify-between items-center mb-12">
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              </div>
              <h3 className="text-2xl font-bold text-foreground">Your Dashboard</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">Drag and drop cards to customize your layout</p>
          </div>
          <div className="flex gap-3">
            {!isCustomizing ? (
              <Button
                variant="outline"
                onClick={() => setIsCustomizing(true)}
                className="flex items-center gap-2 border-2 hover:border-primary/30 transition-all duration-300 shadow-lg hover:shadow-xl"
                data-testid="customize-dashboard-button"
              >
                <Settings className="h-4 w-4" />
                Customize Layout
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={cancelCustomization}
                  className="shadow-lg hover:shadow-xl transition-all duration-300"
                  data-testid="cancel-customization-button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveCustomization}
                  disabled={updateCardOrder.isPending}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
                  data-testid="save-customization-button"
                >
                  {updateCardOrder.isPending ? "Saving..." : "Save Layout"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 7 Core Section Cards Grid - Now Sortable */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localCardOrder}
            strategy={verticalListSortingStrategy}
          >
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 items-stretch transition-all duration-500 ${isCustomizing ? 'bg-gradient-to-br from-blue-50/80 via-primary/5 to-accent/5 dark:from-blue-900/20 dark:via-primary/10 dark:to-accent/10 p-8 rounded-3xl border-2 border-dashed border-blue-300/60 dark:border-blue-600/40 shadow-2xl backdrop-blur-sm' : ''}`} data-testid="section-cards-grid">
              {(localCardOrder.length > 0 ? localCardOrder : ["profile", "jobs", "documents", "resources", "practice", "qa", "tracker", "news", "referrals"]).map((cardId) => {
                const card = sectionCards.find(c => c.id === cardId);
                return card ? (
                  <SortableCard key={card.id} card={card} isCustomizing={isCustomizing} />
                ) : null;
              })}
            </div>
          </SortableContext>
        </DndContext>

        {/* Recent Activity */}
        <RecentActivity applications={dashboardData?.recentApplications || []} />
      </main>

      <Footer />

      {/* Analytics Consent Widget - shows randomly once per day */}
      <AnalyticsConsentWidget />

      {/* Henry Onboarding */}
      {showOnboarding && (
        <HenryOnboarding
          isPremium={isPaid}
          onComplete={() => {
            setShowOnboarding(false);
            setHasCompletedOnboardingThisSession(true);
            completeOnboardingMutation.mutate(isPaid ? 'premium' : 'free');
          }}
          onSkip={() => {
            setShowOnboarding(false);
            setHasCompletedOnboardingThisSession(true);
            completeOnboardingMutation.mutate(isPaid ? 'premium' : 'free');
          }}
        />
      )}
    </div>
  );
}
