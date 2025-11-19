-- Migration: Add AI Usage Tracking and Monitoring Tables
-- This migration adds comprehensive usage tracking for Gemini-powered features

-- AI Usage Tracking Table
CREATE TABLE IF NOT EXISTS ai_usage_tracking (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature_type VARCHAR NOT NULL,
    usage_date VARCHAR NOT NULL, -- YYYY-MM-DD format
    hourly_count INTEGER DEFAULT 0,
    daily_count INTEGER DEFAULT 0,
    weekly_count INTEGER DEFAULT 0,
    monthly_count INTEGER DEFAULT 0,
    last_hour INTEGER DEFAULT 0, -- Hour of last request (0-23)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_usage_user_feature_date ON ai_usage_tracking(user_id, feature_type, usage_date);

-- Usage Violations Table
CREATE TABLE IF NOT EXISTS usage_violations (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    violation_type VARCHAR NOT NULL, -- 'excessive_usage', 'rapid_requests', 'suspicious_pattern'
    feature_type VARCHAR NOT NULL,
    violation_details JSONB,
    warning_sent BOOLEAN DEFAULT FALSE,
    restriction_applied BOOLEAN DEFAULT FALSE,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_violations_user_feature ON usage_violations(user_id, feature_type);

-- User Restrictions Table
CREATE TABLE IF NOT EXISTS user_restrictions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature_type VARCHAR NOT NULL,
    restriction_type VARCHAR NOT NULL, -- 'rate_limit', 'temporary_ban', 'under_review'
    start_time TIMESTAMP DEFAULT NOW(),
    end_time TIMESTAMP,
    reason TEXT,
    can_appeal BOOLEAN DEFAULT TRUE,
    appeal_submitted BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_restrictions_user_active ON user_restrictions(user_id, is_active);

-- Usage Appeals Table
CREATE TABLE IF NOT EXISTS usage_appeals (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restriction_id VARCHAR NOT NULL REFERENCES user_restrictions(id) ON DELETE CASCADE,
    appeal_reason TEXT,
    status VARCHAR DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    admin_response TEXT,
    reviewed_by VARCHAR REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP
);

-- Add comments for documentation
COMMENT ON TABLE ai_usage_tracking IS 'Tracks per-user usage of AI features with daily/weekly/monthly counters';
COMMENT ON TABLE usage_violations IS 'Records violations of usage limits and suspicious patterns';
COMMENT ON TABLE user_restrictions IS 'Active restrictions applied to users for usage violations';
COMMENT ON TABLE usage_appeals IS 'User appeals against usage restrictions';

COMMENT ON COLUMN ai_usage_tracking.feature_type IS 'Type of AI feature: cv_job_duties, supporting_info, cover_letter, interview_practice, qa_generator';
COMMENT ON COLUMN usage_violations.violation_type IS 'Type of violation: excessive_usage, rapid_requests, suspicious_pattern';
COMMENT ON COLUMN user_restrictions.restriction_type IS 'Type of restriction: rate_limit, temporary_ban, under_review';
