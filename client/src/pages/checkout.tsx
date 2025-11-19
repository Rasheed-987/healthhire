import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Star, Zap, Users, FileText, Search } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useLocation } from "wouter";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    if (!stripe || !elements) {
      setIsProcessing(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Welcome to HealthHire Portal Premium! Redirecting...",
      });
      setTimeout(() => setLocation("/"), 2000);
    }
    
    setIsProcessing(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg border">
        <PaymentElement />
      </div>
      
      <Button 
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full h-12 text-lg font-semibold"
        data-testid="submit-payment"
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            Processing Payment...
          </div>
        ) : (
          `Complete Payment - £70`
        )}
      </Button>
    </form>
  );
};

const PremiumFeatures = () => {
  const features = [
    {
      icon: Search,
      title: "Unlimited Job Search",
      description: "Access all NHS jobs with advanced filtering and real-time updates"
    },
    {
      icon: FileText,
      title: "Document Generation", 
      description: "Generate unlimited Supporting Information and CVs tailored to NHS roles"
    },
    {
      icon: Zap,
      title: "Role Fit Calculator",
      description: "Intelligent matching to find your perfect NHS positions"
    },
    {
      icon: Users,
      title: "Interview Practice",
      description: "Mock interviews with expert feedback on NHS values and STAR responses"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Premium Features Included
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2 mt-0.5">
              <feature.icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">{feature.title}</h4>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </div>
          </div>
        ))}
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">One-time payment • Lifetime access</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
      return;
    }

    // Redirect to Stripe Checkout for secure payment processing
    const initiateCheckout = async () => {
      try {
        const response = await apiRequest('POST', '/api/payments/create-checkout', {});
        const data = await response.json();
        if (data.checkout_url) {
          // Redirect to Stripe's secure checkout page
          window.location.href = data.checkout_url;
        } else {
          throw new Error('No checkout URL received');
        }
      } catch (error) {
        console.error("Checkout setup error:", error);
        setIsLoading(false);
      }
    };

    initiateCheckout();
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
        </div>
        <Footer />
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Payment Setup Error</h1>
            <p className="text-muted-foreground mb-6">Unable to initialize payment. Please try again.</p>
            <Button onClick={() => setLocation("/")} variant="outline">
              Return to Dashboard
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Upgrade to Premium</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get lifetime access to all HealthHire Portal features and accelerate your NHS career
          </p>
          <div className="mt-6">
            <div className="text-4xl font-bold text-primary">£70</div>
            <div className="text-sm text-muted-foreground">One-time payment • Lifetime access</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Payment Form */}
          <div>
            <h2 className="text-xl font-semibold mb-6">Complete Your Purchase</h2>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm />
            </Elements>
          </div>

          {/* Features List */}
          <div>
            <PremiumFeatures />
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 pt-8 border-t text-center">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>No Recurring Charges</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Instant Access</span>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}