import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Lock, FileText, Search, Target, Zap, Star, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useSubscription } from "@/hooks/useSubscription";

export const PremiumUpgradeCard = () => {
  const [, setLocation] = useLocation();
  const { isPaid } = useSubscription();

  if (isPaid) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-6 text-center">
          <Crown className="h-8 w-8 text-primary mx-auto mb-3" />
          <Badge className="mb-3">Premium Active</Badge>
          <h3 className="font-semibold mb-2">Premium Member</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You have lifetime access to all premium features
          </p>
          <Button 
            onClick={() => setLocation('/ai-documents')}
            variant="outline"
            className="w-full"
            data-testid="button-use-ai-generator"
          >
            <FileText className="h-4 w-4 mr-2" />
            Use AI Generator
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-6 text-center">
        <Crown className="h-8 w-8 text-primary mx-auto mb-3" />
        <h3 className="font-semibold mb-2">Upgrade to Premium</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Unlock AI document generation, unlimited job search, and advanced features
        </p>
        <div className="mb-4">
          <span className="text-2xl font-bold text-primary">£70</span>
          <span className="text-sm text-muted-foreground ml-1">one-time</span>
        </div>
        
        <div className="space-y-2 mb-4 text-xs">
          <div className="flex items-center gap-2 justify-center text-green-600">
            <CheckCircle className="h-3 w-3" />
            <span>Lifetime access</span>
          </div>
          <div className="flex items-center gap-2 justify-center text-green-600">
            <CheckCircle className="h-3 w-3" />
            <span>No recurring charges</span>
          </div>
        </div>
        
        <Button 
          onClick={() => setLocation('/pricing')}
          className="w-full"
          data-testid="button-upgrade-premium"
        >
          <Crown className="h-4 w-4 mr-2" />
          Subscribe Now
        </Button>
      </CardContent>
    </Card>
  );
};

export const PremiumFeatureList = () => {
  const features = [
    {
      icon: Search,
      title: "Unlimited Job Search",
      description: "Access all NHS jobs with advanced filtering and real-time updates",
      free: false
    },
    {
      icon: FileText,
      title: "Document Generation", 
      description: "Generate unlimited Supporting Information and CVs tailored to NHS roles",
      free: false
    },
    {
      icon: Target,
      title: "Enhanced Role Matching",
      description: "Intelligent job fit scoring with detailed compatibility analysis",
      free: false
    },
    {
      icon: Zap,
      title: "Advanced Interview Practice",
      description: "Mock interviews with expert feedback on NHS values and STAR responses",
      free: false
    }
  ];

  return (
    <div className="space-y-3">
      {features.map((feature, index) => (
        <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
          <div className="rounded-full bg-primary/10 p-2 mt-0.5">
            <feature.icon className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm">{feature.title}</h4>
              {!feature.free && (
                <Badge variant="secondary" className="text-xs">
                  <Crown className="h-2 w-2 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{feature.description}</p>
          </div>
          {!feature.free && <Lock className="h-4 w-4 text-muted-foreground mt-2" />}
        </div>
      ))}
    </div>
  );
};