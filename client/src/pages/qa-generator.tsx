import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { AiConsentWidget } from "@/components/ai-consent-widget";
import Header from "@/components/dashboard/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { FullscreenLoader } from "@/components/fullscreen-loader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircleQuestion,
  ArrowLeft,
  BookOpen,
  Clock,
  Target,
  TrendingUp,
  AlertCircle,
  Download,
  Edit2,
  Check,
  X,
} from "lucide-react";
import henryImage from "@assets/Henry Helper_1756820773886.png";
import { UpgradePrompt } from "@/components/ui/upgrade-prompt";
import { useLocation } from "wouter";

interface QaSession {
  id: string;
  jobTitle: string;
  sessionName: string | null;
  totalQuestions: number;
  createdAt: string;
  completedAt: string | null;
}

export default function QAGenerator() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { isPaid, canAccessFeature } = useSubscription();
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiConsent, setShowAiConsent] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionName, setEditingSessionName] = useState("");
  const queryClient = useQueryClient();

  const [, setLocation] = useLocation();

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

  // Fetch user's Q&A sessions
  const { data: sessions = [] } = useQuery<QaSession[]>({
    queryKey: ["/api/qa/sessions"],
    retry: false,
    enabled: isAuthenticated && isPaid,
  });
  console.log("Q&A Sessions fetched:", sessions);
  // Get current consents
  const { data: consentsData } = useQuery({
    queryKey: ["/api/gdpr/consents"],
  });

  // Generate Q&A session mutation
  const generateMutation = useMutation({
    mutationFn: async ({ jobTitle, jobDescription }: { jobTitle: string; jobDescription: string }) => {
      const response = await apiRequest("POST", "/api/qa/generate", {
        jobTitle,
        jobDescription,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/qa/sessions"] });
      toast({
        title: "Questions Generated!",
        description:
          "Your 25 practice questions are ready. Starting your flashcard session...",
      });
      // Navigate to the session
      window.location.href = `/qa/session/${data.session_id}`;
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      console.error("Error generating questions:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate questions. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update session name mutation
  const updateSessionNameMutation = useMutation({
    mutationFn: async ({ sessionId, sessionName }: { sessionId: string; sessionName: string }) => {
      const response = await apiRequest("PATCH", `/api/qa/session/${sessionId}/name`, {
        sessionName,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qa/sessions"] });
      toast({
        title: "Session Renamed",
        description: "Your session name has been updated successfully.",
      });
      setEditingSessionId(null);
      setEditingSessionName("");
    },
    onError: (error) => {
      console.error("Error updating session name:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update session name. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = async () => {
    if (!isPaid) {
      toast({
        title: "Premium Feature",
        description: "Q&A Generator requires a premium subscription.",
        variant: "destructive",
      });
      return;
    }

    if (jobTitle.trim().length < 3) {
      toast({
        title: "Job Title Required",
        description: "Please enter a job title (minimum 3 characters).",
        variant: "destructive",
      });
      return;
    }

    if (jobDescription.trim().length < 100) {
      toast({
        title: "More Details Needed",
        description:
          "Please provide a more detailed job description (minimum 100 characters).",
        variant: "destructive",
      });
      return;
    }

    // Check for AI consent before proceeding
    const aiConsent = consentsData?.consents?.find(
      (c: any) => c.type === "ai_processing"
    );
    if (!aiConsent?.given) {
      setShowAiConsent(true);
      return;
    }

    setIsGenerating(true);
    try {
      await generateMutation.mutateAsync({ jobTitle, jobDescription });
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
      await generateMutation.mutateAsync({ jobTitle, jobDescription });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = (sessionId: string, jobTitle: string) => {
    // Open download in new window - server will set proper headers
    window.open(`/api/qa/session/${sessionId}/download-pdf`, '_blank');
    
    toast({
      title: "Downloading Q&A Session",
      description: `Downloading your practice questions for ${jobTitle}`,
    });
  };

  const startEditingSessionName = (sessionId: string, currentName: string) => {
    setEditingSessionId(sessionId);
    setEditingSessionName(currentName);
  };

  const cancelEditingSessionName = () => {
    setEditingSessionId(null);
    setEditingSessionName("");
  };

  const saveSessionName = async (sessionId: string) => {
    if (editingSessionName.trim().length === 0) {
      toast({
        title: "Invalid Name",
        description: "Session name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    await updateSessionNameMutation.mutateAsync({ sessionId, sessionName: editingSessionName });
  };

  if (isLoading) {
    return <FullscreenLoader show={isLoading} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* AI Consent Widget */}
      {showAiConsent && (
        <AiConsentWidget
          onConsentGiven={handleConsentGiven}
          onDismiss={() => setShowAiConsent(false)}
          isVisible={showAiConsent}
        />
      )}
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back to Dashboard Button */}
        <Button
          variant="outline"
          onClick={() => setLocation("/")}
          className="mb-4"
          data-testid="button-back-dashboard"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-3 rounded-full">
              <img
                src={henryImage}
                alt="Henry the Helper"
                className="h-8 w-8 rounded-full"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Henry's Q&A Generator</h1>
          <p className="text-muted-foreground">
            Let Henry generate 25 tailored interview questions with model
            answers for any NHS role
          </p>
        </div>

        {/* Free Tier Limitation */}
        {!isPaid && (
          <UpgradePrompt
            title="Premium Feature - Q&A Generator"
            description="Generate unlimited job-specific flashcard questions with model answers. Upgrade to unlock this powerful interview preparation tool."
            variant="card"
            className="mb-8"
          />
        )}

        {/* Disclaimer */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-blue-800 text-sm">
              <strong>Disclaimer:</strong> We cannot predict the exact questions
              you'll be asked in your interview. However, these questions
              generated by Henry based on your job description will help you
              practice common healthcare interview themes and develop strong
              responses. Model answers may contain errors so be sure to do
              research on top.
            </div>
          </div>
        </div>

        {/* Main Generator */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                <img
                  src={henryImage}
                  alt="Henry the Helper"
                  className="w-6 h-6 rounded-full"
                />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Generate Your Practice Questions
                </CardTitle>
                <CardDescription>
                  Let Henry analyze your job description and create 25 tailored
                  interview questions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
          
            <div>
              <label className="block text-sm font-medium mb-2">
                Job Title *
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Staff Nurse, Healthcare Assistant, Practice Nurse..."
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={!isPaid}
                data-testid="input-job-title"
              />
              <div className="text-sm text-gray-600 mt-1">
                {jobTitle.length} characters (minimum 3 required)
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Job Description *
              </label>
              <textarea
                className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Paste the full job description here. Include key responsibilities, requirements, qualifications, and any specific skills mentioned. The more detailed the description, the better your tailored questions will be..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                disabled={!isPaid}
                data-testid="input-job-description"
              />
              <div className="text-sm text-gray-600 mt-1">
                {jobDescription.length} characters (minimum 100 required)
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={
                !isPaid || isGenerating || jobDescription.trim().length < 100
              }
              className="w-full"
              data-testid="button-generate-questions"
            >
              {isGenerating ? (
                <>
                  <div className="flex items-end gap-0.5 mr-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-0.5 bg-white rounded-full animate-pulse"
                        style={{
                          height: "12px",
                          animationDelay: `${i * 0.2}s`,
                          animationDuration: "0.8s",
                        }}
                      />
                    ))}
                  </div>
                  Generating 25 Questions...
                </>
              ) : (
                <>
                  <MessageCircleQuestion className="h-4 w-4 mr-2" />
                  Generate Q&A Flashcards
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Previous Sessions */}
        {isPaid && sessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Your Q&A Sessions
              </CardTitle>
              <CardDescription>
                Resume practicing with your previous flashcard sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessions.map((session:any) => (
                  <div
                    key={session.id}
                    className="group flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingSessionId === session.id ? (
                          <div className="flex items-center gap-2 mb-1">
                            <input
                              type="text"
                              value={editingSessionName}
                              onChange={(e) => setEditingSessionName(e.target.value)}
                              className="flex-1 px-2 py-1 text-lg font-semibold border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter session name"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveSessionName(session.id);
                                if (e.key === 'Escape') cancelEditingSessionName();
                              }}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => saveSessionName(session.id)}
                              className="h-7 w-7 p-0"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEditingSessionName}
                              className="h-7 w-7 p-0"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-semibold text-lg text-gray-900">
                              {session.sessionName || session.jobTitle}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditingSessionName(session.id, session.sessionName || session.jobTitle)}
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Rename session"
                            >
                              <Edit2 className="h-3 w-3 text-gray-500" />
                            </Button>
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MessageCircleQuestion className="h-3 w-3" />
                            {session.totalQuestions} questions
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(session.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-4">
                      {session.completedAt ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                          <Target className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-300 text-amber-700">
                          <Clock className="h-3 w-3 mr-1" />
                          In Progress
                        </Badge>
                      )}
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            (window.location.href = `/qa/session/${session.id}`)
                          }
                          data-testid={`button-resume-session-${session.id}`}
                          className="flex-1"
                        >
                          {session.completedAt ? "Review" : "Resume"}
                        </Button>
                        {session.completedAt && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadPDF(session.id, session.jobTitle)}
                            data-testid={`button-download-session-${session.id}`}
                            className="px-2"
                            title="Download as PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}
