import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  MapPin,
  Clock,
  Briefcase,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface NhsJob {
  id: string;
  title: string;
  employer: string;
  location: string;
  band: string;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  personSpec?: string;
  visaSponsorship: boolean;
  closingDate?: string;
  externalId?: string;
  contractType?: string;
  workingPattern?: string;
  externalUrl?: string;
}

export default function JobDetail() {
  const [, setLocation] = useLocation();
  const [jobId, setJobId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Extract job ID from URL path
    const path = window.location.pathname;
    const id = path.split("/jobs/")[1];
    setJobId(id);
  }, []);

  const {
    data: job,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/jobs", jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const response = await apiRequest("GET", `/api/jobs/${jobId}`);
      return response.json();
    },
    enabled: !!jobId,
    retry: false,
  });

  // Mutation to add job to tracker
  const addToTrackerMutation = useMutation({
    mutationFn: async (jobData: any) => {
      const response = await apiRequest("POST", "/api/applications", jobData);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Job Added to Tracker",
        description:
          "This job has been saved to your Application Tracker as a draft.",
      });
      // Invalidate applications query to refresh the tracker
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
    },
    onError: (error) => {
      console.error("Error adding job to tracker:", error);
      toast({
        title: "Error",
        description: "Failed to add job to tracker. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className="space-y-6">
            <Skeleton className="h-8 w-32" />
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
            <p className="text-gray-600 mb-6">
              {error
                ? "There was an error loading this job."
                : "The job you're looking for doesn't exist."}
            </p>
            <Button
              onClick={() => setLocation("/jobs")}
              data-testid="button-back-to-jobs"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Job Search
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleApplyForRole = () => {
    console.log("Applying for role:", job);
    try {
      const advertId = job.externalId || job.id;
      if (!advertId) {
        toast({
          title: "External Application Required",
          description:
            "Please check the employer's website or NHS Jobs directly for application details.",
        });
        return;
      }

      let url = job.externalUrl; // if already exists
      const source = job.source || job.employer || "";
      if (!url) {
        switch (source) {
          case "HealthJobsUK":
            url = `https://www.healthjobsuk.com/job/${advertId}`;
            break;
          case "NHS Jobs England":
            url = `https://www.jobs.nhs.uk/xi/vacancy/${advertId}`;
            break;
          case "NHS Scotland":
            url = `https://apply.jobs.scot.nhs.uk/Job/JobDetail?JobId=${advertId}`;
            break;
          default:
            // fallback for Database or unknown source
            url = null;
        }
      }

      if (url) {
        window.open(url, "_blank");
      } else {
        toast({
          title: "External Application Required",
          description:
            "Please check the employer's website or NHS Jobs directly for application details.",
        });
      }
    } catch (error) {
      console.error("Error handling application:", error);
      toast({
        title: "Error",
        description: "Failed to process application. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateSupporting = () => {
    // Open Application Documents page in new tab with job context and switch focus
    const documentsUrl = `/ai-documents?jobId=${jobId}`;
    const newTab = window.open(documentsUrl, "_blank");

    // Ensure the new tab gets focus
    if (newTab) {
      newTab.focus();
    }
  };

  const handleAddToTracker = () => {
    if (!job) return;

    const salaryDisplay =
      job.salaryMin && job.salaryMax
        ? `£${job.salaryMin.toLocaleString()} - £${job.salaryMax.toLocaleString()}`
        : job.salaryMin
        ? `From £${job.salaryMin.toLocaleString()}`
        : job.salaryMax
        ? `Up to £${job.salaryMax.toLocaleString()}`
        : "Competitive/Negotiable";

    addToTrackerMutation.mutate({
      jobTitle: job.title,
      employer: job.employer,
      location: job.location,
      salary: salaryDisplay,
      status: "draft",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/jobs")}
          className="mb-6"
          data-testid="button-back-to-jobs"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Job Search
        </Button>

        {/* Job Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1
                  className="text-2xl font-bold text-gray-900 mb-2"
                  data-testid="job-title"
                >
                  {job.title}
                </h1>
                <p
                  className="text-lg text-blue-600 font-medium mb-2"
                  data-testid="job-employer"
                >
                  {job.employer}
                </p>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span data-testid="job-location">{job.location}</span>
                </div>
              </div>
            </div>

            {/* Key Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* <div>
                <span className="text-sm text-gray-500 block">Band</span>
                <p className="font-semibold" data-testid="job-band">
                  {job.band}
                </p>
              </div> */}
              <div>
                <span className="text-sm text-gray-500 block">Salary</span>
                <p
                  className="font-semibold text-green-600"
                  data-testid="job-salary"
                >
                  {job.salaryMin && job.salaryMax
                    ? `£${job.salaryMin.toLocaleString()} - £${job.salaryMax.toLocaleString()} per annum`
                    : job.salaryMin
                    ? `From £${job.salaryMin.toLocaleString()} per annum`
                    : job.salaryMax
                    ? `Up to £${job.salaryMax.toLocaleString()} per annum`
                    : "Competitive/Negotiable"}
                </p>
              </div>
              {job.contractType && (
                <div>
                  <span className="text-sm text-gray-500 block">Contract</span>
                  <p className="font-semibold">{job.contractType}</p>
                </div>
              )}
              {job.closingDate && (
                <div>
                  <span className="text-sm text-gray-500 block">Closes</span>
                  <p
                    className="font-semibold text-red-600"
                    data-testid="job-closing-date"
                  >
                    {new Date(job.closingDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Tags */}
            {/* <div className="flex flex-wrap gap-2 mb-6">
              <Badge variant="secondary">{job.band}</Badge>
              {job.visaSponsorship && (
                <Badge className="bg-blue-100 text-blue-800">
                  Visa Sponsorship Available
                </Badge>
              )}
            </div> */}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleApplyForRole}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                data-testid="button-apply-for-role"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Apply for This Role
              </Button>
              <Button
                onClick={handleGenerateSupporting}
                variant="outline"
                className="font-semibold"
                data-testid="button-generate-supporting"
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Supporting Information
              </Button>
              <Button
                onClick={handleAddToTracker}
                variant="outline"
                className="font-semibold"
                data-testid="button-add-to-tracker"
                disabled={addToTrackerMutation.isPending}
              >
                <Bookmark className="h-4 w-4 mr-2" />
                {addToTrackerMutation.isPending
                  ? "Adding..."
                  : "Add to Job Tracker"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Essential Criteria Warning */}
        <Alert className="mb-6 border-red-200 bg-red-50">
          <CheckCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong className="font-semibold">Before You Apply:</strong> Make
            sure you meet ALL essential criteria in the person specification
            below. Applications missing essential requirements are automatically
            rejected by NHS panels.
          </AlertDescription>
        </Alert>

        {/* Job Description */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Job Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div
                dangerouslySetInnerHTML={{ __html: job.description }}
                className="whitespace-pre-wrap"
                data-testid="job-description"
              />
            </div>
          </CardContent>
        </Card>

        {/* Person Specification */}
        {job.personSpec && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">Person Specification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div
                  dangerouslySetInnerHTML={{ __html: job.personSpec }}
                  className="whitespace-pre-wrap"
                  data-testid="job-person-spec"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bottom Action Buttons */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 mb-4">
                Ready to Apply?
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleApplyForRole}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                  data-testid="button-apply-bottom"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Apply for This Role
                </Button>
                <Button
                  onClick={handleGenerateSupporting}
                  variant="outline"
                  className="font-semibold"
                  data-testid="button-generate-bottom"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Supporting Information
                </Button>
                <Button
                  onClick={handleAddToTracker}
                  variant="outline"
                  className="font-semibold"
                  data-testid="button-add-to-tracker-bottom"
                  disabled={addToTrackerMutation.isPending}
                >
                  <Bookmark className="h-4 w-4 mr-2" />
                  {addToTrackerMutation.isPending
                    ? "Adding..."
                    : "Add to Job Tracker"}
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                💡 Use Henry the Helper to generate tailored Supporting
                Information that matches this role's requirements
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
