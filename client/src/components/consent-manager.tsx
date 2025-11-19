import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Eye, 
  Brain, 
  Mail, 
  Target, 
  Info, 
  Check, 
  AlertCircle,
  Clock
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ConsentType {
  type: string;
  given: boolean;
  date: string;
  legalBasis: string;
  version: string;
}

interface ConsentConfig {
  name: string;
  description: string;
  required: boolean;
  legalBasis: string;
  icon: React.ComponentType<any>;
  details?: string;
}

const CONSENT_TYPES: Record<string, ConsentConfig> = {
  essential: {
    name: 'Essential Cookies & Data Processing',
    description: 'Required for basic platform functionality, account management, and security.',
    required: true,
    legalBasis: 'legitimate_interest',
    icon: Shield,
    details: 'These are necessary for the platform to function and cannot be disabled. Includes session management, security features, and core platform operations.'
  },
  analytics: {
    name: 'Analytics & Performance',
    description: 'Help us understand how you use our platform to improve your experience.',
    required: false,
    legalBasis: 'consent',
    icon: Eye,
    details: 'We collect anonymized usage data to understand how users interact with our platform, identify popular features, and optimize performance.'
  },
  ai_processing: {
    name: 'AI Content Generation',
    description: 'Process your data with AI to generate CVs, interview questions, and feedback.',
    required: false,
    legalBasis: 'consent',
    icon: Brain,
    details: 'Your profile and career data will be processed by AI systems to generate personalized content like CVs, supporting information, and interview practice questions.'
  },
  marketing: {
    name: 'Marketing Communications',
    description: 'Send you job alerts, platform updates, and relevant career opportunities.',
    required: false,
    legalBasis: 'consent',
    icon: Mail,
    details: 'We will send you relevant job matches, platform updates, career tips, and information about new features that might interest you.'
  },
  profiling: {
    name: 'Job Matching & Profiling',
    description: 'Create profiles to suggest relevant jobs and improve recommendations.',
    required: false,
    legalBasis: 'consent',
    icon: Target,
    details: 'We analyze your skills, experience, and preferences to create a profile that helps us suggest the most relevant NHS job opportunities.'
  }
};

export function ConsentManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDetails, setShowDetails] = useState(false);
  const [consentStates, setConsentStates] = useState<Record<string, boolean>>({});

  // Fetch current consents
  const { data: consentsData, isLoading } = useQuery<{ consents: ConsentType[] }>({
    queryKey: ["/api/gdpr/consents"],
  });

  // Update consent mutation
  const updateConsentMutation = useMutation({
    mutationFn: async ({ consentType, consentGiven }: { consentType: string; consentGiven: boolean }) => {
      return apiRequest("POST", "/api/gdpr/consent", {
        consent_type: consentType,
        consent_given: consentGiven,
        legal_basis: CONSENT_TYPES[consentType]?.legalBasis || 'consent'
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/gdpr/consents"] });
      toast({
        title: "Privacy Preferences Updated",
        description: `${CONSENT_TYPES[variables.consentType]?.name} consent ${variables.consentGiven ? 'granted' : 'withdrawn'}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update privacy preferences. Please try again.",
        variant: "destructive",
      });
      console.error('Consent update error:', error);
    },
  });

  // Initialize consent states from API data
  useEffect(() => {
    if (consentsData?.consents) {
      const states: Record<string, boolean> = {};
      
      // Set defaults for all consent types
      Object.keys(CONSENT_TYPES).forEach(type => {
        states[type] = CONSENT_TYPES[type].required; // Default required consents to true
      });
      
      // Update with actual consent data
      consentsData.consents.forEach(consent => {
        states[consent.type] = consent.given;
      });
      
      setConsentStates(states);
    }
  }, [consentsData]);

  const handleConsentChange = async (consentType: string, newValue: boolean) => {
    // Optimistically update the UI
    setConsentStates(prev => ({ ...prev, [consentType]: newValue }));
    
    // Call the API
    await updateConsentMutation.mutateAsync({ consentType, consentGiven: newValue });
  };

  const getConsentStatus = (type: string): ConsentType | undefined => {
    return consentsData?.consents.find(c => c.type === type);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading privacy preferences...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy Preferences
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs"
            >
              <Info className="h-3 w-3 mr-1" />
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Control how your personal data is processed and used on our platform.
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your privacy matters to us. You can change these preferences at any time. 
              Required services are essential for platform functionality and cannot be disabled.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {Object.entries(CONSENT_TYPES).map(([key, consent]) => {
              const consentStatus = getConsentStatus(key);
              const isEnabled = consentStates[key] || false;
              const Icon = consent.icon;
              
              return (
                <div key={key} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-blue-600" />
                        <h4 className="font-medium">{consent.name}</h4>
                        {consent.required && (
                          <Badge variant="secondary" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {consent.description}
                      </p>
                      
                      {showDetails && (
                        <div className="space-y-2 text-xs">
                          <div className="bg-muted p-3 rounded text-muted-foreground">
                            <strong>Details:</strong> {consent.details}
                          </div>
                          <div className="flex items-center gap-4 text-muted-foreground">
                            <span><strong>Legal basis:</strong> {consent.legalBasis.replace('_', ' ')}</span>
                            {consentStatus && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <strong>Last updated:</strong> {formatDate(consentStatus.date)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      {consent.required ? (
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-xs text-muted-foreground">Always On</span>
                        </div>
                      ) : (
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) => handleConsentChange(key, checked)}
                          disabled={updateConsentMutation.isPending}
                          data-testid={`consent-switch-${key}`}
                        />
                      )}
                      
                      {isEnabled ? (
                        <Badge variant="default" className="text-xs">
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Disabled
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {showDetails && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-semibold">Your Rights</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-500" />
                  <span>Access your personal data</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-500" />
                  <span>Request data correction</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-500" />
                  <span>Download your data</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-500" />
                  <span>Delete your account</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}