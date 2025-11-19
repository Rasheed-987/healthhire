/**
 * Usage Limitation System Test Suite
 * Tests the complete usage tracking and limitation system
 */

import { db } from '../db.js';
import { users, aiUsageTracking, usageViolations, userRestrictions } from '@shared/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { UsageMonitor } from '../middleware/usageMonitoring.js';
import { UsageResetService } from '../services/usageResetService.js';
import { USAGE_LIMITS } from '../config/usageLimits.js';

// Test configuration
const TEST_USER_ID = 'test-user-usage-limits';
const TEST_USER_EMAIL = 'test.usage.limits@example.com';
const TEST_USER_FIRST_NAME = 'Usage';
const TEST_USER_LAST_NAME = 'Test';

async function setupTestUser() {
  console.log('Setting up test user...');
  
  // Create test user
  await db.insert(users).values({
    id: TEST_USER_ID,
    email: TEST_USER_EMAIL,
    firstName: TEST_USER_FIRST_NAME,
    lastName: TEST_USER_LAST_NAME,
    passwordHash: 'hashedpassword',
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).onConflictDoNothing();
  
  console.log('✅ Test user setup complete');
}

async function cleanupTestData() {
  console.log('Cleaning up test data...');
  
  // Clean up all test data
  await db.delete(aiUsageTracking).where(eq(aiUsageTracking.userId, TEST_USER_ID));
  await db.delete(usageViolations).where(eq(usageViolations.userId, TEST_USER_ID));
  await db.delete(userRestrictions).where(eq(userRestrictions.userId, TEST_USER_ID));
  await db.delete(users).where(eq(users.id, TEST_USER_ID));
  
  console.log('✅ Test data cleanup complete');
}

async function testUsageTracking() {
  console.log('\n🧪 Testing usage tracking...');
  
  // Test 1: Track usage for CV Job Duties
  await UsageMonitor.trackUsage(TEST_USER_ID, 'cv_job_duties');
  const usage = await UsageMonitor.getCurrentUsage(TEST_USER_ID, 'cv_job_duties');
  
  if (usage.daily_count !== 1) {
    throw new Error(`Expected daily count 1, got ${usage.daily_count}`);
  }
  if (usage.weekly_count !== 1) {
    throw new Error(`Expected weekly count 1, got ${usage.weekly_count}`);
  }
  if (usage.monthly_count !== 1) {
    throw new Error(`Expected monthly count 1, got ${usage.monthly_count}`);
  }
  
  console.log('✅ Usage tracking test passed');
}

async function testUsageLimits() {
  console.log('\n🧪 Testing usage limits...');
  
  // Test 2: Exceed daily limit for CV Job Duties (limit is 12)
  for (let i = 0; i < 12; i++) {
    await UsageMonitor.trackUsage(TEST_USER_ID, 'cv_job_duties');
  }
  
  const usage = await UsageMonitor.getCurrentUsage(TEST_USER_ID, 'cv_job_duties');
  if (usage.daily_count !== 12) {
    throw new Error(`Expected daily count 12, got ${usage.daily_count}`);
  }
  
  // Test 3: Check violations
  const violations = await UsageMonitor.checkViolations(TEST_USER_ID, 'cv_job_duties');
  if (violations.length === 0) {
    throw new Error('Expected violations after reaching limit');
  }
  
  console.log('✅ Usage limits test passed');
}

async function testRestrictions() {
  console.log('\n🧪 Testing restrictions...');
  
  // Test 4: Check for active restrictions
  const restrictions = await UsageMonitor.checkRestrictions(TEST_USER_ID, 'cv_job_duties');
  if (restrictions.length === 0) {
    throw new Error('Expected active restrictions after exceeding limit');
  }
  
  console.log('✅ Restrictions test passed');
}

async function testResetService() {
  console.log('\n🧪 Testing reset service...');
  
  // Test 5: Reset user feature counters
  await UsageResetService.resetUserFeatureCounters(TEST_USER_ID, 'cv_job_duties');
  
  const usageAfterReset = await UsageMonitor.getCurrentUsage(TEST_USER_ID, 'cv_job_duties');
  if (usageAfterReset.daily_count !== 0) {
    throw new Error(`Expected daily count 0 after reset, got ${usageAfterReset.daily_count}`);
  }
  
  // Test 6: Check restrictions are removed
  const restrictionsAfterReset = await UsageMonitor.checkRestrictions(TEST_USER_ID, 'cv_job_duties');
  if (restrictionsAfterReset.length > 0) {
    throw new Error('Expected no active restrictions after reset');
  }
  
  console.log('✅ Reset service test passed');
}

async function testDifferentFeatures() {
  console.log('\n🧪 Testing different features...');
  
  // Test 7: Test all feature types
  const features = Object.keys(USAGE_LIMITS) as Array<keyof typeof USAGE_LIMITS>;
  
  for (const feature of features) {
    await UsageMonitor.trackUsage(TEST_USER_ID, feature);
    const usage = await UsageMonitor.getCurrentUsage(TEST_USER_ID, feature);
    
    if (usage.daily_count !== 1) {
      throw new Error(`Expected daily count 1 for ${feature}, got ${usage.daily_count}`);
    }
  }
  
  console.log('✅ Different features test passed');
}

async function testSuspiciousPatterns() {
  console.log('\n🧪 Testing suspicious patterns...');
  
  // Test 8: Test suspicious pattern detection
  await UsageMonitor.checkSuspiciousPatterns(TEST_USER_ID, 'cv_job_duties');
  
  // This should not throw an error
  console.log('✅ Suspicious patterns test passed');
}

async function testResetSchedule() {
  console.log('\n🧪 Testing reset schedule...');
  
  // Test 9: Get reset schedule
  const schedule = UsageResetService.getResetSchedule();
  
  if (!schedule.daily || !schedule.weekly || !schedule.monthly) {
    throw new Error('Reset schedule missing required fields');
  }
  
  if (!schedule.nextDaily || !schedule.nextWeekly || !schedule.nextMonthly) {
    throw new Error('Reset schedule missing next reset dates');
  }
  
  console.log('✅ Reset schedule test passed');
}

async function runAllTests() {
  console.log('🚀 Starting Usage Limitation System Tests...\n');
  
  try {
    await setupTestUser();
    await testUsageTracking();
    await testUsageLimits();
    await testRestrictions();
    await testResetService();
    await testDifferentFeatures();
    await testSuspiciousPatterns();
    await testResetSchedule();
    
    console.log('\n🎉 All tests passed! Usage limitation system is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await cleanupTestData();
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    console.error('Tests failed:', error);
    process.exit(1);
  });
}

export { runAllTests, setupTestUser, cleanupTestData };
