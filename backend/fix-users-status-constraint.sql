-- Drop the old users status constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;

-- Add new constraint with all status values including interview statuses
ALTER TABLE users ADD CONSTRAINT users_status_check
  CHECK (status IN (
    'PENDING',
    'INTERVIEW_SCHEDULED',
    'INTERVIEW_CONFIRMED',
    'INTERVIEW_COMPLETED',
    'CANDIDATURE_APPROVED',
    'APPROVED',
    'REJECTED'
  ));
