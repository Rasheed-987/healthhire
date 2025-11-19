import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Key, Mail, Save, X } from "lucide-react";

interface AdminSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export function AdminSettingsDialog({
  open,
  onOpenChange,
  currentUser,
}: AdminSettingsDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newEmail: currentUser.email || "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateAdminMutation = useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newEmail?: string;
      newPassword?: string;
    }) => {
      return await apiRequest("PUT", "/api/admin/update-profile", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Admin settings updated successfully",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      currentPassword: "",
      newEmail: currentUser.email || "",
      newPassword: "",
      confirmPassword: "",
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Current password is required
    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required";
    }

    // Email validation
    if (formData.newEmail !== currentUser.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.newEmail)) {
        newErrors.newEmail = "Please enter a valid email address";
      }
    }

    // Password validation (only if changing password)
    if (formData.newPassword) {
      if (formData.newPassword.length < 8) {
        newErrors.newPassword = "Password must be at least 8 characters long";
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const updateData: any = {
      currentPassword: formData.currentPassword,
    };

    // Only include changed fields
    if (formData.newEmail !== currentUser.email) {
      updateData.newEmail = formData.newEmail;
    }

    if (formData.newPassword) {
      updateData.newPassword = formData.newPassword;
    }

    updateAdminMutation.mutate(updateData);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Admin Settings
          </DialogTitle>
          <DialogDescription>
            Update your admin account email and password. Current password is
            required for security.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Current Password *</Label>
            <Input
              id="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  currentPassword: e.target.value,
                }))
              }
              placeholder="Enter your current password"
              className={errors.currentPassword ? "border-destructive" : ""}
            />
            {errors.currentPassword && (
              <p className="text-sm text-destructive mt-1">
                {errors.currentPassword}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="newEmail">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="newEmail"
                type="email"
                value={formData.newEmail}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, newEmail: e.target.value }))
                }
                placeholder="Enter new email address"
                className={`pl-10 ${errors.newEmail ? "border-destructive" : ""}`}
              />
            </div>
            {errors.newEmail && (
              <p className="text-sm text-destructive mt-1">{errors.newEmail}</p>
            )}
          </div>

          <div>
            <Label htmlFor="newPassword">New Password (optional)</Label>
            <Input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, newPassword: e.target.value }))
              }
              placeholder="Enter new password (leave blank to keep current)"
              className={errors.newPassword ? "border-destructive" : ""}
            />
            {errors.newPassword && (
              <p className="text-sm text-destructive mt-1">
                {errors.newPassword}
              </p>
            )}
          </div>

          {formData.newPassword && (
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                placeholder="Confirm your new password"
                className={errors.confirmPassword ? "border-destructive" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateAdminMutation.isPending}
            >
              {updateAdminMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Settings
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}