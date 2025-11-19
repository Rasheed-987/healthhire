ALTER TABLE users 
ADD COLUMN type varchar DEFAULT 'applicant',
ADD COLUMN approval_status varchar DEFAULT 'pending',
ADD COLUMN approval_date timestamp;

COMMENT ON COLUMN users.type IS 'Either "applicant" or "employer"';
COMMENT ON COLUMN users.approval_status IS 'For employers: "pending", "approved", or "rejected"';
COMMENT ON COLUMN users.approval_date IS 'When the employer was approved/rejected';