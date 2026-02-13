-- ALGERAC Platform - Seed Data
-- Run this after Spring Boot creates the tables

-- Insert test users (passwords are BCrypt hashed 'password123')
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status) VALUES
('orginag65msf@gmail.com', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'DT Test', 'DT', 'ALGERAC DT', '0555123456', NOW(), 'APPROVED'),
('asmaa9nouali@gmail.com', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Admin Test', 'ADMIN', 'ALGERAC Admin', '0555123456', NOW(), 'APPROVED'),
('sumsum88.sum23@gmail.com', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Chef Département', 'CD', 'ALGERAC Direction', '0555111111', NOW(), 'APPROVED'),
('gr.asmaa98@gmail.com', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Responsable Accréditation 1', 'RA', 'ALGERAC RA', '0555222222', NOW(), 'APPROVED'),
('zenmal695@gmail.com', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'Responsable Accréditation 2', 'RA', 'ALGERAC RA', '0555333333', NOW(), 'APPROVED'),
('lynakdr724@gmail.com', '$2a$10$AfEgCB5hUnlvbHu/x/MtguEWwY3xnfsmehkKWalAA1LXGnNUhFTtS', 'OEC Test', 'OEC', 'Laboratoire Central', '0555444444', NOW(), 'APPROVED')
ON CONFLICT (email) DO NOTHING;

-- Insert test accreditation requests
INSERT INTO accreditation_requests (oec_id, type, domain, description, status, progress, submission_date, created_at) VALUES
((SELECT id FROM users WHERE email = 'lynakdr724@gmail.com'), 'INITIAL', 'Laboratoire d''essais', 'Demande initiale pour accréditation laboratoire', 'PAYMENT_COMPLETED', 20, NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days'),
((SELECT id FROM users WHERE email = 'lynakdr724@gmail.com'), 'RENOUVELLEMENT', 'Inspection', 'Renouvellement accréditation inspection', 'PAYMENT_COMPLETED', 20, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'),
((SELECT id FROM users WHERE email = 'lynakdr724@gmail.com'), 'EXTENSION', 'Certification', 'Extension de portée pour certification', 'PAYMENT_COMPLETED', 20, NOW(), NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

