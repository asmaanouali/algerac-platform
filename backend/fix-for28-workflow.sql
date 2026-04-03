-- Migration: Add FOR28 secure token columns to users table
-- This supports the split workflow: FOR20 (CV) → profile analysis → FOR28 (documents via secure link)

ALTER TABLE users ADD COLUMN IF NOT EXISTS for28_token VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS for28_token_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS for28_submitted_at TIMESTAMP;

-- Update status constraint to include new statuses
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (
    status IN (
        'PENDING',
        'PROFILE_PRESELECTED',
        'DOCUMENTS_SUBMITTED',
        'INTERVIEW_SCHEDULED',
        'INTERVIEW_CONFIRMED',
        'INTERVIEW_COMPLETED',
        'CANDIDATURE_APPROVED',
        'APPROVED',
        'REJECTED'
    )
);
