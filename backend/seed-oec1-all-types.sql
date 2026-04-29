-- Seed: 4 demandes SOUMISES pour oec1 (un de chaque type)
-- Types: INITIAL (monosite), EXTENSION, RENOUVELLEMENT, INITIAL (multisites)

-- Nettoyage des demandes existantes pour cet OEC en statut SUBMITTED
DELETE FROM accreditation_requests
WHERE oec_id = (SELECT id FROM users WHERE email = 'oec1@algeractestapp.dz')
  AND status = 'SUBMITTED';

-- 1) INITIAL (monosite)
INSERT INTO accreditation_requests (
    oec_id, type, domain, description,
    status, progress, submission_date, created_at,
    pending_with, current_phase, current_step, is_multisite
)
SELECT u.id, 'INITIAL',
    'Laboratoire d''Essais - Essais Physiques et Chimiques',
    'Demande d''accréditation initiale ISO/IEC 17025 pour essais physiques et chimiques sur matériaux de construction.',
    'SUBMITTED', 10, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days',
    'DT', 'INITIAL_REVIEW', 'dt_review_pending', false
FROM users u WHERE u.email = 'oec1@algeractestapp.dz';

-- 2) EXTENSION
INSERT INTO accreditation_requests (
    oec_id, type, domain, description,
    status, progress, submission_date, created_at,
    pending_with, current_phase, current_step, is_multisite
)
SELECT u.id, 'EXTENSION',
    'Laboratoire d''Essais - Extension Microbiologie Alimentaire',
    'Demande d''extension de portée d''accréditation ISO/IEC 17025 pour inclure essais microbiologiques (Salmonella, E. coli, Listeria) sur produits alimentaires.',
    'SUBMITTED', 10, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days',
    'DT', 'INITIAL_REVIEW', 'dt_review_pending', false
FROM users u WHERE u.email = 'oec1@algeractestapp.dz';

-- 3) RENOUVELLEMENT
INSERT INTO accreditation_requests (
    oec_id, type, domain, description,
    status, progress, submission_date, created_at,
    pending_with, current_phase, current_step, is_multisite
)
SELECT u.id, 'RENOUVELLEMENT',
    'Laboratoire d''Étalonnage - Métrologie',
    'Demande de renouvellement d''accréditation ISO/IEC 17025 pour étalonnage température, pression et dimensions. Cycle d''accréditation maintenu sans interruption depuis 4 ans.',
    'SUBMITTED', 10, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days',
    'DT', 'INITIAL_REVIEW', 'dt_review_pending', false
FROM users u WHERE u.email = 'oec1@algeractestapp.dz';

-- 4) INITIAL multisites (PRO 26)
INSERT INTO accreditation_requests (
    oec_id, type, domain, description,
    status, progress, submission_date, created_at,
    pending_with, current_phase, current_step, is_multisite
)
SELECT u.id, 'INITIAL',
    'Organisme d''Inspection Multisites - Équipements sous Pression',
    'Demande d''accréditation initiale ISO/IEC 17020 multisites (PRO 26) pour inspection d''équipements industriels sous pression. Siège à Alger + 3 sites satellites (Oran, Constantine, Annaba).',
    'SUBMITTED', 10, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day',
    'DT', 'INITIAL_REVIEW', 'dt_review_pending', true
FROM users u WHERE u.email = 'oec1@algeractestapp.dz';

-- Vérification
SELECT
    ar.id,
    ar.type,
    CASE WHEN ar.is_multisite THEN 'MULTISITES' ELSE 'MONOSITE' END AS site_mode,
    ar.status,
    ar.domain,
    ar.submission_date::date AS soumis_le
FROM accreditation_requests ar
JOIN users u ON ar.oec_id = u.id
WHERE u.email = 'oec1@algeractestapp.dz'
ORDER BY ar.submission_date DESC;
