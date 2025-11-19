import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

// Initialize Stripe for production  
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
});

export { stripe };

// Stripe configuration constants
export const STRIPE_CONFIG = {
  // £70.00 one-time payment in pence
  PRICE_AMOUNT: 7000,
  CURRENCY: 'gbp',
  PRODUCT_NAME: 'HealthHire Portal',
  PRODUCT_DESCRIPTION: 'HealthHire Portal is a product created by HealthHire UK. Everything for your job application in one place: Build a reusable profile that powers your CV • Find and save jobs, track every application • Tailor Supporting Information and cover letters with Henry the Helper • Practise interviews and role-specific questions with feedback and model answers • Access expert resources • Earn rewards via our referral programme.',
  // Optional pre-created Stripe Price ID (if you prefer reusing a Price instead of inline price_data)
  PRICE_ID: process.env.STRIPE_PRICE_ID || undefined,
} as const;