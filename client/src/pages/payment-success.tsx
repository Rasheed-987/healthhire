import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const { refetchSubscription } = useSubscription();

  useEffect(() => {
    // Refetch subscription status to update UI
    refetchSubscription();
  }, [refetchSubscription]);

  const handleContinue = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Welcome to HealthHire Portal Premium! Your payment has been processed successfully.
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-4 border border-blue-200/50 dark:border-blue-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900 dark:text-blue-100">Premium Features Unlocked</span>
            </div>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Unlimited job searching</li>
              <li>• AI document generation</li>
              <li>• Interview practice with feedback</li>
              <li>• Job application tracking</li>
              <li>• Q&A generator</li>
              <li>• Complete resources hub</li>
            </ul>
          </div>

          <Button 
            onClick={handleContinue}
            className="w-full"
            size="lg"
          >
            Continue to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              You now have lifetime access to all premium features. 
              No recurring fees, no expiration date.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}