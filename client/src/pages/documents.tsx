import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HenryTrigger } from "@/components/henry-trigger";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Download, Eye } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Document } from "@shared/schema";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/ui/upgrade-prompt";
import { FEATURES } from "@shared/schema";

export default function Documents() {
  const [, setLocation] = useLocation();
  const { canAccessFeature } = useSubscription();

  const { data: documents } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

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
          <h1 className="text-3xl font-bold text-foreground mb-2">Application Documents</h1>
          <p className="text-muted-foreground text-lg">
            Generate tailored CVs and Supporting Information with NHS values alignment
          </p>
        </div>

        {/* Document Generation Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>CV Generator</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Create NHS-compliant CVs with STAR methodology and evidence-based outcomes
              </p>
              <Button 
                className="w-full" 
                data-testid="button-generate-cv"
                disabled={!canAccessFeature(FEATURES.AI_GENERATION)}
              >
                {canAccessFeature(FEATURES.AI_GENERATION) ? 'Generate New CV' : '🔒 Premium Feature'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Supporting Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Generate 900-1200 word Supporting Information with NHS values mapping
              </p>
              <Button 
                className="w-full" 
                data-testid="button-generate-supporting-info"
                disabled={!canAccessFeature(FEATURES.AI_GENERATION)}
              >
                {canAccessFeature(FEATURES.AI_GENERATION) ? 'Generate Supporting Info' : '🔒 Premium Feature'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Generated Documents List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Generated Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {documents?.length ? (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">
                          {doc.type === 'cv' ? 'CV' : 
                           doc.type === 'supporting_info' ? 'Supporting Information' : 
                           'Cover Letter'} v{doc.version}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Created {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" data-testid={`button-view-document-${doc.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" data-testid={`button-download-document-${doc.id}`}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !canAccessFeature(FEATURES.AI_GENERATION) ? (
                <UpgradePrompt 
                  title="AI Document Generation Locked" 
                  description="Generate NHS-specific CVs and Supporting Information with AI for £70 one-time"
                  variant="card"
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">No Documents Yet</h3>
                  <p className="mb-4">Generate your first NHS-optimized CV or Supporting Information</p>
                  <Button data-testid="button-create-first-document">Create Your First Document</Button>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </main>
      
      <Footer />
      
      {/* Henry the Helper - Documents Context */}
      <HenryTrigger context="documents" />
    </div>
  );
}
