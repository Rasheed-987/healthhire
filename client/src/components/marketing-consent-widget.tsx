import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Mail, Bell, CheckCircle, Gift } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface ConsentType {
  type: string;
  given: boolean;
  date: string;
  legalBasis: string;
  version: string;
}

export function MarketingConsentWidget() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Fetch current consents
  const { data: consentsData } = useQuery<{ consents: ConsentType[] }>({
    queryKey: ["/api/gdpr/consents"],
  });

  // Update consent mutation
  const updateConsentMutation = useMutation({
    mutationFn: async (consentGiven: boolean) => {
      return apiRequest("POST", "/api/gdpr/consent", {
        consent_type: "marketing",
        consent_given: consentGiven,
        legal_basis: "consent",
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/gdpr/consents"] });
      setIsVisible(false);
      toast({
        title: variables
          ? "Marketing notifications enabled! 🎉"
          : "Marketing notifications disabled",
        description: variables
          ? "You'll now receive career insights, platform updates, and expert advice for your NHS career journey."
          : "You can re-enable marketing notifications in Privacy Settings anytime.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description:
          "Failed to update notification preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Check if marketing consent has been given
  useEffect(() => {
    if (consentsData?.consents) {
      const marketingConsent = consentsData.consents.find(
        (c) => c.type === "marketing"
      );
      const hasMarketingConsent = marketingConsent?.given;

      // Show widget if no marketing consent and not dismissed
      if (!hasMarketingConsent && !isDismissed) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }
  }, [consentsData, isDismissed]);

  // Don't show if dismissed or already consented
  if (!isVisible) {
    return null;
  }

  const handleAccept = () => {
    updateConsentMutation.mutate(true);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  const handleDecline = () => {
    updateConsentMutation.mutate(false);
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                <Gift className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm">
                  Get career insights and expert advice
                </h4>
                <Badge variant="secondary" className="text-xs">
                  Optional
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Receive career insights, platform updates, and expert advice to
                accelerate your NHS career journey.
              </p>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Career insights</span>
                <span className="text-muted-foreground/60">•</span>
                <Bell className="h-3 w-3 text-blue-500" />
                <span>Platform updates</span>
                <span className="text-muted-foreground/60">•</span>
                <Mail className="h-3 w-3 text-orange-500" />
                <span>Expert advice and tips</span>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            data-testid="dismiss-marketing-widget"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-blue-200/50 dark:border-blue-800/50">
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={updateConsentMutation.isPending}
            className="text-xs h-7 bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="accept-marketing-consent"
          >
            {updateConsentMutation.isPending
              ? "Enabling..."
              : "Yes, keep me updated"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDecline}
            disabled={updateConsentMutation.isPending}
            className="text-xs h-7 text-muted-foreground hover:text-foreground"
            data-testid="decline-marketing-consent"
          >
            No thanks
          </Button>

          <div className="flex-1" />

          <div className="text-xs text-muted-foreground">
            <Link
              href="/privacy"
              className="underline hover:no-underline"
              data-testid="privacy-settings-link"
            >
              Privacy settings
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
