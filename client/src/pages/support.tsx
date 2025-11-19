import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import DashboardHeader from "@/components/dashboard/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HelpCircle,
  MessageCircle,
  FileText,
  User as UserIcon,
  Search,
  CreditCard,
  Mail,
  ExternalLink,
  ChevronRight,
  Clock,
  Shield,
  CheckCircle,
  X,
  ArrowLeft,
  Settings,
  Lock,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { HenryChat } from "@/components/henry-chat";
import henryAvatar from "@assets/Green Simple Woman Doctor Avatar_1757189713820.png";
import { useAuth } from "@/hooks/useAuth";
import { FullscreenLoader } from "@/components/fullscreen-loader";
import { useLocation } from "wouter";
import type { SupportArticle, User } from "@shared/schema";

interface ArticleProps {
  id: string;
  icon: string; // Icon name that matches schema
  iconComponent: React.ReactNode; // For rendering
  title: string;
  description: string;
  content: string[];
  category: "general" | "account" | "technical" | "billing";
  isPublished: boolean;
}

// Icon mapping for dynamic icons based on category and icon name
const getIconComponent = (iconName: string): React.ReactNode => {
  switch (iconName) {
    case "profile":
      return <UserIcon className="h-5 w-5" />;
    case "search":
      return <Search className="h-5 w-5" />;
    case "documents":
      return <FileText className="h-5 w-5" />;
    case "payments":
      return <CreditCard className="h-5 w-5" />;
    case "account":
      return <MessageCircle className="h-5 w-5" />;
    case "troubleshooting":
      return <Shield className="h-5 w-5" />;
    case "privacy":
      return <Lock className="h-5 w-5" />;
    default:
      return <HelpCircle className="h-5 w-5" />;
  }
};

export default function Support() {
  const [selectedArticle, setSelectedArticle] = useState<ArticleProps | null>(
    null
  );
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch support articles from API
  const { data: supportArticles = [], isLoading: articlesLoading, error: articlesError } = useQuery({
    queryKey: ["/api/support"],
    queryFn: async (): Promise<SupportArticle[]> => {
      const response = await fetch("/api/support");
      if (!response.ok) {
        throw new Error("Failed to fetch support articles");
      }
      return response.json();
    },
  });

  // Transform API data to ArticleProps format
  const transformedArticles: ArticleProps[] = useMemo(() => {
    return supportArticles
      .filter((article) => article.isPublished) // Only show published articles
      .map((article) => ({
        id: article.id,
        icon: article.icon,
        iconComponent: getIconComponent(article.icon),
        title: article.title,
        description: article.description,
        content: (() => {
          // Handle both array and JSON string content
          if (Array.isArray(article.content)) {
            return article.content;
          }
          try {
            const parsed = JSON.parse(article.content as string);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })(),
        category: article.category as "general" | "account" | "technical" | "billing",
        isPublished: Boolean(article.isPublished),
      }));
  }, [supportArticles]);

  const categories = [
    { id: "all", label: "All Articles", count: transformedArticles.length },
    {
      id: "general",
      label: "General",
      count: transformedArticles.filter((a) => a.category === "general").length,
    },
    {
      id: "account",
      label: "Account",
      count: transformedArticles.filter((a) => a.category === "account").length,
    },
    {
      id: "technical",
      label: "Technical",
      count: transformedArticles.filter((a) => a.category === "technical").length,
    },
    {
      id: "billing",
      label: "Billing",
      count: transformedArticles.filter((a) => a.category === "billing").length,
    },
  ];

  const filteredArticles =
    activeCategory === "all"
      ? transformedArticles
      : transformedArticles.filter(
          (article) => article.category === activeCategory
        );

  if (isLoading || articlesLoading) {
    return <FullscreenLoader show={true} />;
  }

  // Show error state if articles failed to load
  if (articlesError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {isAuthenticated && user ? (
          <DashboardHeader 
            user={{
              firstName: (user as User).firstName || undefined,
              lastName: (user as User).lastName || undefined,
              profileImageUrl: (user as User).profileImageUrl || undefined,
            }} 
            profileCompletion={0} 
          />
        ) : (
          <PublicHeader />
        )}
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-8">
              <h2 className="text-xl font-semibold mb-2">Unable to load support articles</h2>
              <p className="text-muted-foreground mb-4">Please try refreshing the page or contact support.</p>
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {isAuthenticated && user ? (
        <DashboardHeader 
          user={{
            firstName: (user as User).firstName || undefined,
            lastName: (user as User).lastName || undefined,
            profileImageUrl: (user as User).profileImageUrl || undefined,
          }} 
          profileCompletion={0} 
        />
      ) : (
        <PublicHeader />
      )}

      <main className="container mx-auto px-4 py-8">
        {/* Back to Dashboard Button */}
        {user && isAuthenticated ? (
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              data-testid="button-back-dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        ) : null}

        {/* Privacy Settings Access */}
        {user && isAuthenticated && !(user as User)?.isAdmin ? (
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 mb-8">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Privacy Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage your privacy preferences and data rights
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => (window.location.href = "/privacy")}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  data-testid="button-privacy-settings"
                >
                  Access Settings
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Hero Section with Henry */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            How Can We Help You?
          </h1>

          {/* Henry with Speech Bubble */}
          <div className="flex flex-col items-center max-w-4xl mx-auto mb-8">
            <div className="relative">
              {/* Speech Bubble */}
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-2xl p-6 mb-4 max-w-2xl mx-auto relative">
                <p className="text-blue-800 dark:text-blue-200 text-lg leading-relaxed">
                  👋{" "}
                  <strong>Hi there! I'm Henry, your NHS career helper.</strong>
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-base mt-3">
                  Check out the articles below - they answer common questions
                  for instant help! If you can't find what you need, scroll down
                  to email our support team directly.
                </p>

                {/* Speech bubble arrow */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                  <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[12px] border-l-transparent border-r-transparent border-t-blue-200 dark:border-t-blue-700"></div>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-[1px]">
                    <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-blue-50 dark:border-t-blue-900/30"></div>
                  </div>
                </div>
              </div>

              {/* Henry Avatar */}
              <div className="flex justify-center">
                <img
                  src={henryAvatar}
                  alt="Henry the Helper"
                  className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Article Categories */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category.id)}
              data-testid={`filter-${category.id}`}
            >
              {category.label}
              <Badge variant="secondary" className="ml-2 text-xs">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredArticles.map((article, index) => (
            <Card
              key={index}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedArticle(article)}
              data-testid={`article-${article.title
                .toLowerCase()
                .replace(/\s+/g, "-")}`}
            >
              <CardHeader>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    {article.iconComponent}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base mb-2 line-clamp-2">
                      {article.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                      {article.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs capitalize">
                    {article.category}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Still Need Help Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardContent className="text-center py-8">
            <h3 className="text-xl font-semibold mb-4">Still need help?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              Can't find what you're looking for? Our support team is here to
              help with any questions or issues.
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              You can reach us at:
              <br />
              <strong>hello@healthhireportal.com</strong>
            </p>
            <Button
              onClick={() =>
                window.open(
                  "mailto:hello@healthhireportal.com?subject=Support Request - HealthHire Portal"
                )
              }
              data-testid="button-email-support-bottom"
            >
              <Mail className="h-4 w-4 mr-2" />
              Email Support Team
          
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Article Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  {selectedArticle.iconComponent}
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {selectedArticle.title}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs capitalize mt-1">
                    {selectedArticle.category}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedArticle(null)}
                data-testid="button-close-article"
              >
                ×
              </Button>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {selectedArticle.description}
              </p>
              <div className="space-y-3">
                {selectedArticle.content.map((step, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">
                      {index + 1}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Still need help?</strong> Contact our support team at
                  hello@healthhireportal.com for personalized assistance!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isAuthenticated ? <Footer /> : <PublicFooter />}
    </div>
  );
}
