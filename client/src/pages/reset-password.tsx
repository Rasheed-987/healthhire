import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [location] = useLocation();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const t = url.searchParams.get("token");
      if (t) setToken(t);
    } catch {}
  }, [location]);

  const validatePassword = (value: string) => {
    if (!value) return "Password is required";
    if (value.length < 8) return "Password must be at least 8 characters long";
    if (!/[A-Z]/.test(value))
      return "Password must contain an uppercase letter";
    if (!/[a-z]/.test(value)) return "Password must contain a lowercase letter";
    if (!/[0-9]/.test(value)) return "Password must contain a number";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value))
      return "Password must contain a special character";
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const passwordErr = validatePassword(newPassword);
    const confirmErr =
      newPassword !== confirm ? "Passwords do not match" : null;

    if (passwordErr || confirmErr) {
      setPasswordError(passwordErr);
      setConfirmError(confirmErr);
      return;
    }

    setLoading(true);
    setPasswordError(null);
    setConfirmError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to reset");
      }
      toast({ title: "Password updated", description: "You can sign in now." });
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (e: any) {
      toast({
        title: "Reset failed",
        description: e.message || "Failed to reset",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader ctaLabel="Sign in" ctaHref="/login" showNavLinks={false} />
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Reset password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm">New password</label>
                <div className="relative">
                  <input
                    className={`w-full border rounded px-3 py-2 pr-10 dark:text-white dark:bg-[#0f182b] ${
                      passwordError ? "border-red-500" : ""
                    }`}
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError(validatePassword(e.target.value));
                    }}
                    onBlur={() =>
                      setPasswordError(validatePassword(newPassword))
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs text-red-600">{passwordError}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block text-sm">Confirm password</label>
                <div className="relative">
                  <input
                    className={`w-full border rounded px-3 py-2 pr-10 dark:text-white dark:bg-[#0f182b] ${
                      confirmError ? "border-red-500" : ""
                    }`}
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => {
                      setConfirm(e.target.value);
                      if (newPassword !== e.target.value) {
                        setConfirmError("Passwords do not match");
                      } else {
                        setConfirmError(null);
                      }
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {confirmError && (
                  <p className="text-xs text-red-600">{confirmError}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={
                  loading || !token || !!passwordError || !!confirmError
                }
                className="w-full"
              >
                {loading ? "Resetting..." : "Reset password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <PublicFooter />
    </div>
  );
}
