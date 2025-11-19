import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Stethoscope,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AiConsentWidget } from "@/components/ai-consent-widget";
import henryImage from "@assets/Henry Helper_1756820773886.png";

interface HenryHelperProps {
  jobTitle: string;
  onAcceptDuties: (duties: string[]) => void;
  disabled?: boolean;
}

interface GeneratedDuties {
  duties: string[];
  jobTitle: string;
  message: string;
  isDemo?: boolean;
}

export function HenryHelper({
  jobTitle,
  onAcceptDuties,
  disabled,
}: HenryHelperProps) {
  const [generatedDuties, setGeneratedDuties] =
    useState<GeneratedDuties | null>(null);
  const [showAiConsent, setShowAiConsent] = useState(false);
  const { toast } = useToast();

  // Get current consents
  const { data: consentsData } = useQuery({
    queryKey: ["/api/gdpr/consents"],
  });

  const generateMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await apiRequest("POST", "/api/henry/generate-duties", {
        jobTitle: title,
      });
      return response.json();
    },
    onSuccess: (data: GeneratedDuties) => {
      setGeneratedDuties(data);
      toast({
        title: "Henry Generated Job Duties!",
        description: `Created ${data.duties.length} duties for ${data.jobTitle}`,
      });
    },
    onError: async (error: any) => {
      console.error("HenryHelper mutation error:", error);

      let errorMessage = "Henry is taking a break. Please try again later.";
      let errorTitle = "Henry Had a Problem";

      try {
        // Check if it's a structured API error with JSON inside the message
        if (typeof error.message === "string" && error.message.includes("{")) {
          const match = error.message.match(/\{.*\}/s); // extract JSON part
          if (match) {
            const parsed = JSON.parse(match[0]);
            errorTitle = parsed.error || errorTitle;
            errorMessage = parsed.message || errorMessage;

            // Optionally show extra info (e.g. next_steps)
            if (parsed.details?.reason) {
              errorMessage += ` (${parsed.details.reason})`;
            }
          }
        }
      } catch (e) {
        console.warn("Failed to parse error message:", e);
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!jobTitle.trim()) {
      toast({
        title: "Job Title Required",
        description:
          "Please enter a job title first, then Henry can help generate duties!",
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

    generateMutation.mutate(jobTitle);
  };

  const handleConsentGiven = () => {
    setShowAiConsent(false);
    // Now proceed with generation
    generateMutation.mutate(jobTitle);
  };

  const handleAccept = () => {
    if (generatedDuties) {
      onAcceptDuties(generatedDuties.duties);
      setGeneratedDuties(null);
      toast({
        title: "Duties Added!",
        description:
          "Henry's suggestions have been added to your work experience",
      });
    }
  };

  const handleRegenerate = () => {
    generateMutation.mutate(jobTitle);
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
        disabled={disabled || !jobTitle.trim() || generateMutation.isPending}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        data-testid="button-henry-generate"
      >
        {generateMutation.isPending ? (
          <>
            {/* Show loading spinner */}
            <div className="animate-spin mr-2 ">⏳</div>
            Henry is working...
          </>
        ) : (
          <>
            <img
              src={henryImage}
              alt="Henry"
              className="h-5 w-5 mr-2 rounded-full"
            />
            Generate Job Duties with Henry
          </>
        )}
      </Button>

      {/* Results Display */}
      {generatedDuties && (
        <Card className="border-blue-200 bg-blue-50/50 animate-in slide-in-from-top-2 duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <img
                  src={henryImage}
                  alt="Henry the Helper"
                  className="h-6 w-6 rounded-full"
                />
                Henry the Helper generated these job duties:
              </CardTitle>
              {generatedDuties.isDemo && (
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
            {/* Generated Duties List */}
            <div className="space-y-3">
              {generatedDuties.duties.map((duty, index) => (
                <div
                  key={index}
                  className="bg-white p-3 rounded-lg border-l-4 border-blue-500 shadow-sm"
                  data-testid={`henry-duty-${index}`}
                >
                  <div className="flex gap-3">
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 font-semibold"
                    >
                      {index + 1}
                    </Badge>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {duty}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <strong className="text-yellow-800">Disclaimer:</strong>{" "}
                  <span className="text-yellow-700">
                    {generatedDuties.isDemo
                      ? "These are sample duties from Henry's knowledge base. Real AI generation is temporarily unavailable. Please adjust as needed for your specific role."
                      : "Henry can make mistakes! Please double-check this information and adjust as needed for your specific role."}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleAccept}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                data-testid="button-henry-accept"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Use These Duties
              </Button>
              <Button
                type="button"
                onClick={handleRegenerate}
                variant="outline"
                className="flex-1 border-gray-300 hover:bg-green-700"
                disabled={generateMutation.isPending}
                data-testid="button-henry-regenerate"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Generate New Ones
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
