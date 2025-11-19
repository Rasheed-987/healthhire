import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import DashboardHeader from "@/components/dashboard/header";
import DashboardFooter from "@/components/dashboard/footer";
import { Footer } from "@/components/footer";

export default function CookiePolicy() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const handleBack = () => {
    // If user is authenticated, go to dashboard, otherwise go to homepage
    if (isAuthenticated) {
      setLocation("/");
    } else {
      setLocation("/landing");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {isAuthenticated ? (
        <DashboardHeader user={user} profileCompletion={0} />
      ) : (
        <PublicHeader />
      )}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Back Button */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          {/* Cookie Policy Content */}
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h1>Cookie Policy</h1>
            <p>
              <strong>Last updated: 8 September 2025</strong>
            </p>

            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4">
                1) About this policy
              </h2>
              <p className="mb-4">
                This Cookie Policy explains how HealthHire Portal / HealthHire
                UK ("we", "us") uses cookies and similar technologies on our
                website and app. For how we handle personal data more generally,
                see our Privacy Notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4">
                2) What are cookies?
              </h2>
              <p className="mb-4">
                Cookies are small text files placed on your device when you
                visit a website. They help a site work, remember your
                preferences, and understand how people use it. We also use
                similar technologies such as local storage and pixels—together
                referred to here as "cookies".
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4">
                3) How we use cookies
              </h2>
              <p className="mb-4">We use cookies for the following purposes:</p>

              <div className="mb-4">
                <p className="mb-2">
                  <strong>Essential (strictly necessary):</strong> required to
                  run the site, keep you signed in, secure your account, process
                  payments, and deliver core features. These run on the basis of
                  our legitimate interests in providing a secure, functional
                  service and do not require consent.
                </p>

                <p className="mb-2">
                  <strong>Preferences:</strong> remember choices like language
                  or display settings.
                </p>

                <p className="mb-2">
                  <strong>Analytics:</strong> help us understand usage (pages
                  visited, features used) so we can improve performance and user
                  experience.
                </p>

                <p className="mb-2">
                  <strong>(Optional) Marketing/Attribution:</strong> if enabled,
                  measure the effectiveness of our campaigns and referrals.
                </p>
              </div>

              <p className="mb-4">
                We only set non-essential cookies (Preferences, Analytics,
                Marketing) with your consent.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4">4) Your choices</h2>
              <div className="mb-4">
                <p className="mb-2">
                  <strong>Cookie banner:</strong> On your first visit you can
                  Accept all, Reject all (for non-essential), or Manage settings
                  by category.
                </p>

                <p className="mb-2">
                  <strong>Change your mind anytime:</strong> Use the privacy
                  link in the support centre to update your choices or withdraw
                  consent.
                </p>

                <p className="mb-2">
                  <strong>Browser controls:</strong> You can block or delete
                  cookies via your browser settings. Blocking essential cookies
                  may break parts of the site.
                </p>

                <p className="mb-2">
                  <strong>Quick link:</strong> Cookie settings (opens the
                  preferences manager)
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4">
                5) Cookies we use (examples)
              </h2>
              <p className="mb-4">
                These are typical cookies we use or may use. Exact names can
                vary by provider and environment.
              </p>

              <div className="mb-6">
                <h3 className="text-md font-semibold mb-3">
                  A) Essential (always on)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border p-2 text-left">
                          Name
                        </th>
                        <th className="border border-border p-2 text-left">
                          Provider
                        </th>
                        <th className="border border-border p-2 text-left">
                          Purpose
                        </th>
                        <th className="border border-border p-2 text-left">
                          Type
                        </th>
                        <th className="border border-border p-2 text-left">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-border p-2">hh_session</td>
                        <td className="border border-border p-2">HealthHire</td>
                        <td className="border border-border p-2">
                          Keeps you signed in and ties your actions to your
                          account securely.
                        </td>
                        <td className="border border-border p-2">
                          First-party
                        </td>
                        <td className="border border-border p-2">Session</td>
                      </tr>
                      <tr>
                        <td className="border border-border p-2">hh_csrf</td>
                        <td className="border border-border p-2">HealthHire</td>
                        <td className="border border-border p-2">
                          Protects forms and actions against CSRF attacks.
                        </td>
                        <td className="border border-border p-2">
                          First-party
                        </td>
                        <td className="border border-border p-2">Session</td>
                      </tr>
                      <tr>
                        <td className="border border-border p-2">
                          cookie_consent
                        </td>
                        <td className="border border-border p-2">HealthHire</td>
                        <td className="border border-border p-2">
                          Stores your cookie preferences.
                        </td>
                        <td className="border border-border p-2">
                          First-party
                        </td>
                        <td className="border border-border p-2">
                          6–12 months
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-border p-2">
                          __stripe_sid, __stripe_mid
                        </td>
                        <td className="border border-border p-2">Stripe 🔷</td>
                        <td className="border border-border p-2">
                          Payment processing and fraud prevention during
                          checkout.
                        </td>
                        <td className="border border-border p-2">
                          Third-party
                        </td>
                        <td className="border border-border p-2">
                          Up to 1 year
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-border p-2">
                          cf_bm / __cf_*
                        </td>
                        <td className="border border-border p-2">
                          Cloudflare/host 🔷
                        </td>
                        <td className="border border-border p-2">
                          Bot management / performance (if used).
                        </td>
                        <td className="border border-border p-2">
                          Third-party
                        </td>
                        <td className="border border-border p-2">
                          30 minutes–1 day
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-md font-semibold mb-3">
                  B) Preferences (consent)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border p-2 text-left">
                          Name
                        </th>
                        <th className="border border-border p-2 text-left">
                          Provider
                        </th>
                        <th className="border border-border p-2 text-left">
                          Purpose
                        </th>
                        <th className="border border-border p-2 text-left">
                          Type
                        </th>
                        <th className="border border-border p-2 text-left">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-border p-2">hh_ui_pref</td>
                        <td className="border border-border p-2">HealthHire</td>
                        <td className="border border-border p-2">
                          Remembers layout/theme/language choices.
                        </td>
                        <td className="border border-border p-2">
                          First-party
                        </td>
                        <td className="border border-border p-2">6 months</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-md font-semibold mb-3">
                  C) Analytics (consent)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border p-2 text-left">
                          Name
                        </th>
                        <th className="border border-border p-2 text-left">
                          Provider
                        </th>
                        <th className="border border-border p-2 text-left">
                          Purpose
                        </th>
                        <th className="border border-border p-2 text-left">
                          Type
                        </th>
                        <th className="border border-border p-2 text-left">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-border p-2">_ga, _ga_*</td>
                        <td className="border border-border p-2">
                          Google Analytics 🔷
                        </td>
                        <td className="border border-border p-2">
                          Usage analytics (pages, events) to improve the
                          product.
                        </td>
                        <td className="border border-border p-2">
                          First-party
                        </td>
                        <td className="border border-border p-2">13 months</td>
                      </tr>
                      <tr>
                        <td className="border border-border p-2">
                          pll_* / plausible_* 🔷
                        </td>
                        <td className="border border-border p-2">
                          Plausible/Other
                        </td>
                        <td className="border border-border p-2">
                          Privacy-centred analytics (if enabled).
                        </td>
                        <td className="border border-border p-2">
                          First-party
                        </td>
                        <td className="border border-border p-2">
                          6–12 months
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-md font-semibold mb-3">
                  D) Marketing/Attribution (consent, if used)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border p-2 text-left">
                          Name
                        </th>
                        <th className="border border-border p-2 text-left">
                          Provider
                        </th>
                        <th className="border border-border p-2 text-left">
                          Purpose
                        </th>
                        <th className="border border-border p-2 text-left">
                          Type
                        </th>
                        <th className="border border-border p-2 text-left">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-border p-2">_fbp, _fbc</td>
                        <td className="border border-border p-2">Meta 🔷</td>
                        <td className="border border-border p-2">
                          Campaign attribution/retargeting.
                        </td>
                        <td className="border border-border p-2">
                          First-party
                        </td>
                        <td className="border border-border p-2">3 months</td>
                      </tr>
                      <tr>
                        <td className="border border-border p-2">
                          _tt_enable_cookie
                        </td>
                        <td className="border border-border p-2">TikTok 🔷</td>
                        <td className="border border-border p-2">
                          Campaign attribution.
                        </td>
                        <td className="border border-border p-2">
                          First-party
                        </td>
                        <td className="border border-border p-2">13 months</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4">
                6) Local storage & similar tech
              </h2>
              <p className="mb-4">
                We may use local storage to cache non-sensitive settings (e.g.,
                UI preferences) and server-side sessions to keep you signed in.
                We treat these similarly to cookies in terms of consent where
                they're not strictly necessary.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4">
                7) Third-party cookies
              </h2>
              <p className="mb-4">
                Some features (e.g., payments via Stripe, embedded content, or
                analytics) are provided by third parties who may set their own
                cookies. We control which categories are loaded and seek your
                consent where required, but those providers control how their
                cookies are used. Please review their policies for details.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4">
                8) Changes to this policy
              </h2>
              <p className="mb-4">
                We may update this Cookie Policy from time to time. We'll post
                the latest version here and update the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4">9) Contact us</h2>
              <p className="mb-4">
                Questions about cookies? Email{" "}
                <strong>
                  <a
                    href="mailto:hello@healthhireportal.com"
                    className="text-primary hover:underline"
                  >
                    hello@healthhireportal.com
                  </a>
                </strong>
              </p>
            </section>
          </div>
        </div>
      </div>
      {isAuthenticated ? <Footer /> : <PublicFooter />}
    </div>
  );
}
