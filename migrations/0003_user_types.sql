-- Add user type and approval columns
ALTER TABLE users ADD COLUMN user_type text DEFAULT 'applicant';
ALTER TABLE users ADD COLUMN approval_status text DEFAULT 'pending';
ALTER TABLE users ADD COLUMN approval_date timestamptz;

-- Update schema comments
COMMENT ON COLUMN users.user_type IS 'Either applicant or employer';
COMMENT ON COLUMN users.approval_status IS 'For employers: pending, approved, or rejected';
COMMENT ON COLUMN users.approval_date IS 'When the employer was approved/rejected';