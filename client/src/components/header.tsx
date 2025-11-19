import { useQuery } from "@tanstack/react-query";
import { Crown } from "lucide-react";
import type { UserWithProfile, DashboardData } from "@shared/schema";
import { useSubscription } from "@/hooks/useSubscription";
import logoHealthhire from "@assets/Portal_1756483081930.png";
import UserDropdown from "./dashboard/user-dropdown";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getQueryFn } from "@/lib/queryClient";

export function Header() {
  // Use on401: "returnNull" to handle unauthenticated state gracefully
  const { data: user } = useQuery<UserWithProfile>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: dashboardData } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  const { isPaid } = useSubscription();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center space-x-3"
            data-testid="header-logo"
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <img
                src={logoHealthhire}
                alt="HealthHire Portal"
                className="w-10 h-10 object-contain"
                data-testid="img-logo"
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                HealthHire Portal
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
              Your career toolkit for healthcare success
              </p>
            </div>
          </div>

          {/* Theme Toggle & User Avatar Dropdown */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* User Avatar Dropdown */}
            <UserDropdown user={user} />
          </div>
        </div>
      </div>
      {/* Small fixed badge for mobile/compact screens */}
      {isPaid && (
        <div className="fixed top-3 right-3 z-50 sm:hidden">
          <div className="bg-amber-100 text-amber-800 rounded-full p-2 shadow-md flex items-center">
            <Crown className="h-4 w-4" />
          </div>
        </div>
      )}
    </header>
  );
}
