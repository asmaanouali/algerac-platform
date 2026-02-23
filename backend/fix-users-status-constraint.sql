-- Drop the old users status constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;

-- Add new constraint with all status values including CANDIDATURE_APPROVED
ALTER TABLE users ADD CONSTRAINT users_status_check
  CHECK (status IN (
    'PENDING',
    'CANDIDATURE_APPROVED',
    'APPROVED',
    'REJECTED'
  ));
