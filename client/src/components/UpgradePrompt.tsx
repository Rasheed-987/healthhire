import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Check, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

interface UpgradePromptProps {
  feature?: string;
  className?: string;
  compact?: boolean;
}

export function UpgradePrompt({ feature = "premium features", className = "", compact = false }: UpgradePromptProps) {
  const [, setLocation] = useLocation();

  const handleUpgrade = () => {
    setLocation('/pricing');
  };

  if (compact) {
    return (
      <div className={`text-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Crown className="h-5 w-5 text-yellow-600" />
          <span className="font-medium text-gray-900">Unlock {feature}</span>
        </div>
        <Button 
          onClick={handleUpgrade}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2"
          data-testid="button-upgrade-compact"
        >
          Upgrade for £70
        </Button>
      </div>
    );
  }

  return (
    <Card className={`border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 ${className}`}>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          <Crown className="h-6 w-6 text-yellow-600" />
          <span>Unlock {feature}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-gray-700">
          Get full access to all HealthHire Portal features for just £70 one-time payment
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Check className="h-4 w-4 text-green-600" />
            <span>Unlimited job searching with intelligent matching</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Check className="h-4 w-4 text-green-600" />
            <span>Professional CV and Supporting Information generation</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Check className="h-4 w-4 text-green-600" />
            <span>Interview practice with feedback</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Check className="h-4 w-4 text-green-600" />
            <span>Application tracking and analytics</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Check className="h-4 w-4 text-green-600" />
            <span>Lifetime access - no recurring fees</span>
          </div>
        </div>
        
        <Button 
          onClick={handleUpgrade}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 text-lg font-semibold"
          data-testid="button-upgrade-full"
        >
          <Crown className="h-5 w-5 mr-2" />
          Upgrade Now - £70 One-Time
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
        
        <p className="text-xs text-gray-500">
          Secure payment • Instant access • Lifetime ownership
        </p>
      </CardContent>
    </Card>
  );
}