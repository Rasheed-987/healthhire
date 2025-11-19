import { ReactNode } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Lock } from "lucide-react";

interface FeatureGateProps {
  children: ReactNode;
  feature: string;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export function FeatureGate({ 
  children, 
  feature, 
  fallback, 
  showUpgradePrompt = true 
}: FeatureGateProps) {
  const { canAccessFeature, isPaid } = useSubscription();
  const [, setLocation] = useLocation();

  const hasAccess = canAccessFeature(feature as any);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-6 text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <Badge variant="secondary" className="mb-3">
          <Crown className="h-3 w-3 mr-1" />
          Premium Feature
        </Badge>
        <h3 className="font-semibold mb-2">Upgrade to Unlock</h3>
        <p className="text-sm text-muted-foreground mb-4">
          This feature is available with a premium subscription
        </p>
        <Button 
          onClick={() => setLocation('/pricing')}
          className="w-full"
        >
          <Crown className="h-4 w-4 mr-2" />
          Subscribe Now
        </Button>
      </CardContent>
    </Card>
  );
}

interface PremiumOverlayProps {
  children: ReactNode;
  feature: string;
  className?: string;
}

export function PremiumOverlay({ children, feature, className = "" }: PremiumOverlayProps) {
  const { canAccessFeature } = useSubscription();
  const [, setLocation] = useLocation();

  const hasAccess = canAccessFeature(feature as any);

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      {children}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
        <div className="text-center p-4">
          <Lock className="w-8 h-8 text-white mx-auto mb-2" />
          <p className="text-white font-medium mb-2">Premium Feature</p>
          <Button 
            onClick={() => setLocation('/pricing')}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            <Crown className="h-4 w-4 mr-2" />
            Subscribe to Unlock
          </Button>
        </div>
      </div>
    </div>
  );
}
