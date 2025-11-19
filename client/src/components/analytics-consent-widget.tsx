import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, BarChart3, TrendingUp, Eye } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function AnalyticsConsentWidget() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current consents
  const { data: consentsData } = useQuery({
    queryKey: ["/api/gdpr/consents"],
  });

  // Consent mutation
  const consentMutation = useMutation({
    mutationFn: async (given: boolean) => {
      return apiRequest("POST", "/api/gdpr/consent", {
        consent_type: "analytics",
        consent_given: given,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/gdpr/consents"] });
      setIsVisible(false);
      toast({
        title: variables ? "Analytics enabled! 📊" : "Analytics disabled",
        description: variables 
          ? "We'll now track your usage to improve your experience and provide better insights."
          : "Analytics tracking has been disabled. You can re-enable it in Privacy Settings anytime.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update consent. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Check if analytics consent has been given and show widget randomly once per day
  useEffect(() => {
    if (consentsData?.consents && !isDismissed) {
      const analyticsConsent = consentsData.consents.find((c: any) => c.type === 'analytics');
      const hasAnalyticsConsent = analyticsConsent?.given;
      
      if (!hasAnalyticsConsent) {
        // Check if we've shown this today
        const lastShown = localStorage.getItem('analytics-widget-shown');
        const today = new Date().toDateString();
        
        if (lastShown !== today) {
          // Show randomly (30% chance) once per day
          const shouldShow = Math.random() < 0.3;
          if (shouldShow) {
            setIsVisible(true);
            localStorage.setItem('analytics-widget-shown', today);
          }
        }
      }
    }
  }, [consentsData, isDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
  };

  // Don't show if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 shadow-lg z-40">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Improve Your Experience</h4>
              <Badge variant="secondary" className="text-xs">
                <Eye className="h-3 w-3 mr-1" />
                Optional
              </Badge>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-auto p-1 text-muted-foreground hover:text-foreground"
            data-testid="button-close-analytics-consent"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          Help us improve your NHS career journey by allowing analytics and performance tracking.
        </p>
        
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
          <TrendingUp className="h-3 w-3 text-green-500" />
          <span>Better insights</span>
          <span className="text-muted-foreground/60">•</span>
          <BarChart3 className="h-3 w-3 text-blue-500" />
          <span>Improved features</span>
        </div>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => consentMutation.mutate(true)}
            disabled={consentMutation.isPending}
            className="flex-1 text-xs"
            data-testid="button-allow-analytics"
          >
            Enable Tracking
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            disabled={consentMutation.isPending}
            className="text-xs"
            data-testid="button-no-thanks-analytics"
          >
            No Thanks
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}