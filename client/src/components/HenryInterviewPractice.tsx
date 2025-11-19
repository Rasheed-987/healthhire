import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { AiConsentWidget } from "@/components/ai-consent-widget";
import { MessageCircleQuestion, Sparkles, RotateCcw, Target, AlertTriangle, Clock, Timer, History, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import henryImage from "@assets/Henry Helper_1756820773886.png";

interface GeneratedQuestions {
  questions: string[];
  jobTitle: string;
  experienceLevel: string;
  message: string;
  isDemo?: boolean;
}

interface InterviewFeedback {
  feedback: string;
  jobTitle: string;
  question: string;
  userAnswer: string;
  message: string;
  isDemo?: boolean;
}

interface InterviewAttempt {
  id: string;
  question: string;
  answer: string;
  feedback: string;
  timeSpent: number | null;
  createdAt: string;
}

export function HenryInterviewPractice() {
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("mid");
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestions | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [showAiConsent, setShowAiConsent] = useState(false);
  
  // Timer states
  const [timerDuration, setTimerDuration] = useState(0); // Not selected yet
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerSelected, setTimerSelected] = useState(false);
  
  // History expansion state
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  const { toast } = useToast();

  // Function to extract score from feedback and get color scheme
  const parseScoreAndGetColors = (feedbackText: string) => {
    // Extract score using regex (looking for patterns like "8/10", "7/10", etc.)
    const scoreMatch = feedbackText.match(/(\d+)\/10/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
    
    if (score === null) {
      // Default red if no score found
      return {
        score: null,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        avatarBg: 'from-red-100 to-orange-100',
        iconColor: 'text-red-600',
        titleColor: 'text-red-900'
      };
    }

    if (score <= 3) {
      // Red - Needs Improvement
      return {
        score,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        avatarBg: 'from-red-100 to-orange-100',
        iconColor: 'text-red-600',
        titleColor: 'text-red-900'
      };
    } else if (score <= 6) {
      // Amber - Average Performance
      return {
        score,
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        avatarBg: 'from-amber-100 to-orange-100',
        iconColor: 'text-amber-600',
        titleColor: 'text-amber-900'
      };
    } else {
      // Green - Good Performance
      return {
        score,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        avatarBg: 'from-green-100 to-emerald-100',
        iconColor: 'text-green-600',
        titleColor: 'text-green-900'
      };
    }
  };

  // Function to remove score line from feedback text
  const cleanFeedbackText = (feedbackText: string) => {
    // Remove the "How you performed overall: X/10" line
    return feedbackText.replace(/How you performed overall:\s*\d+\/10[^\n]*\n*/, '').trim();
  };

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

  // Get interview history
  const { data: historyData, refetch: refetchHistory } = useQuery<{
    attempts: InterviewAttempt[];
    message: string;
  }>({
    queryKey: ["/api/henry/interview-history"],
    retry: false,
  });

  // Timer effect
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && timerActive) {
      // Auto-submit when timer runs out
      setTimerActive(false);
      handleGetFeedback();
      toast({
        title: "Time's Up!",
        description: "Your answer has been automatically submitted for feedback.",
        variant: "destructive",
      });
    }
  }, [timeLeft, timerActive]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle timer selection
  const selectTimerDuration = (duration: number) => {
    setTimerDuration(duration);
    setTimerSelected(true);
    setTimeLeft(duration);
    setTimerActive(true);
    toast({
      title: "Timer Started!",
      description: `You have ${formatTime(duration)} to complete your answer.`,
    });
  };

  const handleGenerateQuestions = async () => {
    if (!jobTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a job title first.",
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

    setIsGeneratingQuestions(true);
    try {
      const response = await apiRequest("POST", "/api/henry/generate-questions", {
        jobTitle: jobTitle.trim(),
        experienceLevel,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate questions");
      }

      const data = await response.json();
      setGeneratedQuestions(data);
      setSelectedQuestion(data.questions[0] || "");
      setUserAnswer("");
      setFeedback(null);
      // Reset timer state
      setTimerActive(false);
      setTimeLeft(0);
      setTimerSelected(false);
      setTimerDuration(0);

      toast({
        title: "Questions Generated!",
        description: `Henry created ${data.questions.length} interview questions for you.`,
      });

    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Henry couldn't generate questions right now.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleGetFeedback = async () => {
    if (!selectedQuestion.trim()) {
      toast({
        title: "Missing Question",
        description: "Please select a question first.",
        variant: "destructive",
      });
      return;
    }

    if (!userAnswer.trim()) {
      toast({
        title: "Missing Answer",
        description: "Please write your answer before getting feedback.",
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

    // Stop timer if active
    setTimerActive(false);
    setTimeLeft(0);

    setIsGeneratingFeedback(true);
    try {
      // Calculate time spent (if timer was used)
      const timeSpent = timerDuration > 0 ? timerDuration - timeLeft : null;
      
      const response = await apiRequest("POST", "/api/henry/interview-practice", {
        jobTitle: jobTitle.trim(),
        question: selectedQuestion.trim(),
        userAnswer: userAnswer.trim(),
        timeSpent: timeSpent,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to get feedback");
      }

      const data = await response.json();
      setFeedback(data);

      // Refresh interview history to show the new attempt
      refetchHistory();

      toast({
        title: "Feedback Ready!",
        description: "Henry has reviewed your answer with honest feedback.",
      });

    } catch (error: any) {
      toast({
        title: "Feedback Failed",
        description: error.message || "Henry couldn't provide feedback right now.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  const handleConsentGiven = () => {
    setShowAiConsent(false);
    toast({
      title: "AI Consent Given",
      description: "Thank you! Henry can now help with interview practice.",
    });
  };

  const handleConsentDeclined = () => {
    setShowAiConsent(false);
    toast({
      title: "AI Consent Declined",
      description: "You can still use the app, but AI features won't be available.",
      variant: "destructive",
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Toggle expansion for history items
  const toggleItemExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="space-y-6" data-testid="henry-interview-practice">
      {showAiConsent && (
        <AiConsentWidget
          onConsentGiven={handleConsentGiven}
          onConsentDeclined={handleConsentDeclined}
        />
      )}

      {/* Interview History Section */}
      {historyData && historyData.attempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Your Recent Interview Practice
            </CardTitle>
            <CardDescription>
              Your last {historyData.attempts.length} interview attempts with Henry's feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {historyData.attempts.map((attempt, index) => {
                const isExpanded = expandedItems.has(attempt.id);
                return (
                  <div key={attempt.id} className="border border-gray-200 rounded-lg transition-colors">
                    {/* Collapsed Header - Always Visible */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                      onClick={() => toggleItemExpansion(attempt.id)}
                      data-testid={`history-item-${index}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-700">
                          #{historyData.attempts.length - index}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {formatDate(attempt.createdAt)}
                        </div>
                        {attempt.timeSpent && (
                          <Badge variant="outline" className="text-xs">
                            {Math.floor(attempt.timeSpent / 60)}m {attempt.timeSpent % 60}s
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {isExpanded ? 'Collapse' : 'View Details'}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Summary line when collapsed */}
                    {!isExpanded && (
                      <div className="px-4 pb-4">
                        <p className="text-sm text-gray-600 italic">
                          {attempt.question.length > 100 
                            ? `${attempt.question.substring(0, 100)}...` 
                            : attempt.question}
                        </p>
                      </div>
                    )}
                    
                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">Question:</p>
                          <p className="text-sm bg-blue-50 p-3 rounded border-l-4 border-blue-200">
                            {attempt.question}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">Your Answer:</p>
                          <p className="text-sm bg-gray-50 p-3 rounded border-l-4 border-gray-200">
                            {attempt.answer}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">Henry's Feedback:</p>
                          <div className="bg-red-50 p-3 rounded border-l-4 border-red-200">
                            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
                              {attempt.feedback}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
            <img src={henryImage} alt="Henry" className="w-8 h-8 rounded-full" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageCircleQuestion className="w-5 h-5" />
              Henry's Interview Practice
            </CardTitle>
            <CardDescription>
              Get realistic NHS interview questions and harsh but constructive feedback to improve your performance
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Job Setup */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
              <h3 className="text-lg font-semibold">Interview Setup</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interview-job-title">Job Title</Label>
                <Input
                  id="interview-job-title"
                  placeholder="e.g., Registered Nurse, Healthcare Assistant"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  data-testid="input-interview-job-title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="experience-level">Experience Level</Label>
                <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                  <SelectTrigger data-testid="select-experience-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleGenerateQuestions}
              disabled={isGeneratingQuestions || !jobTitle.trim()}
              className="w-full md:w-auto"
              data-testid="button-generate-questions"
            >
              {isGeneratingQuestions ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Henry is creating questions...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Interview Questions
                </>
              )}
            </Button>
          </div>

          {/* Step 2: Questions & Practice */}
          {generatedQuestions && (
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                <h3 className="text-lg font-semibold">Practice Questions</h3>
                {generatedQuestions.isDemo && (
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    Demo Mode
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                <Label>Choose a question to practice:</Label>
                {generatedQuestions.questions.map((question, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedQuestion === question
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => {
                      setSelectedQuestion(question);
                      setUserAnswer("");
                      setFeedback(null);
                      // Reset timer state
                      setTimerActive(false);
                      setTimeLeft(0);
                      setTimerSelected(false);
                      setTimerDuration(0);
                    }}
                    data-testid={`question-option-${index}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium text-blue-600">Q{index + 1}:</span>
                      <p className="text-sm">{question}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* Step 3: Timer Selection */}
          {selectedQuestion && !timerSelected && (
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                <h3 className="text-lg font-semibold">How long would you like to answer this question?</h3>
              </div>

              <div className="space-y-4 p-6 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <Timer className="w-6 h-6 text-blue-600" />
                  <span className="font-medium text-blue-900">Choose your time limit</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => selectTimerDuration(120)}
                    className="h-20 flex flex-col gap-2 text-left"
                    variant="outline"
                    data-testid="button-select-2min"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      <span className="font-semibold">2 Minutes</span>
                    </div>
                    <span className="text-sm text-muted-foreground">I feel confident and want a challenge</span>
                  </Button>
                  
                  <Button
                    onClick={() => selectTimerDuration(240)}
                    className="h-20 flex flex-col gap-2 text-left"
                    variant="outline"
                    data-testid="button-select-4min"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      <span className="font-semibold">4 Minutes</span>
                    </div>
                    <span className="text-sm text-muted-foreground">I want more time to think through my answer</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Answer Input */}
          {selectedQuestion && timerSelected && (
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">4</div>
                <h3 className="text-lg font-semibold">Your Answer</h3>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Selected Question:</p>
                    <p className="text-sm">{selectedQuestion}</p>
                  </div>
                  {timerActive && (
                    <div className="flex items-center gap-2 text-lg font-mono">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <span className={`font-bold ${timeLeft <= 30 ? 'text-red-600' : timeLeft <= 60 ? 'text-orange-600' : 'text-green-600'}`}>
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                  )}
                </div>
                {timerActive && timeLeft <= 30 && (
                  <p className="text-sm text-red-600 animate-pulse mt-2">Hurry up! Time is running out!</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-answer">Write your answer (max 2000 characters):</Label>
                <Textarea
                  id="user-answer"
                  placeholder="Write your thoughtful answer. Henry will give you honest feedback..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="min-h-[120px]"
                  maxLength={2000}
                  data-testid="textarea-user-answer"
                />
                <p className="text-xs text-gray-500">{userAnswer.length}/2000 characters</p>
              </div>

              <Button 
                onClick={handleGetFeedback}
                disabled={isGeneratingFeedback || !userAnswer.trim()}
                className="w-full md:w-auto"
                data-testid="button-get-feedback"
              >
                {isGeneratingFeedback ? (
                  <>
                    <Target className="w-4 h-4 mr-2 animate-spin" />
                    Henry is reviewing your answer...
                  </>
                ) : (
                  <>
                    <img src={henryImage} alt="Henry" className="w-4 h-4 mr-2 rounded-full" />
                    Get Honest Feedback
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 5: Feedback */}
          
          {feedback && (
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">5</div>
                <h3 className="text-lg font-semibold">Henry's Honest Feedback</h3>
                {feedback.isDemo && (
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    Demo Mode
                  </Badge>
                )}
              </div>

              {(() => {
                const colors = parseScoreAndGetColors(feedback.feedback);
                const cleanedFeedback = cleanFeedbackText(feedback.feedback);

                return (
                  <div className={`${colors.bgColor} border ${colors.borderColor} rounded-lg p-6`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${colors.avatarBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <img src={henryImage} alt="Henry" className="w-6 h-6 rounded-full" />
                      </div>
                      <div className="flex-1">
                        {/* Score Display at Top */}
                        {colors.score !== null && (
                          <div className={`flex items-center gap-2 mb-4 p-3 bg-white rounded-lg border ${colors.borderColor}`}>
                            <div className={`w-8 h-8 ${colors.bgColor} rounded-full flex items-center justify-center`}>
                              <span className={`text-lg font-bold ${colors.titleColor}`}>
                                {colors.score}
                              </span>
                            </div>
                            <div>
                              <div className={`font-bold ${colors.titleColor}`}>
                                Your Score: {colors.score}/10
                              </div>
                              <div className={`text-sm ${colors.iconColor}`}>
                                {colors.score <= 3 
                                  ? "🔴 Needs Improvement" 
                                  : colors.score <= 6 
                                    ? "🟠 Average Performance" 
                                    : "🟢 Good Performance"
                                }
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className={`w-4 h-4 ${colors.iconColor}`} />
                          <span className={`font-semibold ${colors.titleColor}`}>Henry's Brutal but Helpful Review</span>
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 bg-white p-4 rounded border">
{cleanedFeedback}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => {
                    setUserAnswer("");
                    setFeedback(null);
                    // Reset timer state
                    setTimerActive(false);
                    setTimeLeft(0);
                    setTimerSelected(false);
                    setTimerDuration(0);
                  }}
                  variant="outline"
                  data-testid="button-try-again"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try This Question Again
                </Button>
                <Button 
                  onClick={() => {
                    setSelectedQuestion("");
                    setUserAnswer("");
                    setFeedback(null);
                    // Reset timer state
                    setTimerActive(false);
                    setTimeLeft(0);
                    setTimerSelected(false);
                    setTimerDuration(0);
                  }}
                  variant="outline"
                  data-testid="button-choose-different-question"
                >
                  Choose Different Question
                </Button>
                <Button 
                  onClick={() => {
                    setGeneratedQuestions(null);
                    setSelectedQuestion("");
                    setUserAnswer("");
                    setFeedback(null);
                    // Reset timer state
                    setTimerActive(false);
                    setTimeLeft(0);
                    setTimerSelected(false);
                    setTimerDuration(0);
                  }}
                  variant="outline"
                  data-testid="button-start-over"
                >
                  Start Over
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}