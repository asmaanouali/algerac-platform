-- Idempotent seed: oec2 accredited + surveillance S1 approaching (FOR 68 requested)
-- Login: oec2@algeractestapp.dz / password123
-- RA: ra.d2.01@algeractestapp.dz / password123

DO $$
DECLARE
    v_oec_id BIGINT;
    v_ra_id BIGINT;
    v_cd_id BIGINT;
    v_dept_id BIGINT;
    v_req_id BIGINT;
    v_report_id BIGINT;
    v_decision_id BIGINT;
    v_cert_id BIGINT;
    v_plan_id BIGINT;
    v_issue_date TIMESTAMP := NOW() - INTERVAL '11 months';
    v_base_date TIMESTAMP := NOW() - INTERVAL '16 months';
    v_eval_date TIMESTAMP := NOW() + INTERVAL '45 days';
BEGIN
    IF EXISTS (SELECT 1 FROM accreditation_requests WHERE reference_number = 'D-2025-011') THEN
        RAISE NOTICE 'D-2025-011 already exists, skipping.';
        RETURN;
    END IF;

    SELECT id INTO v_oec_id FROM users WHERE email = 'oec2@algeractestapp.dz';
    SELECT id INTO v_ra_id FROM users WHERE email = 'ra.d2.01@algeractestapp.dz';
    SELECT id INTO v_cd_id FROM users WHERE email = 'cd.domaine2@algeractestapp.dz';
    SELECT id INTO v_dept_id FROM departments WHERE code = 'INSPECTION' LIMIT 1;

    IF v_oec_id IS NULL THEN
        RAISE EXCEPTION 'oec2@algeractestapp.dz not found';
    END IF;

    INSERT INTO accreditation_requests (
        reference_number, oec_id, assigned_to_ra, assigned_to_cd, department_id,
        type, domain, description, status, progress,
        submission_date, assignment_date, receivability_decision_date, is_receivable,
        evaluation_start_date, evaluation_end_date, cas_decision_date,
        certificate_issue_date, certificate_expiration_date,
        current_phase, current_step, next_action, pending_with, created_at, is_new_oec
    ) VALUES (
        'D-2025-011', v_oec_id, v_ra_id, v_cd_id, v_dept_id,
        'INITIAL',
        'Organisme d''Inspection - Équipements sous Pression',
        'Accréditation ISO/IEC 17020 type A déjà délivrée. Première surveillance (S1) approchante.',
        'SURVEILLANCE_SCHEDULED', 100,
        v_base_date, v_base_date + INTERVAL '3 days', v_base_date + INTERVAL '12 days', true,
        v_base_date + INTERVAL '3 months', v_base_date + INTERVAL '3 months 4 days',
        v_base_date + INTERVAL '5 months',
        v_issue_date, v_issue_date + INTERVAL '4 years',
        'Phase IV : Surveillance Périodique',
        'Documents demandés (FOR 68)',
        'OEC soumet les documents FOR 68 pour la surveillance S1',
        'OEC',
        v_base_date,
        false
    ) RETURNING id INTO v_req_id;

    INSERT INTO evaluation_reports (
        request_id, report_number, type, conclusion_and_recommendation,
        status, validated_bycd, created_at
    ) VALUES (
        v_req_id, 'RAP-2025-011', 'FOR_08_INSPECTION',
        'FAVORABLE - Accréditation recommandée portée complète.',
        'VALIDATED', true, v_base_date + INTERVAL '4 months'
    ) RETURNING id INTO v_report_id;

    INSERT INTO cas_decisions (
        request_id, report_id, decision_number, decision_type, meeting_date,
        justification, scope, appeal_right_notified, created_at
    ) VALUES (
        v_req_id, v_report_id, 'DEC-CAS-2025-011', 'GRANT_FULL',
        v_base_date + INTERVAL '5 months',
        'L''OEC a démontré sa conformité aux exigences ISO/IEC 17020.',
        'Inspection d''équipements sous pression - type A',
        true, v_base_date + INTERVAL '5 months'
    ) RETURNING id INTO v_decision_id;

    INSERT INTO accreditation_certificates (
        request_id, cas_decision_id, certificate_number, issue_date, expiration_date,
        oec_identity, scope, technical_domains, methods_and_standards,
        accreditation_standard_reference, signed_bydg, signed_bydt, published, created_at
    ) VALUES (
        v_req_id, v_decision_id, 'CERT-ALGERAC-2025-011',
        v_issue_date, v_issue_date + INTERVAL '4 years',
        'Bureau d''Inspection Algérien',
        'Inspection des équipements sous pression selon ISO/IEC 17020 type A',
        'Inspection industrielle - équipements sous pression',
        'ISO/IEC 17020:2012, réglementation ESP',
        'ISO/IEC 17020:2012', true, true, true, v_issue_date
    ) RETURNING id INTO v_cert_id;

    INSERT INTO surveillance_plans (
        certificate_id, plan_code, surveillance_calendar, frequency, scope_sampling,
        estimated_duration_per_evaluation, cycle_number, cycle_duration_years, surveillance_count,
        next_surveillance_date, drafted_by_ra_id, drafted_at, submitted_tocdat,
        validated_bycd, cd_validation_date, sent_tooecat, oec_acknowledged, oec_acknowledged_at,
        satisfaction_formfor22sent, created_at
    ) VALUES (
        v_cert_id, 'SURV-2025-011',
        'S1 à 12 mois, S2 à 24 mois, S3 à 36 mois',
        'Annuelle',
        'S1: inspection ESP site Oran; S2: procédures + personnel; S3: portée complète',
        3, 1, 3, 2,
        v_eval_date, v_ra_id, v_issue_date + INTERVAL '5 days', v_issue_date + INTERVAL '7 days',
        true, v_issue_date + INTERVAL '10 days', v_issue_date + INTERVAL '12 days',
        true, v_issue_date + INTERVAL '15 days',
        true, v_issue_date + INTERVAL '5 days'
    ) RETURNING id INTO v_plan_id;

    INSERT INTO surveillance_evaluations (
        request_id, certificate_id, surveillance_plan_id, evaluation_code, evaluation_type,
        status, evaluation_date, focus_scope, documents_request_sent, finding_deadline_months, created_at
    ) VALUES (
        v_req_id, v_cert_id, v_plan_id, 'SURV-EVAL-2025-011', 'SURVEILLANCE',
        'DOCUMENTS_REQUESTED', v_eval_date,
        'Surveillance S1 - échantillonnage inspection ESP (site Oran)',
        true, 3, NOW() - INTERVAL '5 days'
    );

    INSERT INTO notifications (user_id, title, message, type, link, read, created_at)
    VALUES (
        v_oec_id,
        'Surveillance S1 — documents requis (FOR 68)',
        'Votre première évaluation de surveillance approche (dans ~45 jours). Veuillez soumettre les documents FOR 68 pour le dossier D-2025-011.',
        'warning', '/oec/surveillance', false, NOW() - INTERVAL '5 days'
    );

    IF v_ra_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, message, type, link, read, created_at)
        VALUES (
            v_ra_id,
            'Surveillance S1 programmée — D-2025-011',
            'La surveillance S1 de oec2 (Bureau d''Inspection Algérien) est programmée. FOR 68 envoyé, en attente des documents OEC.',
            'info', '/ra/surveillance', false, NOW() - INTERVAL '5 days'
        );
    END IF;

    RAISE NOTICE 'Seeded D-2025-011 for oec2 (request %, cert %, plan %, eval date %)',
        v_req_id, v_cert_id, v_plan_id, v_eval_date;
END $$;
