-- Script pour créer des demandes de test pour le CD
-- Ces demandes auront le statut PAYMENT_COMPLETED et seront visibles au CD

-- Insérer des demandes d'accréditation de test
INSERT INTO accreditation_requests (
    oec_id, 
    type, 
    domain, 
    description, 
    status, 
    progress, 
    submission_date, 
    created_at
) 
SELECT 
    u.id,
    'INITIAL',
    'Laboratoire d''Essais - Matériaux de Construction',
    'Demande d''accréditation initiale pour laboratoire de test de matériaux de construction selon norme ISO/IEC 17025',
    'PAYMENT_COMPLETED',
    25,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
FROM users u WHERE u.email = 'oec.test@algerac.dz'
ON CONFLICT DO NOTHING;

INSERT INTO accreditation_requests (
    oec_id, 
    type, 
    domain, 
    description, 
    status, 
    progress, 
    submission_date, 
    created_at
) 
SELECT 
    u.id,
    'INITIAL',
    'Organisme d''Inspection - Équipements sous Pression',
    'Accréditation pour inspection d''équipements sous pression conformément à la norme ISO/IEC 17020',
    'PAYMENT_COMPLETED',
    25,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
FROM users u WHERE u.email = 'oec.test@algerac.dz'
ON CONFLICT DO NOTHING;

INSERT INTO accreditation_requests (
    oec_id, 
    type, 
    domain, 
    description, 
    status, 
    progress, 
    submission_date, 
    created_at
) 
SELECT 
    u.id,
    'EXTENSION',
    'Laboratoire d''Essais - Essais Électriques',
    'Extension de portée pour inclure les essais électriques haute tension',
    'PAYMENT_COMPLETED',
    25,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours'
FROM users u WHERE u.email = 'oec.test@algerac.dz'
ON CONFLICT DO NOTHING;

INSERT INTO accreditation_requests (
    oec_id, 
    type, 
    domain, 
    description, 
    status, 
    progress, 
    submission_date, 
    created_at
) 
SELECT 
    u.id,
    'INITIAL',
    'Organisme de Certification - Systèmes de Management',
    'Demande d''accréditation pour certification ISO 9001 et ISO 14001',
    'PAYMENT_COMPLETED',
    25,
    NOW() - INTERVAL '5 hours',
    NOW() - INTERVAL '5 hours'
FROM users u WHERE u.email = 'oec.test@algerac.dz'
ON CONFLICT DO NOTHING;

-- Créer les paiements correspondants
INSERT INTO payments (
    request_id,
    amount,
    status,
    payment_method,
    description,
    created_at
)
SELECT 
    ar.id,
    5000.00,
    'COMPLETED',
    'CCP',
    'Frais de dossier',
    ar.created_at
FROM accreditation_requests ar
WHERE ar.status = 'PAYMENT_COMPLETED' 
AND NOT EXISTS (
    SELECT 1 FROM payments p WHERE p.request_id = ar.id
);

-- Vérification
SELECT 'Demandes créées:' as message, COUNT(*) as count 
FROM accreditation_requests 
WHERE status = 'PAYMENT_COMPLETED';

SELECT 'Détails des demandes créées:' as message;
SELECT 
    ar.id,
    ar.type,
    ar.domain,
    ar.status,
    u.organization_name as oec,
    ar.submission_date
FROM accreditation_requests ar
JOIN users u ON ar.oec_id = u.id
WHERE ar.status = 'PAYMENT_COMPLETED'
ORDER BY ar.submission_date DESC;
