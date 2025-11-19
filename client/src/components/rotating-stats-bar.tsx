import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Search,
  Send,
  Target,
  Clock,
  CheckCircle,
  BarChart3,
} from "lucide-react";

interface WeeklyStats {
  applicationsThisWeek: number;
  applicationsLastWeek: number;
  jobSearchesThisWeek: number;
  jobSearchesLastWeek: number;
  interviewsThisWeek: number;
  interviewsLastWeek: number;
  documentsCreatedThisWeek: number;
  documentsCreatedLastWeek: number;
  practiceSessionsThisWeek: number;
  practiceSessionsLastWeek: number;
}

interface StatItem {
  id: string;
  text: string;
  value: number;
  previousValue: number;
  icon: React.ElementType;
  color: string;
  changeType: "increase" | "decrease" | "same";
}

export function RotatingStatsBar() {
  const [currentStatIndex, setCurrentStatIndex] = useState(0);

  // Fetch weekly stats - refetch when applications change
  const { data: stats } = useQuery<WeeklyStats>({
    queryKey: ["/api/user/weekly-stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Generate stat items from API data
  const statItems: StatItem[] = [
    {
      id: "applications",
      text:
        stats?.applicationsThisWeek === 1
          ? "application sent this week"
          : "applications sent this week",
      value: stats?.applicationsThisWeek || 0,
      previousValue: stats?.applicationsLastWeek || 0,
      icon: Send,
      color: "text-primary",
      changeType: getChangeType(
        stats?.applicationsThisWeek || 0,
        stats?.applicationsLastWeek || 0
      ),
    },
    {
      id: "job_searches",
      text:
        stats?.jobSearchesThisWeek === 1
          ? "job searched this week"
          : "jobs searched this week",
      value: stats?.jobSearchesThisWeek || 0,
      previousValue: stats?.jobSearchesLastWeek || 0,
      icon: Search,
      color: "text-secondary",
      changeType: getChangeType(
        stats?.jobSearchesThisWeek || 0,
        stats?.jobSearchesLastWeek || 0
      ),
    },
    {
      id: "interviews",
      text:
        stats?.interviewsThisWeek === 1
          ? "interview scheduled this week"
          : "interviews scheduled this week",
      value: stats?.interviewsThisWeek || 0,
      previousValue: stats?.interviewsLastWeek || 0,
      icon: Calendar,
      color: "text-accent",
      changeType: getChangeType(
        stats?.interviewsThisWeek || 0,
        stats?.interviewsLastWeek || 0
      ),
    },
    {
      id: "documents",
      text:
        stats?.documentsCreatedThisWeek === 1
          ? "document created this week"
          : "documents created this week",
      value: stats?.documentsCreatedThisWeek || 0,
      previousValue: stats?.documentsCreatedLastWeek || 0,
      icon: Target,
      color: "text-primary",
      changeType: getChangeType(
        stats?.documentsCreatedThisWeek || 0,
        stats?.documentsCreatedLastWeek || 0
      ),
    },
    {
      id: "practice",
      text:
        stats?.practiceSessionsThisWeek === 1
          ? "practice session this week"
          : "practice sessions this week",
      value: stats?.practiceSessionsThisWeek || 0,
      previousValue: stats?.practiceSessionsLastWeek || 0,
      icon: CheckCircle,
      color: "text-secondary",
      changeType: getChangeType(
        stats?.practiceSessionsThisWeek || 0,
        stats?.practiceSessionsLastWeek || 0
      ),
    },
  ];

  // Filter out stats with zero values for a cleaner display
  const activeStats = statItems.filter(
    (stat) => stat.value > 0 || stat.previousValue > 0
  );

  // Rotate through stats every 3 seconds - always call this hook
  useEffect(() => {
    if (activeStats.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentStatIndex((prev) => (prev + 1) % activeStats.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeStats.length]);

  // If no activity, show encouraging message
  if (activeStats.length === 0) {
    return (
      <div
        className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 p-4 rounded-lg mb-6"
        data-testid="stats-bar-empty"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">
              Start your job search journey - your weekly stats will appear
              here!
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = "/tracker")}
            className="flex items-center gap-1"
            data-testid="button-go-to-tracker"
          >
            <BarChart3 className="h-3 w-3" />
            Go to Tracker
          </Button>
        </div>
      </div>
    );
  }

  const currentStat = activeStats[currentStatIndex];

  if (!currentStat) return null;

  const Icon = currentStat.icon;
  const hasChange = currentStat.previousValue !== currentStat.value;
  const changeAmount = Math.abs(currentStat.value - currentStat.previousValue);

  return (
    <div
      className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 
       rounded-lg mb-3 transition-all duration-500"
      data-testid="rotating-stats-bar"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`py-2 rounded-full bg-background/50 ${currentStat.color}`}
          >
            <Icon className="h-4 w-4" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{currentStat.value}</span>
            <span className="text-sm text-muted-foreground">
              {currentStat.text}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasChange && (
            <div className="flex items-center gap-1">
              {currentStat.changeType === "increase" && (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <Badge
                    variant="secondary"
                    className="text-xs bg-green-100 text-green-700"
                  >
                    +{changeAmount} vs last week
                  </Badge>
                </>
              )}
              {currentStat.changeType === "decrease" && (
                <>
                  <TrendingDown className="h-3 w-3 text-orange-500" />
                  <Badge
                    variant="secondary"
                    className="text-xs bg-orange-100 text-orange-700"
                  >
                    -{changeAmount} vs last week
                  </Badge>
                </>
              )}
              {currentStat.changeType === "same" &&
                currentStat.previousValue > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Same as last week
                  </Badge>
                )}
            </div>
          )}

          <div className="flex items-center gap-2">
            {activeStats.length > 1 && (
              <div className="flex gap-1">
                {activeStats.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentStatIndex ? "bg-primary" : "bg-muted"
                    }`}
                    data-testid={`stat-indicator-${index}`}
                  />
                ))}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = "/tracker")}
              className="flex items-center gap-1"
              data-testid="button-view-tracker"
            >
              <BarChart3 className="h-3 w-3" />
              View Tracker
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getChangeType(
  current: number,
  previous: number
): "increase" | "decrease" | "same" {
  if (current > previous) return "increase";
  if (current < previous) return "decrease";
  return "same";
}
