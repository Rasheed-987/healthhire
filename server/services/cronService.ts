import { UsageResetService } from './usageResetService';

/**
 * Cron Service for Automated Usage Resets
 * Handles scheduled tasks for daily, weekly, and monthly resets
 */
export class CronService {
  private static intervals: NodeJS.Timeout[] = [];

  /**
   * Initialize all cron jobs
   */
  static initialize(): void {
    console.log('🕐 Initializing cron jobs for usage resets...');
    
    // Daily reset at midnight UTC
    this.setupDailyReset();
    
    // Weekly reset on Monday at midnight UTC
    this.setupWeeklyReset();
    
    // Monthly reset on 1st of month at midnight UTC
    this.setupMonthlyReset();
    
    // Cleanup expired restrictions every hour
    this.setupRestrictionCleanup();
    
    console.log('✅ All cron jobs initialized successfully');
  }

  /**
   * Setup daily reset cron job
   */
  private static setupDailyReset(): void {
    const runDailyReset = async () => {
      try {
        console.log('🔄 Running scheduled daily reset...');
        await UsageResetService.resetDailyCounters();
      } catch (error) {
        console.error('❌ Error in daily reset cron job:', error);
      }
    };

    // Calculate time until next midnight UTC
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setUTCDate(nextMidnight.getUTCDate() + 1);
    nextMidnight.setUTCHours(0, 0, 0, 0);
    
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();
    
    // Run at next midnight, then every 24 hours
    setTimeout(() => {
      runDailyReset();
      const interval = setInterval(runDailyReset, 24 * 60 * 60 * 1000); // 24 hours
      this.intervals.push(interval);
    }, msUntilMidnight);
    
    console.log(`📅 Daily reset scheduled for ${nextMidnight.toISOString()}`);
  }

  /**
   * Setup weekly reset cron job (Monday at midnight UTC)
   */
  private static setupWeeklyReset(): void {
    const runWeeklyReset = async () => {
      try {
        console.log('🔄 Running scheduled weekly reset...');
        await UsageResetService.resetWeeklyCounters();
      } catch (error) {
        console.error('❌ Error in weekly reset cron job:', error);
      }
    };

    // Calculate time until next Monday at midnight UTC
    const now = new Date();
    const nextMonday = new Date(now);
    const daysUntilMonday = (8 - now.getUTCDay()) % 7;
    nextMonday.setUTCDate(nextMonday.getUTCDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
    nextMonday.setUTCHours(0, 0, 0, 0);
    
    const msUntilMonday = nextMonday.getTime() - now.getTime();
    
    // Run at next Monday, then every 7 days
    setTimeout(() => {
      runWeeklyReset();
      const interval = setInterval(runWeeklyReset, 7 * 24 * 60 * 60 * 1000); // 7 days
      this.intervals.push(interval);
    }, msUntilMonday);
    
    console.log(`📅 Weekly reset scheduled for ${nextMonday.toISOString()}`);
  }

  /**
   * Setup monthly reset cron job (1st of month at midnight UTC)
   */
  private static setupMonthlyReset(): void {
    const runMonthlyReset = async () => {
      try {
        console.log('🔄 Running scheduled monthly reset...');
        await UsageResetService.resetMonthlyCounters();
      } catch (error) {
        console.error('❌ Error in monthly reset cron job:', error);
      }
    };

    // Run immediately, then every month (30 days = 30 * 24 * 60 * 60 * 1000 ms)
    runMonthlyReset();
    const interval = setInterval(runMonthlyReset, 30 * 24 * 60 * 60 * 1000); // 30 days
    this.intervals.push(interval);
    
    console.log('📅 Monthly reset scheduled every 30 days');
  }

  /**
   * Setup restriction cleanup cron job (every hour)
   */
  private static setupRestrictionCleanup(): void {
    const runCleanup = async () => {
      try {
        console.log('🧹 Running scheduled restriction cleanup...');
        await UsageResetService.cleanupExpiredRestrictions();
      } catch (error) {
        console.error('❌ Error in restriction cleanup cron job:', error);
      }
    };

    // Run immediately, then every hour
    runCleanup();
    const interval = setInterval(runCleanup, 60 * 60 * 1000); // 1 hour
    this.intervals.push(interval);
    
    console.log('📅 Restriction cleanup scheduled every hour');
  }

  /**
   * Stop all cron jobs
   */
  static stop(): void {
    console.log('🛑 Stopping all cron jobs...');
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    console.log('✅ All cron jobs stopped');
  }

  /**
   * Get status of all cron jobs
   */
  static getStatus(): {
    initialized: boolean;
    activeJobs: number;
    nextResets: {
      daily: Date;
      weekly: Date;
      monthly: string;
    };
  } {
    const schedule = UsageResetService.getResetSchedule();
    
    return {
      initialized: this.intervals.length > 0,
      activeJobs: this.intervals.length,
      nextResets: {
        daily: schedule.nextDaily,
        weekly: schedule.nextWeekly,
        monthly: "Every 30 days (simplified)"
      }
    };
  }
}

// Auto-initialize when module is imported - DISABLED to prevent infinite loops
// if (process.env.NODE_ENV !== 'test') {
//   CronService.initialize();
// }
