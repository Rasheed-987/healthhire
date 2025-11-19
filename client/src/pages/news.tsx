import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FullscreenLoader } from "@/components/fullscreen-loader";
import {
  Newspaper,
  Calendar,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  TrendingUp,
  FileText,
  Users,
  ChevronUp,
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/header";
import { Footer } from "@/components/footer";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface NewsArticle {
  id: number;
  title: string;
  description: string;
  content: string;
  category: string;
  type: string;
  priority: string;
  readTime: string;
  read_time?: string;
  publishedAt: string;
  isPublished: boolean;
}

const categoryColors: Record<string, string> = {
  "Pay & Benefits": "bg-green-100 text-green-800",
  "Platform Update": "bg-blue-100 text-blue-800",
  "Immigration": "bg-purple-100 text-purple-800",
  "Recruitment": "bg-orange-100 text-orange-800",
  "Education": "bg-indigo-100 text-indigo-800",
};

const typeIcons: Record<string, any> = {
  policy: AlertCircle,
  feature: TrendingUp,
  opportunity: Users,
};

export default function NewsAndUpdates() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [expandedArticleId, setExpandedArticleId] = useState<number | null>(null);

  // Fetch news articles from API
  const { data: newsItems = [], isLoading: isLoadingNews } = useQuery<NewsArticle[]>({
    queryKey: ["news"],
    queryFn: async () => {
      const response = await fetch("/api/news");
      if (!response.ok) {
        throw new Error("Failed to fetch news articles");
      }
      return response.json();
    },
  });

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
      case "important":
        return "border-l-red-500";
      case "medium":
        return "border-l-yellow-500";
      case "low":
        return "border-l-green-500";
      default:
        return "border-l-gray-300";
    }
  };

  if (isLoading || !isAuthenticated || isLoadingNews) {
    return <FullscreenLoader show={isLoading || !isAuthenticated || isLoadingNews} />;
  }

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      data-testid="news-page"
    >
      {isAuthenticated ? (
        <DashboardHeader user={user} profileCompletion={0} />
      ) : (
        <PublicHeader />
      )}
      <main className="flex-grow max-w-4xl mx-auto px-6 lg:px-8 py-8 w-full">
        {/* Back to Dashboard Button */}
        {isAuthenticated && (
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              data-testid="button-back-to-dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Newspaper className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                News & Updates
              </h1>
              <p className="text-muted-foreground">
                Stay informed with the latest NHS policy changes, platform
                updates, and career opportunities.
              </p>
            </div>
          </div>
        </div>

        {/* News Feed */}
        <div className="space-y-6">
          {newsItems.map((item) => {
            const IconComponent = typeIcons[item.type] || FileText;
            const readTime = item.readTime || item.read_time || "5 min read";
            const isExpanded = expandedArticleId === item.id;

            return (
              <Card
                key={item.id}
                className={`border-l-4 ${getPriorityColor(
                  item.priority
                )} hover:shadow-md transition-all duration-300 ${isExpanded ? 'shadow-lg' : ''}`}
                data-testid={`news-item-${item.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className="h-4 w-4 text-primary" />
                        <Badge
                          variant="secondary"
                          className={
                            categoryColors[item.category] ||
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          {item.category}
                        </Badge>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {`${readTime} min read`}
                        </span>
                      </div>
                      <CardTitle
                        className="text-xl mb-2"
                        data-testid={`news-title-${item.id}`}
                      >
                        {item.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(item.publishedAt)}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t animate-in slide-in-from-top-2 duration-300">
                      <div className="prose prose-sm max-w-none">
                        <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                          {item.content}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="group"
                      onClick={() => setExpandedArticleId(isExpanded ? null : item.id)}
                      data-testid={`read-more-${item.id}`}
                    >
                      {isExpanded ? (
                        <>
                          Show Less
                          <ChevronUp className="h-4 w-4 ml-2 group-hover:-translate-y-1 transition-transform" />
                        </>
                      ) : (
                        <>
                          Read Full Article
                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>

                    {(item.priority?.toLowerCase() === "high" || item.priority?.toLowerCase() === "important") && (
                      <Badge variant="destructive" className="text-xs">
                        Important
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Load More Section */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg" data-testid="load-more-news">
            Load More Updates
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Stay updated with weekly newsletters and real-time notifications
          </p>
        </div>
      </main>

      {isAuthenticated ? <Footer /> : <PublicFooter />}
    </div>
  );
}
