import { FEATURES, FEATURE_ACCESS, type Feature, type SubscriptionStatus, type FreeTierLimits } from "@shared/schema";
import { storage } from "../storage";

export class FeatureGates {
  static canAccessFeature(subscriptionStatus: SubscriptionStatus, feature: Feature): boolean {
    return FEATURE_ACCESS[feature].includes(subscriptionStatus);
  }

  static async canViewJob(userId: string): Promise<{ canView: boolean; remaining: number }> {
    const user = await storage.getUser(userId);
    
    if (!user) {
      return { canView: false, remaining: 0 };
    }

    // Paid users have unlimited access
    if (user.subscriptionStatus === 'paid') {
      return { canView: true, remaining: -1 }; // -1 indicates unlimited
    }

    const limits = user.freeTierLimits as FreeTierLimits || { jobs_viewed_today: 0, last_reset: '2024-01-01' };
    const today = new Date().toDateString();
    const lastReset = new Date(limits.last_reset).toDateString();

    // Reset counter if it's a new day
    if (today !== lastReset) {
      const newLimits: FreeTierLimits = {
        jobs_viewed_today: 0,
        last_reset: today
      };
      
      await storage.updateUserLimits(userId, newLimits);
      return { canView: true, remaining: 4 }; // 5 - 1 for current view
    }

    const remaining = Math.max(0, 5 - limits.jobs_viewed_today);
    return { 
      canView: limits.jobs_viewed_today < 5, 
      remaining: remaining - 1 
    };
  }

  static async recordJobView(userId: string): Promise<void> {
    const user = await storage.getUser(userId);
    
    if (!user || user.subscriptionStatus === 'paid') {
      return; // No tracking needed for paid users
    }

    const limits = user.freeTierLimits as FreeTierLimits || { jobs_viewed_today: 0, last_reset: '2024-01-01' };
    const today = new Date().toDateString();
    const lastReset = new Date(limits.last_reset).toDateString();

    let newJobsViewedToday = limits.jobs_viewed_today;
    
    if (today !== lastReset) {
      // Reset counter for new day
      newJobsViewedToday = 1;
    } else {
      // Increment counter for same day
      newJobsViewedToday += 1;
    }

    const newLimits: FreeTierLimits = {
      jobs_viewed_today: newJobsViewedToday,
      last_reset: today
    };

    await storage.updateUserLimits(userId, newLimits);
  }

  static getUpgradeMessage(feature: Feature): string {
    const messages: Record<Feature, string> = {
      [FEATURES.AI_GENERATION]: "Unlock professional CV and Supporting Information generation for £70 one-time",
      [FEATURES.INTERVIEW_PRACTICE]: "Get unlimited interview practice with expert feedback for £70 one-time", 
      [FEATURES.JOB_TRACKING]: "Track all your NHS job applications with our comprehensive dashboard for £70 one-time",
      [FEATURES.UNLIMITED_SEARCH]: "Search unlimited NHS jobs and get personalized matches for £70 one-time",
      [FEATURES.QA_GENERATOR]: "Generate tailored interview Q&As for any NHS role for £70 one-time",
      [FEATURES.BASIC_PROFILE]: "",
      [FEATURES.LIMITED_JOB_VIEW]: ""
    };

    return messages[feature];
  }
}