-- Drop the old constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint with all roles including GES_COMPETENCES, EVALUATEUR, FORMATEUR
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('ADMIN', 'CD', 'RA', 'DAG', 'DT', 'OEC', 'EXPERT', 'REE', 'ET', 'EQ', 'CAS_MEMBER', 'CAS_PRESIDENT', 'DG', 'GES_COMPETENCES', 'EVALUATEUR', 'FORMATEUR'));
