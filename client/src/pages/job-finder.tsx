import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Briefcase,
  Heart,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useLocation } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { Crown, Lock } from "lucide-react";
import { FullscreenLoader } from "@/components/fullscreen-loader";
import { Checkbox } from "@/components/ui/checkbox";

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
  featured: boolean;
  closingDate?: string;
  externalId?: string;
}

interface JobMatch {
  id: string;
  userId: string;
  jobId: string;
  fitScore: number;
  matchData: any;
}

export default function JobFinder() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isPaid, canAccessFeature } = useSubscription();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    // band: "",
    location: "",
    visaSponsorship: false,
  });
  const [selectedJob, setSelectedJob] = useState<NhsJob | null>(null);

  const canAccessSearch = canAccessFeature("unlimited_search");

  // Sample jobs for preview mode
  // const sampleJobs: NhsJob[] = [
  //   {
  //     id: "sample-1",
  //     title: "Band 6 Staff Nurse - Acute Medicine",
  //     employer: "London NHS Foundation Trust",
  //     location: "London, Greater London",
  //     band: "Band 6",
  //     salaryMin: 35392,
  //     salaryMax: 42618,
  //     description:
  //       "Join our dynamic acute medicine team. We're looking for a compassionate and skilled nurse to provide high-quality patient care...",
  //     visaSponsorship: true,
  //     featured: true,
  //     closingDate: "2024-01-15",
  //   },
  //   {
  //     id: "sample-2",
  //     title: "Senior Physiotherapist",
  //     employer: "Birmingham Community Healthcare",
  //     location: "Birmingham, West Midlands",
  //     band: "Band 7",
  //     salaryMin: 40057,
  //     salaryMax: 45839,
  //     description:
  //       "Exciting opportunity for an experienced physiotherapist to lead our community rehabilitation services...",
  //     visaSponsorship: false,
  //     featured: false,
  //     closingDate: "2024-01-20",
  //   },
  //   {
  //     id: "sample-3",
  //     title: "Healthcare Assistant",
  //     employer: "Manchester Royal Infirmary",
  //     location: "Manchester, Greater Manchester",
  //     band: "Band 3",
  //     salaryMin: 22383,
  //     salaryMax: 24336,
  //     description:
  //       "Support our nursing team in providing excellent patient care. Full training provided for the right candidate...",
  //     visaSponsorship: true,
  //     featured: false,
  //     closingDate: "2024-01-18",
  //   },
  // ];

  const queryResult = useQuery({
    queryKey: ["/api/jobs", activeSearchQuery, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeSearchQuery) params.append("search", activeSearchQuery);
      // if (filters.band && filters.band !== "all-bands")
        // params.append("band", filters.band);
      if (filters.location) params.append("location", filters.location);
      if (filters.visaSponsorship) params.append("visa", "true");

      const response = await apiRequest("GET", `/api/jobs?${params}`);
      return response.json();
    },
    enabled: isPaid,
    retry: false,
  });
  console.log("Job Finder - queryResult:", queryResult);

  const unfilteredJobs = queryResult.data ?? (!isPaid ? sampleJobs : []);

  // 🔍 Remove local or mocked database jobs from the visible list
  const visibleJobs = (unfilteredJobs || []).filter(
    (job: any) => job.source !== "Database"
  );

  const filteredJobs = visibleJobs.filter((job: NhsJob) => {
    const now = new Date();

    const isExpired = job.closingDate && new Date(job.closingDate) < now;
    if (isExpired) return false;

    const lowerQuery = activeSearchQuery.toLowerCase();
    const matchesSearch =
      !activeSearchQuery ||
      job.title.toLowerCase().includes(lowerQuery) ||
      job.employer.toLowerCase().includes(lowerQuery) ||
      job.description.toLowerCase().includes(lowerQuery);

    // const matchesBand =
    //   !filters.band ||
    //   filters.band === "all-bands" ||
    //   job.band === filters.band;
    const matchesLocation =
      !filters.location ||
      job.location.toLowerCase().includes(filters.location.toLowerCase());
    const matchesVisa = !filters.visaSponsorship || job.visaSponsorship;

    return matchesSearch  && matchesLocation && matchesVisa;
  });

  const jobsFetching = isPaid ? queryResult.isFetching : false;
  const jobsLoading = isPaid ? queryResult.isLoading : false;
  const jobsError = isPaid ? queryResult.error : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearchQuery(searchQuery);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setActiveSearchQuery("");
    setFilters({
      // band: "",
      location: "",
      visaSponsorship: false,
    });
  };

  const JobCard = ({
    job,
    isBlurred = false,
    index = 0,
  }: {
    job: NhsJob;
    isBlurred?: boolean;
    index?: number;
  }) => {
    const handleViewDetails = (e: React.MouseEvent) => {
      e.stopPropagation();
      setLocation(`/jobs/${job.id}`);
    };

    return (
      <div className="relative">
        <Card
          className={`transition-all hover:shadow-lg ${
            isBlurred ? "overflow-hidden" : ""
          }`}
          data-testid={`job-card-${job.id}`}
        >
          <CardHeader className={`pb-3 ${isBlurred ? "filter blur-sm" : ""}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle
                  className="text-lg font-semibold text-gray-900 mb-1"
                  data-testid={`job-title-${job.id}`}
                >
                  {job.title}
                </CardTitle>
                <p
                  className="text-blue-600 font-medium"
                  data-testid={`job-employer-${job.id}`}
                >
                  {job.employer}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className={isBlurred ? "filter blur-sm" : ""}>
            <div className="space-y-3">
              {/* Job Details */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span data-testid={`job-location-${job.id}`}>
                    {job.location}
                  </span>
                </div>
                {/* <div className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  <span data-testid={`job-band-${job.id}`}>{job.band}</span>
                </div> */}
                {job.closingDate && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      Closes: {new Date(job.closingDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Salary */}
              {(job.salaryMin || job.salaryMax) && (
                <div
                  className="font-medium text-green-600"
                  data-testid={`job-salary-${job.id}`}
                >
                  {job.salaryMin && job.salaryMax
                    ? `£${job.salaryMin.toLocaleString()} - £${job.salaryMax.toLocaleString()}`
                    : job.salaryMin
                    ? `From £${job.salaryMin.toLocaleString()}`
                    : `Up to £${job.salaryMax?.toLocaleString()}`}{" "}
                  per annum
                </div>
              )}

              {/* Tags */}
              {/* <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" data-testid={`job-band-${job.id}`}>
                  {job.band}
                </Badge>
              </div> */}

              {/* Description Preview */}
              <p className="text-sm text-gray-600 line-clamp-2">
                {job.description.substring(0, 150)}...
              </p>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  className="w-full"
                  onClick={canAccessSearch ? handleViewDetails : undefined}
                  disabled={!canAccessSearch}
                  data-testid={`view-details-${job.id}`}
                >
                  {canAccessSearch ? "View Details" : "View Details (Locked)"}
                  {!canAccessSearch && <Lock className="inline h-3 w-3 ml-1" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {isBlurred && (
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-white/90 flex items-center justify-center backdrop-blur-[1px] z-10">
            <div className="text-center bg-white rounded-lg border-2 border-yellow-300 shadow-lg p-6 max-w-sm mx-4">
              <Crown className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">Unlock More Jobs</h3>
              <p className="text-sm text-gray-600 mb-4">
                {index === 2
                  ? "See this job and hundreds more with Premium access"
                  : `View ${
                      index > 2 ? "remaining" : "this"
                    } job with Premium access`}
              </p>
              <Button
                onClick={() => setLocation("/pricing")}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium"
                size="sm"
                data-testid="button-upgrade-job-card"
              >
                Upgrade Now - £70
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

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
            Please sign in to access job search
          </p>
          <Button onClick={() => (window.location.href = "/login")}>
            Sign In
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />



      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
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

        {/* Helpful Tips Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Lightbulb className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">
                💡 Smart Job Search Tips
              </h3>
              <div className="text-blue-800 space-y-2">
                <p>
                  • <strong>Expand your search:</strong> Use multiple job boards
                  alongside HealthHire for maximum opportunities
                </p>
                <p>
                  • <strong>Use Henry the Helper:</strong> Generate tailored
                  Supporting Information for any application
                </p>
                <p>
                  • <strong>Stay organised:</strong> Track all your applications
                  using our Application Tracker page
                </p>
                <p>
                  • <strong>Apply Smart - Save Time:</strong> Only apply to
                  roles where you meet the essential criteria. NHS panels
                  automatically reject applications missing basic requirements.
                </p>
              </div>
            </div>
          </div>
        </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

      {/* Box 1 */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8 flex flex-col items-center text-center h-48 sm:h-52 md:h-56 lg:h-52">
        <a
          href="https://apply.jobs.scot.nhs.uk/Home/Job"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center text-center justify-between h-full w-full"
        >
          <img
            src="/nhs.png"
            alt="NHS Scotland Logo"
            className="w-32 h-20 object-contain mb-4 flex-shrink-0"
          />
          <p className="text-gray-800 font-medium mt-auto">
            Search for Jobs in NHS Scotland
          </p>
        </a>
      </div>

      {/* Box 2 */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8 flex flex-col items-center text-center h-48 sm:h-52 md:h-56 lg:h-52">
        <a
          href="https://www.jobs.nhs.uk/candidate"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center text-center justify-between h-full w-full"
        >
          <img
            src="/nhs_logo.png"
            alt="NHS Jobs Logo"
            className="w-[132px] h-[87px] object-contain mb-4 flex-shrink-0"
          />
          <p className="text-gray-800 font-medium mt-auto">
            Search for Jobs on the NHS Jobs Website
          </p>
        </a>
      </div>

      {/* Box 3 */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8 flex flex-col items-center text-center h-48 sm:h-52 md:h-56 lg:h-52">
        <a
          href="https://www.healthjobsuk.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center text-center justify-between h-full w-full"
        >
          <img
            src="/healthjob.png"
            alt="HealthJobs UK Logo"
            className="w-32 h-20 object-contain mb-4 flex-shrink-0"
          />
          <p className="text-gray-800 font-medium mt-auto">
            Search for Jobs on the HealthJobs UK (Trac) Website
          </p>
        </a>
      </div>

      {/* Box 4 */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8 flex flex-col items-center text-center h-64 sm:h-72 md:h-80 lg:h-72">
        <a
          href="https://uk.indeed.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center text-center justify-between h-full w-full"
        >
          <img
            src="/indeed.png"
            alt="Indeed Logo"
            className="w-32 h-20 object-contain mb-4 flex-shrink-0"
          />
          <p className="text-gray-800 font-medium mt-auto">
            Search for Jobs on the Indeed Website <br />
            <span className="text-sm text-red-600 font-normal">
              Use with caution as scams do exist on this website, never pay
              anyone claiming to guarantee you a role
            </span>
          </p>
        </a>
      </div>

    </div>

      
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold text-gray-900 mb-2"
            data-testid="page-title"
          >
            🔍 NHS Job Finder {!isPaid && "(Preview Mode)"}
            {!isPaid && (
              <Crown className="inline h-6 w-6 text-yellow-600 ml-2" />
            )}
          </h1>
          <p className="text-gray-600">
            {isPaid
              ? "Discover your perfect NHS role with intelligent role fit scoring"
              : "Preview intelligent job matching features - upgrade to unlock full access"}
          </p>
        </div>

        {/* Preview Mode Notice */}
        {!isPaid && (
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Crown className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-2">
                  🔍 Smart Job Matching (Premium Feature)
                </h3>
                <div className="text-yellow-800">
                  <p>
                    Unlock intelligent role fit scoring, advanced filters, and
                    unlimited job searching.
                  </p>
                  <p className="mt-2">
                    <strong>
                      Upgrade now to access the full NHS job matching
                      experience.
                    </strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        {canAccessSearch ? (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Search jobs by title, employer, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                    data-testid="search-input"
                  />
                </div>
                <Button type="submit" data-testid="search-button">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              <div className="flex flex-wrap gap-4">
                <Input
                  type="text"
                  placeholder="Location..."
                  value={filters.location}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  className="w-40"
                  data-testid="location-filter"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFilters}
                  data-testid="reset-filters"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Limited Access Mode
              </h3>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 mb-3">
                  Your free account includes limited job search capabilities.
                  Upgrade to unlock advanced filters, unlimited searches, and
                  personalized job matching.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button disabled variant="outline">
                    <Search className="h-4 w-4 mr-2" />
                    Advanced Search
                  </Button>
                  <Button disabled variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>

              <UpgradePrompt feature="Job Search" compact={true} />
            </div>
          </div>
        )}

        {/* Search Results */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {activeSearchQuery
                ? `Search Results for "${activeSearchQuery}"`
                : "All NHS Jobs"}
            </h2>
            <div className="text-sm text-gray-500" data-testid="results-count">
              {jobsFetching ? "" : `${filteredJobs.length} jobs found`}
            </div>
          </div>

          {jobsError ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-red-900 mb-2">
                  Unable to load jobs
                </h3>
                <p className="text-red-700 mb-4">
                  {jobsError instanceof Error &&
                  jobsError.message.includes("401")
                    ? "Please log in to view NHS job listings."
                    : "There was an error loading job listings. Please try again later."}
                </p>
                <Button
                  onClick={() => (window.location.href = "/login")}
                  data-testid="login-button"
                >
                  Log In
                </Button>
              </div>
            </div>
          ) : jobsFetching ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredJobs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredJobs.map((job: NhsJob, index: number) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isBlurred={!isPaid && index >= 2}
                    index={index}
                  />
                ))}
              </div>
              {!isPaid && filteredJobs.length > 2 && (
                <div className="mt-8 text-center">
                  <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 p-6">
                    <Crown className="h-8 w-8 text-yellow-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      See {filteredJobs.length - 2} More Jobs
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Unlock full access to all NHS job listings with
                      intelligent role fit scoring and unlimited searches.
                    </p>
                    <Button
                      onClick={() => setLocation("/pricing")}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-8 py-3"
                      data-testid="button-upgrade-job-results"
                    >
                      Upgrade Now - £70 One-Time
                    </Button>
                  </Card>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No jobs found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search criteria or filters
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
