-- ============================================================
-- ALGERAC Platform - Vider toutes les tables SAUF users
-- ============================================================

TRUNCATE TABLE
    accreditation_certificates,
    accreditation_requests,
    accreditation_transfers,
    action_plans,
    cas_decisions,
    cas_meetings,
    cas_votes,
    complaints,
    complementary_evaluations,
    conventions,
    documents,
    documentary_reviews,
    evaluation_notes,
    evaluation_plans,
    evaluation_reports,
    evaluation_teams,
    feasibility_studies,
    gaps,
    gap_contestations,
    mandates,
    mission_orders,
    multi_site_configs,
    notifications,
    oec_applications,
    password_reset_token,
    payments,
    preparation_meetings,
    preliminary_visits,
    quotations,
    risk_analysis_forms,
    sampling_plans,
    surveillance_evaluations,
    surveillance_plans,
    tariff_grids,
    team_members,
    user_availabilities
CASCADE;

-- Note: La table 'users' est conservée avec toutes ses données
