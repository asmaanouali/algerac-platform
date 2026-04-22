-- Seed an ACTIVE accreditation for oec1@algeractestapp.dz
-- Run this to enable testing the transfer procedure

-- Insert accreditation request with ACTIVE status
INSERT INTO accreditation_requests (
    reference_number,
    oec_id,
    type,
    domain,
    description,
    status,
    progress,
    submission_date,
    assignment_date,
    receivability_decision_date,
    is_receivable,
    evaluation_start_date,
    evaluation_end_date,
    cas_decision_date,
    certificate_issue_date,
    certificate_expiration_date,
    current_phase,
    current_step,
    next_action,
    pending_with,
    created_at
)
SELECT
    'D-2026-OEC1-001',
    u.id,
    'INITIAL',
    'Laboratoire d''Essais - Essais Physiques et Chimiques',
    'Accréditation initiale ISO/IEC 17025 pour essais physiques et chimiques sur matériaux.',
    'ACTIVE',
    100,
    NOW() - INTERVAL '10 months',
    NOW() - INTERVAL '10 months' + INTERVAL '3 days',
    NOW() - INTERVAL '9 months',
    true,
    NOW() - INTERVAL '7 months',
    NOW() - INTERVAL '6 months' + INTERVAL '25 days',
    NOW() - INTERVAL '5 months',
    NOW() - INTERVAL '4 months' + INTERVAL '15 days',
    NOW() - INTERVAL '4 months' + INTERVAL '15 days' + INTERVAL '4 years',
    'SURVEILLANCE',
    'surveillance_scheduled',
    'Prochaine évaluation de surveillance prévue',
    'ALGERAC',
    NOW() - INTERVAL '10 months'
FROM users u
WHERE u.email = 'oec1@algeractestapp.dz'
ON CONFLICT (reference_number) DO NOTHING;

-- Insert the corresponding certificate
INSERT INTO accreditation_certificates (
    request_id,
    certificate_number,
    issue_date,
    expiration_date,
    oec_identity,
    scope,
    technical_domains,
    methods_and_standards,
    concerned_sites,
    accreditation_standard_reference,
    signed_by_dg,
    signed_by_dt,
    published,
    created_at
)
SELECT
    ar.id,
    'CERT-2026-OEC1-001',
    NOW() - INTERVAL '4 months' + INTERVAL '15 days',
    NOW() - INTERVAL '4 months' + INTERVAL '15 days' + INTERVAL '4 years',
    'Laboratoire National d''Essais - Dr. Belaid Aissa - Alger, Algérie',
    'Essais physiques et chimiques sur matériaux de construction et industriels',
    'Laboratoire d''essais - ISO/IEC 17025',
    'ISO/IEC 17025:2017, NF EN 12390, NF EN 196, AFNOR',
    'Laboratoire National d''Essais, Alger',
    'ISO/IEC 17025:2017',
    true,
    true,
    true,
    NOW() - INTERVAL '4 months' + INTERVAL '15 days'
FROM accreditation_requests ar
WHERE ar.reference_number = 'D-2026-OEC1-001'
ON CONFLICT (certificate_number) DO NOTHING;

-- Verify
SELECT ar.id, ar.reference_number, ar.status, u.email, ac.certificate_number
FROM accreditation_requests ar
JOIN users u ON ar.oec_id = u.id
LEFT JOIN accreditation_certificates ac ON ac.request_id = ar.id
WHERE u.email = 'oec1@algeractestapp.dz' AND ar.status = 'ACTIVE';
