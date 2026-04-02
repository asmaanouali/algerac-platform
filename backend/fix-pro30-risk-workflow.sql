-- PRO 30 : Migration - Alignement avec la procédure de gestion des risques et opportunités
-- Exécuter ce script sur la base PostgreSQL avant de redémarrer le backend

-- 1. Supprimer les contraintes CHECK existantes sur les colonnes enum
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'risk_opportunity_registers'
          AND con.contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE risk_opportunity_registers DROP CONSTRAINT IF EXISTS ' || r.conname;
    END LOOP;
END $$;

-- 2. Migrer les valeurs de likelihood (5 niveaux → 3 niveaux)
UPDATE risk_opportunity_registers SET likelihood = 'UNLIKELY' WHERE likelihood = 'RARE';
-- UNLIKELY stays UNLIKELY
UPDATE risk_opportunity_registers SET likelihood = 'PROBABLE' WHERE likelihood IN ('POSSIBLE', 'LIKELY');
-- ALMOST_CERTAIN stays ALMOST_CERTAIN

-- 3. Migrer les valeurs de impact (5 niveaux → 3 niveaux : INSIGNIFICANT, MODERATE, SEVERE)
UPDATE risk_opportunity_registers SET impact = 'INSIGNIFICANT' WHERE impact IN ('NEGLIGIBLE', 'MINOR');
-- MODERATE stays MODERATE
UPDATE risk_opportunity_registers SET impact = 'SEVERE' WHERE impact IN ('MAJOR', 'CRITICAL');

-- 4. Migrer les valeurs de level (4 niveaux → 3 niveaux : LOW, MEDIUM, HIGH)
-- LOW stays LOW, MEDIUM stays MEDIUM, HIGH stays HIGH
UPDATE risk_opportunity_registers SET level = 'HIGH' WHERE level = 'CRITICAL';

-- 5. Migrer les valeurs de status (ancien workflow → nouveau workflow PRO 30)
-- IDENTIFIED stays IDENTIFIED
UPDATE risk_opportunity_registers SET status = 'ANALYZED' WHERE status = 'ANALYZING';
UPDATE risk_opportunity_registers SET status = 'VALIDATED' WHERE status = 'TREATMENT_PLAN';
-- IN_TREATMENT stays IN_TREATMENT
-- MONITORED stays MONITORED
UPDATE risk_opportunity_registers SET status = 'MONITORED' WHERE status = 'MITIGATED';
UPDATE risk_opportunity_registers SET status = 'CLOSED' WHERE status = 'ACCEPTED';
-- CLOSED stays CLOSED

-- 6. Migrer les valeurs de category (anciens → nouveaux domaines PRO 30)
UPDATE risk_opportunity_registers SET category = 'OTHER' WHERE category IN ('STRATEGIC', 'OPERATIONAL', 'FINANCIAL', 'REPUTATIONAL');
UPDATE risk_opportunity_registers SET category = 'MINISTRY' WHERE category = 'REGULATORY';
UPDATE risk_opportunity_registers SET category = 'ASSESSMENTS' WHERE category = 'TECHNICAL';
UPDATE risk_opportunity_registers SET category = 'STAFF' WHERE category IN ('HUMAN_RESOURCES', 'COMPETENCE');
UPDATE risk_opportunity_registers SET category = 'OTHER' WHERE category = 'INFORMATION_SECURITY';
-- IMPARTIALITY stays IMPARTIALITY

-- 7. Ajouter les nouvelles colonnes pour le risque résiduel et la validation
ALTER TABLE risk_opportunity_registers ADD COLUMN IF NOT EXISTS residual_doc_control TEXT;
ALTER TABLE risk_opportunity_registers ADD COLUMN IF NOT EXISTS residual_competence TEXT;
ALTER TABLE risk_opportunity_registers ADD COLUMN IF NOT EXISTS residual_control_level TEXT;
ALTER TABLE risk_opportunity_registers ADD COLUMN IF NOT EXISTS residual_mastery VARCHAR(50);
ALTER TABLE risk_opportunity_registers ADD COLUMN IF NOT EXISTS submitted_by_id BIGINT;
ALTER TABLE risk_opportunity_registers ADD COLUMN IF NOT EXISTS validated_by_id BIGINT;
ALTER TABLE risk_opportunity_registers ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;
ALTER TABLE risk_opportunity_registers ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP;

-- 8. Ajouter les contraintes de clé étrangère
ALTER TABLE risk_opportunity_registers
    ADD CONSTRAINT IF NOT EXISTS fk_risk_submitted_by
    FOREIGN KEY (submitted_by_id) REFERENCES users(id);

ALTER TABLE risk_opportunity_registers
    ADD CONSTRAINT IF NOT EXISTS fk_risk_validated_by
    FOREIGN KEY (validated_by_id) REFERENCES users(id);

SELECT 'Migration PRO 30 terminée avec succès' AS result;
