import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { AiConsentWidget } from "@/components/ai-consent-widget";
import { FileText } from "lucide-react";
import henryImage from "@assets/Henry Helper_1756820773886.png";

interface GeneratedCoverLetter {
  coverLetter: string;
  message: string;
  isDemo?: boolean;
}

export function HenryCoverLetterHelper() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [roleName, setRoleName] = useState("");
  const [generatedLetter, setGeneratedLetter] = useState<GeneratedCoverLetter | null>(null);
  const [showAiConsent, setShowAiConsent] = useState(false);
  const { toast } = useToast();

  // Get current consents
  const { data: consentsData } = useQuery<{
    consents: Array<{
      type: string;
      given: boolean;
      date: string;
      legalBasis?: string;
      version?: string;
    }>;
  }>({
    queryKey: ["/api/gdpr/consents"],
  });

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide the job description.",
        variant: "destructive",
      });
      return;
    }

    // Check for AI consent before proceeding
    const aiConsent = consentsData?.consents?.find((c: any) => c.type === 'ai_processing');
    if (!aiConsent?.given) {
      setShowAiConsent(true);
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/henry/generate-cover-letter", {
        jobDescription: jobDescription.trim(),
        companyName: companyName.trim() || undefined,
        roleName: roleName.trim() || undefined,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate cover letter");
      }

      const data = await response.json();
      setGeneratedLetter(data);
      
      toast({
        title: "Cover Letter Generated!",
        description: data.message,
      });
    } catch (error) {
      console.error("Error generating cover letter:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate cover letter",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConsentGiven = () => {
    setShowAiConsent(false);
    // Now proceed with generation
    handleGenerateAfterConsent();
  };

  const handleGenerateAfterConsent = async () => {
    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/henry/generate-cover-letter", {
        jobDescription: jobDescription.trim(),
        companyName: companyName.trim() || undefined,
        roleName: roleName.trim() || undefined,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate cover letter");
      }

      const data = await response.json();
      setGeneratedLetter(data);
      
      toast({
        title: "Cover Letter Generated!",
        description: data.message,
      });
    } catch (error) {
      console.error("Error generating cover letter:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate cover letter",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (generatedLetter) {
      await navigator.clipboard.writeText(generatedLetter.coverLetter);
      toast({
        title: "Copied!",
        description: "Cover letter copied to clipboard",
      });
    }
  };

  const handleGenerateNew = () => {
    handleGenerate();
  };

  return (
    <div className="space-y-6">
      {/* AI Consent Widget */}
      {showAiConsent && (
        <AiConsentWidget 
          onConsentGiven={handleConsentGiven}
          onDismiss={() => setShowAiConsent(false)}
          isVisible={showAiConsent}
        />
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            Cover Letter Generator
            <Badge variant="secondary" className="ml-auto">Private Sector</Badge>
          </CardTitle>
          <CardDescription>
            Perfect for private sector healthcare roles that don't require supporting information. 
            Henry will create a medium-length cover letter highlighting your healthcare background.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name (Optional)</Label>
              <Input
                id="company-name"
                placeholder="e.g., Bupa Healthcare"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                data-testid="input-company-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-name">Role Title (Optional)</Label>
              <Input
                id="role-name"
                placeholder="e.g., Senior Staff Nurse"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                data-testid="input-role-name"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="job-description">Job Description *</Label>
            <Textarea
              id="job-description"
              placeholder="Paste the job description for the private healthcare role..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={8}
              className="min-h-[200px]"
              data-testid="textarea-job-description"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !jobDescription.trim()}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-generate-cover-letter"
            >
              <img 
                src={henryImage} 
                alt="Henry" 
                className="w-4 h-4 mr-2 rounded-full object-cover"
              />
              {isGenerating ? "Henry is writing..." : "Ask Henry to Write Cover Letter"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedLetter && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Your Cover Letter
              {generatedLetter.isDemo && (
                <Badge variant="outline">Demo Mode</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {generatedLetter.message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-gray-200 font-sans">
                  {generatedLetter.coverLetter}
                </pre>
              </div>
              
              
              <div className="flex gap-2">
                <Button 
                  onClick={copyToClipboard}
                  variant="outline"
                  data-testid="button-copy-cover-letter"
                >
                  Copy to Clipboard
                </Button>
                <Button 
                  onClick={handleGenerateNew}
                  variant="outline"
                  data-testid="button-generate-new"
                  disabled={isGenerating}
                >
                  <img 
                    src={henryImage} 
                    alt="Henry" 
                    className="w-4 h-4 mr-2 rounded-full object-cover"
                  />
                  {isGenerating ? "Henry is writing..." : "Generate New"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}