import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SimpleFileUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: any) => void;
  buttonClassName?: string;
  children: React.ReactNode;
}

export function SimpleFileUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: SimpleFileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    
    // Validate number of files
    if (fileArray.length > maxNumberOfFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxNumberOfFiles} file(s) allowed`,
        variant: "destructive",
      });
      return;
    }

    // Validate file sizes
    for (const file of fileArray) {
      if (file.size > maxFileSize) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than ${Math.round(maxFileSize / 1024 / 1024)}MB`,
          variant: "destructive",
        });
        return;
      }
    }

    setSelectedFiles(fileArray);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Get upload parameters
        const uploadParams = await onGetUploadParameters();
        
        // Upload file
        const response = await fetch(uploadParams.url, {
          method: uploadParams.method,
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        // Update progress
        const progress = ((i + 1) / selectedFiles.length) * 100;
        setUploadProgress(progress);

        // Call completion callback
        if (onComplete) {
          onComplete({
            successful: [{
              name: file.name,
              size: file.size,
              uploadURL: uploadParams.url,
            }],
            failed: [],
          });
        }
      }

      toast({
        title: "Upload successful",
        description: `${selectedFiles.length} file(s) uploaded successfully`,
      });

      // Reset state
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={triggerFileInput} 
        className={buttonClassName}
        disabled={isUploading}
      >
        {children}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        multiple={maxNumberOfFiles > 1}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Files</h4>
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({Math.round(file.size / 1024)} KB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading... {Math.round(uploadProgress)}%
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFiles([]);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              disabled={isUploading}
            >
              Clear
            </Button>
          </div>

          {isUploading && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
