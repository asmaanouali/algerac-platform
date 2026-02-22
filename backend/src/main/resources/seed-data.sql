-- ALGERAC Platform - Seed Data
-- Run this after Spring Boot creates the tables
-- Table truncation is handled by DataInitializer.java on startup

-- Insert test users (passwords are BCrypt hashed 'password123')
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status, specialite, experience, nom, prenom) VALUES
('orginag65msf@gmail.com', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'DT Test', 'DT', 'ALGERAC DT', '0555123456', NOW(), 'APPROVED', NULL, NULL, NULL, NULL),
('asmaanouali256@gmail.com', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Admin Test', 'ADMIN', 'ALGERAC Admin', '0555123456', NOW(), 'APPROVED', NULL, NULL, NULL, NULL),
('sumsum88.sum23@gmail.com', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Chef Département', 'CD', 'ALGERAC Direction', '0555111111', NOW(), 'APPROVED', NULL, NULL, NULL, NULL),
('gr.asmaa98@gmail.com', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Responsable Accréditation 1', 'RA', 'ALGERAC RA', '0555222222', NOW(), 'APPROVED', NULL, NULL, NULL, NULL),
('zenmal695@gmail.com', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Responsable Accréditation 2', 'RA', 'ALGERAC RA', '0555333333', NOW(), 'APPROVED', NULL, NULL, NULL, NULL),
('lynakdr724@gmail.com', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'OEC Test', 'OEC', 'Laboratoire Central', '0555444444', NOW(), 'APPROVED', NULL, NULL, NULL, NULL),
('dag@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'DAG Test', 'DAG', 'ALGERAC DAG', '0555555555', NOW(), 'APPROVED', NULL, NULL, NULL, NULL),
('expert1@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Ahmed Benali', 'EXPERT', NULL, '0555666666', NOW(), 'APPROVED', 'Laboratoire d''essais', '10 ans', 'Benali', 'Ahmed'),
('expert2@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Fatima Cherif', 'EXPERT', NULL, '0555777777', NOW(), 'APPROVED', 'Inspection', '8 ans', 'Cherif', 'Fatima'),
('expert3@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Karim Hadj', 'EXPERT', NULL, '0555888888', NOW(), 'APPROVED', 'Certification', '12 ans', 'Hadj', 'Karim'),
('expert4@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Nadia Saadi', 'EXPERT', NULL, '0555999999', NOW(), 'APPROVED', 'Qualité', '6 ans', 'Saadi', 'Nadia'),
('expert5@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Youcef Mansouri', 'EXPERT', NULL, '0556111111', NOW(), 'APPROVED', 'Métrologie', '15 ans', 'Mansouri', 'Youcef'),
('ree@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Mohamed Belkacem', 'REE', 'ALGERAC', '0556222222', NOW(), 'APPROVED', 'Laboratoire d''essais', '14 ans', 'Belkacem', 'Mohamed'),
('et@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Samira Khelifi', 'ET', 'ALGERAC', '0556333333', NOW(), 'APPROVED', 'Essais mécaniques', '9 ans', 'Khelifi', 'Samira'),
('eq@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Rachid Boudiaf', 'EQ', 'ALGERAC', '0556444444', NOW(), 'APPROVED', 'Système qualité ISO 17025', '11 ans', 'Boudiaf', 'Rachid'),
('cas.membre@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Amina Messaoudi', 'CAS_MEMBER', 'ALGERAC', '0556555555', NOW(), 'APPROVED', 'Accréditation', '7 ans', 'Messaoudi', 'Amina'),
('cas.president@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Pr. Abdelkader Djebbar', 'CAS_PRESIDENT', 'ALGERAC', '0556666666', NOW(), 'APPROVED', 'Accréditation internationale', '20 ans', 'Djebbar', 'Abdelkader'),
('dg@algerac.dz', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Mme Farida Benmansour', 'DG', 'ALGERAC', '0556777777', NOW(), 'APPROVED', NULL, NULL, 'Benmansour', 'Farida'),
('caroziiinya@gmail.com', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Gestionnaire Compétences', 'GES_COMPETENCES', 'ALGERAC', '0556888888', NOW(), 'APPROVED', 'Gestion des compétences', '5 ans', 'Gestionnaire', 'Compétences')
ON CONFLICT (email) DO NOTHING;

-- Test accreditation requests are now seeded by TestDataSeeder.java (JPA-based, more reliable)

