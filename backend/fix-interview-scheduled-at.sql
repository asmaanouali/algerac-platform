-- Add interviewScheduledAt column to track when the interview was scheduled (for 7-day deadline)
ALTER TABLE users ADD COLUMN IF NOT EXISTS interview_scheduled_at TIMESTAMP;

-- Backfill: set interviewScheduledAt for existing INTERVIEW_SCHEDULED candidates using their createdAt as approximation
UPDATE users SET interview_scheduled_at = created_at 
WHERE status = 'INTERVIEW_SCHEDULED' AND interview_scheduled_at IS NULL AND interview_date IS NOT NULL;
