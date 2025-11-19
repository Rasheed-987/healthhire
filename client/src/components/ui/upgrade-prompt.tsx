import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Sparkles, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface UpgradePromptProps {
  title: string;
  description: string;
  feature?: string;
  className?: string;
  variant?: 'overlay' | 'card' | 'banner';
}

export function UpgradePrompt({ 
  title, 
  description, 
  feature,
  className = "",
  variant = 'overlay'
}: UpgradePromptProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/payments/create-checkout', {});
      const data = await response.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === 'overlay') {
    return (
      <div className={`absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-10 ${className}`}>
        <Card className="max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground mb-4 text-sm">{description}</p>
            <div className="space-y-3">
              <Badge variant="secondary" className="mb-2">
                <Sparkles className="w-3 h-3 mr-1" />
                £70 one-time payment
              </Badge>
              <Button 
                onClick={handleUpgrade}
                disabled={isLoading}
                className="w-full"
                size="sm"
              >
                {isLoading ? "Loading..." : "Unlock Now"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-lg p-4 mb-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-sm">{title}</h4>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <Button 
            onClick={handleUpgrade}
            disabled={isLoading}
            size="sm"
            variant="default"
          >
            {isLoading ? "..." : "Upgrade"}
          </Button>
        </div>
      </div>
    );
  }

  // Card variant
  return (
    <Card className={`${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                £70 lifetime access
              </Badge>
              <Button 
                onClick={handleUpgrade}
                disabled={isLoading}
                size="sm"
              >
                {isLoading ? "Loading..." : "Upgrade Now"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}