-- ALGERAC Platform - Seed Data
-- Run this after Spring Boot creates the tables
-- Uses ON CONFLICT to avoid duplicates on restart

-- Password: password123 (BCrypt)
-- $2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS

-- ADMIN
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred)
VALUES ('admin@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
        'Administrateur Système', 'ADMIN', 'ALGERAC', '0555000001', NOW(), 'APPROVED', false, false)
ON CONFLICT (email) DO NOTHING;

-- DG
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred)
VALUES ('dg@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
        'Farida Benmansour', 'DG', 'ALGERAC', '0555000002', NOW(), 'APPROVED', false, false)
ON CONFLICT (email) DO NOTHING;

-- DAG
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred)
VALUES ('dag@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
        'Karim Mebarki', 'DAG', 'ALGERAC', '0555000003', NOW(), 'APPROVED', false, false)
ON CONFLICT (email) DO NOTHING;

-- DT
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred)
VALUES ('dt@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
        'Noureddine Hamidi', 'DT', 'ALGERAC', '0555000004', NOW(), 'APPROVED', false, false)
ON CONFLICT (email) DO NOTHING;

-- GES_COMPETENCES
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred)
VALUES ('ges.competences@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
        'Samia Khelifi', 'GES_COMPETENCES', 'ALGERAC', '0555000005', NOW(), 'APPROVED', false, false)
ON CONFLICT (email) DO NOTHING;

-- RQ
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred)
VALUES ('rq@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
        'Leila Bouazza', 'RQ', 'ALGERAC', '0555000006', NOW(), 'APPROVED', false, false)
ON CONFLICT (email) DO NOTHING;

-- CAS_PRESIDENT
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred)
VALUES ('cas.president@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS',
        'Pr. Abdelkader Djebbar', 'CAS_PRESIDENT', 'ALGERAC', '0555000007', NOW(), 'APPROVED', false, false)
ON CONFLICT (email) DO NOTHING;

-- CAS_MEMBER x3
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred) VALUES
('cas.membre1@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Amina Messaoudi', 'CAS_MEMBER', 'ALGERAC', '0555000008', NOW(), 'APPROVED', false, false),
('cas.membre2@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Yacine Slimani', 'CAS_MEMBER', 'ALGERAC', '0555000009', NOW(), 'APPROVED', false, false),
('cas.membre3@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Nadjia Ferhat', 'CAS_MEMBER', 'ALGERAC', '0555000010', NOW(), 'APPROVED', false, false)
ON CONFLICT (email) DO NOTHING;

-- CD x5 (un par domaine)
-- Rachid Boudiaf (CD Domaine 1) also has CAS_MEMBER + EQ roles
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred, domaine_expertise, roles) VALUES
('cd.domaine1@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Rachid Boudiaf', 'CD', 'ALGERAC', '0555100001', NOW(), 'APPROVED', false, false, 'Domaine 1', 'CD,CAS_MEMBER,EQ')
ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred, domaine_expertise) VALUES
('cd.domaine2@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Salima Benali', 'CD', 'ALGERAC', '0555100002', NOW(), 'APPROVED', false, false, 'Domaine 2'),
('cd.domaine3@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Mourad Ziani', 'CD', 'ALGERAC', '0555100003', NOW(), 'APPROVED', false, false, 'Domaine 3'),
('cd.domaine4@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Khadidja Hamidou', 'CD', 'ALGERAC', '0555100004', NOW(), 'APPROVED', false, false, 'Domaine 4'),
('cd.domaine5@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Lotfi Medjdoub', 'CD', 'ALGERAC', '0555100005', NOW(), 'APPROVED', false, false, 'Domaine 5')
ON CONFLICT (email) DO NOTHING;

-- RA x25 (5 par domaine)
-- Amine Toumi (RA Domaine 1) also has REE role
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred, domaine_expertise, roles) VALUES
('ra.d1.01@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Amine Toumi','RA','ALGERAC','0555200001',NOW(),'APPROVED',false,false,'Domaine 1','RA,REE')
ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred, domaine_expertise) VALUES
('ra.d1.02@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Sabrina Ouali','RA','ALGERAC','0555200002',NOW(),'APPROVED',false,false,'Domaine 1'),
('ra.d1.03@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Fares Belkacemi','RA','ALGERAC','0555200003',NOW(),'APPROVED',false,false,'Domaine 1'),
('ra.d1.04@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Meriem Boudjelal','RA','ALGERAC','0555200004',NOW(),'APPROVED',false,false,'Domaine 1'),
('ra.d1.05@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Yassine Chikhi','RA','ALGERAC','0555200005',NOW(),'APPROVED',false,false,'Domaine 1'),
('ra.d2.01@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Nadir Benyahia','RA','ALGERAC','0555200011',NOW(),'APPROVED',false,false,'Domaine 2'),
('ra.d2.02@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Hassiba Djaballah','RA','ALGERAC','0555200012',NOW(),'APPROVED',false,false,'Domaine 2'),
('ra.d2.03@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Walid Rebahi','RA','ALGERAC','0555200013',NOW(),'APPROVED',false,false,'Domaine 2'),
('ra.d2.04@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Sihem Larbi','RA','ALGERAC','0555200014',NOW(),'APPROVED',false,false,'Domaine 2'),
('ra.d2.05@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Riad Gherbi','RA','ALGERAC','0555200015',NOW(),'APPROVED',false,false,'Domaine 2'),
('ra.d3.01@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Sofiane Aït-Ahmed','RA','ALGERAC','0555200021',NOW(),'APPROVED',false,false,'Domaine 3'),
('ra.d3.02@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Lamia Bahloul','RA','ALGERAC','0555200022',NOW(),'APPROVED',false,false,'Domaine 3'),
('ra.d3.03@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Djamel Sahraoui','RA','ALGERAC','0555200023',NOW(),'APPROVED',false,false,'Domaine 3'),
('ra.d3.04@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Imane Bouzid','RA','ALGERAC','0555200024',NOW(),'APPROVED',false,false,'Domaine 3'),
('ra.d3.05@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Bilal Messaoud','RA','ALGERAC','0555200025',NOW(),'APPROVED',false,false,'Domaine 3'),
('ra.d4.01@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Hakim Boutaleb','RA','ALGERAC','0555200031',NOW(),'APPROVED',false,false,'Domaine 4'),
('ra.d4.02@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Nadia Ferdjioui','RA','ALGERAC','0555200032',NOW(),'APPROVED',false,false,'Domaine 4'),
('ra.d4.03@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Tarek Benhassine','RA','ALGERAC','0555200033',NOW(),'APPROVED',false,false,'Domaine 4'),
('ra.d4.04@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Zineb Amrouche','RA','ALGERAC','0555200034',NOW(),'APPROVED',false,false,'Domaine 4'),
('ra.d4.05@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Oussama Necib','RA','ALGERAC','0555200035',NOW(),'APPROVED',false,false,'Domaine 4'),
('ra.d5.01@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Adel Mokrani','RA','ALGERAC','0555200041',NOW(),'APPROVED',false,false,'Domaine 5'),
('ra.d5.02@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Fatima-Zohra Achour','RA','ALGERAC','0555200042',NOW(),'APPROVED',false,false,'Domaine 5'),
('ra.d5.03@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Khaled Mansouri','RA','ALGERAC','0555200043',NOW(),'APPROVED',false,false,'Domaine 5'),
('ra.d5.04@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Amira Guettaf','RA','ALGERAC','0555200044',NOW(),'APPROVED',false,false,'Domaine 5'),
('ra.d5.05@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Mohamed Belhadj','RA','ALGERAC','0555200045',NOW(),'APPROVED',false,false,'Domaine 5')
ON CONFLICT (email) DO NOTHING;

-- EXPERT x5
INSERT INTO users (email, password, full_name, role, phone, created_at, status, blacklisted, starred, specialite, experience, nom, prenom, domaine_expertise) VALUES
('expert1@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Ahmed Benali','EXPERT','0555300001',NOW(),'APPROVED',false,false,'Laboratoire d''essais','10 ans','Benali','Ahmed','Domaine 1'),
('expert2@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Fatima Cherif','EXPERT','0555300002',NOW(),'APPROVED',false,false,'Inspection','8 ans','Cherif','Fatima','Domaine 2'),
('expert3@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Karim Hadj','EXPERT','0555300003',NOW(),'APPROVED',false,false,'Certification','12 ans','Hadj','Karim','Domaine 3'),
('expert4@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Nadia Saadi','EXPERT','0555300004',NOW(),'APPROVED',false,false,'Qualité','6 ans','Saadi','Nadia','Domaine 4'),
('expert5@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Youcef Mansouri','EXPERT','0555300005',NOW(),'APPROVED',false,false,'Métrologie','15 ans','Mansouri','Youcef','Domaine 5')
ON CONFLICT (email) DO NOTHING;

-- REE x3, ET x3, EQ x1, EVALUATEUR x2, FORMATEUR x2
-- Samira Khelifi (ET) also has EQ role
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred, specialite, experience, nom, prenom, roles) VALUES
('et1@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Samira Khelifi','ET','ALGERAC','0555500001',NOW(),'APPROVED',false,false,'Essais mécaniques','9 ans','Khelifi','Samira','ET,EQ')
ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred, specialite, experience, nom, prenom) VALUES
('ree1@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Mohamed Belkacem','REE','ALGERAC','0555400001',NOW(),'APPROVED',false,false,'Laboratoire d''essais','14 ans','Belkacem','Mohamed'),
('ree2@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Amel Guendouz','REE','ALGERAC','0555400002',NOW(),'APPROVED',false,false,'Inspection','11 ans','Guendouz','Amel'),
('ree3@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Hichem Ferkous','REE','ALGERAC','0555400003',NOW(),'APPROVED',false,false,'Certification','9 ans','Ferkous','Hichem'),
('et2@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Abdelhakim Rahmani','ET','ALGERAC','0555500002',NOW(),'APPROVED',false,false,'Essais chimiques','7 ans','Rahmani','Abdelhakim'),
('et3@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Lynda Benzahra','ET','ALGERAC','0555500003',NOW(),'APPROVED',false,false,'Microbiologie','5 ans','Benzahra','Lynda'),
('eq2@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Souhila Taleb','EQ','ALGERAC','0555600002',NOW(),'APPROVED',false,false,'ISO 17020','8 ans','Taleb','Souhila'),
('evaluateur1@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Smail Zerrouki','EVALUATEUR','ALGERAC','0555700001',NOW(),'APPROVED',false,false,'Évaluation générale','6 ans','Zerrouki','Smail'),
('evaluateur2@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Houda Benslimane','EVALUATEUR','ALGERAC','0555700002',NOW(),'APPROVED',false,false,'Évaluation technique','4 ans','Benslimane','Houda'),
('formateur1@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Toufik Hadji','FORMATEUR','ALGERAC','0555800001',NOW(),'APPROVED',false,false,'Formation accréditation','10 ans','Hadji','Toufik'),
('formateur2@algerac.dz','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Djamila Ait-Ouali','FORMATEUR','ALGERAC','0555800002',NOW(),'APPROVED',false,false,'Formation qualité','7 ans','Ait-Ouali','Djamila')
ON CONFLICT (email) DO NOTHING;

-- OEC x5
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, blacklisted, starred, type_organisme, adresse_siege, nom_representant, portee_accreditation) VALUES
('oec1@labo-dz.com','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Laboratoire National d''Essais','OEC','Laboratoire National d''Essais','0555900001',NOW(),'APPROVED',false,false,'Laboratoire d''essais','Alger, Algérie','Dr. Belaid Aissa','Essais physiques et chimiques'),
('oec2@inspect-dz.com','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Bureau d''Inspection Algérien','OEC','Bureau d''Inspection Algérien','0555900002',NOW(),'APPROVED',false,false,'Organisme d''inspection','Oran, Algérie','Mme Kheira Bouziane','Inspection industrielle'),
('oec3@certif-dz.com','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Organisme de Certification CERTIDZ','OEC','Organisme de Certification CERTIDZ','0555900003',NOW(),'APPROVED',false,false,'Organisme de certification','Constantine, Algérie','Mohamed Salah Yahiaoui','Certification de produits'),
('oec4@calibr-dz.com','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Centre d''Étalonnage Algérien','OEC','Centre d''Étalonnage Algérien','0555900004',NOW(),'APPROVED',false,false,'Laboratoire d''étalonnage','Annaba, Algérie','Arezki Belkadi','Métrologie dimensionnelle et masse'),
('oec5@medlab-dz.com','$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS','Laboratoire Médical Pasteur','OEC','Laboratoire Médical Pasteur','0555900005',NOW(),'APPROVED',false,false,'Laboratoire de biologie médicale','Blida, Algérie','Dr. Farid Hemiche','Analyses médicales')
ON CONFLICT (email) DO NOTHING;

