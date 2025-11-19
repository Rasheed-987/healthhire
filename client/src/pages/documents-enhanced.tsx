import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Upload, Download, Plus, Crown, Lock, Eye, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { UserFile } from "@shared/schema";

interface Document {
  id: string;
  title: string;
  type: string;
  content?: string;
  filePath?: string;
  fileSize?: number;
  createdAt: string;
}

const DocumentUploader = ({ documentType }: { documentType: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleUpload = async (file: File) => {
    try {
      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf-token', {
        credentials: 'include',
      });
      const { csrfToken } = await csrfResponse.json();

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', documentType);

      // Upload file directly to backend
      const uploadResponse = await fetch('/api/profile/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'x-csrf-token': csrfToken,
        },
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to upload file');
      }

      const fileRecord = await uploadResponse.json();
      
      // Invalidate queries to refresh the file list
      queryClient.invalidateQueries({ queryKey: ["/api/profile/files"] });
      
      toast({
        title: 'File uploaded',
        description: 'Your file has been uploaded successfully.',
      });
      
      return fileRecord;
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload file. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = true;
          input.accept = '.pdf,.docx,.doc,.png,.jpg,.jpeg';
          input.onchange = async (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files) {
              for (const file of Array.from(files)) {
                await handleUpload(file);
              }
            }
          };
          input.click();
        }}
        className="w-full"
      >
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          <span>Upload {documentType === 'certificate' ? 'Certificates' : 'Documents'}</span>
        </div>
      </Button>
    </div>
  );
};

const DocumentsList = ({ type }: { type: string }) => {
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/documents", type],
  });

  const { data: userFiles = [], isLoading: filesLoading } = useQuery<UserFile[]>({
    queryKey: ["/api/profile/files"],
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Filter files by type
  const filteredFiles = userFiles.filter((file: UserFile) => file.fileType === type);
  const filteredDocs = documents.filter((doc: Document) => doc.type === type);

  const isLoading = documentsLoading || filesLoading;

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await apiRequest('DELETE', `/api/profile/files/${fileId}`);
    },
    onSuccess: () => {
      toast({
        title: 'File deleted',
        description: 'Your file has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/profile/files'] });
    },
    onError: () => {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete file. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-red-500" />;
    if (['png', 'jpg', 'jpeg'].includes(ext || '')) return <FileText className="w-5 h-5 text-blue-500" />;
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return <div className="text-center py-4"></div>;
  }

  const hasFiles = filteredFiles.length > 0 || filteredDocs.length > 0;

  if (!hasFiles) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No {type}s uploaded yet</p>
        <p className="text-sm">Upload your files to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Uploaded Files */}
      {filteredFiles.map((file: UserFile) => (
        <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            {getFileIcon(file.fileName)}
            <div>
              <div className="font-medium text-sm">{file.fileName}</div>
              <div className="text-xs text-muted-foreground">
                {formatFileSize(file.fileSize)} • {formatDate(file.uploadedAt)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(file.filePath, '_blank', 'noopener,noreferrer')}
              title="View file"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteFileMutation.mutate(file.id)}
              disabled={deleteFileMutation.isPending}
              title="Delete file"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}

      {/* AI Generated Documents */}
      {filteredDocs.map((doc: Document) => (
        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-medium text-sm">{doc.title}</div>
              <div className="text-xs text-muted-foreground">
                {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : ''} • 
                {new Date(doc.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          {doc.filePath && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`/objects${doc.filePath}`, '_blank')}
              data-testid={`button-download-${doc.id}`}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

const PremiumUpgrade = () => {
  const [, setLocation] = useLocation();
  
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-6 text-center">
        <Crown className="h-8 w-8 text-primary mx-auto mb-3" />
        <h3 className="font-semibold mb-2">Upgrade to Premium</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Get unlimited access to AI document generation, enhanced job matching, and more
        </p>
        <div className="mb-4">
          <span className="text-2xl font-bold text-primary">£70</span>
          <span className="text-sm text-muted-foreground ml-1">one-time</span>
        </div>
        <Button 
          onClick={() => setLocation('/checkout')}
          className="w-full"
          data-testid="button-upgrade-premium"
        >
          <Crown className="h-4 w-4 mr-2" />
          Upgrade Now
        </Button>
      </CardContent>
    </Card>
  );
};

export default function DocumentsEnhanced() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const isPremium = user?.subscriptionStatus === 'paid';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">Please sign in to access document management</p>
          <Button onClick={() => window.location.href = "/login"}>
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
      
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Document Management</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload, generate, and manage your NHS application documents in one place
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="certificates" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="certificates" data-testid="tab-certificates">
                  Certificates
                </TabsTrigger>
                <TabsTrigger value="cv" data-testid="tab-cv">
                  CVs
                </TabsTrigger>
                <TabsTrigger value="cover_letter" data-testid="tab-cover-letter">
                  Cover Letters
                </TabsTrigger>
                <TabsTrigger value="generated" data-testid="tab-generated">
                  AI Generated
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="certificates" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Professional Certificates</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <DocumentUploader documentType="certificate" />
                    <DocumentsList type="certificate" />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="cv" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">CVs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <DocumentUploader documentType="cv" />
                    <DocumentsList type="cv" />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="cover_letter" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cover Letters</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <DocumentUploader documentType="cover_letter" />
                    <DocumentsList type="cover_letter" />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="generated" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      AI Generated Documents
                      {!isPremium && <Lock className="h-4 w-4 text-muted-foreground" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isPremium ? (
                      <div className="space-y-4">
                        <DocumentsList type="supporting_info" />
                        <DocumentsList type="cv" />
                        {/* Show generated documents here */}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Lock className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                        <h3 className="font-medium mb-2">Premium Feature</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Upgrade to access AI-generated documents and unlimited generation
                        </p>
                        <Button size="sm" data-testid="button-upgrade-for-ai">
                          <Crown className="h-4 w-4 mr-2" />
                          Upgrade to Premium
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Document Generator */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  AI Generator
                  {!isPremium && <Lock className="h-4 w-4 text-muted-foreground" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isPremium ? (
                  <div className="space-y-3">
                    <Button 
                      onClick={() => window.location.href = '/ai-documents'}
                      className="w-full justify-start"
                      data-testid="button-ai-documents"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Generate Documents
                    </Button>
                    <div className="text-xs text-muted-foreground">
                      Create Supporting Information and CVs tailored to specific NHS roles
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Lock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground mb-3">Premium feature</p>
                    <Button size="sm" variant="outline" className="w-full text-xs">
                      Upgrade Required
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upgrade Card */}
            {!isPremium && <PremiumUpgrade />}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Document Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Certificates:</span>
                    <Badge variant="secondary">0</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Documents:</span>
                    <Badge variant="secondary">0</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>AI Generated:</span>
                    <Badge variant="secondary">0</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}