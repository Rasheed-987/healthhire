import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import type { SubscriptionStatus, Feature } from "@shared/schema";
import { FEATURE_ACCESS } from "@shared/schema";

export function useSubscription() {
  const { user, isAuthenticated } = useAuth();

  const { data: subscriptionData, refetch: refetchSubscription } = useQuery({
    queryKey: ['/api/user/subscription-status'],
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });

  const subscriptionStatus: SubscriptionStatus = subscriptionData?.subscriptionStatus || 'free';
  const isPaid = subscriptionStatus === 'paid';
  
  const canAccessFeature = (feature: Feature): boolean => {
    return FEATURE_ACCESS[feature].includes(subscriptionStatus);
  };

  const { data: jobLimits } = useQuery({
    queryKey: ['/api/user/job-limits'],
    enabled: isAuthenticated && !isPaid,
    refetchOnWindowFocus: false,
  });

  return {
    subscriptionStatus,
    isPaid,
    canAccessFeature,
    jobViewsRemaining: jobLimits?.remaining || 0,
    hasJobViewsLeft: (jobLimits?.remaining || 0) > 0,
    refetchSubscription,
  };
}