-- PRO 07 & PRO 16: Add FOR 14 and FOR 15 columns to CAS tables
-- Run this migration to add the new fields for full PRO 07/PRO 16 compliance

-- CAS Votes: FOR 14 fields (Avis des membres CAS)
ALTER TABLE cas_votes ADD COLUMN IF NOT EXISTS for14_opinion TEXT;
ALTER TABLE cas_votes ADD COLUMN IF NOT EXISTS for14_technical_remarks TEXT;
ALTER TABLE cas_votes ADD COLUMN IF NOT EXISTS for14_scope_remarks TEXT;
ALTER TABLE cas_votes ADD COLUMN IF NOT EXISTS for14_recommendation TEXT;
ALTER TABLE cas_votes ADD COLUMN IF NOT EXISTS for14_conformity_assessment VARCHAR(50);
ALTER TABLE cas_votes ADD COLUMN IF NOT EXISTS for14_competence_assessment VARCHAR(50);
ALTER TABLE cas_votes ADD COLUMN IF NOT EXISTS for14_impartiality_assessment VARCHAR(50);
ALTER TABLE cas_votes ADD COLUMN IF NOT EXISTS has_conflict_of_interest BOOLEAN DEFAULT FALSE;
ALTER TABLE cas_votes ADD COLUMN IF NOT EXISTS conflict_description TEXT;

-- CAS Meetings: PRO 07 convocation/quorum + PRO 16 FOR 15 fields
ALTER TABLE cas_meetings ADD COLUMN IF NOT EXISTS summons_sent_at TIMESTAMP;
ALTER TABLE cas_meetings ADD COLUMN IF NOT EXISTS dossier_sent_at TIMESTAMP;
ALTER TABLE cas_meetings ADD COLUMN IF NOT EXISTS quorum_required INTEGER DEFAULT 3;
ALTER TABLE cas_meetings ADD COLUMN IF NOT EXISTS attendees_confirmed INTEGER DEFAULT 0;
ALTER TABLE cas_meetings ADD COLUMN IF NOT EXISTS quorum_reached BOOLEAN DEFAULT FALSE;
ALTER TABLE cas_meetings ADD COLUMN IF NOT EXISTS for15_decision_justification TEXT;
ALTER TABLE cas_meetings ADD COLUMN IF NOT EXISTS for15_conditions TEXT;
ALTER TABLE cas_meetings ADD COLUMN IF NOT EXISTS for15_scope_decision TEXT;
ALTER TABLE cas_meetings ADD COLUMN IF NOT EXISTS for15_reserves_to_lift TEXT;
ALTER TABLE cas_meetings ADD COLUMN IF NOT EXISTS for15_reserves_deadline TIMESTAMP;
ALTER TABLE cas_meetings ADD COLUMN IF NOT EXISTS for15_appeal_rights_notice TEXT;
ALTER TABLE cas_meetings ADD COLUMN IF NOT EXISTS meeting_minutes TEXT;
ALTER TABLE cas_meetings ADD COLUMN IF NOT EXISTS voting_opened_at TIMESTAMP;
ALTER TABLE cas_meetings ADD COLUMN IF NOT EXISTS voting_closed_at TIMESTAMP;
ALTER TABLE cas_meetings ADD COLUMN IF NOT EXISTS decided_at TIMESTAMP;
