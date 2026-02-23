-- Fix missing columns in quotations table (added to entity but not in DB)
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS et_count INTEGER NOT NULL DEFAULT 1;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS ree_count INTEGER NOT NULL DEFAULT 1;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS obs_count INTEGER DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS sup_count INTEGER DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS exp_count INTEGER DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS evaluation_duration_days DOUBLE PRECISION;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS dag_comments TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS sent_to_dag_date TIMESTAMP;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS approved_by_dag_date TIMESTAMP;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS sent_to_oec_date TIMESTAMP;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS validated_by_oec_date TIMESTAMP;

-- Fix missing columns in evaluation_teams table (date negotiation fields)
ALTER TABLE evaluation_teams ADD COLUMN IF NOT EXISTS proposed_evaluation_date DATE;
ALTER TABLE evaluation_teams ADD COLUMN IF NOT EXISTS oec_proposed_date DATE;
ALTER TABLE evaluation_teams ADD COLUMN IF NOT EXISTS evaluation_date_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE evaluation_teams ADD COLUMN IF NOT EXISTS date_refusal_reason TEXT;
ALTER TABLE evaluation_teams ADD COLUMN IF NOT EXISTS dossier_unlocked BOOLEAN DEFAULT FALSE;

-- Fix missing columns in team_members table if any
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS mandatement_message TEXT;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS mandatement_sent_at TIMESTAMP;

SELECT 'Migration completed successfully' AS result;
