import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface InvitationData {
  email: string;
  firstName?: string;
  lastName?: string;
  userType: 'applicant' | 'employer';
  isValid: boolean;
}

export default function AcceptInvite() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract token from URL search params
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  // Verify invitation token
  const verifyInvitationMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest('POST', '/api/auth/verify-invitation', { token });
      return response.json();
    },
    onSuccess: (data) => {
      setInvitationData(data);
      setIsLoading(false);
    },
    onError: (error: Error) => {
      console.error('Error verifying invitation:', error);
      setIsLoading(false);
      toast({
        title: "Invalid Invitation",
        description: error.message || "This invitation link is invalid or has expired",
        variant: "destructive",
      });
    }
  });

  // Accept invitation and set password
  const acceptInvitationMutation = useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/accept-invitation', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Activated",
        description: "Your account has been activated successfully! You can now log in.",
      });
      setLocation('/login');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to activate account",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  });

  useEffect(() => {
    if (token) {
      verifyInvitationMutation.mutate(token);
    } else {
      setIsLoading(false);
      toast({
        title: "Invalid Link",
        description: "No invitation token provided",
        variant: "destructive",
      });
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return; 
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    acceptInvitationMutation.mutate({ token: token!, password });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2">Verifying invitation...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitationData || !invitationData.isValid) {
  return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This invitation link is invalid or has expired. Please contact the administrator for a new invitation.
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button 
                onClick={() => setLocation('/login')}
                className="w-full"
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
                </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Welcome to HealthHire!
          </CardTitle>
          <CardDescription>
            Complete your account setup by creating a password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Account Details</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Email:</strong> {invitationData.email}</p>
              <p><strong>Name:</strong> {invitationData.firstName} {invitationData.lastName}</p>
              <p><strong>Account Type:</strong> {invitationData.userType === 'applicant' ? 'Healthcare Professional' : 'Employer'}</p>
                </div>
              </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">Password must be at least 8 characters long</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting || !password || !confirmPassword}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
            </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto"
                onClick={() => setLocation('/login')}
              >
                Sign in here
              </Button>
            </p>
          </div>
          </CardContent>
        </Card>
    </div>
  );
}
