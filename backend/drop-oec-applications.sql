-- Suppression de la table oec_applications.
-- Un nouvel OEC est désormais représenté uniquement par users (PENDING) + accreditation_requests.

BEGIN;

-- Reprise des candidatures encore en attente du DT qui n'ont pas de demande liée,
-- pour qu'elles restent visibles côté DT (demandes d'accréditation).
INSERT INTO accreditation_requests
    (oec_id, type, domain, description, status, progress, current_phase, current_step,
     next_action, pending_with, is_new_oec, submission_date, created_at)
SELECT u.id,
       CASE lower(coalesce(a.type_demande, 'initiale'))
            WHEN 'extension' THEN 'EXTENSION'
            WHEN 'transfert' THEN 'EXTENSION'
            WHEN 'renouvellement' THEN 'RENOUVELLEMENT'
            ELSE 'INITIAL'
       END,
       coalesce(nullif(a.portee_accreditation, ''), 'À définir'),
       a.form_data_json,
       'PENDING_DT_REVIEW', 5, 'INITIAL', 'Dossier en cours d''examen',
       'Votre dossier est en cours d''examen par ALGERAC.', 'DT', TRUE,
       a.created_at, a.created_at
FROM oec_applications a
JOIN users u ON u.email = a.email AND u.status = 'PENDING'
WHERE a.status = 'PENDING_DT'
  AND NOT EXISTS (SELECT 1 FROM accreditation_requests r WHERE r.oec_id = u.id);

DROP TABLE IF EXISTS oec_applications;

COMMIT;
