import { useLocation } from "wouter";

interface FooterProps {
  totalApplications: number;
  interviewsScheduled: number;
}

export default function Footer({
  totalApplications,
  interviewsScheduled,
}: FooterProps) {
  const [, setLocation] = useLocation();

  return (
    <footer
      className="border-t border-border bg-card/50 backdrop-blur-sm"
      data-testid="footer"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Quick Stats */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Your Progress</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Applications sent:
                </span>
                <span
                  className="font-medium text-foreground"
                  data-testid="text-total-applications"
                >
                  {totalApplications}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Interviews scheduled:
                </span>
                <span
                  className="font-medium text-foreground"
                  data-testid="text-interviews-scheduled"
                >
                  {interviewsScheduled}
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
