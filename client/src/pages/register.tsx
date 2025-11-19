import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { GoogleIcon } from "@/components/ui/google-icon";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff } from "lucide-react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const [redirectTo, setRedirectTo] = useState<string>("/login");
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();

  // Check for redirect parameter on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get("redirect");

    if (redirect) {
      setRedirectTo(redirect);
    }
  }, []);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (!/^[A-Za-z][A-Za-z\s'-]{1,}$/.test(firstName.trim())) {
      newErrors.firstName =
        "First name must contain only letters, spaces, hyphens, or apostrophes (min 2 chars)";
    }

    if (!lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (!/^[A-Za-z][A-Za-z\s'-]{1,}$/.test(lastName.trim())) {
      newErrors.lastName = "Last name must contain only letters, spaces, hyphens, or apostrophes (min 2 chars)";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/.test(password)
    ) {
      newErrors.password =
        "Password must be at least 8 characters and include uppercase, lowercase, and a number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;
    setLoading(true);
      // Redirect after successful registration
      // setLocation(redirectTo);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Registration failed");
      }
      // Try to automatically sign the user in so they land on the pricing flow
      try {
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        if (loginRes.ok) {

          try {
            await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          } catch (e) {
            // ignore
          }
        
          setLocation("/pricing");
        } else {
         
          const loginUrl = `/login?redirect=/pricing&email=${encodeURIComponent(
            email
          )}`;
          setLocation(loginUrl);
        }
      } catch (err) {
        // On network error, fall back to login with email prefilled
        const loginUrl = `/login?redirect=/pricing&email=${encodeURIComponent(
          email
        )}`;
        setLocation(loginUrl);
      }
    } catch (err: any) {
      setServerError(err.message || "Registration failed");
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
            <CardTitle>Create account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              {serverError && (
                <div className="text-red-600 text-sm">{serverError}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-sm">First name</label>
                  <input
                    className={`w-full dark:text-white dark:bg-[#0f182b] border rounded px-3 py-2 ${
                      errors.firstName ? "border-red-500" : ""
                    }`}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs">{errors.firstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm">Last name</label>
                  <input
                    className={`w-full dark:text-white dark:bg-[#0f182b] border rounded px-3 py-2 ${
                      errors.lastName ? "border-red-500" : ""
                    }`}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs">{errors.lastName}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm">Email</label>
                <input
                  type="email"
                  className={`w-full dark:text-white dark:bg-[#0f182b] border rounded px-3 py-2 ${
                    errors.email ? "border-red-500" : ""
                  }`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-sm">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`w-full dark:text-white dark:bg-[#0f182b] border rounded px-3 py-2 pr-10 ${
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
                {loading ? "Creating..." : "Create account"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white  dark:bg-[#0c1322] px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <a
                href={`${import.meta.env.VITE_API_BASE_URL}/api/auth/google`}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors w-full"
              >
                <GoogleIcon className="w-5 h-5 mr-2" />
                Sign up with Google
              </a>

              <div className="text-sm text-center">
                Already have an account?{" "}
                <Link className="underline" href="/login">
                  Sign in
                </Link>
              </div>
              <div className="text-sm text-center">
                Need to verify your email?{" "}
                <Link className="underline" href="/verify-email">
                  Enter code
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <PublicFooter />
    </div>
  );
}
