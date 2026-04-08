-- ============================================================
-- ALGERAC Platform - Reset Database & Seed Users
-- Vide toutes les tables puis insère les utilisateurs de test
-- ============================================================

-- 1) Désactiver les contraintes FK temporairement et TRUNCATE tout
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
    domain_development_requests,
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
    reference_rules,
    remote_evaluations,
    risk_analysis_forms,
    risk_opportunity_registers,
    sampling_plans,
    surveillance_evaluations,
    surveillance_plans,
    tariff_grids,
    team_members,
    user_availabilities,
    users
CASCADE;

-- 2) Mot de passe BCrypt pour 'password123'
-- $2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS

-- ============================================================
-- ADMIN (1)
-- ============================================================
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred)
VALUES ('admin@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
        'Administrateur Système', 'ADMIN', 'ALGERAC', '0555000001', NOW(), 'APPROVED', false, false);

-- ============================================================
-- DG - Directrice Générale (1)
-- ============================================================
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred)
VALUES ('dg@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
        'Farida Benmansour', 'DG', 'ALGERAC', '0555000002', NOW(), 'APPROVED', false, false);

-- ============================================================
-- DAG - Directeur Administratif Général (1)
-- ============================================================
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred)
VALUES ('dag@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
        'Karim Mebarki', 'DAG', 'ALGERAC', '0555000003', NOW(), 'APPROVED', false, false);

-- ============================================================
-- DT - Direction Technique (1)
-- ============================================================
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred)
VALUES ('dt@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
        'Noureddine Hamidi', 'DT', 'ALGERAC', '0555000004', NOW(), 'APPROVED', false, false);

-- ============================================================
-- GES_COMPETENCES - Gestionnaire de Compétences (1)
-- ============================================================
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred)
VALUES ('ges.competences@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
        'Samia Khelifi', 'GES_COMPETENCES', 'ALGERAC', '0555000005', NOW(), 'APPROVED', false, false);

-- ============================================================
-- RQ - Responsable Qualité (1)
-- ============================================================
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred)
VALUES ('rq@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
        'Leila Bouazza', 'RQ', 'ALGERAC', '0555000006', NOW(), 'APPROVED', false, false);

-- ============================================================
-- CAS_PRESIDENT - Président du CAS (1)
-- ============================================================
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred)
VALUES ('cas.president@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
        'Pr. Abdelkader Djebbar', 'CAS_PRESIDENT', 'ALGERAC', '0555000007', NOW(), 'APPROVED', false, false);

-- ============================================================
-- CAS_MEMBER - Membres du CAS (3)
-- ============================================================
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred) VALUES
('cas.membre1@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Amina Messaoudi', 'CAS_MEMBER', 'ALGERAC', '0555000008', NOW(), 'APPROVED', false, false),
('cas.membre2@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Yacine Slimani', 'CAS_MEMBER', 'ALGERAC', '0555000009', NOW(), 'APPROVED', false, false),
('cas.membre3@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Nadjia Ferhat', 'CAS_MEMBER', 'ALGERAC', '0555000010', NOW(), 'APPROVED', false, false);

-- ============================================================
-- CD - Chefs de Département (5 domaines)
-- Rachid Boudiaf (CD Domaine 1) also has CAS_MEMBER + EQ roles
-- ============================================================
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred, domaine_expertise, roles) VALUES
('cd.domaine1@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Rachid Boudiaf', 'CD', 'ALGERAC', '0555100001', NOW(), 'APPROVED', false, false, 'Domaine 1', 'CD,CAS_MEMBER,EQ');
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred, domaine_expertise) VALUES
('cd.domaine2@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Salima Benali', 'CD', 'ALGERAC', '0555100002', NOW(), 'APPROVED', false, false, 'Domaine 2'),
('cd.domaine3@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Mourad Ziani', 'CD', 'ALGERAC', '0555100003', NOW(), 'APPROVED', false, false, 'Domaine 3'),
('cd.domaine4@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Khadidja Hamidou', 'CD', 'ALGERAC', '0555100004', NOW(), 'APPROVED', false, false, 'Domaine 4'),
('cd.domaine5@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Lotfi Medjdoub', 'CD', 'ALGERAC', '0555100005', NOW(), 'APPROVED', false, false, 'Domaine 5');

-- ============================================================
-- RA - Responsables d'Accréditation (5 par CD = 25 total)
-- ============================================================

-- Domaine 1 (sous CD Rachid Boudiaf)
-- Amine Toumi (RA Domaine 1) also has REE role
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred, domaine_expertise, roles) VALUES
('ra.d1.01@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Amine Toumi', 'RA', 'ALGERAC', '0555200001', NOW(), 'APPROVED', false, false, 'Domaine 1', 'RA,REE');
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred, domaine_expertise) VALUES
('ra.d1.02@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Sabrina Ouali', 'RA', 'ALGERAC', '0555200002', NOW(), 'APPROVED', false, false, 'Domaine 1'),
('ra.d1.03@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Fares Belkacemi', 'RA', 'ALGERAC', '0555200003', NOW(), 'APPROVED', false, false, 'Domaine 1'),
('ra.d1.04@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Meriem Boudjelal', 'RA', 'ALGERAC', '0555200004', NOW(), 'APPROVED', false, false, 'Domaine 1'),
('ra.d1.05@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Yassine Chikhi', 'RA', 'ALGERAC', '0555200005', NOW(), 'APPROVED', false, false, 'Domaine 1');

-- Domaine 2 (sous CD Salima Benali)
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred, domaine_expertise) VALUES
('ra.d2.01@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Nadir Benyahia', 'RA', 'ALGERAC', '0555200011', NOW(), 'APPROVED', false, false, 'Domaine 2'),
('ra.d2.02@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Hassiba Djaballah', 'RA', 'ALGERAC', '0555200012', NOW(), 'APPROVED', false, false, 'Domaine 2'),
('ra.d2.03@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Walid Rebahi', 'RA', 'ALGERAC', '0555200013', NOW(), 'APPROVED', false, false, 'Domaine 2'),
('ra.d2.04@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Sihem Larbi', 'RA', 'ALGERAC', '0555200014', NOW(), 'APPROVED', false, false, 'Domaine 2'),
('ra.d2.05@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Riad Gherbi', 'RA', 'ALGERAC', '0555200015', NOW(), 'APPROVED', false, false, 'Domaine 2');

-- Domaine 3 (sous CD Mourad Ziani)
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred, domaine_expertise) VALUES
('ra.d3.01@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Sofiane Aït-Ahmed', 'RA', 'ALGERAC', '0555200021', NOW(), 'APPROVED', false, false, 'Domaine 3'),
('ra.d3.02@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Lamia Bahloul', 'RA', 'ALGERAC', '0555200022', NOW(), 'APPROVED', false, false, 'Domaine 3'),
('ra.d3.03@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Djamel Sahraoui', 'RA', 'ALGERAC', '0555200023', NOW(), 'APPROVED', false, false, 'Domaine 3'),
('ra.d3.04@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Imane Bouzid', 'RA', 'ALGERAC', '0555200024', NOW(), 'APPROVED', false, false, 'Domaine 3'),
('ra.d3.05@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Bilal Messaoud', 'RA', 'ALGERAC', '0555200025', NOW(), 'APPROVED', false, false, 'Domaine 3');

-- Domaine 4 (sous CD Khadidja Hamidou)
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred, domaine_expertise) VALUES
('ra.d4.01@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Hakim Boutaleb', 'RA', 'ALGERAC', '0555200031', NOW(), 'APPROVED', false, false, 'Domaine 4'),
('ra.d4.02@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Nadia Ferdjioui', 'RA', 'ALGERAC', '0555200032', NOW(), 'APPROVED', false, false, 'Domaine 4'),
('ra.d4.03@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Tarek Benhassine', 'RA', 'ALGERAC', '0555200033', NOW(), 'APPROVED', false, false, 'Domaine 4'),
('ra.d4.04@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Zineb Amrouche', 'RA', 'ALGERAC', '0555200034', NOW(), 'APPROVED', false, false, 'Domaine 4'),
('ra.d4.05@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Oussama Necib', 'RA', 'ALGERAC', '0555200035', NOW(), 'APPROVED', false, false, 'Domaine 4');

-- Domaine 5 (sous CD Lotfi Medjdoub)
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred, domaine_expertise) VALUES
('ra.d5.01@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Adel Mokrani', 'RA', 'ALGERAC', '0555200041', NOW(), 'APPROVED', false, false, 'Domaine 5'),
('ra.d5.02@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Fatima-Zohra Achour', 'RA', 'ALGERAC', '0555200042', NOW(), 'APPROVED', false, false, 'Domaine 5'),
('ra.d5.03@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Khaled Mansouri', 'RA', 'ALGERAC', '0555200043', NOW(), 'APPROVED', false, false, 'Domaine 5'),
('ra.d5.04@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Amira Guettaf', 'RA', 'ALGERAC', '0555200044', NOW(), 'APPROVED', false, false, 'Domaine 5'),
('ra.d5.05@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Mohamed Belhadj', 'RA', 'ALGERAC', '0555200045', NOW(), 'APPROVED', false, false, 'Domaine 5');

-- ============================================================
-- EXPERTS (5)
-- ============================================================
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred, specialite, experience, nom, prenom, domaine_expertise) VALUES
('expert1@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Ahmed Benali', 'EXPERT', NULL, '0555300001', NOW(), 'APPROVED', false, false, 'Laboratoire d''essais', '10 ans', 'Benali', 'Ahmed', 'Domaine 1'),
('expert2@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Fatima Cherif', 'EXPERT', NULL, '0555300002', NOW(), 'APPROVED', false, false, 'Inspection', '8 ans', 'Cherif', 'Fatima', 'Domaine 2'),
('expert3@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Karim Hadj', 'EXPERT', NULL, '0555300003', NOW(), 'APPROVED', false, false, 'Certification', '12 ans', 'Hadj', 'Karim', 'Domaine 3'),
('expert4@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Nadia Saadi', 'EXPERT', NULL, '0555300004', NOW(), 'APPROVED', false, false, 'Qualité', '6 ans', 'Saadi', 'Nadia', 'Domaine 4'),
('expert5@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Youcef Mansouri', 'EXPERT', NULL, '0555300005', NOW(), 'APPROVED', false, false, 'Métrologie', '15 ans', 'Mansouri', 'Youcef', 'Domaine 5');

-- ============================================================
-- REE - Responsable d'Équipe d'Évaluation (3)
-- ============================================================
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred, specialite, experience, nom, prenom) VALUES
('ree1@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Mohamed Belkacem', 'REE', 'ALGERAC', '0555400001', NOW(), 'APPROVED', false, false, 'Laboratoire d''essais', '14 ans', 'Belkacem', 'Mohamed'),
('ree2@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Amel Guendouz', 'REE', 'ALGERAC', '0555400002', NOW(), 'APPROVED', false, false, 'Inspection', '11 ans', 'Guendouz', 'Amel'),
('ree3@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Hichem Ferkous', 'REE', 'ALGERAC', '0555400003', NOW(), 'APPROVED', false, false, 'Certification', '9 ans', 'Ferkous', 'Hichem');

-- ============================================================
-- ET - Évaluateur Technique (3)
-- Samira Khelifi (ET) also has EQ role
-- ============================================================
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred, specialite, experience, nom, prenom, roles) VALUES
('et1@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Samira Khelifi', 'ET', 'ALGERAC', '0555500001', NOW(), 'APPROVED', false, false, 'Essais mécaniques', '9 ans', 'Khelifi', 'Samira', 'ET,EQ');
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred, specialite, experience, nom, prenom) VALUES
('et2@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Abdelhakim Rahmani', 'ET', 'ALGERAC', '0555500002', NOW(), 'APPROVED', false, false, 'Essais chimiques', '7 ans', 'Rahmani', 'Abdelhakim'),
('et3@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Lynda Benzahra', 'ET', 'ALGERAC', '0555500003', NOW(), 'APPROVED', false, false, 'Microbiologie', '5 ans', 'Benzahra', 'Lynda');

-- ============================================================
-- EQ - Évaluateur Qualité (1) — Rachid Boudiaf has EQ via his CD account (roles field)
-- ============================================================
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred, specialite, experience, nom, prenom) VALUES
('eq2@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Souhila Taleb', 'EQ', 'ALGERAC', '0555600002', NOW(), 'APPROVED', false, false, 'ISO 17020', '8 ans', 'Taleb', 'Souhila');

-- ============================================================
-- EVALUATEUR (2)
-- ============================================================
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred, specialite, experience, nom, prenom) VALUES
('evaluateur1@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Smail Zerrouki', 'EVALUATEUR', 'ALGERAC', '0555700001', NOW(), 'APPROVED', false, false, 'Évaluation générale', '6 ans', 'Zerrouki', 'Smail'),
('evaluateur2@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Houda Benslimane', 'EVALUATEUR', 'ALGERAC', '0555700002', NOW(), 'APPROVED', false, false, 'Évaluation technique', '4 ans', 'Benslimane', 'Houda');

-- ============================================================
-- FORMATEUR (2)
-- ============================================================
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred, specialite, experience, nom, prenom) VALUES
('formateur1@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Toufik Hadji', 'FORMATEUR', 'ALGERAC', '0555800001', NOW(), 'APPROVED', false, false, 'Formation accréditation', '10 ans', 'Hadji', 'Toufik'),
('formateur2@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Djamila Ait-Ouali', 'FORMATEUR', 'ALGERAC', '0555800002', NOW(), 'APPROVED', false, false, 'Formation qualité', '7 ans', 'Ait-Ouali', 'Djamila');

-- ============================================================
-- OEC - Organismes d'Évaluation de la Conformité (5)
-- ============================================================
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred, type_organisme, adresse_siege, nom_representant, portee_accreditation) VALUES
('oec1@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Laboratoire National d''Essais', 'OEC', 'Laboratoire National d''Essais', '0555900001', NOW(), 'APPROVED', false, false,
 'Laboratoire d''essais', 'Alger, Algérie', 'Dr. Belaid Aissa', 'Essais physiques et chimiques'),
('oec2@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Bureau d''Inspection Algérien', 'OEC', 'Bureau d''Inspection Algérien', '0555900002', NOW(), 'APPROVED', false, false,
 'Organisme d''inspection', 'Oran, Algérie', 'Mme Kheira Bouziane', 'Inspection industrielle'),
('oec3@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Organisme de Certification CERTIDZ', 'OEC', 'Organisme de Certification CERTIDZ', '0555900003', NOW(), 'APPROVED', false, false,
 'Organisme de certification', 'Constantine, Algérie', 'Mohamed Salah Yahiaoui', 'Certification de produits'),
('oec4@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Centre d''Étalonnage Algérien', 'OEC', 'Centre d''Étalonnage Algérien', '0555900004', NOW(), 'APPROVED', false, false,
 'Laboratoire d''étalonnage', 'Annaba, Algérie', 'Arezki Belkadi', 'Métrologie dimensionnelle et masse'),
('oec5@algeractestapp.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
 'Laboratoire Médical Pasteur', 'OEC', 'Laboratoire Médical Pasteur', '0555900005', NOW(), 'APPROVED', false, false,
 'Laboratoire de biologie médicale', 'Blida, Algérie', 'Dr. Farid Hemiche', 'Analyses médicales');

-- ============================================================
-- Résumé : 
--   1 ADMIN
--   1 DG
--   1 DAG
--   1 DT
--   1 GES_COMPETENCES
--   1 RQ
--   1 CAS_PRESIDENT
--   3 CAS_MEMBER
--   5 CD (un par domaine)
--  25 RA (5 par domaine)
--   5 EXPERT
--   3 REE
--   3 ET
--   1 EQ (+ Rachid Boudiaf via CD account roles + Samira Khelifi via ET account roles)
--   2 EVALUATEUR
--   2 FORMATEUR
--   5 OEC
--
-- Multi-rôle (un seul compte, champ 'roles' CSV) :
--   Rachid Boudiaf  : cd.domaine1@  → CD, CAS_MEMBER, EQ
--   Amine Toumi     : ra.d1.01@     → RA, REE
--   Samira Khelifi  : et1@          → ET, EQ
--
-- Total : 62 lignes dans la table users
-- ============================================================
