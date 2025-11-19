import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  PlayCircle,
  FileText,
  Crown,
  Lock,
  Download,
  Search,
  Video,
} from "lucide-react";
import { useLocation } from "wouter";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { useQuery } from "@tanstack/react-query";

// Icon mapping for database icon strings
const iconMap: Record<string, any> = {
  guide: BookOpen,
  video: Video,
  checklist: CheckCircle,
  file: FileText,
  course: PlayCircle,
};

// Type definition for resource from database
interface ResourceFromDB {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: string;
  fileUrl?: string;
  videoUrl?: string;
  isPublished: boolean;
  createdAt: string;
}

export default function Resources() {
  const [, setLocation] = useLocation();
  const { isPaid } = useSubscription();

  // Fetch resources from API
  const { data: dbResources, isLoading, error } = useQuery<ResourceFromDB[]>({
    queryKey: ["/api/resources"],
  });

  console.log("DEBUG - Resources:", {
    isLoading,
    hasError: !!error,
    errorMessage: error ? String(error) : null,
    dataType: typeof dbResources,
    dataIsArray: Array.isArray(dbResources),
    dataLength: dbResources?.length,
    firstItem: dbResources?.[0]
  });

  // Transform database resources to match the existing component structure
  const resources = dbResources?.map(resource => ({
    id: resource.id,
    title: resource.title,
    description: resource.description,
    type: resource.icon,
    duration: resource.icon === 'video' ? '30 min' : '10 min read',
    icon: iconMap[resource.icon] || BookOpen,
    fileUrl: resource.fileUrl,
    videoUrl: resource.videoUrl,
  })) || [];

  // Handle resource access - download file or open video
  const handleAccessResource = (resource: any) => {
    if (resource.videoUrl) {
      // Open video URL in new tab (YouTube or other video platform)
      window.open(resource.videoUrl, '_blank', 'noopener,noreferrer');
    } else if (resource.fileUrl) {
      // Open file in new tab
      window.open(resource.fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

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


        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            📚 Resources Hub {!isPaid && "(Preview Mode)"}
            {!isPaid && (
              <Crown className="inline h-6 w-6 text-yellow-600 ml-2" />
            )}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isPaid ? (
              <>
                This page is currently being updated with resources, if you
                require any specific resources for the time being drop us an
                email at{" "}
                <a
                  href="mailto:hello@healthhireportal.com"
                  className="text-blue-600 hover:underline cursor-pointer"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  hello@healthhireportal.com
                </a>
                .
              </>
            ) : (
              "Preview resources - upgrade to unlock downloads and access"
            )}
          </p>

          {!isPaid && (
            <div className="mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-50 text-yellow-700 border border-yellow-200">
                <Crown className="h-4 w-4 mr-1" />
                Free Tier: 3 resources available
              </span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading resources...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600">Failed to load resources. Please try again later.</p>
          </div>
        )}

        {/* Show content only when not loading and no error */}
        {!isLoading && !error && (
          <>
        {/* Featured Resource */}
        {/* <Card
          className={`mb-8 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20 ${
            !isPaid ? "opacity-60" : ""
          }`}
        >
          <CardContent className="p-8">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                <PlayCircle className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  🌟 Featured: Interview Success Masterclass
                  {!isPaid && (
                    <Lock className="inline h-5 w-5 text-muted-foreground ml-2" />
                  )}
                </h3>
                <p className="text-muted-foreground mb-4">
                  Complete video course covering NHS values-based interviews,
                  STAR methodology, and common healthcare scenarios with expert
                  feedback.
                </p>
                <Button
                  disabled={!isPaid}
                  data-testid="button-start-masterclass"
                >
                  {isPaid ? "Start Masterclass" : "Start Masterclass (Locked)"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card> */}

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resources.map((resource, index) => {
            const isAccessible = isPaid || index < 3; // Free users get first 3 resources
            const isBlurred = !isPaid && index >= 3;

            return (
              <div key={index} className="relative">
                <Card
                  className={`hover:shadow-md transition-shadow ${
                    isBlurred ? "overflow-hidden" : ""
                  }`}
                >
                  <CardHeader className={isBlurred ? "filter blur-sm" : ""}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                          <resource.icon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {resource.title}
                            {!isAccessible && (
                              <Lock className="inline h-4 w-4 text-muted-foreground ml-2" />
                            )}
                          </CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {resource.type}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {resource.duration}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className={isBlurred ? "filter blur-sm" : ""}>
                    <p className="text-muted-foreground mb-4">
                      {resource.description}
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={!isAccessible}
                      onClick={() => isAccessible && handleAccessResource(resource)}
                      data-testid={`button-access-resource-${index}`}
                    >
                      {isAccessible
                        ? resource.type === 'video' ? "Watch Video" : "Download Resource"
                        : "Access Resource (Locked)"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Upgrade overlay for blurred resources */}
                {isBlurred && (
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-white/90 flex items-center justify-center backdrop-blur-[1px] z-10">
                    <div className="text-center bg-white rounded-lg border-2 border-yellow-300 shadow-lg p-6 max-w-sm mx-4">
                      <Crown className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
                      <h3 className="font-semibold text-lg mb-2">
                        Unlock Premium Resources
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Access all career development resources and downloadable
                        materials
                      </p>
                      <Button
                        onClick={() => setLocation("/pricing")}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium"
                        size="sm"
                        data-testid="button-upgrade-resource"
                      >
                        Upgrade Now - £70
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Actions - Premium Only */}
        {isPaid ? (
          <div className="mt-12 bg-muted/50 rounded-lg p-8">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => setLocation("/cv-viewer")}
                data-testid="button-view-cv"
              >
                <FileText className="w-4 h-4 mr-2" />
                View Your CV
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => window.open("/api/cv/download-pdf", "_blank")}
                data-testid="button-download-cv-pdf"
              >
                <Download className="w-4 h-4 mr-2" />
                Download CV as PDF
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => setLocation("/jobs")}
                data-testid="button-find-jobs"
              >
                <Search className="w-4 h-4 mr-2" />
                Find NHS Jobs
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-12 relative">
            <div className="bg-muted/30 rounded-lg p-8 filter blur-[1px]">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/50 rounded border p-3">
                  <FileText className="w-4 h-4 mr-2 inline" />
                  View Your CV
                </div>
                <div className="bg-white/50 rounded border p-3">
                  <Download className="w-4 h-4 mr-2 inline" />
                  Download CV as PDF
                </div>
                <div className="bg-white/50 rounded border p-3">
                  <Search className="w-4 h-4 mr-2 inline" />
                  Find NHS Jobs
                </div>
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80 flex items-center justify-center">
              <div className="text-center bg-white rounded-lg border-2 border-yellow-300 shadow-lg p-6 max-w-sm">
                <Crown className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">
                  Premium Downloads
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Access professional templates and tools
                </p>
                <Button
                  onClick={() => setLocation("/pricing")}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium"
                  size="sm"
                  data-testid="button-upgrade-quick-actions"
                >
                  Upgrade Now - £70
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Prompt for Free Users */}
        {!isPaid && (
          <div className="mt-8">
            <UpgradePrompt feature="Resources Hub" />
          </div>
        )}
        </>
        )}
      </main>

      <Footer />
    </div>
  );
}
