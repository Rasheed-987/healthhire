// Usage limits configuration for AI features
export const USAGE_LIMITS = {
  // CV Job Duties (Henry Helper) - 12 sets/day, 14 sets max/day, 18 sets/week, 20 sets/month
  cv_job_duties: {
    daily: 12,      // 12 sets/day (max 14/day)
    weekly: 18,     // 18 sets/week
    monthly: 20     // 20 sets/month
  },
  
  // Supporting Information Generator - Max 8/day, 25/week, 75/month
  supporting_info: {
    daily: 8,       // Max 8/day
    weekly: 25,     // 25/week
    monthly: 75     // 75/month
  },
  
  // Cover Letter Generator - Max 8/day, 15/week, 45/month
  cover_letter: {
    daily: 8,       // Max 8/day
    weekly: 15,     // 15/week
    monthly: 45     // 45/month
  },
  
  // Interview Practice Generator - Max 15 sessions/day, 40/week, 90/month
  interview_practice: {
    daily: 15,      // Max 15 sessions/day
    weekly: 40,     // 40/week
    monthly: 90     // 90/month
  },
  
  // Q&A Generator - Max 8 sessions/day, 16/week, 30/month
  qa_generator: {
    daily: 8,       // Max 8 sessions/day
    weekly: 16,     // 16/week
    monthly: 30     // 30/month
  }
} as const;

// Warning thresholds (percentage of limit)
export const WARNING_THRESHOLDS = {
  first_warning: 0.75,   // 75% of limit - gentle reminder
  final_warning: 0.90,   // 90% of limit - strong warning
  restriction: 1.0       // 100% of limit - enforce restriction
} as const;

// Suspicious pattern detection configurations
export const SUSPICIOUS_PATTERNS = {
  rapid_requests: {
    requests_per_minute: 8,   // More than 8 requests per minute
    duration_minutes: 3       // Sustained for 3 minutes
  },
  identical_content: {
    threshold: 3              // Same content submitted 3+ times within short period
  },
  off_hours_usage: {
    requests_per_hour: 25,    // 25+ requests between 1-5 AM
    time_range: [1, 5] as const // 1 AM to 5 AM
  },
  burst_detection: {
    max_requests_per_5min: 20, // More than 20 requests in 5 minutes
    burst_threshold: 3         // 3 bursts in an hour triggers review
  }
} as const;

// Feature type mapping for easier identification
export const FEATURE_TYPE_MAP = {
  'cv_job_duties': 'CV Job Duties',
  'supporting_info': 'Supporting Information Generator',
  'cover_letter': 'Cover Letter Generator',
  'interview_practice': 'Interview Practice Generator',
  'qa_generator': 'Q&A Generator'
} as const;

export type FeatureType = keyof typeof USAGE_LIMITS;
export type LimitPeriod = 'daily' | 'weekly' | 'monthly';

// Grace periods for different violation types
export const RESTRICTION_DURATIONS = {
  first_offense: {
    daily: 6,       // 6 hours cool-down
    weekly: 24,     // 24 hours cool-down
    monthly: 72     // 72 hours cool-down
  },
  repeat_offense: {
    daily: 12,      // 12 hours
    weekly: 48,     // 48 hours
    monthly: 168    // 7 days
  },
  severe_abuse: {
    daily: 72,      // 72 hours
    weekly: 168,    // 7 days
    monthly: 720    // 30 days
  }
} as const;

// Email templates configuration
export const EMAIL_TEMPLATES = {
  first_warning: {
    subject: 'AI Feature Usage Reminder - HealthHire Portal',
    type: 'friendly_reminder' as const
  },
  final_warning: {
    subject: 'Important: AI Usage Limit Warning - HealthHire Portal',
    type: 'urgent_warning' as const
  },
  restriction_applied: {
    subject: 'AI Feature Access Temporarily Limited - HealthHire Portal',
    type: 'restriction_notice' as const
  },
  restriction_lifted: {
    subject: 'AI Feature Access Restored - HealthHire Portal',
    type: 'good_news' as const
  }
} as const;

// Helper function to get feature display name
export function getFeatureDisplayName(featureType: FeatureType): string {
  return FEATURE_TYPE_MAP[featureType] || featureType;
}

// Helper function to determine if pattern is suspicious
export function isSuspiciousTime(): boolean {
  const currentHour = new Date().getHours();
  const [startHour, endHour] = SUSPICIOUS_PATTERNS.off_hours_usage.time_range;
  return currentHour >= startHour && currentHour <= endHour;
}

// Helper to calculate restriction end time
export function calculateRestrictionEndTime(
  violationType: keyof typeof RESTRICTION_DURATIONS,
  period: LimitPeriod
): Date {
  const now = new Date();
  const hours = RESTRICTION_DURATIONS[violationType][period];
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}