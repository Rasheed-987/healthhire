-- Add user suspension and admin management columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_role varchar,
  ADD COLUMN IF NOT EXISTS admin_created_by varchar,
  ADD COLUMN IF NOT EXISTS admin_created_at timestamp,
  ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_by varchar,
  ADD COLUMN IF NOT EXISTS suspended_at timestamp,
  ADD COLUMN IF NOT EXISTS suspension_reason text,
  ADD COLUMN IF NOT EXISTS previous_subscription_status varchar,
  ADD COLUMN IF NOT EXISTS admin_updated_by varchar,
  ADD COLUMN IF NOT EXISTS admin_updated_at timestamp,
  ADD COLUMN IF NOT EXISTS has_completed_onboarding boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_completed_premium_onboarding boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS dashboard_card_order text[] DEFAULT '{"profile","jobs","documents","resources","practice","qa","tracker","news"}';

-- Add comments for documentation
COMMENT ON COLUMN users.is_admin IS 'Whether the user has admin privileges';
COMMENT ON COLUMN users.admin_role IS 'Admin role: master_admin, secondary_admin';
COMMENT ON COLUMN users.admin_created_by IS 'Reference to admin who created this admin user';
COMMENT ON COLUMN users.admin_created_at IS 'When this user was granted admin privileges';
COMMENT ON COLUMN users.is_suspended IS 'Whether the user account is suspended';
COMMENT ON COLUMN users.suspended_by IS 'Reference to admin who suspended this user';
COMMENT ON COLUMN users.suspended_at IS 'When the user was suspended';
COMMENT ON COLUMN users.suspension_reason IS 'Reason for suspension';
COMMENT ON COLUMN users.previous_subscription_status IS 'Subscription status before suspension';
COMMENT ON COLUMN users.admin_updated_by IS 'Reference to admin who last updated this user';
COMMENT ON COLUMN users.admin_updated_at IS 'When this user was last updated by admin';
COMMENT ON COLUMN users.has_completed_onboarding IS 'Whether user has completed basic onboarding';
COMMENT ON COLUMN users.has_completed_premium_onboarding IS 'Whether user has completed premium onboarding';
COMMENT ON COLUMN users.dashboard_card_order IS 'Order of dashboard cards for this user';
