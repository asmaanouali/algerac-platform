-- Add new columns to users table
-- Run this script against the algerac_db database

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS blacklisted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS blacklist_reason VARCHAR(1000),
    ADD COLUMN IF NOT EXISTS blacklisted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS consent_oec_data VARCHAR(50),
    ADD COLUMN IF NOT EXISTS consent_oec_data_details TEXT,
    ADD COLUMN IF NOT EXISTS rejection_type VARCHAR(50);
