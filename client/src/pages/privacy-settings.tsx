import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield,
  Download,
  Edit,
  Trash2,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  MessageCircle,
  ArrowLeft,
} from "lucide-react";
import { ConsentManager } from "@/components/consent-manager";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

interface DataRequest {
  id: string;
  type: string;
  status: string;
  submittedDate: string;
  completedDate?: string;
  referenceId: string;
  details?: string;
}

const REQUEST_TYPE_LABELS = {
  access: "Data Access Request",
  rectification: "Data Correction Request",
  erasure: "Data Deletion Request",
  portability: "Data Export Request",
  restriction: "Data Processing Restriction",
  objection: "Processing Objection",
};

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function PrivacySettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("consents");
  const [rectificationData, setRectificationData] = useState({
    field: "",
    currentValue: "",
    requestedValue: "",
    reason: "",
  });
  const [erasureReason, setErasureReason] = useState("");

  // Fetch user's GDPR requests
  const { data: requestsData, isLoading: requestsLoading } = useQuery<{
    requests: DataRequest[];
  }>({
    queryKey: ["/api/gdpr/requests"],
  });

  const [, setLocation] = useLocation();

  // Data access request mutation
  const accessRequestMutation = useMutation({
    mutationFn: async (details?: string) => {
      const response = await apiRequest("POST", "/api/gdpr/request/access", {
        details,
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/gdpr/requests"] });
      toast({
        title: "Data Access Request Submitted",
        description: `Reference ID: ${data.referenceId}. You'll receive your data within 30 days.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit data access request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Data rectification request mutation
  const rectificationMutation = useMutation({
    mutationFn: async (data: typeof rectificationData) => {
      const response = await apiRequest(
        "POST",
        "/api/gdpr/request/rectification",
        data
      );
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/gdpr/requests"] });
      setRectificationData({
        field: "",
        currentValue: "",
        requestedValue: "",
        reason: "",
      });
      toast({
        title: "Correction Request Submitted",
        description: `Reference ID: ${data.referenceId}. We'll review your request shortly.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit correction request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Data erasure request mutation
  const erasureMutation = useMutation({
    mutationFn: async (reason: string) => {
      const response = await apiRequest("POST", "/api/gdpr/request/erasure", {
        reason: "user_request",
        specificData: reason || "all_personal_data",
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/gdpr/requests"] });
      setErasureReason("");
      toast({
        title: "Deletion Request Submitted",
        description: `Reference ID: ${data.referenceId}. Your account will be deleted within 30 days.`,
        variant: "destructive",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit deletion request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Data portability request mutation
  const portabilityMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        "/api/gdpr/request/portability"
      );
      return response.json();
    },
    onSuccess: (data: any) => {
      // Trigger download
      const blob = new Blob([JSON.stringify(data.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `healthhire_data_export_${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      queryClient.invalidateQueries({ queryKey: ["/api/gdpr/requests"] });
      toast({
        title: "Data Export Downloaded",
        description: "Your personal data has been exported and downloaded.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Back to Dashboard Button */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              data-testid="button-back-dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Privacy Settings</h1>
            <p className="text-muted-foreground">
              Manage your privacy preferences and exercise your data protection
              rights.
            </p>
          </div>

          {/* Support Section - Moved to top */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-2">
                    Need Help with Privacy Settings?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    If your privacy settings aren't changing as expected or you
                    have questions, please contact us at
                    hello@healthhireportal.com for assistance.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open("mailto:hello@healthhireportal.com", "_blank")
                    }
                    className="text-xs"
                    data-testid="button-get-support"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Contact Us
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="consents" data-testid="tab-consents">
                Consent Management
              </TabsTrigger>
              <TabsTrigger value="data-rights" data-testid="tab-data-rights">
                Data Rights
              </TabsTrigger>
              <TabsTrigger value="requests" data-testid="tab-requests">
                My Requests
              </TabsTrigger>
              <TabsTrigger value="info" data-testid="tab-info">
                Information
              </TabsTrigger>
            </TabsList>

            {/* Consent Management Tab */}
            <TabsContent value="consents" className="space-y-6">
              <ConsentManager />
            </TabsContent>

            {/* Data Rights Tab */}
            <TabsContent value="data-rights" className="space-y-6">
              <div className="mx-auto space-y-6 px-4 max-w-3xl">
                {/* Data Access Request */}
                {/* <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Access My Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Request a copy of all personal data we hold about you.
                    </p>
                    <Button
                      onClick={() => accessRequestMutation.mutate(undefined)}
                      disabled={accessRequestMutation.isPending}
                      className="w-full"
                      data-testid="button-access-request"
                    >
                      {accessRequestMutation.isPending
                        ? "Submitting..."
                        : "Request My Data"}
                    </Button>
                  </CardContent>
                </Card> */}

                {/* Data Export */}
                <Card className="mx-auto w-full sm:w-10/12 md:w-3/4 lg:w-2/3">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Export My Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                    Download a copy of all data we hold about you
                    </p>
                    <Button
                      onClick={() => portabilityMutation.mutate()}
                      disabled={portabilityMutation.isPending}
                      className="w-full"
                      data-testid="button-export-data"
                    >
                      {portabilityMutation.isPending
                        ? "Preparing..."
                        : "Download My Data"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Data Correction */}
                {/* <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Edit className="h-5 w-5" />
                      Correct My Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Request correction of inaccurate personal data.
                    </p>

                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="field">Field to Correct</Label>
                        <Input
                          id="field"
                          placeholder="e.g., Email address"
                          value={rectificationData.field}
                          onChange={(e) =>
                            setRectificationData((prev) => ({
                              ...prev,
                              field: e.target.value,
                            }))
                          }
                          data-testid="input-correction-field"
                        />
                      </div>

                      <div>
                        <Label htmlFor="current">Current Value</Label>
                        <Input
                          id="current"
                          placeholder="Current incorrect value"
                          value={rectificationData.currentValue}
                          onChange={(e) =>
                            setRectificationData((prev) => ({
                              ...prev,
                              currentValue: e.target.value,
                            }))
                          }
                          data-testid="input-current-value"
                        />
                      </div>

                      <div>
                        <Label htmlFor="requested">Correct Value</Label>
                        <Input
                          id="requested"
                          placeholder="What it should be"
                          value={rectificationData.requestedValue}
                          onChange={(e) =>
                            setRectificationData((prev) => ({
                              ...prev,
                              requestedValue: e.target.value,
                            }))
                          }
                          data-testid="input-requested-value"
                        />
                      </div>

                      <div>
                        <Label htmlFor="reason">Reason (Optional)</Label>
                        <Textarea
                          id="reason"
                          placeholder="Why this correction is needed"
                          value={rectificationData.reason}
                          onChange={(e) =>
                            setRectificationData((prev) => ({
                              ...prev,
                              reason: e.target.value,
                            }))
                          }
                          rows={2}
                          data-testid="textarea-correction-reason"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={() =>
                        rectificationMutation.mutate(rectificationData)
                      }
                      disabled={
                        rectificationMutation.isPending ||
                        !rectificationData.field ||
                        !rectificationData.requestedValue
                      }
                      className="w-full"
                      data-testid="button-submit-correction"
                    >
                      {rectificationMutation.isPending
                        ? "Submitting..."
                        : "Submit Correction"}
                    </Button>
                  </CardContent>
                </Card> */}

                {/* Data Deletion */}
                {/* <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trash2 className="h-5 w-5" />
                      Delete My Account
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        This will permanently delete your account and all
                        associated data. This action cannot be undone.
                      </AlertDescription>
                    </Alert>

                    <div>
                      <Label htmlFor="erasure-reason">Reason (Optional)</Label>
                      <Textarea
                        id="erasure-reason"
                        placeholder="Please tell us why you're deleting your account"
                        value={erasureReason}
                        onChange={(e) => setErasureReason(e.target.value)}
                        rows={3}
                        data-testid="textarea-erasure-reason"
                      />
                    </div>

                    <Button
                      onClick={() => erasureMutation.mutate(erasureReason)}
                      disabled={erasureMutation.isPending}
                      variant="destructive"
                      className="w-full"
                      data-testid="button-delete-account"
                    >
                      {erasureMutation.isPending
                        ? "Submitting..."
                        : "Delete My Account"}
                    </Button>
                  </CardContent>
                </Card> */}
              </div>
            </TabsContent>

            {/* My Requests Tab */}
            <TabsContent value="requests" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Privacy Requests</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Track the status of your data protection requests.
                  </p>
                </CardHeader>
                <CardContent>
                  {requestsLoading ? (
                    <div className="text-center py-8">
                      <div className="text-sm text-muted-foreground">
                        Loading your requests...
                      </div>
                    </div>
                  ) : !requestsData?.requests?.length ? (
                    <div className="text-center py-8">
                      <div className="text-sm text-muted-foreground">
                        You haven't submitted any privacy requests yet.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {requestsData.requests.map((request) => (
                        <div
                          key={request.id}
                          className="border rounded-lg p-4 space-y-3"
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <h4 className="font-medium">
                                {
                                  REQUEST_TYPE_LABELS[
                                    request.type as keyof typeof REQUEST_TYPE_LABELS
                                  ]
                                }
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Reference: {request.referenceId}
                              </p>
                            </div>
                            <Badge
                              className={
                                STATUS_COLORS[
                                  request.status as keyof typeof STATUS_COLORS
                                ]
                              }
                            >
                              {request.status.charAt(0).toUpperCase() +
                                request.status.slice(1)}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Submitted: {formatDate(request.submittedDate)}
                            </span>
                            {request.completedDate && (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Completed: {formatDate(request.completedDate)}
                              </span>
                            )}
                          </div>

                          {request.details && (
                            <div className="text-sm bg-muted p-2 rounded">
                              {request.details}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Information Tab */}
            <TabsContent value="info" className="space-y-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Your Data Protection Rights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <h4 className="font-medium">Right to Access</h4>
                        <p className="text-sm text-muted-foreground">
                          You can request a copy of your personal data we hold.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Right to Rectification</h4>
                        <p className="text-sm text-muted-foreground">
                          You can request correction of inaccurate personal
                          data.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Right to Erasure</h4>
                        <p className="text-sm text-muted-foreground">
                          You can request deletion of your personal data.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Right to Portability</h4>
                        <p className="text-sm text-muted-foreground">
                          You can receive your data in a machine-readable
                          format.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Right to Object</h4>
                        <p className="text-sm text-muted-foreground">
                          You can object to certain types of data processing.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Right to Restrict</h4>
                        <p className="text-sm text-muted-foreground">
                          You can request restriction of data processing.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Data Processing Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium">What data we collect:</h4>
                        <p className="text-sm text-muted-foreground">
                          Profile information, CV data, job applications,
                          interview responses, and usage analytics.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium">
                          Why we process your data:
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          To provide career services, job matching, CV
                          generation, interview practice, and platform
                          improvements.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium">
                          Legal basis for processing:
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Your consent and our legitimate interest in providing
                          healthcare career services.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium">Data retention:</h4>
                        <p className="text-sm text-muted-foreground">
                          We retain your data for 7 years or until you request
                          deletion, whichever comes first.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium">Third-party sharing:</h4>
                        <p className="text-sm text-muted-foreground">
                          We do not share your personal data with third parties
                          without your explicit consent.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </>
  );
}
