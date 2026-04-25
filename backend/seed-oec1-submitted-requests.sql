-- 5 demandes d'accréditation soumises par oec1
-- Status: SUBMITTED (remplies et soumises, en attente de revue DT)

INSERT INTO accreditation_requests (
    oec_id,
    type,
    domain,
    description,
    status,
    progress,
    submission_date,
    created_at,
    pending_with,
    current_phase,
    current_step
)
SELECT
    u.id,
    'INITIAL',
    'Laboratoire d''Essais - Essais Physiques et Chimiques',
    'Demande d''accréditation initiale selon la norme ISO/IEC 17025 pour la réalisation d''essais physiques et chimiques sur matériaux de construction, métaux et alliages. Le laboratoire dispose d''équipements certifiés et d''un personnel qualifié avec plus de 10 ans d''expérience.',
    'SUBMITTED',
    10,
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '4 days',
    'DT',
    'INITIAL_REVIEW',
    'dt_review_pending'
FROM users u WHERE u.email = 'oec1@algeractestapp.dz'
ON CONFLICT DO NOTHING;

INSERT INTO accreditation_requests (
    oec_id,
    type,
    domain,
    description,
    status,
    progress,
    submission_date,
    created_at,
    pending_with,
    current_phase,
    current_step
)
SELECT
    u.id,
    'INITIAL',
    'Organisme d''Inspection - Équipements Industriels sous Pression',
    'Demande d''accréditation initiale conformément à la norme ISO/IEC 17020 pour l''inspection d''équipements industriels sous pression (chaudières, réservoirs, tuyauteries). Couverture des catégories A, B et C selon la réglementation algérienne en vigueur.',
    'SUBMITTED',
    10,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days',
    'DT',
    'INITIAL_REVIEW',
    'dt_review_pending'
FROM users u WHERE u.email = 'oec1@algeractestapp.dz'
ON CONFLICT DO NOTHING;

INSERT INTO accreditation_requests (
    oec_id,
    type,
    domain,
    description,
    status,
    progress,
    submission_date,
    created_at,
    pending_with,
    current_phase,
    current_step
)
SELECT
    u.id,
    'RENOUVELLEMENT',
    'Laboratoire d''Étalonnage - Métrologie et Instrumentation',
    'Demande de renouvellement d''accréditation ISO/IEC 17025 pour les activités d''étalonnage d''instruments de mesure de température, pression et dimensions. Le laboratoire a maintenu ses exigences d''accréditation sans interruption depuis 5 ans.',
    'SUBMITTED',
    10,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days',
    'DT',
    'INITIAL_REVIEW',
    'dt_review_pending'
FROM users u WHERE u.email = 'oec1@algeractestapp.dz'
ON CONFLICT DO NOTHING;

INSERT INTO accreditation_requests (
    oec_id,
    type,
    domain,
    description,
    status,
    progress,
    submission_date,
    created_at,
    pending_with,
    current_phase,
    current_step
)
SELECT
    u.id,
    'EXTENSION',
    'Laboratoire d''Essais - Essais Microbiologiques et Alimentaires',
    'Demande d''extension de portée d''accréditation ISO/IEC 17025 pour inclure les essais microbiologiques sur produits alimentaires et eaux. Extension vers les analyses de Salmonella, E. coli, Listeria et dénombrement de la flore totale aérobie.',
    'SUBMITTED',
    10,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    'DT',
    'INITIAL_REVIEW',
    'dt_review_pending'
FROM users u WHERE u.email = 'oec1@algeractestapp.dz'
ON CONFLICT DO NOTHING;

INSERT INTO accreditation_requests (
    oec_id,
    type,
    domain,
    description,
    status,
    progress,
    submission_date,
    created_at,
    pending_with,
    current_phase,
    current_step
)
SELECT
    u.id,
    'INITIAL',
    'Organisme de Certification - Produits et Systèmes de Management',
    'Demande d''accréditation initiale selon la norme ISO/IEC 17065 pour la certification de produits industriels et de consommation, ainsi que selon ISO/IEC 17021 pour la certification de systèmes de management qualité (ISO 9001) et environnement (ISO 14001).',
    'SUBMITTED',
    10,
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '6 hours',
    'DT',
    'INITIAL_REVIEW',
    'dt_review_pending'
FROM users u WHERE u.email = 'oec1@algeractestapp.dz'
ON CONFLICT DO NOTHING;

-- Vérification
SELECT
    ar.id,
    ar.type,
    ar.domain,
    ar.status,
    ar.progress,
    ar.submission_date
FROM accreditation_requests ar
JOIN users u ON ar.oec_id = u.id
WHERE u.email = 'oec1@algeractestapp.dz'
ORDER BY ar.submission_date DESC;
