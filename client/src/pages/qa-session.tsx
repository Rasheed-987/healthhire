import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/header";
import { PublicHeader } from "@/components/public-header";
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
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Meh,
  Target,
  Trophy,
  AlertCircle,
  CheckCircle,
  Download,
} from "lucide-react";
import henryImage from "@assets/Henry Helper_1756820773886.png";

interface QaQuestion {
  id: string;
  questionText: string;
  modelAnswer: string;
  category: string;
  questionOrder: number;
}

interface QaSession {
  id: string;
  jobTitle: string;
  jobDescription: string;
  totalQuestions: number;
  createdAt: string;
  completedAt: string | null;
}

interface QaProgress {
  id: string;
  questionId: string;
  confidenceLevel: number;
  attempts: number;
}

interface SessionData {
  session: QaSession;
  questions: QaQuestion[];
  progress: QaProgress[];
}

export default function QASession() {
  const { sessionId } = useParams();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionStats, setSessionStats] = useState<any>(null);
  const [totalAnswered, setTotalAnswered] = useState(0);

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

  // Fetch session data
  const { data: sessionData, isLoading: isSessionLoading } =
    useQuery<SessionData>({
      queryKey: [`/api/qa/session/${sessionId}`],
      retry: false,
      enabled: isAuthenticated && !!sessionId,
    });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({
      questionId,
      confidenceLevel,
    }: {
      questionId: string;
      confidenceLevel: number;
    }) => {
      const response = await apiRequest("POST", "/api/qa/progress", {
        session_id: sessionId,
        question_id: questionId,
        confidence_level: confidenceLevel,
      });
      return response.json();
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
      console.error("Error updating progress:", error);
      toast({
        title: "Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Complete session mutation
  const completeSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        `/api/qa/session/${sessionId}/complete`
      );
      return response.json();
    },
    onSuccess: (data) => {
      setSessionStats(data.summary);
      setIsCompleted(true);
      toast({
        title: "Session Completed!",
        description: "Great job! You've completed all your flashcards.",
      });
    },
  });

  const currentQuestion = sessionData?.questions[currentQuestionIndex];
  const totalQuestions = sessionData?.questions.length || 0;
  const progressPercent =
    totalQuestions > 0
      ? ((currentQuestionIndex + 1) / totalQuestions) * 100
      : 0;

  const inReviewPhase = totalAnswered >= 25 && reviewQueue.length > 0;

  // 🧩 Updated handleConfidenceLevel logic
  const handleConfidenceLevel = async (level: number) => {
    if (!currentQuestion) return;
    if (isCompleted) return;

    try {
      await updateProgressMutation.mutateAsync({
        questionId: currentQuestion.id,
        confidenceLevel: level,
      });

      setTotalAnswered((prev) => prev + 1);

      // ✅ CONFIDENT: stop immediately and show summary

      // ❌ NOT CONFIDENT: add to review queue
      if (level === 1 || level === 2) {
        setReviewQueue((prev) => [...prev, currentQuestionIndex]);
      }

      // ✅ If total answered < 25 → go to next main question
      if (totalAnswered + 1 < 25) {
        nextQuestion();
      } else {
        // 🚀 If 25 reached → start reviewing from queue
        if (reviewQueue.length > 0) {
          const nextReviewIndex = reviewQueue[0];
          setCurrentQuestionIndex(nextReviewIndex);
          setReviewQueue((prev) => prev.slice(1));
        } else {
          completeSessionMutation.mutate();
        }
      }
    } catch (error) {
      // handled already by mutation onError
    }
  };

  // 🧩 Updated nextQuestion logic
  const nextQuestion = () => {
    setShowAnswer(false);

    if (currentQuestionIndex < totalQuestions - 1) {
      // normal progression
      setCurrentQuestionIndex((prev) => prev + 1);
    } else if (reviewQueue.length > 0) {
      // switch to review queue
      const nextReviewIndex = reviewQueue[0];
      setCurrentQuestionIndex(nextReviewIndex);
      setReviewQueue((prev) => prev.slice(1));
    } else {
      // done with everything
      completeSessionMutation.mutate();
    }
  };

  const restartSession = () => {
    setCurrentQuestionIndex(0);
    setShowAnswer(false);
    setReviewQueue([]);
    setIsCompleted(false);
    setSessionStats(null);
  };

  // Download the completed Q&A session (server returns print-ready HTML)
  const handleDownloadPDF = () => {
    if (!sessionId) return;
    window.open(`/api/qa/session/${sessionId}/download-pdf`, "_blank");
  };

  if (isLoading || isSessionLoading) {
    return <FullscreenLoader show={isLoading || isSessionLoading} />;
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PublicHeader />
        <div className="container mx-auto px-4 py-12 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Session Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The Q&A session you're looking for doesn't exist or you don't
                have access to it.
              </p>
              <Button onClick={() => (window.location.href = "/qa")}>
                Back to Q&A Generator
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Completion View
  if (isCompleted && sessionStats) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="mb-4"
            data-testid="button-back-dashboard"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center items-center gap-4 mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Trophy className="h-12 w-12 text-green-600" />
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                  <img
                    src={henryImage}
                    alt="Henry the Helper"
                    className="w-10 h-10 rounded-full"
                  />
                </div>
              </div>
              <CardTitle className="text-2xl">Q&A Session Completed!</CardTitle>
              <CardDescription>
                Great job practicing with {sessionData.session.jobTitle}. Henry
                is proud of your progress!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {sessionStats.final_mastery.confident}
                  </div>
                  <div className="text-sm text-gray-600">Confident</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {sessionStats.final_mastery.somewhat_confident}
                  </div>
                  <div className="text-sm text-gray-600">
                    Somewhat Confident
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {sessionStats.final_mastery.not_confident}
                  </div>
                  <div className="text-sm text-gray-600">
                    Need More Practice
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Total attempts: {sessionStats.total_attempts} • Questions:{" "}
                  {sessionStats.total_questions}
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={restartSession} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Practice Again
                  </Button>
                  <Button onClick={handleDownloadPDF} variant="default">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button onClick={() => (window.location.href = "/qa")}>
                    Generate New Questions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Main Flashcard Interface
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="outline"
          onClick={() => (window.location.href = "/qa")}
          className="mb-4"
          data-testid="button-back-qa"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Q&A Generator
        </Button>

        {/* Progress Header */}
        <div className="mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="h-5 w-5 text-primary" />
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {sessionData.session.jobTitle}
                  </h1>
                </div>
                <div className="text-sm text-gray-600 line-clamp-2 max-w-3xl">
                  {sessionData.session.jobDescription}
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                  <div className="text-gray-500 text-xs mb-1">Progress</div>
                  <div className="font-semibold text-gray-900">
                    {currentQuestionIndex + 1} / {totalQuestions}
                  </div>
                </div>
                {reviewQueue.length > 0 && (
                  <div className="bg-orange-50 px-4 py-2 rounded-lg border border-orange-200">
                    <div className="text-orange-600 text-xs mb-1">To Review</div>
                    <div className="font-semibold text-orange-700">
                      {reviewQueue.length}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Session Progress</span>
                <span className="font-medium">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="w-full h-2" />
            </div>
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-6 min-h-[500px]">
          <CardContent className="p-8 flex flex-col justify-center">
            <div className="text-center space-y-6">
              <Badge variant="outline" className="mb-4">
                {currentQuestion?.category}
              </Badge>

              <h2 className="text-xl font-medium leading-relaxed">
                {currentQuestion?.questionText}
              </h2>

              {!showAnswer ? (
                <Button
                  onClick={() => setShowAnswer(true)}
                  className="mt-8"
                  size="lg"
                  data-testid="button-show-answer"
                >
                  Show Model Answer
                </Button>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg text-left">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                        <img
                          src={henryImage}
                          alt="Henry the Helper"
                          className="w-4 h-4 rounded-full"
                        />
                      </div>
                      <h3 className="font-medium text-gray-800">
                        Henry's Model Answer:
                      </h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {currentQuestion?.modelAnswer}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 text-center">
                      How confident do you feel about answering this question?
                    </p>
                    <div className="flex justify-center gap-4">
                      <Button
                        onClick={() => handleConfidenceLevel(1)}
                        variant="outline"
                        className="flex flex-col items-center hover:text-black py-4 px-6 h-auto border-red-200 hover:bg-red-50"
                        disabled={
                          updateProgressMutation.isPending || isCompleted
                        }
                        data-testid="button-not-confident"
                      >
                        <ThumbsDown className="h-6 w-6 text-red-500 mb-2" />
                        <span className="text-sm ">Not Confident</span>
                        <span className="text-xs text-gray-500">
                          Need more practice
                        </span>
                      </Button>
                      <Button
                        onClick={() => handleConfidenceLevel(2)}
                        variant="outline"
                        className="flex flex-col hover:text-black items-center py-4 px-6 h-auto border-yellow-200 hover:bg-yellow-50"
                        disabled={
                          updateProgressMutation.isPending || isCompleted
                        }
                        data-testid="button-somewhat-confident"
                      >
                        <Meh className="h-6 w-6 text-yellow-500 mb-2" />
                        <span className="text-sm">Somewhat Confident</span>
                        <span className="text-xs text-gray-500">
                          Could use improvement
                        </span>
                      </Button>
                      <Button
                        onClick={() => handleConfidenceLevel(3)}
                        variant="outline"
                        className="flex flex-col hover:text-black items-center py-4 px-6 h-auto border-green-200 hover:bg-green-50"
                        disabled={
                          updateProgressMutation.isPending || isCompleted
                        }
                        data-testid="button-confident"
                      >
                        <ThumbsUp className="h-6 w-6 text-green-500 mb-2" />
                        <span className="text-sm">Confident</span>
                        <span className="text-xs text-gray-500">
                          Ready for interview
                        </span>
                      </Button>
                    </div>
                    {totalAnswered > 25 && !inReviewPhase && (
                      <p className="text-sm text-red-600 text-center mt-3">
                        You’ve reached the maximum of 25 questions for this
                        session.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Session Info */}
        <div className="text-center text-sm text-gray-600">
          <p>Use this flashcard system to master your interview preparation</p>
          <p>
            Questions marked as "Not Confident" will be repeated until you feel
            ready
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
