import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { GoogleIcon } from "@/components/ui/google-icon";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [isSuspended, setIsSuspended] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [redirectTo, setRedirectTo] = useState<string>("/dashboard");
  const [needsRedirect, setNeedsRedirect] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get("error");
    const emailParam = urlParams.get("email");
    const redirect = urlParams.get("redirect");

    if (errorParam === "suspended") {
      setError("Your account has been suspended. Please contact support.");
      setIsSuspended(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    // // If the register flow provided an email, prefill the email field
    // if (emailParam) {
    //   setEmail(emailParam);
    //   // remove the email param from the URL for cleanliness
    //   try {
    //     const u = new URL(window.location.href);
    //     u.searchParams.delete("email");
    //     window.history.replaceState({}, document.title, u.pathname + u.search);
    //   } catch (e) {
    //     // ignore
    //   }
    // }

    if (redirect) {
      setRedirectTo(redirect);
    }
  }, []);

  // Redirect when authenticated
  // Redirect when authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading && needsRedirect) {
      console.log("✅ Redirecting to:", redirectTo, { user });

      // 🟩 If admin, go to admin panel
      if (user?.isAdmin) {
        setLocation("/admin");
        return;
      }

      // 🟦 Otherwise, handle applicant flow
      if (!user?.subscriptionStatus || user.subscriptionStatus === "free") {
        setLocation("/pricing");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    needsRedirect,
    redirectTo,
    setLocation,
    user,
  ]);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));

        if (data.isSuspended) {
          setError(
            data.suspensionReason ||
              "Your account has been suspended. Please contact support."
          );
          setIsSuspended(true);
        } else {
          setError(data.message || "Login failed");
          setIsSuspended(false);
        }
        return;
      }

      // Refresh auth state and trigger redirect
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setNeedsRedirect(true);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader
        ctaLabel="Register"
        ctaHref="/register"
        showNavLinks={false}
      />
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              {error && (
                <div
                  className={`p-4 rounded-lg border ${
                    isSuspended
                      ? "bg-red-50 border-red-200 text-red-800"
                      : "bg-red-50 border-red-200 text-red-600"
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium">
                        {isSuspended ? "Account Suspended" : "Login Error"}
                      </h3>
                      <p className="mt-1 text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label className="block text-sm">Email</label>
                <input
                  type="email"
                  className={`w-full border rounded px-3 py-2 dark:text-white dark:bg-[#0f182b] ${
                    errors.email ? "border-red-500" : ""
                  }`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs">{errors.email}</p>
                )}
              </div>

              {/* Password field with visibility toggle */}
              <div className="space-y-2">
                <label className="block text-sm">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`w-full border rounded px-3 py-2 pr-10 dark:text-white dark:bg-[#0f182b] ${
                      errors.password ? "border-red-500" : ""
                    }`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs">{errors.password}</p>
                )}
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Signing in..." : "Sign in"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-[#0c1322] px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <a
                href={`${import.meta.env.VITE_API_BASE_URL}/api/auth/google`}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors w-full"
              >
                <GoogleIcon className="w-5 h-5 mr-2" />
                Sign in with Google
              </a>

              <div className="text-sm text-center">
                <a className="underline" href="/forgot-password">
                  Forgot password?
                </a>
              </div>
              <div className="text-sm text-center">
                No account?{" "}
                <Link className="underline" href="/register">
                  Create one
                </Link>
              </div>
            </form>

            <p className="mt-6 text-xs text-center text-gray-500 leading-relaxed">
              By creating an account, you confirm that you have read,
              understood, and agree to the{" "}
              <a href="/" className="underline hover:text-gray-700">
                HealthHire Portal’s Terms of Use
              </a>{" "}
              and related policies.
            </p>
          </CardContent>
        </Card>
      </div>
      <PublicFooter />
    </div>
  );
}
