import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import henryComingSoonImage from "@assets/Green Simple Woman Doctor Avatar_1756984911398.png";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useAuth } from "@/hooks/useAuth";

export default function Referrals() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8 flex-1">
        {/* Back to Dashboard Button */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            data-testid="button-back-dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Coming Soon Content */}
        <div className="text-center px-4 py-10 border-2 border-dotted border-[#EFEFF4] rounded-2xl space-y-12">
          {/* Title */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-primary text-white py-4 rounded-md">
              <h1 className="text-lg md:text-xl font-semibold">
                HealthHire Portal Referral Programme – Earn a £20 Voucher
              </h1>
            </div>
          </div>

          {/* Henry Image */}
          <div className="flex justify-center">
            <img
              src={henryComingSoonImage}
              alt="Henry the Helper"
              className="w-48 h-48 md:w-56 md:h-56 object-contain mx-auto"
            />
          </div>

          {/* Steps Section */}
          <div className="max-w-2xl mx-auto px-4 my-12 space-y-10">
            {/* Step 1 */}
            <div className="rounded-2xl bg-[#EFF4FF] shadow-sm border border-primary/10 overflow-hidden">
              <div className="bg-primary text-white py-3 rounded-t-2xl">
                <h2 className="font-semibold">Step 1 – Refer someone</h2>
              </div>
              <div className="p-6 text-left">
                <p className="text-muted-foreground text-base leading-relaxed">
                  Share HealthHire Portal with a friend, colleague, or anyone looking for an NHS job.
                  They must sign up and purchase lifetime access. Both accounts must be active for
                  at least 30 days before submitting a referral claim.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl bg-[#EFF4FF] shadow-sm border border-primary/10 overflow-hidden">
              <div className="bg-primary text-white py-3 rounded-t-2xl">
                <h2 className="font-semibold">Step 2 – Let us know</h2>
              </div>
              <div className="p-6 text-left">
                <p className="text-muted-foreground text-base leading-relaxed">
                  After they have purchased and both accounts meet the 30-day requirement,
                  complete the referral form with both sets of details so we can verify the referral.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl bg-[#EFF4FF] shadow-sm border border-primary/10 overflow-hidden">
              <div className="bg-primary text-white py-3 rounded-t-2xl">
                <h2 className="font-semibold">Step 3 – Receive your £20 voucher</h2>
              </div>
              <div className="p-6 text-left">
                <p className="text-muted-foreground text-base leading-relaxed">
                  Once verified, we will send you a £20 voucher. You can refer as many people as you like.
                </p>
              </div>
            </div>
          </div>

          {/* Button */}
          <div className="pt-4">
            <a
              href="https://forms.office.com/e/qRxi5mb1xm"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="bg-primary text-white hover:bg-primary/90">
                Complete Referral Form
              </Button>
            </a>
          </div>

          {/* Important Section */}
          <div className="max-w-2xl mx-auto px-4 space-y-4">
            <div className="rounded-2xl bg-[#EFF4FF] shadow-sm border border-primary/10 overflow-hidden">
              <div className="bg-primary text-white py-3 rounded-t-2xl">
                <h3 className="font-semibold">Important</h3>
              </div>
              <div className="p-6 text-left">
                <p className="text-muted-foreground text-base leading-relaxed">
                  The person you refer must be a new customer and complete their purchase.
                  Both accounts must stay active for at least 30 days before referral submission.
                </p>
              </div>
            </div>
          </div>

          {/* Disclaimer Section */}
          <div className="max-w-2xl mx-auto px-4 space-y-4 pb-10">
            <div className="rounded-2xl bg-[#EFF4FF] shadow-sm border border-primary/10 overflow-hidden">
              <div className="bg-primary text-white py-3 rounded-t-2xl">
                <h3 className="font-semibold">Disclaimer</h3>
              </div>
              <div className="p-6 text-left">
                <p className="text-muted-foreground text-base leading-relaxed">
                  HealthHire Portal may refuse referral rewards in cases of suspected misuse,
                  duplicate claims, fraudulent activity, or policy violations. All decisions are final.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
