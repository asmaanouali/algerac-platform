-- Add per-member documentary review result columns to team_members table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='team_members' AND column_name='doc_review_results') THEN
    ALTER TABLE team_members ADD COLUMN doc_review_results TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='team_members' AND column_name='doc_review_deficiencies') THEN
    ALTER TABLE team_members ADD COLUMN doc_review_deficiencies TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='team_members' AND column_name='doc_review_submitted_at') THEN
    ALTER TABLE team_members ADD COLUMN doc_review_submitted_at TIMESTAMP;
  END IF;
END $$;
