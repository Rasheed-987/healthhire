import { useState } from "react";
import { useLocation } from "wouter";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) return "Email is required";
    if (!emailRegex.test(value)) return "Please enter a valid email address";
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }

    setLoading(true);
    setEmailError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed to send reset");
      toast({
        title: "Check your email",
        description: "If the email exists, a reset link has been sent.",
      });
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (e: any) {
      toast({
        title: "Request failed",
        description: e.message || "Failed to send reset",
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
            <CardTitle>Forgot password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm">Email</label>
                <input
                  className={`w-full border rounded px-3 py-2 dark:text-white dark:bg-[#0f182b] ${
                    emailError ? "border-red-500" : ""
                  }`}
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError)
                      setEmailError(validateEmail(e.target.value));
                  }}
                  onBlur={() => setEmailError(validateEmail(email))}
                  required
                />
                {emailError && (
                  <p className="text-red-600 text-xs">{emailError}</p>
                )}
              </div>
              <Button
                type="submit"
                disabled={loading || !!emailError || !email}
                className="w-full"
              >
                {loading ? "Sending..." : "Send reset link"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <PublicFooter />
    </div>
  );
}
