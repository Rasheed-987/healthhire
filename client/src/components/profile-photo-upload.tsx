import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, X } from "lucide-react";
import type { User } from "@shared/schema";

interface ProfilePhotoUploadProps {
  user: User;
  className?: string;
}

export function ProfilePhotoUpload({
  user,
  className = "",
}: ProfilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update user profile photo mutation
  const updateProfilePhotoMutation = useMutation({
    mutationFn: async ({
      uploadURL,
      csrfToken,
    }: {
      uploadURL: string;
      csrfToken: string;
    }) => {
      const response = await fetch("/api/user/profile-photo", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({ uploadURL }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile photo");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      console.log("Profile photo update successful:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Profile Photo Updated",
        description: "Your profile photo has been successfully updated.",
      });
      setPreviewUrl(null);
    },
    onError: (error) => {
      console.error("Error updating profile photo:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (JPG, PNG, GIF, etc.).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Get CSRF token
      const csrfResponse = await fetch("/api/csrf-token", {
        credentials: "include",
      });
      const { csrfToken } = await csrfResponse.json();

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", "profile_photo");

      // Upload file directly to backend
      const uploadResponse = await fetch("/api/profile/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: {
          "x-csrf-token": csrfToken,
        },
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Upload failed");
      }

      const fileRecord = await uploadResponse.json();
      console.log("Upload successful, file record:", fileRecord);

      // Get a fresh CSRF token for the profile update
      const csrfResponse2 = await fetch("/api/csrf-token", {
        credentials: "include",
      });
      const { csrfToken: csrfToken2 } = await csrfResponse2.json();

      // Update user profile with the file path (using fresh CSRF token)
      await updateProfilePhotoMutation.mutateAsync({
        uploadURL: fileRecord.filePath,
        csrfToken: csrfToken2,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = async () => {
    try {
      // Get CSRF token for removal
      const csrfResponse = await fetch("/api/csrf-token", {
        credentials: "include",
      });
      const { csrfToken } = await csrfResponse.json();

      await updateProfilePhotoMutation.mutateAsync({
        uploadURL: "",
        csrfToken,
      });
    } catch (error) {
      // Error handled in mutation
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // GCS URLs are already absolute, no conversion needed
  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return null;

    const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;

    if (imagePath.startsWith("/uploads/")) {
      // Fallback for any legacy local paths (shouldn't happen with GCS)
      return `${baseUrl}${imagePath}`;
    }
    return imagePath;
  };

  const displayImage = previewUrl || getImageUrl(user.profileImageUrl);
  const initials = user.firstName?.[0] || user.lastName?.[0] || "U";

  console.log("ProfilePhotoUpload render:", {
    previewUrl,
    profileImageUrl: user.profileImageUrl,
    displayImage,
    user: user.firstName + " " + user.lastName,
  });

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Avatar Display */}
      <div className="relative">
        <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
          <AvatarImage src={displayImage || undefined} alt="Profile photo" />
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Camera overlay */}
        <div
          className="absolute inset-0 bg-black bg-opacity-40 rounded-full opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          onClick={triggerFileInput}
        >
          <Camera className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Upload/Remove Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={triggerFileInput}
          disabled={isUploading || updateProfilePhotoMutation.isPending}
          size="sm"
          variant="outline"
          data-testid="button-upload-photo"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              {displayImage ? "Change Photo" : "Upload Photo"}
            </>
          )}
        </Button>

        {displayImage && (
          <Button
            onClick={handleRemovePhoto}
            disabled={updateProfilePhotoMutation.isPending}
            size="sm"
            variant="outline"
            data-testid="button-remove-photo"
          >
            <X className="w-4 h-4 mr-2" />
            Remove
          </Button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-file-photo"
      />

      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Upload a square image for best results. Maximum file size: 5MB
      </p>
    </div>
  );
}
