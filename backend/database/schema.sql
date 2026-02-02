-- ALGERAC Platform Database Schema
-- PostgreSQL

-- Create database
CREATE DATABASE algerac_db;

-- Connect to the database
\c algerac_db;

-- Users table will be created automatically by Hibernate
-- But here's the expected structure for reference:

/*
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    user_type VARCHAR(50) NOT NULL,
    
    -- Common fields
    email VARCHAR(255) NOT NULL UNIQUE,
    telephone VARCHAR(50) NOT NULL,
    
    -- OEC specific fields
    nom_organisme VARCHAR(255),
    type_organisme VARCHAR(100),
    adresse_siege TEXT,
    nom_representant VARCHAR(255),
    fonction VARCHAR(100),
    telephone_direct VARCHAR(50),
    email_professionnel VARCHAR(255),
    portee_accreditation TEXT,
    
    -- Expert specific fields
    nom VARCHAR(100),
    prenom VARCHAR(100),
    specialite VARCHAR(255),
    experience TEXT,
    diplomes TEXT,
    langues VARCHAR(255),
    disponibilite VARCHAR(255),
    
    -- Status and dates
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    date_inscription TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_approbation TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_user_type ON users(user_type);
*/

-- Grant permissions (adjust username as needed)
-- GRANT ALL PRIVILEGES ON DATABASE algerac_db TO your_username;
