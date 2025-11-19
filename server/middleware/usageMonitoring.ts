import { Request, Response, NextFunction, type RequestHandler } from 'express';
import { db } from '../db';
import { aiUsageTracking, usageViolations, userRestrictions } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { 
  USAGE_LIMITS, 
  WARNING_THRESHOLDS, 
  SUSPICIOUS_PATTERNS,
  RESTRICTION_DURATIONS,
  calculateRestrictionEndTime,
  type FeatureType,
  type LimitPeriod 
} from '../config/usageLimits';
import { any } from 'zod';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    claims?: {
      sub: string;
      email?: string;
    };
  };
}

export class UsageMonitor {
  
  /**
   * Track usage for a specific feature and user
   */
  static async trackUsage(userId: string, featureType: FeatureType): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();
    
    try {
      // Get or create usage record for today
      const [existingUsage] = await db
        .select()
        .from(aiUsageTracking)
        .where(and(
          eq(aiUsageTracking.userId, userId),
          eq(aiUsageTracking.featureType, featureType),
          eq(aiUsageTracking.usageDate, today)
        ));

      if (existingUsage) {
        // Update existing record
        await db
          .update(aiUsageTracking)
          .set({
            hourlyCount: existingUsage.lastHour === currentHour 
              ? (existingUsage.hourlyCount || 0) + 1 
              : 1, // Reset hourly count if different hour
            dailyCount: (existingUsage.dailyCount || 0) + 1,
            weeklyCount: (existingUsage.weeklyCount || 0) + 1,
            monthlyCount: (existingUsage.monthlyCount || 0) + 1,
            lastHour: currentHour,
            updatedAt: new Date()
          })
          .where(eq(aiUsageTracking.id, existingUsage.id));
      } else {
        // Create new record
        await db
          .insert(aiUsageTracking)
          .values({
            userId,
            featureType,
            usageDate: today,
            hourlyCount: 1,
            dailyCount: 1,
            weeklyCount: 1,
            monthlyCount: 1,
            lastHour: currentHour
          });
      }
    } catch (error) {
      console.error('Error tracking AI usage:', error);
      // Don't throw - tracking shouldn't break the user experience
    }
  }

  /**
   * Get current usage for a user and feature
   */
  static async getCurrentUsage(userId: string, featureType: FeatureType) {
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();
    
    const [usage] = await db
      .select()
      .from(aiUsageTracking)
      .where(and(
        eq(aiUsageTracking.userId, userId),
        eq(aiUsageTracking.featureType, featureType),
        eq(aiUsageTracking.usageDate, today)
      ));

    return {
      hourly_count: usage?.lastHour === currentHour ? (usage.hourlyCount || 0) : 0,
      daily_count: usage?.dailyCount || 0,
      weekly_count: usage?.weeklyCount || 0,
      monthly_count: usage?.monthlyCount || 0
    };
  }

  /**
   * Check for violations and handle them
   */
  static async checkViolations(userId: string, featureType: FeatureType) {
    const usage = await this.getCurrentUsage(userId, featureType);
    const limits = USAGE_LIMITS[featureType];
    const violations = [];

    // Check each time period
    const periods: LimitPeriod[] = ['daily', 'weekly', 'monthly'];
    
    for (const period of periods) {
      const currentUsage = usage[`${period}_count`];
      const limit = limits[period];
      const percentage = currentUsage / limit;

      if (percentage >= WARNING_THRESHOLDS.restriction) {
        violations.push({
          type: 'limit_exceeded',
          period,
          current: currentUsage,
          limit,
          percentage
        });
      } else if (percentage >= WARNING_THRESHOLDS.final_warning) {
        violations.push({
          type: 'final_warning',
          period,
          current: currentUsage,
          limit,
          percentage
        });
      } else if (percentage >= WARNING_THRESHOLDS.first_warning) {
        violations.push({
          type: 'first_warning',
          period,
          current: currentUsage,
          limit,
          percentage
        });
      }
    }

    // Process violations
    for (const violation of violations) {
      await this.handleViolation(userId, featureType, violation);
    }

    return violations;
  }

  /**
   * Handle a specific violation
   */
  static async handleViolation(userId: string, featureType: FeatureType, violation: any) {
    try {
      // Record the violation
      await db.insert(usageViolations).values({
        userId,
        violationType: violation.type,
        featureType,
        violationDetails: violation,
        warningSent: false,
        restrictionApplied: false,
        resolved: false
      });

      switch (violation.type) {
        case 'first_warning':
          // Log warning but don't restrict yet
          console.log(`First warning issued to user ${userId} for ${featureType}`);
          break;
        case 'final_warning':
          // Log final warning
          console.log(`Final warning issued to user ${userId} for ${featureType}`);
          break;
        case 'limit_exceeded':
          await this.applyRestriction(userId, featureType, violation);
          break;
      }
    } catch (error) {
      console.error('Error handling violation:', error);
    }
  }

  /**
   * Apply restriction to user
   */
  static async applyRestriction(userId: string, featureType: FeatureType, violation: any) {
    try {
      // Determine restriction duration
      const endTime = calculateRestrictionEndTime('first_offense', violation.period);
      
      await db.insert(userRestrictions).values({
        userId,
        featureType,
        restrictionType: 'rate_limit',
        endTime,
        reason: `Exceeded ${violation.period} usage limit (${violation.current}/${violation.limit})`,
        canAppeal: true,
        appealSubmitted: false,
        isActive: true
      });

      console.log(`Restriction applied to user ${userId} for ${featureType} until ${endTime}`);
    } catch (error) {
      console.error('Error applying restriction:', error);
    }
  }

  /**
   * Check if user has active restrictions
   */
  static async checkRestrictions(userId: string, featureType: FeatureType) {
    const restrictions = await db
      .select()
      .from(userRestrictions)
      .where(and(
        eq(userRestrictions.userId, userId),
        eq(userRestrictions.featureType, featureType),
        eq(userRestrictions.isActive, true)
      ));

    const activeRestrictions = restrictions.filter(r => 
      !r.endTime || r.endTime > new Date()
    );

    return activeRestrictions;
  }

  /**
   * Check for suspicious patterns
   */
  static async checkSuspiciousPatterns(userId: string, featureType: FeatureType) {
    // For now, implement basic suspicious time detection
    const now = new Date();
    const currentHour = now.getHours();
    const [startHour, endHour] = SUSPICIOUS_PATTERNS.off_hours_usage.time_range;
    
    if (currentHour >= startHour && currentHour <= endHour) {
      const usage = await this.getCurrentUsage(userId, featureType);
      
      if ((usage.hourly_count || 0) > SUSPICIOUS_PATTERNS.off_hours_usage.requests_per_hour) {
        // Log suspicious activity
        await db.insert(usageViolations).values({
          userId,
          violationType: 'suspicious_pattern',
          featureType,
          violationDetails: {
            pattern: 'off_hours_usage',
            hour: currentHour,
            requests: usage.hourly_count,
            threshold: SUSPICIOUS_PATTERNS.off_hours_usage.requests_per_hour
          }
        });
      }
    }
  }
}

/**
 * Middleware to check usage restrictions before allowing AI requests
 */
export const checkUsageRestrictions = (featureType: FeatureType): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;

    try {
      if (!authReq.user?.id) return next();
      const userId = authReq.user.id;

      // Normalize feature name once
      const normalizedFeature = featureType.trim().toLowerCase();

      // Check for active restrictions
      const restrictions = await UsageMonitor.checkRestrictions(userId, normalizedFeature as any);
      if (restrictions.length > 0) {
        const restriction = restrictions[0];

        // ✅ Always check normalized feature name
        if (normalizedFeature === 'cv_job_duties') {
          return res.status(429).json({
            error: 'Usage Restricted',
            message:
              'You’ve hit the usage limit for this feature. Our system detected patterns that suggest the tool may not be used as intended. You can wait for your allowance to reset or contact us if you believe this is an error. See our support page for more.',
            details: {
              restriction_type: restriction.restrictionType,
              reason: restriction.reason,
              end_time: restriction.endTime,
              can_appeal: restriction.canAppeal,
              feature: normalizedFeature,
            },
          });
        }

        // Default message for other features
        return res.status(429).json({
          error: 'Usage Restricted',
          message: 'AI feature usage is temporarily limited.',
          details: {
            restriction_type: restriction.restrictionType,
            reason: restriction.reason,
            end_time: restriction.endTime,
            can_appeal: restriction.canAppeal,
            feature: normalizedFeature,
          },
          next_steps: [
            'Normal access will resume automatically after the restriction period',
            'If you believe this is an error, please contact support',
            'You can continue using other platform features normally',
          ],
        });
      }

      // Check current usage BEFORE allowing the request
      const currentUsage = await UsageMonitor.getCurrentUsage(userId, featureType);
      const limits = USAGE_LIMITS[featureType];
      
      // Check if any usage limits would be exceeded by this request
      const periods: LimitPeriod[] = ['daily', 'weekly', 'monthly'];
      
      for (const period of periods) {
        const currentCount = (currentUsage as any)[`${period}_count`] || 0;
        const limit = limits[period];
        
        if (currentCount >= limit) {
          // Apply restriction immediately
          const violation = {
            type: 'limit_exceeded',
            period,
            current: currentCount,
            limit,
            percentage: currentCount / limit
          };
          
          await UsageMonitor.applyRestriction(userId, featureType, violation);
          
          // Special message for cv_job_duties (Henry's job duties feature)
          if (featureType === 'cv_job_duties') {
            return res.status(429).json({
              error: 'Usage Limit Exceeded',
              message: `You've reached your ${period} limit of ${limit} requests for Henry's job duties feature. Please wait for your allowance to reset.`,
              details: {
                period,
                current: currentCount,
                limit,
                reset_info: `Your ${period} limit will reset automatically`,
                feature: featureType
              }
            });
          }
          
          // Default message for other features
          return res.status(429).json({
            error: 'Usage Limit Exceeded',
            message: "You've hit the usage limit for this feature. Our system detected patterns that suggest the tool may not be used as intended. You can wait for your allowance to reset, or contact us if you believe this is an error.",
            details: {
              period,
              current: currentCount,
              limit,
              feature: featureType,
              reset_info: `Your ${period} limit will reset automatically`
            }
          });
        }
      }

      // Track this usage request (only if we're within limits)
      await UsageMonitor.trackUsage(userId, featureType);

      // Add usage info to response headers for transparency
      const updatedUsage = await UsageMonitor.getCurrentUsage(userId, featureType);
      res.setHeader('X-Usage-Daily', `${updatedUsage.daily_count}/${limits.daily}`);
      res.setHeader('X-Usage-Weekly', `${updatedUsage.weekly_count}/${limits.weekly}`);
      res.setHeader('X-Usage-Monthly', `${updatedUsage.monthly_count}/${limits.monthly}`);

      // Check for warnings after tracking usage
  const violations = await UsageMonitor.checkViolations(userId, featureType);
      const warningViolations = violations.filter(v => v.type === 'first_warning' || v.type === 'final_warning');
      if (warningViolations.length > 0) {
        res.setHeader('X-Usage-Warning', 'Approaching usage limits');
      }

      // Check for suspicious patterns
      await UsageMonitor.checkSuspiciousPatterns(userId, featureType);

      next();
      
    } catch (error) {
      console.error('Usage monitoring error:', error);
      // Don't block requests if monitoring fails - user experience is priority
      next();
    }
  };
};

/**
 * Get usage statistics for a user
 */
export const getUserUsageStats = async (userId: string) => {
  const today = new Date().toISOString().split('T')[0];
  
  const usageStats = await db
    .select()
    .from(aiUsageTracking)
    .where(and(
      eq(aiUsageTracking.userId, userId),
      eq(aiUsageTracking.usageDate, today)
    ));

  const restrictions = await db
    .select()
    .from(userRestrictions)
    .where(and(
      eq(userRestrictions.userId, userId),
      eq(userRestrictions.isActive, true)
    ));

  return {
    usage: usageStats,
    restrictions: restrictions.filter(r => !r.endTime || r.endTime > new Date()),
    limits: USAGE_LIMITS
  };
};