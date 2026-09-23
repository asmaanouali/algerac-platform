-- Idempotent seed: scénarios OEC 1→5
-- oec1 : demande INITIALE soumise (remplie seulement)
-- oec1 : SEED-OEC1-TEAM-VAL — INITIALE jusqu'à validation équipe par OEC
-- oec1 : SEED-OEC1-CAS-PENDING — INITIALE jusqu'à CAS (décision pas encore faite)
-- oec2 : demande EXTENSION soumise (remplie seulement)
-- oec3 : demande RENOUVELLEMENT soumise (remplie seulement)
-- oec4 : accréditation ACTIVE + demande de transfert initiée (PRO 31)
-- oec5 : accréditation ACTIVE prête pour surveillances
-- + plaintes : PLT-SEED-OEC2 (oec2) et PLT-SEED-PUBLIC (externe)
--
-- Logins: oecN@algeractestapp.dz / password123

DO $$
DECLARE
    v_oec1 BIGINT;
    v_oec2 BIGINT;
    v_oec3 BIGINT;
    v_oec4 BIGINT;
    v_oec5 BIGINT;
    v_ra1 BIGINT;
    v_ra2 BIGINT;
    v_ra3 BIGINT;
    v_cd1 BIGINT;
    v_cd2 BIGINT;
    v_req_id BIGINT;
    v_report_id BIGINT;
    v_decision_id BIGINT;
    v_cert_id BIGINT;
    v_plan_id BIGINT;
    v_issue_date TIMESTAMP;
    v_base_date TIMESTAMP;
    v_eval_date TIMESTAMP;
BEGIN
    SELECT id INTO v_oec1 FROM users WHERE email = 'oec1@algeractestapp.dz';
    SELECT id INTO v_oec2 FROM users WHERE email = 'oec2@algeractestapp.dz';
    SELECT id INTO v_oec3 FROM users WHERE email = 'oec3@algeractestapp.dz';
    SELECT id INTO v_oec4 FROM users WHERE email = 'oec4@algeractestapp.dz';
    SELECT id INTO v_oec5 FROM users WHERE email = 'oec5@algeractestapp.dz';
    SELECT id INTO v_ra1 FROM users WHERE email = 'ra.d1.01@algeractestapp.dz';
    SELECT id INTO v_ra2 FROM users WHERE email = 'ra.d2.01@algeractestapp.dz';
    SELECT id INTO v_ra3 FROM users WHERE email = 'ra.d3.01@algeractestapp.dz';
    SELECT id INTO v_cd1 FROM users WHERE email = 'cd.domaine1@algeractestapp.dz';
    SELECT id INTO v_cd2 FROM users WHERE email = 'cd.domaine2@algeractestapp.dz';

    IF v_oec1 IS NULL OR v_oec2 IS NULL OR v_oec3 IS NULL OR v_oec4 IS NULL OR v_oec5 IS NULL THEN
        RAISE EXCEPTION 'Un ou plusieurs comptes OEC manquants (oec1..oec5)';
    END IF;

    -- ═══════════════════════════════════════════════════════════
    -- OEC1 : Demande d'accréditation INITIALE (soumise, en attente DT)
    -- ═══════════════════════════════════════════════════════════
    IF NOT EXISTS (SELECT 1 FROM accreditation_requests WHERE reference_number = 'SEED-OEC1-INITIAL') THEN
        INSERT INTO accreditation_requests (
            reference_number, oec_id, type, domain, description,
            status, progress, submission_date, created_at,
            pending_with, current_phase, current_step, next_action,
            is_new_oec, is_multisite
        ) VALUES (
            'SEED-OEC1-INITIAL', v_oec1, 'INITIAL',
            'Laboratoire d''Essais - Essais Physiques et Chimiques',
            'Demande d''accréditation initiale ISO/IEC 17025 pour essais physiques et chimiques sur matériaux de construction. Formulaire rempli par l''OEC, en attente de vérification DT.',
            'PENDING_DT_REVIEW', 5, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days',
            'ALGERAC', 'INITIAL', 'Dossier en cours d''examen',
            'Votre dossier est en cours d''examen par ALGERAC.',
            false, false
        );
        RAISE NOTICE '✓ oec1: demande INITIALE (PENDING_DT_REVIEW)';
    ELSE
        RAISE NOTICE 'oec1 INITIAL déjà présent, skip';
    END IF;

    -- ═══════════════════════════════════════════════════════════
    -- OEC1 : Demande INITIALE — validation équipe d'évaluation par OEC
    -- ═══════════════════════════════════════════════════════════
    IF NOT EXISTS (SELECT 1 FROM accreditation_requests WHERE reference_number = 'SEED-OEC1-TEAM-VAL') THEN
        v_base_date := NOW() - INTERVAL '2 months';

        INSERT INTO accreditation_requests (
            reference_number, oec_id, assigned_to_ra, assigned_to_cd,
            type, domain, description, status, progress,
            submission_date, assignment_date, receivability_decision_date, is_receivable,
            current_phase, current_step, next_action, pending_with,
            created_at, is_new_oec, is_multisite
        ) VALUES (
            'SEED-OEC1-TEAM-VAL', v_oec1, v_ra1, v_cd1,
            'INITIAL',
            'Laboratoire d''Essais - Essais Environnementaux',
            'Demande d''accréditation initiale ISO/IEC 17025 pour essais environnementaux (eaux, air, sols). Composition de l''équipe envoyée à l''OEC pour validation.',
            'TEAM_SENT_TO_OEC', 35,
            v_base_date, v_base_date + INTERVAL '3 days', v_base_date + INTERVAL '12 days', true,
            'CONSTITUTION_EQUIPE', 'team_sent_to_oec',
            'OEC doit valider la composition de l''équipe d''évaluation (3 jours)',
            'OEC',
            v_base_date, false, false
        ) RETURNING id INTO v_req_id;

        INSERT INTO quotations (
            request_id, quotation_number, prepared_by_ra, approved_by_dag, status, amount,
            details, ree_count, et_count, eq_count, exp_count, evaluation_duration_days,
            sent_to_dag_date, approved_by_dag_date, sent_to_oec_date, validated_by_oec_date, created_at
        ) VALUES (
            v_req_id, 'DEV-SEED-OEC1-TEAM', v_ra1, NULL, 'VALIDATED_BY_OEC', 450000.00,
            'Évaluation initiale: 4 jours. 1 REE + 2 ET.', 1, 2, 0, 0, 4.0,
            v_base_date + INTERVAL '18 days', v_base_date + INTERVAL '20 days',
            v_base_date + INTERVAL '21 days', v_base_date + INTERVAL '28 days',
            v_base_date + INTERVAL '15 days'
        );

        INSERT INTO conventions (
            request_id, convention_number, prepared_by_ra, status,
            sent_to_oec_date, validated_by_oec_date, created_at
        ) VALUES (
            v_req_id, 'CONV-SEED-OEC1-TEAM', v_ra1, 'VALIDATED_BY_OEC',
            v_base_date + INTERVAL '21 days', v_base_date + INTERVAL '28 days',
            v_base_date + INTERVAL '15 days'
        );

        INSERT INTO evaluation_teams (
            request_id, team_code, proposed_evaluation_date, sent_tooec,
            oec_response_deadline, status, created_at
        ) VALUES (
            v_req_id, 'EQ-SEED-OEC1-TEAM', CURRENT_DATE + INTERVAL '40 days',
            NOW() - INTERVAL '1 day', NOW() + INTERVAL '2 days',
            'SENT_TO_OEC', NOW() - INTERVAL '4 days'
        );

        INSERT INTO notifications (user_id, title, message, type, link, read, created_at)
        VALUES (
            v_oec1,
            'Composition d''équipe à valider',
            'La composition de l''équipe d''évaluation pour SEED-OEC1-TEAM-VAL vous a été transmise. Merci de valider ou récuser sous 3 jours.',
            'warning', '/oec/demandes', false, NOW() - INTERVAL '1 day'
        );

        RAISE NOTICE '✓ oec1: SEED-OEC1-TEAM-VAL (TEAM_SENT_TO_OEC)';
    ELSE
        RAISE NOTICE 'oec1 TEAM-VAL déjà présent, skip';
    END IF;

    -- ═══════════════════════════════════════════════════════════
    -- OEC1 : Demande INITIALE — étape CAS (décision pas encore faite)
    -- ═══════════════════════════════════════════════════════════
    IF NOT EXISTS (SELECT 1 FROM accreditation_requests WHERE reference_number = 'SEED-OEC1-CAS-PENDING') THEN
        v_base_date := NOW() - INTERVAL '5 months';

        INSERT INTO accreditation_requests (
            reference_number, oec_id, assigned_to_ra, assigned_to_cd,
            type, domain, description, status, progress,
            submission_date, assignment_date, receivability_decision_date, is_receivable,
            evaluation_start_date, evaluation_end_date,
            current_phase, current_step, next_action, pending_with,
            created_at, is_new_oec, is_multisite
        ) VALUES (
            'SEED-OEC1-CAS-PENDING', v_oec1, v_ra1, v_cd1,
            'INITIAL',
            'Laboratoire d''Essais - Essais Non Destructifs (END)',
            'Demande d''accréditation initiale ISO/IEC 17025 pour essais non destructifs (UT, MT, PT). Rapport validé ; réunion CAS programmée, décision non encore rendue.',
            'CAS_SCHEDULED', 89,
            v_base_date, v_base_date + INTERVAL '3 days', v_base_date + INTERVAL '12 days', true,
            v_base_date + INTERVAL '3 months', v_base_date + INTERVAL '3 months 4 days',
            'DECISION_CAS', 'cas_scheduled',
            'Réunion CAS programmée — décision à rendre',
            'CAS',
            v_base_date, false, false
        ) RETURNING id INTO v_req_id;

        INSERT INTO quotations (
            request_id, quotation_number, prepared_by_ra, status, amount,
            details, ree_count, et_count, eq_count, exp_count, evaluation_duration_days,
            validated_by_oec_date, created_at
        ) VALUES (
            v_req_id, 'DEV-SEED-OEC1-CAS', v_ra1, 'VALIDATED_BY_OEC', 520000.00,
            'Évaluation initiale END: 5 jours.', 1, 2, 0, 1, 5.0,
            v_base_date + INTERVAL '28 days', v_base_date + INTERVAL '15 days'
        );

        INSERT INTO conventions (
            request_id, convention_number, prepared_by_ra, status,
            sent_to_oec_date, validated_by_oec_date, created_at
        ) VALUES (
            v_req_id, 'CONV-SEED-OEC1-CAS', v_ra1, 'VALIDATED_BY_OEC',
            v_base_date + INTERVAL '21 days', v_base_date + INTERVAL '28 days',
            v_base_date + INTERVAL '15 days'
        );

        INSERT INTO evaluation_teams (
            request_id, team_code, proposed_evaluation_date,
            evaluation_date_accepted, oec_validated, has_recusation,
            final_validation_date, status, created_at
        ) VALUES (
            v_req_id, 'EQ-SEED-OEC1-CAS', (v_base_date + INTERVAL '3 months')::date,
            true, true, false,
            v_base_date + INTERVAL '2 months', 'ACTIVE',
            v_base_date + INTERVAL '1 month 5 days'
        );

        INSERT INTO evaluation_reports (
            request_id, report_number, type, conclusion_and_recommendation,
            gaps_summary, status, validated_bycd, validation_date, created_at
        ) VALUES (
            v_req_id, 'RAP-SEED-OEC1-CAS', 'FOR_09_LABORATORY',
            'RECOMMANDATION FAVORABLE - Portée END complète demandée.',
            '2 écarts non critiques résolus.',
            'VALIDATED', true, v_base_date + INTERVAL '4 months 5 days',
            v_base_date + INTERVAL '3 months 20 days'
        ) RETURNING id INTO v_report_id;

        INSERT INTO cas_meetings (
            request_id, meeting_code, meeting_date, location, agenda,
            dossier_summary, status, summons_sent_at, dossier_sent_at,
            quorum_required, attendees_confirmed, quorum_reached,
            dossier_read_only, dossier_download_disabled, created_at
        ) VALUES (
            v_req_id, 'CAS-SEED-OEC1-PENDING', NOW() + INTERVAL '7 days',
            'Salle CAS - ALGERAC, Alger',
            'Examen du dossier SEED-OEC1-CAS-PENDING — Essais Non Destructifs',
            'Rapport RAP-SEED-OEC1-CAS validé. Recommandation favorable.',
            'SUMMONS_SENT', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days',
            3, 0, false, true, true, NOW() - INTERVAL '5 days'
        );

        INSERT INTO notifications (user_id, title, message, type, link, read, created_at)
        VALUES (
            v_oec1,
            'Dossier transmis au CAS',
            'Votre demande SEED-OEC1-CAS-PENDING a été programmée pour une réunion CAS. La décision n''a pas encore été rendue.',
            'info', '/oec/demandes', false, NOW() - INTERVAL '3 days'
        );

        RAISE NOTICE '✓ oec1: SEED-OEC1-CAS-PENDING (CAS_SCHEDULED, sans décision)';
    ELSE
        RAISE NOTICE 'oec1 CAS-PENDING déjà présent, skip';
    END IF;

    -- ═══════════════════════════════════════════════════════════
    -- OEC2 : Demande d'EXTENSION (soumise, en attente DT)
    -- ═══════════════════════════════════════════════════════════
    IF NOT EXISTS (SELECT 1 FROM accreditation_requests WHERE reference_number = 'SEED-OEC2-EXTENSION') THEN
        INSERT INTO accreditation_requests (
            reference_number, oec_id, type, domain, description,
            status, progress, submission_date, created_at,
            pending_with, current_phase, current_step, next_action,
            is_new_oec, is_multisite
        ) VALUES (
            'SEED-OEC2-EXTENSION', v_oec2, 'EXTENSION',
            'Organisme d''Inspection - Extension ESP / Levage',
            'Demande d''extension de portée ISO/IEC 17020 pour inclure l''inspection des appareils de levage. Formulaire rempli par l''OEC, en attente de vérification DT.',
            'PENDING_DT_REVIEW', 5, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day',
            'ALGERAC', 'INITIAL', 'Dossier en cours d''examen',
            'Votre dossier est en cours d''examen par ALGERAC.',
            false, false
        );
        RAISE NOTICE '✓ oec2: demande EXTENSION (PENDING_DT_REVIEW)';
    ELSE
        RAISE NOTICE 'oec2 EXTENSION déjà présent, skip';
    END IF;

    -- ═══════════════════════════════════════════════════════════
    -- OEC3 : Demande de RENOUVELLEMENT (soumise, en attente DT)
    -- ═══════════════════════════════════════════════════════════
    IF NOT EXISTS (SELECT 1 FROM accreditation_requests WHERE reference_number = 'SEED-OEC3-RENEWAL') THEN
        INSERT INTO accreditation_requests (
            reference_number, oec_id, type, domain, description,
            status, progress, submission_date, created_at,
            pending_with, current_phase, current_step, next_action,
            is_new_oec, is_multisite
        ) VALUES (
            'SEED-OEC3-RENEWAL', v_oec3, 'RENOUVELLEMENT',
            'Organisme de Certification - Renouvellement produits',
            'Demande de renouvellement d''accréditation ISO/IEC 17065 pour certification de produits. Cycle de 4 ans arrivé à échéance. Formulaire rempli par l''OEC, en attente de vérification DT.',
            'PENDING_DT_REVIEW', 5, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours',
            'ALGERAC', 'INITIAL', 'Dossier en cours d''examen',
            'Votre dossier est en cours d''examen par ALGERAC.',
            false, false
        );
        RAISE NOTICE '✓ oec3: demande RENOUVELLEMENT (PENDING_DT_REVIEW)';
    ELSE
        RAISE NOTICE 'oec3 RENOUVELLEMENT déjà présent, skip';
    END IF;

    -- ═══════════════════════════════════════════════════════════
    -- OEC4 : Accréditation ACTIVE + demande de TRANSFERT (PRO 31)
    -- ═══════════════════════════════════════════════════════════
    IF NOT EXISTS (SELECT 1 FROM accreditation_requests WHERE reference_number = 'SEED-OEC4-ACTIVE') THEN
        v_issue_date := NOW() - INTERVAL '18 months';
        v_base_date := v_issue_date - INTERVAL '5 months';

        INSERT INTO accreditation_requests (
            reference_number, oec_id, assigned_to_ra, assigned_to_cd,
            type, domain, description, status, progress,
            submission_date, assignment_date, receivability_decision_date, is_receivable,
            evaluation_start_date, evaluation_end_date, cas_decision_date,
            certificate_issue_date, certificate_expiration_date,
            current_phase, current_step, next_action, pending_with,
            created_at, is_new_oec
        ) VALUES (
            'SEED-OEC4-ACTIVE', v_oec4, v_ra3, v_cd1,
            'INITIAL',
            'Laboratoire d''Étalonnage - Métrologie dimensionnelle et masse',
            'Accréditation ISO/IEC 17025 délivrée. Demande de transfert initiée (PRO 31).',
            'TRANSFER_INITIATED', 100,
            v_base_date, v_base_date + INTERVAL '3 days', v_base_date + INTERVAL '12 days', true,
            v_base_date + INTERVAL '3 months', v_base_date + INTERVAL '3 months 4 days',
            v_base_date + INTERVAL '5 months',
            v_issue_date, v_issue_date + INTERVAL '4 years',
            'TRANSFERT',
            'Transfert en cours d''examen',
            'Votre demande de transfert est en cours d''examen par ALGERAC.',
            'ALGERAC',
            v_base_date, false
        ) RETURNING id INTO v_req_id;

        INSERT INTO evaluation_reports (
            request_id, report_number, type, conclusion_and_recommendation,
            status, validated_bycd, created_at
        ) VALUES (
            v_req_id, 'RAP-SEED-OEC4', 'FOR_09_LABORATORY',
            'FAVORABLE - Accréditation recommandée portée complète.',
            'VALIDATED', true, v_base_date + INTERVAL '4 months'
        ) RETURNING id INTO v_report_id;

        INSERT INTO cas_decisions (
            request_id, report_id, decision_number, decision_type, meeting_date,
            justification, scope, appeal_right_notified, created_at
        ) VALUES (
            v_req_id, v_report_id, 'DEC-CAS-SEED-OEC4', 'GRANT_FULL',
            v_base_date + INTERVAL '5 months',
            'Conformité démontrée aux exigences ISO/IEC 17025.',
            'Étalonnage dimensionnel et masse',
            true, v_base_date + INTERVAL '5 months'
        ) RETURNING id INTO v_decision_id;

        INSERT INTO accreditation_certificates (
            request_id, cas_decision_id, certificate_number, issue_date, expiration_date,
            oec_identity, scope, technical_domains, methods_and_standards,
            accreditation_standard_reference, signed_bydg, signed_bydt, published, created_at
        ) VALUES (
            v_req_id, v_decision_id, 'CERT-ALGERAC-SEED-OEC4',
            v_issue_date, v_issue_date + INTERVAL '4 years',
            'Centre d''Étalonnage Algérien',
            'Étalonnage dimensionnel et masse selon ISO/IEC 17025',
            'Métrologie - dimensions et masse',
            'ISO/IEC 17025:2017',
            'ISO/IEC 17025:2017', true, true, true, v_issue_date
        ) RETURNING id INTO v_cert_id;

        INSERT INTO accreditation_transfers (
            transfer_code, original_request_id, original_certificate_id, source_oec_id,
            source_organization_name, source_organization_details,
            target_organization_name, target_organization_details, target_is_new_entity,
            reason, reason_details, transferred_scope, full_scope_transfer,
            risk_analysis, impartiality_compliance, assessment_methods_continuity,
            last_evaluation_status, financial_regularized,
            continuity_assessment, management_system_continuity, personnel_continuity, equipment_continuity,
            status, accreditation_number, original_expiration_date, created_at
        ) VALUES (
            'TRF-SEED-OEC4', v_req_id, v_cert_id, v_oec4,
            'Centre d''Étalonnage Algérien',
            'OEC accrédité souhaitant transférer son accréditation suite à restructuration.',
            'Centre d''Étalonnage Algérien - Filiale Métrologie Sud',
            'Nouvelle entité juridique (filiale) destinataire du transfert de portée.',
            true,
            'SUBSIDIARY_CREATION',
            'Création d''une filiale pour séparer l''activité d''étalonnage du siège.',
            'Portée complète - étalonnage dimensionnel et masse',
            true,
            'Risques maîtrisés: même personnel technique, mêmes équipements, même SMQ.',
            true, true,
            'Aucun écart ouvert. Dernière évaluation favorable.',
            true,
            'Continuité assurée: SMQ, personnel clé et équipements transférés à la filiale.',
            true, true, true,
            'DOCUMENTS_SUBMITTED',
            'CERT-ALGERAC-SEED-OEC4',
            v_issue_date + INTERVAL '4 years',
            NOW() - INTERVAL '1 day'
        );

        INSERT INTO notifications (user_id, title, message, type, link, read, created_at)
        VALUES (
            v_oec4,
            'Demande de transfert enregistrée',
            'Votre demande de transfert d''accréditation (TRF-SEED-OEC4) a été soumise. En attente d''examen ALGERAC.',
            'info', '/oec/transfers', false, NOW() - INTERVAL '1 day'
        );

        RAISE NOTICE '✓ oec4: accréditation ACTIVE + transfert DOCUMENTS_SUBMITTED';
    ELSE
        RAISE NOTICE 'oec4 ACTIVE/transfert déjà présent, skip';
    END IF;

    -- ═══════════════════════════════════════════════════════════
    -- OEC5 : Accréditation ACTIVE (dossier traité) — surveillance
    -- ═══════════════════════════════════════════════════════════
    IF NOT EXISTS (SELECT 1 FROM accreditation_requests WHERE reference_number = 'SEED-OEC5-ACTIVE') THEN
        v_issue_date := NOW() - INTERVAL '11 months';
        v_base_date := v_issue_date - INTERVAL '5 months';
        v_eval_date := NOW() + INTERVAL '45 days';

        INSERT INTO accreditation_requests (
            reference_number, oec_id, assigned_to_ra, assigned_to_cd,
            type, domain, description, status, progress,
            submission_date, assignment_date, receivability_decision_date, is_receivable,
            evaluation_start_date, evaluation_end_date, cas_decision_date,
            certificate_issue_date, certificate_expiration_date,
            current_phase, current_step, next_action, pending_with,
            created_at, is_new_oec
        ) VALUES (
            'SEED-OEC5-ACTIVE', v_oec5, COALESCE(v_ra2, v_ra1), COALESCE(v_cd2, v_cd1),
            'INITIAL',
            'Laboratoire de Biologie Médicale - Analyses médicales',
            'Accréditation ISO 15189 délivrée après cycle CBN complet. Phase de surveillance périodique.',
            'ACTIVE', 100,
            v_base_date, v_base_date + INTERVAL '3 days', v_base_date + INTERVAL '12 days', true,
            v_base_date + INTERVAL '3 months', v_base_date + INTERVAL '3 months 4 days',
            v_base_date + INTERVAL '5 months',
            v_issue_date, v_issue_date + INTERVAL '4 years',
            'SURVEILLANCE',
            'surveillance_scheduled',
            'Prochaine évaluation de surveillance prévue',
            'ALGERAC',
            v_base_date, false
        ) RETURNING id INTO v_req_id;

        INSERT INTO evaluation_reports (
            request_id, report_number, type, conclusion_and_recommendation,
            status, validated_bycd, created_at
        ) VALUES (
            v_req_id, 'RAP-SEED-OEC5', 'FOR_09_1_BIOMEDICAL',
            'FAVORABLE - Accréditation recommandée portée complète.',
            'VALIDATED', true, v_base_date + INTERVAL '4 months'
        ) RETURNING id INTO v_report_id;

        INSERT INTO cas_decisions (
            request_id, report_id, decision_number, decision_type, meeting_date,
            justification, scope, appeal_right_notified, created_at
        ) VALUES (
            v_req_id, v_report_id, 'DEC-CAS-SEED-OEC5', 'GRANT_FULL',
            v_base_date + INTERVAL '5 months',
            'L''OEC a démontré sa conformité aux exigences ISO 15189.',
            'Analyses de biologie médicale - portée complète',
            true, v_base_date + INTERVAL '5 months'
        ) RETURNING id INTO v_decision_id;

        INSERT INTO accreditation_certificates (
            request_id, cas_decision_id, certificate_number, issue_date, expiration_date,
            oec_identity, scope, technical_domains, methods_and_standards,
            accreditation_standard_reference, signed_bydg, signed_bydt, published, created_at
        ) VALUES (
            v_req_id, v_decision_id, 'CERT-ALGERAC-SEED-OEC5',
            v_issue_date, v_issue_date + INTERVAL '4 years',
            'Laboratoire Médical Pasteur',
            'Analyses de biologie médicale selon ISO 15189',
            'Biologie médicale',
            'ISO 15189:2022',
            'ISO 15189:2022', true, true, true, v_issue_date
        ) RETURNING id INTO v_cert_id;

        INSERT INTO surveillance_plans (
            certificate_id, plan_code, surveillance_calendar, frequency, scope_sampling,
            estimated_duration_per_evaluation, cycle_number, cycle_duration_years, surveillance_count,
            next_surveillance_date, drafted_by_ra_id, drafted_at, submitted_tocdat,
            validated_bycd, cd_validation_date, sent_tooecat, oec_acknowledged, oec_acknowledged_at,
            satisfaction_formfor22sent, created_at
        ) VALUES (
            v_cert_id, 'SURV-SEED-OEC5',
            'S1 à 12 mois, S2 à 24 mois, S3 à 36 mois',
            'Annuelle',
            'S1: hématologie + biochimie; S2: microbiologie; S3: portée complète',
            3, 1, 3, 2,
            v_eval_date, COALESCE(v_ra2, v_ra1), v_issue_date + INTERVAL '5 days', v_issue_date + INTERVAL '7 days',
            true, v_issue_date + INTERVAL '10 days', v_issue_date + INTERVAL '12 days',
            true, v_issue_date + INTERVAL '15 days',
            true, v_issue_date + INTERVAL '5 days'
        ) RETURNING id INTO v_plan_id;

        INSERT INTO notifications (user_id, title, message, type, link, read, created_at)
        VALUES (
            v_oec5,
            'Accréditation active — surveillance à venir',
            'Votre accréditation CERT-ALGERAC-SEED-OEC5 est active. La surveillance S1 est prévue dans ~45 jours.',
            'info', '/oec/surveillance', false, NOW() - INTERVAL '2 days'
        );

        RAISE NOTICE '✓ oec5: accréditation ACTIVE + plan surveillance (S1 ~45j)';
    ELSE
        RAISE NOTICE 'oec5 ACTIVE déjà présent, skip';
    END IF;

    -- ═══════════════════════════════════════════════════════════
    -- Plaintes démo : oec2 (interne) + personne externe (publique)
    -- ═══════════════════════════════════════════════════════════
    IF NOT EXISTS (SELECT 1 FROM complaints WHERE tracking_code = 'PLT-SEED-OEC2') THEN
        INSERT INTO complaints (
            tracking_code, complainant_name, complainant_email, complainant_phone,
            complainant_organization, target_organization, category, subject, description,
            expected_resolution, is_public, submitted_by_user_id, submitted_by_role,
            status, created_at
        ) VALUES (
            'PLT-SEED-OEC2',
            'Bureau d''Inspection Algérien',
            'oec2@algeractestapp.dz',
            '0555900002',
            'Bureau d''Inspection Algérien',
            'ALGERAC',
            'delay',
            'Délai excessif de traitement d''une demande d''extension',
            'Nous constatons un délai anormalement long dans le traitement de notre demande d''extension de portée (appareils de levage). Aucune communication formelle n''a été reçue depuis plus de 30 jours.',
            'Obtenir un échéancier clair et une reprise du traitement du dossier dans les meilleurs délais.',
            false, v_oec2, 'OEC',
            'RECEIVED', NOW() - INTERVAL '3 days'
        );
        RAISE NOTICE '✓ plainte PLT-SEED-OEC2 (oec2)';
    ELSE
        RAISE NOTICE 'plainte PLT-SEED-OEC2 déjà présente, skip';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM complaints WHERE tracking_code = 'PLT-SEED-PUBLIC') THEN
        INSERT INTO complaints (
            tracking_code, complainant_name, complainant_email, complainant_phone,
            complainant_organization, target_organization, category, subject, description,
            expected_resolution, is_public, status, created_at
        ) VALUES (
            'PLT-SEED-PUBLIC',
            'Karim Benali',
            'karim.benali.externe@example.dz',
            '0555123456',
            'Entreprise BENALI Travaux Publics',
            'Laboratoire National d''Essais',
            'quality',
            'Résultats d''essais non conformes à la méthodologie annoncée',
            'En tant que client externe, nous contestons la qualité des essais réalisés sur des échantillons de béton. La méthodologie appliquée ne correspond pas à celle indiquée sur le rapport d''essais fourni.',
            'Révision des résultats, éventuelle contre-expertise, et mesures correctives auprès de l''organisme concerné.',
            true, 'RECEIVED', NOW() - INTERVAL '1 day'
        );
        RAISE NOTICE '✓ plainte PLT-SEED-PUBLIC (externe)';
    ELSE
        RAISE NOTICE 'plainte PLT-SEED-PUBLIC déjà présente, skip';
    END IF;

    RAISE NOTICE 'Seed oec1→oec5 terminé.';
END $$;

-- Vérification
SELECT
    u.email,
    ar.reference_number,
    ar.type,
    ar.status,
    left(ar.domain, 50) AS domain,
    (SELECT count(*) FROM accreditation_certificates c WHERE c.request_id = ar.id) AS certs,
    (SELECT count(*) FROM accreditation_transfers t WHERE t.original_request_id = ar.id) AS transfers
FROM accreditation_requests ar
JOIN users u ON u.id = ar.oec_id
WHERE u.email IN (
    'oec1@algeractestapp.dz',
    'oec2@algeractestapp.dz',
    'oec3@algeractestapp.dz',
    'oec4@algeractestapp.dz',
    'oec5@algeractestapp.dz'
)
ORDER BY u.email, ar.reference_number;
