import logoHealthhire from "@assets/Portal_1756483081930.png";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "./ui/theme-toggle";

interface PublicHeaderProps {
  ctaLabel?: string;
  ctaHref?: string;
  showNavLinks?: boolean;
}

export function PublicHeader({
  ctaLabel = "Sign in",
  ctaHref = "/login",
  showNavLinks = true,
}: PublicHeaderProps) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handlePricingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setLocation("/login");
    } else {
      setLocation("/pricing");
    }
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-3">
            <img
              src={logoHealthhire}
              alt="HealthHire Portal"
              className="w-10 h-10"
            />
            <div>
              <h1 className="text-xl font-semibold">HealthHire Portal</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Your career toolkit for healthcare success
              </p>
            </div>
          </a>
          <nav className="flex  items-center gap-4">
            {/* Theme Toggle */}
            <ThemeToggle />
            {showNavLinks && (
              <>
                <Link
                  href="/landing"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Home
                </Link>
                <button
                  onClick={handlePricingClick}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Pricing
                </button>
              </>
            )}
            <Button asChild variant="default" size="sm">
              <Link href={ctaHref}>{ctaLabel}</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
