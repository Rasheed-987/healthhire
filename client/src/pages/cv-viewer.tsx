import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Download,
  Edit,
  Eye,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  GraduationCap,
  Briefcase,
  Award,
  FileText,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { UpgradePrompt } from "@/components/UpgradePrompt";

interface CVData {
  personalInfo: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    summary?: string;
  };
  experience: Array<{
    id: string;
    jobTitle: string;
    company: string;
    location: string;
    startDate: string;
    endDate?: string;
    duties: string[];
    current: boolean;
  }>;
  education: Array<{
    id: string;
    qualification: string;
    institution: string;
    year: string;
    grade?: string;
  }>;
  skills: string[];
  registrations: Array<{
    type: string;
    number: string;
    expiry?: string;
  }>;
  lastUpdated: string;
}

export default function CVViewer() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isPaid } = useSubscription();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const {
    data: cvData,
    isLoading: cvLoading,
    error,
  } = useQuery<CVData>({
    queryKey: ["/api/cv/generate-from-profile"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/cv/generate-from-profile");
      return response.json();
    },
    enabled: !!isAuthenticated,
    retry: false,
  });

  const handleDownloadPDF = () => {
    if (!isPaid) {
      toast({
        title: "Premium Feature",
        description:
          "PDF download is available with the premium plan. Upgrade to access this feature.",
        variant: "destructive",
      });
      return;
    }

    // Use the same simple approach as the working gray button
    window.open("/api/cv/download-pdf", "_blank");
  };

  if (isLoading || cvLoading) {
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-6 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to view your CV
          </p>
          <Button onClick={() => (window.location.href = "/login")}>
            Sign In
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !cvData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              CV Not Available
            </h1>
            <p className="text-gray-600 mb-6">
              Your CV couldn't be generated. Please complete your profile first.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => setLocation("/profile")}
                data-testid="button-complete-profile"
              >
                <Edit className="h-4 w-4 mr-2" />
                Complete Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/ai-documents")}
                data-testid="button-back-documents"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Documents
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/ai-documents")}
          className="mb-6"
          data-testid="button-back-to-documents"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documents
        </Button>

        {/* CV Header */}
        <div className="cv-header flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your NHS CV</h1>
            <p className="text-gray-600">
              Last updated: {new Date(cvData.lastUpdated).toLocaleDateString()}
            </p>
          </div>
          <div className="cv-actions flex gap-3">
            {isPaid ? (
              <Button
                onClick={handleDownloadPDF}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-download-pdf"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            ) : (
              <Button
                onClick={() => setLocation("/pricing")}
                variant="outline"
                className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                data-testid="button-upgrade-for-download"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Download PDF
              </Button>
            )}
            <Button
              onClick={() => setLocation("/profile")}
              variant="outline"
              data-testid="button-update-profile"
            >
              <Edit className="h-4 w-4 mr-2" />
              Update Profile
            </Button>
          </div>
        </div>

        {/* CV Content */}
        <div className="cv-content bg-white p-8 shadow-lg rounded-lg border">
          {/* Personal Information */}
          <div className="cv-section mb-8">
            <h2
              className="text-2xl font-bold text-gray-900 mb-2"
              data-testid="cv-name"
            >
              {cvData.personalInfo.name}
            </h2>
            <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
              {cvData.personalInfo.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span data-testid="cv-email">
                    {cvData.personalInfo.email}
                  </span>
                </div>
              )}
              {cvData.personalInfo.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span data-testid="cv-phone">
                    {cvData.personalInfo.phone}
                  </span>
                </div>
              )}
              {cvData.personalInfo.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span data-testid="cv-location">
                    {cvData.personalInfo.location}
                  </span>
                </div>
              )}
            </div>
            {cvData.personalInfo.summary && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Professional Summary
                </h3>
                <p
                  className="text-gray-700 leading-relaxed"
                  data-testid="cv-summary"
                >
                  {cvData.personalInfo.summary}
                </p>
              </div>
            )}
          </div>

          {/* Professional Registrations */}
          {cvData.registrations && cvData.registrations.length > 0 && (
            <div className="cv-section mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="h-5 w-5" />
                Professional Registrations
              </h3>
              <div className="space-y-2">
                {cvData.registrations.map((reg, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                    data-testid={`cv-registration-${index}`}
                  >
                    <div>
                      <span className="font-medium">{reg.type}:</span>{" "}
                      {reg.number}
                    </div>
                    {reg.expiry && (
                      <span className="text-sm text-gray-500">
                        Expires: {reg.expiry}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Work Experience */}
          {cvData.experience && cvData.experience.length > 0 && (
            <div className="cv-section mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Work Experience
              </h3>
              <div className="space-y-6">
                {[...cvData.experience]
                  .sort((a, b) => {
                    if (a.current && !b.current) return -1;
                    if (!a.current && b.current) return 1;
                    return (b.startDate || "").localeCompare(a.startDate || "");
                  })
                  .map((exp) => (
                    <div
                      key={exp.id}
                      className="experience-item"
                      data-testid={`cv-experience-${exp.id}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-md font-semibold text-gray-900">
                          {exp.jobTitle}
                        </h4>
                        {/* {exp.current && (
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                            Currently Working
                          </span>
                        )} */}
                      </div>
                      <p className="text-blue-600 font-medium">
                        {exp.company} • {exp.location}
                      </p>
                      <p className="text-sm text-gray-500 mb-3">
                        {exp.startDate} -{" "}
                        {exp.current ? "Present" : exp.endDate}
                      </p>
                      {exp.duties && exp.duties.length > 0 && (
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          {exp.duties.map((duty, index) => (
                            <li key={index}>{duty}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Education */}
          {cvData.education && cvData.education.length > 0 && (
            <div className="cv-section mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Education & Qualifications
              </h3>
              <div className="space-y-4">
                {cvData.education.map((edu) => (
                  <div
                    key={edu.id}
                    className="education-item"
                    data-testid={`cv-education-${edu.id}`}
                  >
                    <h4 className="text-md font-semibold text-gray-900">
                      {edu.qualification}
                    </h4>
                    <p className="text-blue-600">{edu.institution}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">{edu.year}</span>
                      {edu.grade && (
                        <span className="text-sm font-medium text-gray-700">
                          Grade: {edu.grade}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {cvData.skills && cvData.skills.length > 0 && (
            <div className="cv-section">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Key Skills
              </h3>
              <div className="flex flex-wrap gap-2" data-testid="cv-skills">
                {cvData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="mt-6 flex justify-center gap-4">
          {isPaid ? (
            <Button
              onClick={handleDownloadPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-download-bottom"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Button
                onClick={() => setLocation("/pricing")}
                variant="outline"
                className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                data-testid="button-upgrade-bottom"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Download PDF
              </Button>
              <UpgradePrompt feature="PDF Download" compact={true} />
            </div>
          )}
          <Button
            onClick={() => setLocation("/profile")}
            variant="outline"
            data-testid="button-update-bottom"
          >
            <Edit className="h-4 w-4 mr-2" />
            Update Profile
          </Button>
        </div>

        {/* Auto-update notice */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            💡 Your CV automatically updates when you modify your Candidate
            Profile
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
