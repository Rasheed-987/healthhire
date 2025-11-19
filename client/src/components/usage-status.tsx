import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Clock, 
  Calendar, 
  CalendarDays, 
  CalendarRange,
  Brain,
  FileText,
  MessageSquare,
  HelpCircle,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface UsageStats {
  usage: Array<{
    featureType: string;
    hourlyCount: number;
    dailyCount: number;
    weeklyCount: number;
    monthlyCount: number;
  }>;
  restrictions: Array<{
    featureType: string;
    restrictionType: string;
    reason: string;
    endTime: string | null;
    canAppeal: boolean;
  }>;
  limits: {
    [featureType: string]: {
      hourly: number;
      daily: number;
      weekly: number;
      monthly: number;
    };
  };
}

const FEATURE_ICONS = {
  interview_practice: Brain,
  qa_generator: MessageSquare,
  document_generation: FileText,
  henry_feedback: HelpCircle,
};

const FEATURE_NAMES = {
  interview_practice: "Interview Practice",
  qa_generator: "Q&A Generator",
  document_generation: "Document Generation",
  henry_feedback: "Henry Helper",
};

const PERIOD_ICONS = {
  hourly: Clock,
  daily: Calendar,
  weekly: CalendarDays,
  monthly: CalendarRange,
};

export function UsageStatus() {
  const { data: stats, isLoading, error } = useQuery<UsageStats>({
    queryKey: ["/api/usage/stats"],
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Usage Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading usage statistics...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Usage Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Unable to load usage statistics</div>
        </CardContent>
      </Card>
    );
  }

  const getUsageForFeature = (featureType: string) => {
    return stats.usage.find(u => u.featureType === featureType) || {
      featureType,
      hourlyCount: 0,
      dailyCount: 0,
      weeklyCount: 0,
      monthlyCount: 0,
    };
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-blue-500";
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 100) return <Badge variant="destructive">Limit Reached</Badge>;
    if (percentage >= 90) return <Badge variant="destructive">Almost Full</Badge>;
    if (percentage >= 75) return <Badge variant="secondary">High Usage</Badge>;
    return <Badge variant="default">Normal</Badge>;
  };

  const activeRestrictions = stats.restrictions.filter(r => 
    !r.endTime || new Date(r.endTime) > new Date()
  );

  const formatTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return "Restriction expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Usage Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Restrictions */}
        {activeRestrictions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-red-600 dark:text-red-400">Active Restrictions</h4>
            {activeRestrictions.map((restriction, index) => (
              <Alert key={index} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">
                      {FEATURE_NAMES[restriction.featureType as keyof typeof FEATURE_NAMES]} - Temporarily Limited
                    </div>
                    <div className="text-sm">{restriction.reason}</div>
                    {restriction.endTime && (
                      <div className="text-sm font-medium">
                        {formatTimeRemaining(restriction.endTime)}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Feature Usage */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Current Usage</h4>
          {Object.entries(FEATURE_NAMES).map(([featureType, featureName]) => {
            const usage = getUsageForFeature(featureType);
            const limits = stats.limits[featureType];
            const isRestricted = activeRestrictions.some(r => r.featureType === featureType);
            
            if (!limits) return null;
            
            const Icon = FEATURE_ICONS[featureType as keyof typeof FEATURE_ICONS];
            
            return (
              <div key={featureType} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{featureName}</span>
                  </div>
                  {isRestricted ? (
                    <Badge variant="destructive">Restricted</Badge>
                  ) : (
                    getStatusBadge((usage.dailyCount / limits.daily) * 100)
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    { key: 'daily', label: 'Today', icon: Calendar },
                    { key: 'weekly', label: 'This Week', icon: CalendarDays },
                  ].map(({ key, label, icon: PeriodIcon }) => {
                    const count = usage[`${key}Count` as keyof typeof usage] as number;
                    const limit = limits[key as keyof typeof limits];
                    const percentage = (count / limit) * 100;
                    
                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <PeriodIcon className="h-3 w-3" />
                            <span>{label}</span>
                          </div>
                          <span className={percentage >= 90 ? "text-red-500" : "text-muted-foreground"}>
                            {count}/{limit}
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(percentage, 100)} 
                          className="h-1.5"
                          indicatorClassName={getProgressColor(percentage)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Usage Guidelines */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Usage Guidelines</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>These limits ensure fair access for all users</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Limits reset automatically each period</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Contact support if you need higher limits</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}