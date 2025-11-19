import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AiConsentWidget } from "@/components/ai-consent-widget";
import henryImage from "@assets/Henry Helper_1756820773886.png";

interface GeneratedSupportingInfo {
  supportingInfo: string;
  message: string;
  isDemo: boolean;
}

interface HenrySupportingInfoHelperProps {
  jobDescription: string;
  personSpecification: string;
  disabled?: boolean;
  onSupportingInfoGenerated: (content: string, isDemo: boolean) => void;
}

export function HenrySupportingInfoHelper({
  jobDescription,
  personSpecification,
  disabled = false,
  onSupportingInfoGenerated,
}: HenrySupportingInfoHelperProps) {
  const [generatedInfo, setGeneratedInfo] =
    useState<GeneratedSupportingInfo | null>(null);
  const [showAiConsent, setShowAiConsent] = useState(false);
  const { toast } = useToast();

  // Get current consents
  const { data: consentsData } = useQuery({
    queryKey: ["/api/gdpr/consents"],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        "/api/henry/generate-supporting-info",
        {
          jobDescription,
          personSpecification,
        }
      );
      return response.json();
    },
    onSuccess: (data: GeneratedSupportingInfo) => {
      setGeneratedInfo(data);
      toast({
        title: data.isDemo ? "Demo Mode" : "Supporting Information Generated!",
        description: data.message,
        variant: data.isDemo ? "default" : "default",
      });
    },
    onError: (error: any) => {
      console.error("Henry generation error:", error);

      let title = "Generation Failed";
      let message =
        "Something went wrong while generating supporting information.";

      try {
        const match = error.message?.match(/\{.*\}/s);
        if (match) {
          const errData = JSON.parse(match[0]);

          if (errData?.error === "Usage Restricted") {
            title = "Daily Limit Reached";
            message =
              "You’ve reached your daily AI usage limit. Please try again later today.";
          } else if (errData?.error === "Rate Limit") {
            title = "Too Many Requests";
            message =
              "You’re sending requests too quickly. Please wait a few seconds and try again.";
          } else if (errData?.message) {
            message = errData.message;
          }
        } else if (error.message?.includes("429")) {
          title = "Too Many Requests";
          message =
            "You’re sending requests too quickly. Please wait a moment and try again.";
        }
      } catch (e) {
        console.warn("Error parsing API error:", e);
      }

      toast({
        title,
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Job Description Required",
        description:
          "Please paste the job description first, then Henry can help generate your supporting information!",
        variant: "destructive",
      });
      return;
    }

    // Check for AI consent before proceeding
    const aiConsent = (consentsData as any)?.consents?.find(
      (c: any) => c.type === "ai_processing"
    );
    if (!aiConsent?.given) {
      setShowAiConsent(true);
      return;
    }

    generateMutation.mutate();
  };

  const handleConsentGiven = () => {
    setShowAiConsent(false);
    // Now proceed with generation
    generateMutation.mutate();
  };

  const handleAccept = () => {
    if (generatedInfo) {
      onSupportingInfoGenerated(
        generatedInfo.supportingInfo,
        generatedInfo.isDemo
      );
      setGeneratedInfo(null);
      toast({
        title: "Supporting Information Added!",
        description:
          "Henry's supporting information has been added to your application",
      });
    }
  };

  const handleRegenerate = () => {
    generateMutation.mutate();
  };

  return (
    <div className="space-y-4">
      {/* AI Consent Widget */}
      {showAiConsent && (
        <AiConsentWidget
          onConsentGiven={handleConsentGiven}
          onDismiss={() => setShowAiConsent(false)}
          isVisible={showAiConsent}
        />
      )}
      {/* Generate Button */}
      <Button
        type="button"
        onClick={handleGenerate}
        disabled={
          disabled || !jobDescription.trim() || generateMutation.isPending
        }
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        data-testid="button-henry-generate-supporting-info"
      >
        {generateMutation.isPending ? (
          <>
            <div className="animate-spin mr-2">⏳</div>
            Henry is working...
          </>
        ) : (
          <>
            <img
              src={henryImage}
              alt="Henry"
              className="h-5 w-5 mr-2 rounded-full"
            />
            Generate Supporting Information with Henry
          </>
        )}
      </Button>

      {/* Disclaimer - Always visible */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <div className="text-amber-600 mt-0.5">⚠️</div>
          <div className="text-sm text-amber-800">
            <strong>Important Disclaimer:</strong> This supporting information
            will be generated by Henry the Helper as inspiration for your NHS
            application. Henry doesn't claim responsibility for the content. We
            strongly advise you to not simply copy and paste this supporting
            information, but use it as inspiration and tailor it to your
            specific experience and the role requirements. Always review and
            personalize the content before submitting your application.
          </div>
        </div>
      </div>

      {/* Generated Supporting Information Display */}
      {generatedInfo && (
        <Card className="border-blue-200 bg-blue-50/50 animate-in slide-in-from-top-2 duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <img
                  src={henryImage}
                  alt="Henry the Helper"
                  className="h-6 w-6 rounded-full"
                />
                Henry the Helper generated this supporting information:
              </CardTitle>
              {generatedInfo.isDemo && (
                <Badge
                  variant="outline"
                  className="bg-yellow-100 text-yellow-800 border-yellow-300"
                >
                  Demo Mode
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Supporting Information Content */}
            <div className="bg-white rounded-lg p-4 border border-blue-200 max-h-96 overflow-y-auto">
              <Textarea
                value={generatedInfo.supportingInfo}
                readOnly
                className="min-h-[300px] border-0 p-0 text-sm leading-relaxed resize-none focus:ring-0"
                data-testid="textarea-generated-supporting-info"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleAccept}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                data-testid="button-accept-supporting-info"
              >
                Use This Supporting Information
              </Button>
              <Button
                onClick={handleRegenerate}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
                data-testid="button-regenerate-supporting-info"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
