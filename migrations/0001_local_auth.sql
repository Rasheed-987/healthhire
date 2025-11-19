-- Add local auth columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash varchar,
  ADD COLUMN IF NOT EXISTS email_verified_at timestamp,
  ADD COLUMN IF NOT EXISTS verification_token varchar,
  ADD COLUMN IF NOT EXISTS verification_token_expires timestamp,
  ADD COLUMN IF NOT EXISTS reset_token varchar,
  ADD COLUMN IF NOT EXISTS reset_token_expires timestamp,
  ADD COLUMN IF NOT EXISTS last_login_at timestamp;

-- Create user_providers table if not exists
CREATE TABLE IF NOT EXISTS user_providers (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL REFERENCES users(id),
  provider varchar NOT NULL,
  provider_user_id varchar NOT NULL,
  created_at timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS IDX_user_providers_user ON user_providers(user_id);
CREATE INDEX IF NOT EXISTS IDX_user_providers_provider ON user_providers(provider);
