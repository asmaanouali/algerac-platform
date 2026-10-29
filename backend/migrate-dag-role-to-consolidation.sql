-- Le rôle DAG a été renommé CONSOLIDATION (enum UserRole). Les utilisateurs existants
-- avec role = 'DAG' provoquent: "No enum constant com.algerac.model.UserRole.DAG".
-- La contrainte CHECK générée par Hibernate est aussi obsolète (liste d'anciens rôles).
-- À exécuter une fois sur les bases existantes.
BEGIN;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

UPDATE users SET role = 'CONSOLIDATION' WHERE role = 'DAG';

-- Rôles multiples (liste séparée par des virgules)
UPDATE users
SET roles = array_to_string(
        ARRAY(SELECT DISTINCT CASE WHEN trim(r) = 'DAG' THEN 'CONSOLIDATION' ELSE trim(r) END
              FROM unnest(string_to_array(roles, ',')) AS r),
        ',')
WHERE roles IS NOT NULL AND roles ~ '(^|,)\s*DAG\s*(,|$)';

ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN (
    'ADMIN', 'CD', 'RA', 'DT', 'OEC', 'EXPERT', 'REE', 'ET', 'EQ', 'EF',
    'CAS_MEMBER', 'CAS_PRESIDENT', 'DG', 'GES_COMPETENCES', 'FORMATEUR',
    'RQ', 'SUP', 'CONSOLIDATION'));

COMMIT;
