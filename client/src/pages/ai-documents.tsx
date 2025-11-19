import { useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  Sparkles,
  Target,
  Star,
  Clock,
  Eye,
  User,
  Crown,
  Lock,
  ArrowLeft,
  Edit,
  ClipboardList,
} from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { useToast } from "@/hooks/use-toast";
import { FullscreenLoader } from "@/components/fullscreen-loader";
import { HenrySupportingInfoHelper } from "@/components/HenrySupportingInfoHelper";
import { HenryCoverLetterHelper } from "@/components/HenryCoverLetterHelper";

interface GeneratedDocument {
  content: string;
  wordCount: number;
  tone: string;
  quality: {
    score: number;
    feedback: string[];
    nhsValuesAlignment: number;
  };
}

function ExperiencePreview() {
  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/auth/user");
      return res.json();
    },
  });

  const work: any[] = user?.profile?.workExperience || [];
  if (!Array.isArray(work) || work.length === 0) return null;

  // Normalize and classify jobs: isCurrent & parse start/end as ISO or fallback
  const jobs = work.map((exp) => {
    const startRaw = exp.startDate || exp.from || "";
    const endRaw = exp.endDate || exp.to || "";
    const normEnd =
      typeof endRaw === "string" ? endRaw.trim().toLowerCase() : "";
    const isCurrent =
      Boolean(exp.current) ||
      !endRaw ||
      normEnd === "present" ||
      normEnd === "current";
    // Try to get ISO dates for sorting, fallback to string
    const start =
      new Date(startRaw).toString() !== "Invalid Date"
        ? new Date(startRaw)
        : null;
    const end =
      endRaw && new Date(endRaw).toString() !== "Invalid Date"
        ? new Date(endRaw)
        : null;
    return {
      ...exp,
      isCurrent,
      start,
      end,
      rawStart: startRaw,
      rawEnd: endRaw,
    };
  });

  // Separate
  const currentJobs = jobs.filter((j) => j.isCurrent);
  const prevJobs = jobs.filter((j) => !j.isCurrent);

  // Sort current jobs: newest start first
  currentJobs.sort((a, b) => {
    if (a.start && b.start) return b.start - a.start;
    if (a.start) return -1;
    if (b.start) return 1;
    return 0;
  });
  // Sort previous jobs: by end date (desc), fallback to start date (desc)
  prevJobs.sort((a, b) => {
    if (a.end && b.end) return b.end - a.end;
    if (a.end) return -1;
    if (b.end) return 1;
    // fallback by start date
    if (a.start && b.start) return b.start - a.start;
    if (a.start) return -1;
    if (b.start) return 1;
    return 0;
  });

  const ordered = [...currentJobs, ...prevJobs];

  const formatDate = (d: any, raw: any) => {
    if (!d && raw) return raw;
    if (!d) return "";
    // Show as YYYY-MM or YYYY
    return d.getMonth
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      : d.getFullYear();
  };

  const formatRange = (exp: any) => {
    const start = formatDate(exp.start, exp.rawStart);
    if (exp.isCurrent) {
      return start
        ? `${start} - Present/currently working`
        : "Present/currently working";
    }
    const end = formatDate(exp.end, exp.rawEnd);
    if (start && end) return `${start} - ${end}`;
    if (start) return start;
    if (end) return end;
    return "";
  };

  return (
    <div className="bg-white p-4 rounded border">
      <div className="text-sm font-medium mb-2">Experience (ordered)</div>
      <div className="space-y-2 text-sm text-muted-foreground">
        {ordered.map((exp: any, idx: number) => {
          const title = exp.position || exp.jobTitle || exp.title || "Role";
          const org =
            exp.employer || exp.company || exp.organization || "Organization";
          const range = formatRange(exp);
          return (
            <p key={idx}>
              {title} at {org}
              {range ? ` (${range})` : ""}
            </p>
          );
        })}
      </div>
    </div>
  );
}

const SupportingInfoGenerator = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [personSpec, setPersonSpec] = useState("");
  const [generatedDoc, setGeneratedDoc] = useState<GeneratedDocument | null>(
    null
  );
  const { toast } = useToast();

  const handleSupportingInfoGenerated = (content: string, isDemo: boolean) => {
    // Create a document object to maintain compatibility with existing display
    const documentData: GeneratedDocument = {
      content: content,
      wordCount: content.split(" ").length,
      tone: "Generated by Henry",
      quality: {
        score: isDemo ? 85 : 95,
        feedback: isDemo
          ? ["This is demo content", "Review and personalize before use"]
          : ["Generated using your profile", "Tailored to role requirements"],
        nhsValuesAlignment: isDemo ? 85 : 95,
      },
    };
    setGeneratedDoc(documentData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-8 w-8 text-blue-600" />
            Supporting Information Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="job-description">Job Description *</Label>
            <Textarea
              id="job-description"
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="h-32"
              data-testid="textarea-job-description"
            />
          </div>

          <div>
            <Label htmlFor="person-spec">Person Specification (Optional)</Label>
            <Textarea
              id="person-spec"
              placeholder="Paste the person specification to tailor your response..."
              value={personSpec}
              onChange={(e) => setPersonSpec(e.target.value)}
              className="h-24"
              data-testid="textarea-person-spec"
            />
          </div>

          {/* Henry the Helper - Supporting Information Generator */}
          <HenrySupportingInfoHelper
            jobDescription={jobDescription}
            personSpecification={personSpec}
            onSupportingInfoGenerated={handleSupportingInfoGenerated}
          />
        </CardContent>
      </Card>

      {generatedDoc && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Generated Supporting Information
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {generatedDoc.wordCount} words
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  {generatedDoc.quality.score}% quality
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Ordered Work Experience Preview (current first, then reverse chronological) */}
            <ExperiencePreview />

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  NHS Values Alignment:{" "}
                  {generatedDoc.quality.nhsValuesAlignment}%
                </span>
              </div>
              {generatedDoc.quality.feedback.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  <div className="font-medium mb-1">Feedback:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {generatedDoc.quality.feedback.map((feedback, index) => (
                      <li key={index}>{feedback}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-normal bg-white p-4 rounded border">
                {generatedDoc.content}
              </pre>
            </div>

            <Button
              onClick={() => {
                navigator.clipboard.writeText(generatedDoc.content);
                toast({
                  title: "Copied!",
                  description: "Supporting information copied to clipboard",
                });
              }}
              variant="outline"
              className="w-full"
              data-testid="button-copy-supporting-info"
            >
              <Download className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default function DocumentGeneration() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isPaid, canAccessFeature } = useSubscription();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <FullscreenLoader show={isLoading} />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to access document generation
          </p>
          <Button onClick={() => (window.location.href = "/login")}>
            Sign In
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const canAccessGeneration = canAccessFeature("ai_generation");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Application Documents</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {isPaid
              ? "Generate tailored Supporting Information for NHS applications and manage your master CV"
              : "Preview document generation features and view your basic CV"}
          </p>
        </div>

        {/* Document Strategy Tips */}
        <Card className="mb-8 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Target className="h-5 w-5" />
              Essential Document Strategy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900">
                      CV = Career Snapshot
                    </h4>
                    <p className="text-sm text-blue-700">
                      Your CV is not meant to be "special" - just accurate,
                      clean, and easy to scan. Keep it professional and
                      straightforward.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-purple-900">
                      Supporting Information = The Magic
                    </h4>
                    <p className="text-sm text-purple-700">
                      This is where you shine! Tailor this document to the job's
                      person specification every single time. This is what gets
                      you the interview.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/60 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-amber-900">
                      One CV, Many Applications
                    </h4>
                    <p className="text-sm text-amber-700 mb-2">
                      Your CV can stay broadly the same across applications.
                      Only update it when applying for very different roles.
                    </p>
                    <p className="text-sm font-medium text-amber-800">
                      Your Supporting Information{" "}
                      <strong>must change per role</strong> - this is
                      non-negotiable for success.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* CV Preview Section - Always visible */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                📄 Your CV {!isPaid && "(Preview)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isPaid ? (
                <>
                  <p className="text-muted-foreground mb-4">
                    View and download your complete professional CV based on
                    your profile.
                  </p>
                  <div className="space-y-2">
                    <Button
                      onClick={() => setLocation("/cv-viewer")}
                      className="w-full"
                      data-testid="button-view-cv"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View My CV
                    </Button>
                    <Button
                      onClick={() => {
                        // Trigger CV PDF download
                        window.open("/api/cv/download-pdf", "_blank");
                      }}
                      variant="outline"
                      className="w-full"
                      data-testid="button-download-cv"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground mb-4">
                    Preview your CV - upgrade to unlock full access and PDF
                    download.
                  </p>

                  {/* CV Preview for Free Users */}
                  <div className="cv-preview-container mb-4">
                    <div className="cv-preview-visible bg-gray-50 p-4 rounded-lg border">
                      <h4 className="font-semibold text-lg">
                        {(user as any)?.firstName || ""}{" "}
                        {(user as any)?.lastName || ""}
                      </h4>
                      <p className="text-gray-600">
                        {(user as any)?.email || "your.email@example.com"} |
                        Your Phone | Your Location
                      </p>
                      <h5 className="font-medium mt-3 mb-2">
                        Professional Summary
                      </h5>
                      <p className="text-gray-700">
                        I am a dedicated healthcare professional with extensive
                        experience in NHS settings, committed to delivering
                        exceptional patient care while upholding the highest
                        standards of clinical practice...
                      </p>
                    </div>

                    {/* Blurred/Locked Content */}
                    <div className="cv-preview-locked relative mt-4">
                      <div className="blurred-content bg-gray-100 p-4 rounded-lg filter blur-sm">
                        <div className="space-y-3">
                          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                          <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                        </div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/90 p-3 rounded-lg border shadow-lg">
                          <Button
                            onClick={() => setLocation("/pricing")}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white"
                            data-testid="button-unlock-cv"
                          >
                            <Lock className="h-4 w-4 mr-2" />
                            Unlock Full CV - £70
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Your Master CV Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-600" />
                Your Master CV
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {isPaid
                  ? "View and download your up-to-date CV based on your profile information."
                  : "Basic CV preview available. Upgrade for full access and PDF download."}
              </p>
              <Button
                onClick={() => setLocation("/profile")}
                className="w-full"
                variant="outline"
                data-testid="button-update-cv"
              >
                <Edit className="h-4 w-4 mr-2" />
                {isPaid ? "Update My CV" : "Update Profile"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                {isPaid
                  ? "Updates automatically when you modify your profile"
                  : "Upgrade to unlock automatic updates and PDF download"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Supporting Information Generator */}
        {canAccessGeneration ? (
          <div className="space-y-8">
            <SupportingInfoGenerator />

            {/* Cover Letter Generator */}
            <HenryCoverLetterHelper />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />✨ Supporting
                Information Generator {!isPaid && "(Premium)"}
                {!isPaid && <Crown className="h-4 w-4 text-yellow-600 ml-2" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Professional 900-1200 word responses tailored to NHS person
                specifications with values alignment.
              </p>

              {/* Preview Interface - Disabled */}
              <div className="space-y-4 bg-muted/10 border-muted">
                <div>
                  <Label>Job Description *</Label>
                  <Textarea
                    disabled
                    placeholder="Paste the full job description here..."
                    value="I am writing to express my strong interest in the Staff Nurse position at your NHS Trust. With my extensive clinical experience and deep commitment to NHS values..."
                    className="h-32"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Writing Tone</Label>
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Professional" />
                      </SelectTrigger>
                    </Select>
                  </div>
                  <div>
                    <Label>Target Length</Label>
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="1000 words" />
                      </SelectTrigger>
                    </Select>
                  </div>
                </div>

                <Button disabled className="w-full">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Supporting Information
                </Button>
              </div>

              {/* Upgrade Prompt */}
              <div className="mt-6">
                <UpgradePrompt feature="Document Generation" />
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
