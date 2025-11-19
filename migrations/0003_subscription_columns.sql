-- Add subscription-related columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_status varchar DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS stripe_customer_id varchar,
  ADD COLUMN IF NOT EXISTS payment_date timestamp,
  ADD COLUMN IF NOT EXISTS free_tier_limits jsonb DEFAULT '{"jobs_viewed_today": 0, "last_reset": "2024-01-01"}';