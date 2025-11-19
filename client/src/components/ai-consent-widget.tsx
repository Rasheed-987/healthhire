import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Brain, Shield, AlertTriangle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AiConsentWidgetProps {
  onConsentGiven?: () => void;
  onDismiss?: () => void;
  isVisible?: boolean;
}

export function AiConsentWidget({ onConsentGiven, onDismiss, isVisible: externallyControlled }: AiConsentWidgetProps) {
  const [internalVisible, setInternalVisible] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Use external control if provided, otherwise use internal state
  const isVisible = externallyControlled !== undefined ? externallyControlled : internalVisible;

  // Get current consents
  const { data: consentsData } = useQuery({
    queryKey: ["/api/gdpr/consents"],
  });

  // Consent mutation
  const consentMutation = useMutation({
    mutationFn: async (given: boolean) => {
      return apiRequest("POST", "/api/gdpr/consent", {
        consent_type: "ai_processing",
        consent_given: given,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/gdpr/consents"] });
      setInternalVisible(false);
      toast({
        title: variables ? "AI Processing enabled! 🎉" : "AI Processing disabled",
        description: variables 
          ? "You can now use AI features for document generation, job matching, and career insights."
          : "AI features have been disabled. You can re-enable them in Privacy Settings anytime.",
      });
      if (variables && onConsentGiven) {
        onConsentGiven();
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update consent. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Check if AI consent has been given - widget visibility is controlled externally
  // This component will be shown/hidden by parent components when AI consent is needed

  // Don't show if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h4 className="font-semibold text-lg">AI Features Require Consent</h4>
                <Badge variant="secondary" className="text-xs mt-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Required for AI Use
                </Badge>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setInternalVisible(false);
                onDismiss?.();
              }}
              className="h-auto p-1 text-muted-foreground hover:text-foreground"
              data-testid="button-close-ai-consent"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            To use AI-powered features like document generation, job matching, and career insights, you must consent to AI processing of your data.
          </p>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
            <Shield className="h-3 w-3 text-green-500" />
            <span>AI is utilised for Henry the Helper to utilise this feature</span>
            <span className="text-muted-foreground/60">•</span>
            <Brain className="h-3 w-3 text-blue-500" />
            <span>Used only for AI features</span>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => consentMutation.mutate(true)}
              disabled={consentMutation.isPending}
              className="flex-1"
              data-testid="button-allow-ai"
            >
              <Brain className="h-4 w-4 mr-2" />
              {consentMutation.isPending ? "Enabling..." : "Enable AI Features"}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setInternalVisible(false);
                onDismiss?.();
              }}
              disabled={consentMutation.isPending}
              data-testid="button-not-now-ai"
            >
              Not Now
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-3 text-center">
            You can change this setting anytime in{" "}
            <button 
              onClick={() => window.location.href = "/privacy"}
              className="text-primary hover:underline"
            >
              Privacy Settings
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}