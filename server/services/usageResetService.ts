import { db } from '../db';
import { aiUsageTracking, userRestrictions } from '@shared/schema';
import { sql, lt, eq, and } from 'drizzle-orm';

/**
 * Usage Reset Service
 * Handles automatic daily, weekly, and monthly resets for usage counters
 */
export class UsageResetService {
  
  /**
   * Reset daily usage counters
   * This should be called every day at midnight
   */
  static async resetDailyCounters(): Promise<void> {
    try {
      console.log('🔄 Starting daily usage counter reset...');
      
      // Reset daily counts for all users
      await db
        .update(aiUsageTracking)
        .set({
          dailyCount: 0,
          updatedAt: new Date()
        })
        .where(sql`1=1`); // Reset all records
      
      console.log('✅ Daily usage counters reset completed');
    } catch (error) {
      console.error('❌ Error resetting daily counters:', error);
      throw error;
    }
  }

  /**
   * Reset weekly usage counters
   * This should be called every Monday at midnight
   */
  static async resetWeeklyCounters(): Promise<void> {
    try {
      console.log('🔄 Starting weekly usage counter reset...');
      
      // Reset weekly counts for all users
      await db
        .update(aiUsageTracking)
        .set({
          weeklyCount: 0,
          updatedAt: new Date()
        })
        .where(sql`1=1`); // Reset all records
      
      console.log('✅ Weekly usage counters reset completed');
    } catch (error) {
      console.error('❌ Error resetting weekly counters:', error);
      throw error;
    }
  }

  /**
   * Reset monthly usage counters
   * This should be called on the 1st of every month at midnight
   */
  static async resetMonthlyCounters(): Promise<void> {
    try {
      console.log('🔄 Starting monthly usage counter reset...');
      
      // Reset monthly counts for all users
      await db
        .update(aiUsageTracking)
        .set({
          monthlyCount: 0,
          updatedAt: new Date()
        })
        .where(sql`1=1`); // Reset all records
      
      console.log('✅ Monthly usage counters reset completed');
    } catch (error) {
      console.error('❌ Error resetting monthly counters:', error);
      throw error;
    }
  }

  /**
   * Clean up expired restrictions
   * This should be called periodically to remove expired restrictions
   */
  static async cleanupExpiredRestrictions(): Promise<void> {
    try {
      console.log('🧹 Cleaning up expired restrictions...');
      
      const now = new Date();
      
      // Deactivate expired restrictions
      await db
        .update(userRestrictions)
        .set({
          isActive: false,
          updatedAt: now
        })
        .where(and(
          eq(userRestrictions.isActive, true),
          sql`${userRestrictions.endTime} < ${now}`
        ));
      
      console.log('✅ Expired restrictions cleanup completed');
    } catch (error) {
      console.error('❌ Error cleaning up expired restrictions:', error);
      throw error;
    }
  }

  /**
   * Reset all counters for a specific user and feature
   */
  static async resetUserFeatureCounters(userId: string, featureType: string): Promise<void> {
    try {
      console.log(`🔄 Resetting counters for user ${userId}, feature ${featureType}...`);
      
      const today = new Date().toISOString().split('T')[0];
      
      // Get current usage record
      const [usageRecord] = await db
        .select()
        .from(aiUsageTracking)
        .where(and(
          eq(aiUsageTracking.userId, userId),
          eq(aiUsageTracking.featureType, featureType),
          eq(aiUsageTracking.usageDate, today)
        ));

      if (usageRecord) {
        // Reset all counters
        await db
          .update(aiUsageTracking)
          .set({
            dailyCount: 0,
            weeklyCount: 0,
            monthlyCount: 0,
            updatedAt: new Date()
          })
          .where(eq(aiUsageTracking.id, usageRecord.id));
      }

      // Also remove any active restrictions for this user/feature
      await db
        .update(userRestrictions)
        .set({ 
          isActive: false, 
          updatedAt: new Date() 
        })
        .where(and(
          eq(userRestrictions.userId, userId),
          eq(userRestrictions.featureType, featureType),
          eq(userRestrictions.isActive, true)
        ));
      
      console.log(`✅ Counters reset for user ${userId}, feature ${featureType}`);
    } catch (error) {
      console.error(`❌ Error resetting counters for user ${userId}, feature ${featureType}:`, error);
      throw error;
    }
  }

  /**
   * Get reset schedule information
   */
  static getResetSchedule(): {
    daily: string;
    weekly: string;
    monthly: string;
    nextDaily: Date;
    nextWeekly: Date;
    nextMonthly: Date;
  } {
    const now = new Date();
    
    // Next daily reset (tomorrow at midnight)
    const nextDaily = new Date(now);
    nextDaily.setDate(nextDaily.getDate() + 1);
    nextDaily.setHours(0, 0, 0, 0);
    
    // Next weekly reset (next Monday at midnight)
    const nextWeekly = new Date(now);
    const daysUntilMonday = (8 - now.getDay()) % 7;
    nextWeekly.setDate(nextWeekly.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
    nextWeekly.setHours(0, 0, 0, 0);
    
    // Next monthly reset (1st of next month at midnight)
    const nextMonthly = new Date(now);
    nextMonthly.setMonth(nextMonthly.getMonth() + 1, 1);
    nextMonthly.setHours(0, 0, 0, 0);
    
    return {
      daily: 'Every day at 00:00 UTC',
      weekly: 'Every Monday at 00:00 UTC',
      monthly: '1st of every month at 00:00 UTC',
      nextDaily,
      nextWeekly,
      nextMonthly
    };
  }
}

/**
 * Manual reset endpoints for testing and emergency use
 */
export const resetEndpoints = {
  daily: UsageResetService.resetDailyCounters,
  weekly: UsageResetService.resetWeeklyCounters,
  monthly: UsageResetService.resetMonthlyCounters,
  cleanup: UsageResetService.cleanupExpiredRestrictions
};
