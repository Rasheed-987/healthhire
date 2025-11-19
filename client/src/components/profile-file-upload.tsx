import { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle, FileText, Image as ImageIcon, Download, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface UploadedFile {
  id: string;
  fileName: string;
  fileType: string;
  filePath: string;
  fileSize: number | null;
  uploadedAt: string;
}

interface ProfileFileUploadProps {
  fileType: 'cv' | 'cover_letter' | 'certificate';
  title: string;
  description?: string;
  acceptedTypes?: string;
  icon?: React.ReactNode;
}

export function ProfileFileUpload({
  fileType,
  title,
  description,
  acceptedTypes = '.pdf,.docx,.doc,.png,.jpg,.jpeg',
  icon
}: ProfileFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch uploaded files
  const { data: allFiles = [], refetch } = useQuery<UploadedFile[]>({
    queryKey: ['/api/profile/files'],
  });

  // Filter files by type
  const files = allFiles.filter(f => f.fileType === fileType);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      setUploadProgress(10);

      try {
        // Get CSRF token
        const csrfResponse = await fetch('/api/csrf-token', {
          credentials: 'include',
        });
        const { csrfToken } = await csrfResponse.json();

        setUploadProgress(20);

        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileType', fileType);

        setUploadProgress(40);

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

        setUploadProgress(80);

        const fileRecord = await uploadResponse.json();

        setUploadProgress(100);
        return fileRecord;
      } finally {
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      }
    },
    onSuccess: () => {
      toast({
        title: 'File uploaded',
        description: 'Your file has been uploaded successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/profile/files'] });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload file. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await apiRequest('DELETE', `/api/profile/files/${fileId}`);
    },
    onSuccess: () => {
      toast({
        title: 'File deleted',
        description: 'Your file has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/profile/files'] });
      refetch();
    },
    onError: () => {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete file. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedExtensions = acceptedTypes.split(',').map(ext => ext.trim());
    const hasValidExtension = allowedExtensions.some(ext =>
      file.name.toLowerCase().endsWith(ext.replace('.', ''))
    );

    if (!hasValidExtension) {
      return `Invalid file type. Allowed: ${acceptedTypes}`;
    }

    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return 'File too large. Maximum size is 5MB';
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast({
        title: 'Invalid file',
        description: error,
        variant: 'destructive',
      });
      return;
    }

    uploadMutation.mutate(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-red-500" />;
    if (['png', 'jpg', 'jpeg'].includes(ext || '')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-primary/50'
          } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            onChange={handleFileInputChange}
            className="hidden"
          />

          {isUploading ? (
            <div className="space-y-2">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium">Uploading... {uploadProgress}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  Drop your file here or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Accepted: {acceptedTypes.toUpperCase()} • Max 5MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Uploaded Files List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Uploaded Files</h4>
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 bg-muted rounded-lg"
              >
                <div className="flex-shrink-0">
                  {getFileIcon(file.fileName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {file.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.fileSize)} • {formatDate(file.uploadedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // GCS URLs are already absolute and can be opened directly
                      window.open(file.filePath, '_blank', 'noopener,noreferrer');
                    }}
                    title="View file"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(file.id)}
                    disabled={deleteMutation.isPending}
                    title="Delete file"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {files.length === 0 && !isUploading && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No files uploaded yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
