#!/usr/bin/env node
/**
 * Email Test Script
 * Tests the welcome email functionality
 * Usage: node test-email.js
 */

import { testEmailConfiguration, sendWelcomeEmail } from './email.js';
import { env } from './env.js';

async function testEmailFunctionality() {
  console.log('🧪 Testing Email Functionality...\n');

  // Test 1: Email Configuration
  console.log('1️⃣ Testing email configuration...');
  try {
    const configValid = await testEmailConfiguration();
    if (configValid) {
      console.log('✅ Email configuration is valid');
    } else {
      console.log('❌ Email configuration is invalid');
      return;
    }
  } catch (error) {
    console.log('❌ Email configuration test failed:', error);
    return;
  }

  // Test 2: Send Welcome Email
  console.log('\n2️⃣ Testing welcome email...');
  try {
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    const testFirstName = 'Test User';
    
    console.log(`📧 Sending welcome email to: ${testEmail}`);
    await sendWelcomeEmail(testEmail, testFirstName);
    console.log('✅ Welcome email sent successfully!');
  } catch (error) {
    console.log('❌ Welcome email test failed:', error);
  }

  console.log('\n🎉 Email testing completed!');
  console.log('\n📝 Notes:');
  console.log('- Check your email inbox for the welcome email');
  console.log('- Check server logs for email send confirmations');
  console.log('- Use /api/admin/email-logs to view email logs');
  console.log('- Use /api/admin/test-email to test from admin panel');
}

// Run the test
testEmailFunctionality().catch(console.error);
