import logoHealthhire from "@assets/Portal_1756483081930.png";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export function PublicFooter() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handlePricingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setLocation("/pricing");
  };

  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img
                src={logoHealthhire}
                alt="HealthHire Portal"
                className="w-8 h-8"
              />
              <h3 className="font-semibold">HealthHire Portal</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Your career toolkit for healthcare success
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/landing" className="hover:text-foreground">
                  Home
                </a>
              </li>
              <li>
                <button
                  onClick={handlePricingClick}
                  className="hover:text-foreground text-left"
                >
                  Pricing
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/privacy-notice" className="hover:text-foreground">
                  Privacy Notice
                </a>
              </li>
              <li>
                <a href="/terms-of-use" className="hover:text-foreground">
                  Terms of Use
                </a>
              </li>
              <li>
                <a href="/cookie-policy" className="hover:text-foreground">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/login" className="hover:text-foreground">
                  Sign in
                </a>
              </li>
              <li>
                <a href="/register" className="hover:text-foreground">
                  Create account
                </a>
              </li>
            </ul>
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
