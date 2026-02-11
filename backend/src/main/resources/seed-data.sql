-- ALGERAC Platform - Seed Data
-- Run this after Spring Boot creates the tables

-- Insert test users (passwords are BCrypt hashed 'password123')
INSERT INTO users (email, password, full_name, role, organization_name, phone, created_at, status) VALUES
('admin@algerac.dz', '$2a$10$xN/Dq7KT5IEWmjyR0u5HJeYYC9H7W1qqNq5oQc.n0vO5cU8hKXxhG', 'Salah Nacef', 'ADMIN', 'ALGERAC Admin', '+213 21 123456', NOW(), 'APPROVED'),
('amine.belkacemi@algerac.dz', '$2a$10$xN/Dq7KT5IEWmjyR0u5HJeYYC9H7W1qqNq5oQc.n0vO5cU8hKXxhG', 'Amine Belkacemi', 'RA', 'ALGERAC RA', '+213 21 123457', NOW(), 'APPROVED'),
('dt@algerac.dz', '$2a$10$xN/Dq7KT5IEWmjyR0u5HJeYYC9H7W1qqNq5oQc.n0vO5cU8hKXxhG', 'Ahmed Directeur Technique', 'DT', 'ALGERAC DT', '+213 21 123458', NOW(), 'APPROVED'),
('biotest@example.com', '$2a$10$xN/Dq7KT5IEWmjyR0u5HJeYYC9H7W1qqNq5oQc.n0vO5cU8hKXxhG', 'Laboratoire BioTest', 'OEC', 'Laboratoire BioTest', '+213 21 789456', NOW(), 'APPROVED');

-- Insert test accreditation requests
INSERT INTO accreditation_requests (reference_number, oec_id, type, domain, status, progress, submission_date, next_action_date, created_at) VALUES
('D-2024-001', 3, 'INITIAL', 'Laboratoire Central d''Analyses', 'RECEIVABILITY', 15, '2024-12-01', '2025-06-01', NOW()),
('D-2024-045', 3, 'SURVEILLANCE', 'Certif-Tech Algérie', 'PLANNING', 45, '2024-11-15', '2025-05-15', NOW()),
('D-2023-120', 3, 'RENOUVELLEMENT', 'BioQualité Std', 'EVALUATION', 70, '2023-10-10', '2025-04-01', NOW());

-- Verification
SELECT 'Users created:' as message, COUNT(*) as count FROM users;
SELECT 'Requests created:' as message, COUNT(*) as count FROM accreditation_requests;
