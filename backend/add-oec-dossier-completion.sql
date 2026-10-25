-- Inscription OEC en deux temps : étapes 1-3 à l'inscription, reste du DOC1 après création du compte (délai 15 jours).
-- À exécuter une fois si le schéma n'est pas géré par DDL_AUTO=update.

ALTER TABLE users ADD COLUMN IF NOT EXISTS dossier_deadline TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dossier_completed_at TIMESTAMP;

-- Nouvelles valeurs d'enum : UserStatus.SUSPENDED, RequestStatus.PENDING_ACCOUNT_CREATION / PENDING_DOSSIER_COMPLETION.
-- Hibernate peut avoir généré des contraintes CHECK sur ces colonnes : on les supprime pour accepter les nouvelles valeurs.
DO $$
DECLARE
    c RECORD;
BEGIN
    FOR c IN
        SELECT conrelid::regclass AS tbl, conname
        FROM pg_constraint
        WHERE contype = 'c'
          AND conrelid IN ('users'::regclass, 'accreditation_requests'::regclass)
          AND pg_get_constraintdef(oid) ILIKE '%status%'
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', c.tbl, c.conname);
    END LOOP;
END $$;
