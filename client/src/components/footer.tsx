import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { DashboardData } from "@shared/schema";

export function Footer() {
  const { data: dashboardData } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  const [, setLocation] = useLocation();

  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-20 items-start">
          {/* Quick Stats */}
          <div className="space-y-4 ">
            <h4 className="font-semibold text-foreground">Your Progress</h4>
            <div className="space-y-2 ">
              <div className="flex justify-between gap-2 text-sm">
                <span className="text-muted-foreground">
                  Applications sent:
                </span>
                <span
                  className="font-medium text-foreground"
                  data-testid="text-total-applications"
                >
                  {dashboardData?.totalApplications || 0}
                </span>
              </div>
              <div className="flex justify-between gap-2 text-sm">
                <span className="text-muted-foreground">
                  Interviews scheduled:
                </span>
                <span
                  className="font-medium text-foreground"
                  data-testid="text-interviews-scheduled"
                >
                  {dashboardData?.interviewsThisWeek || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Legal Notices */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Legal Notices</h4>
            <div className="space-y-2 flex flex-col">
              <button
                onClick={() => setLocation("/privacy-notice")}
                className="text-sm text-muted-foreground hover:text-foreground text-left"
                data-testid="link-privacy-notice"
              >
                Privacy Notice
              </button>
              <button
                onClick={() => setLocation("/terms-of-use")}
                className="text-sm text-muted-foreground hover:text-foreground text-left"
                data-testid="link-terms-of-use"
              >
                Terms of Use
              </button>
              <button
                onClick={() => setLocation("/cookie-policy")}
                className="text-sm text-muted-foreground hover:text-foreground text-left"
                data-testid="link-cookie-policy"
              >
                Cookie Policy
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} HealthHire Portal. Your career toolkit
            for healthcare success.
          </p>
        </div>
      </div>
    </footer>
  );
}
