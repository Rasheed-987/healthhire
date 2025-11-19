import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import DashboardHeader from "@/components/dashboard/header";
import { Footer } from "@/components/footer";

export default function PrivacyNotice() {
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

          {/* Privacy Notice Content */}
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h1>Privacy Notice</h1>
            
            <p><strong>Last updated: 8 September 2025</strong></p>

            <h2>1) Who we are</h2>
            <p>
              <strong>Controller:</strong> HealthHire Portal (trading as HealthHire UK)<br/>
              <strong>Registered office:</strong> 52 Carr Side Crescent • <strong>Company no:</strong> 15454323<br/>
              <strong>Email:</strong> hello@healthhireportal.com
            </p>
            
            <p>We provide an online toolkit to help applicants prepare NHS job applications (profile/CV, Supporting Information & cover letters with "Henry the Helper", interview practice, job tracking, resources, and job search & saves).</p>

            <h2>2) The data we collect</h2>
            <p><strong>Account & profile:</strong> name, email, location, role preferences, experience, education, skills, uploaded CVs/documents.</p>
            <p><strong>Content you provide:</strong> Supporting Information, cover letters, interview practice answers, notes, job tracker entries.</p>
            <p><strong>Usage & device:</strong> pages used, actions taken, timestamps, IP address, browser/device type (for security and service improvement).</p>
            <p><strong>Payments:</strong> we receive payment confirmation and metadata from our payment processor.</p>
            <p><strong>Referrals & communications:</strong> who invited you, your marketing preferences, messages you send to us.</p>

            <h2>3) How we use your data (and lawful bases)</h2>
            <ul>
              <li><strong>Provide the service</strong> (create/maintain your account; generate documents; save jobs; track progress)</li>
              <li><strong>Paid access & billing</strong> - Legal obligation (tax records).</li>
              <li><strong>Support & service messages</strong> (password reset, critical updates)</li>
              <li><strong>Improve and secure the platform</strong> (troubleshooting, analytics, preventing misuse)</li>
              <li><strong>Optional updates & tips</strong> (newsletters, offers) (you can withdraw anytime).</li>
            </ul>
            
            <p><strong>About "Henry the Helper":</strong> We use automated tools to help draft and improve your application content based on the information you provide. This is assistance only; we do not make decisions with legal or similarly significant effects based solely on automated processing.</p>

            <h2>4) Who we share data with (processors)</h2>
            <p>We use trusted service providers to run the portal. They only process your data under our instructions:</p>
            
            <ul>
              <li><strong>Hosting & infrastructure:</strong> Replit</li>
              <li><strong>Payments:</strong> Stripe</li>
              <li><strong>Email & notifications:</strong> Outlook</li>
              <li><strong>Automated drafting/model provider:</strong> Google (Gemini)</li>
            </ul>
            
            <p>We don't sell your personal data.</p>

            <h2>5) How long we keep data</h2>
            <ul>
              <li><strong>Account & profile:</strong> for as long as your account is active.</li>
              <li><strong>Generated documents & tracker entries:</strong> until you delete them or close your account.</li>
              <li><strong>Support tickets:</strong> up to 24 months after closure.</li>
              <li><strong>Technical logs:</strong> up to 12 months for security and troubleshooting.</li>
              <li><strong>Billing records:</strong> 6 years (legal requirement).</li>
            </ul>
            
            <p>We delete or anonymise data after these periods.</p>

            <h2>6) Your rights</h2>
            <p>You can <strong>access</strong>, <strong>correct</strong>, <strong>delete</strong>, or <strong>download</strong> your data; <strong>restrict</strong> or <strong>object</strong> to certain processing; and <strong>withdraw consent</strong> (for marketing) at any time.</p>
            <p>To exercise your rights, email us using email at top of this notice or adjust your privacy notice.</p>
            <p>You can also complain to the <strong>Information Commissioner's Office (ICO)</strong> if you are unhappy with how we handle your data (see <strong>ico.org.uk</strong>).</p>

            <h2>7) Cookies</h2>
            <p>We use <strong>essential cookies</strong> to run the site and (with your consent) <strong>optional cookies</strong> for analytics and improvements. You can change your choices anytime in the cookie settings.</p>

            <h2>8) Security</h2>
            <p>We use appropriate technical and organisational measures to keep your data secure, including encryption in transit, access controls, secret management, and abuse/threat monitoring. You're responsible for keeping your login details confidential.</p>

            <h2>9) Children</h2>
            <p>Our service is for users <strong>aged 16+</strong>. If you believe a child has used the service, contact us via the email at the top of this notice</p>

            <h2>10) Changes to this notice</h2>
            <p>We'll post any updates on this page and change the "Last updated" date above. If changes are significant, we'll let you know by email or in-app.</p>
          </div>
        </div>
      </div>
      {isAuthenticated ? (
        <Footer
        />
      ) : (
        <PublicFooter />
      )}
    </div>
  );
}
