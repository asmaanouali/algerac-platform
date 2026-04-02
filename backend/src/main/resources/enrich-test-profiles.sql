-- ============================================================
-- ALGERAC Platform - Complete Workflow Test Data
-- Run AFTER seed-data.sql (which creates users)
-- This script creates realistic test documents and data
-- ============================================================

-- Additional OEC organizations with richer profiles
UPDATE users SET 
    organization_name = 'Laboratoire National d''Essais Matériaux (LNEM)',
    type_organisme = 'Laboratoire d''Essais',
    adresse_siege = '12 Rue des Sciences, Bab Ezzouar, Alger',
    nom_representant = 'Dr. Mohamed Benali',
    fonction = 'Directeur Technique',
    telephone_direct = '023 45 67 89',
    portee_accreditation = 'Essais matériaux de construction: béton, ciment, granulats, acier'
WHERE email = 'oec.test@algerac.dz';

UPDATE users SET 
    organization_name = 'Laboratoire Régional d''Analyses (LRA)',
    type_organisme = 'Laboratoire d''Essais',
    adresse_siege = '45 Boulevard de l''ALN, Oran',
    nom_representant = 'Mme. Fatima Hadj',
    fonction = 'Directrice',
    portee_accreditation = 'Essais chimiques et physiques'
WHERE email = 'oec.labo1@algerac.dz';

UPDATE users SET 
    organization_name = 'Bureau de Contrôle Industriel (BCI)',
    type_organisme = 'Organisme d''Inspection',
    adresse_siege = '78 Zone Industrielle, Rouiba, Alger',
    nom_representant = 'M. Karim Mansouri',
    fonction = 'Gérant',
    portee_accreditation = 'Inspection équipements sous pression, ascenseurs'
WHERE email = 'oec.inspect1@algerac.dz';

UPDATE users SET 
    organization_name = 'Organisme Algérien de Certification (OAC)',
    type_organisme = 'Organisme de Certification',
    adresse_siege = '22 Rue Didouche Mourad, Alger Centre',
    nom_representant = 'Dr. Amine Khelifi',
    fonction = 'Directeur Général',
    portee_accreditation = 'Certification de produits agroalimentaires'
WHERE email = 'oec.certif1@algerac.dz';

UPDATE users SET 
    organization_name = 'Centre National de Métrologie (CNM)',
    type_organisme = 'Laboratoire d''Étalonnage',
    adresse_siege = '5 Avenue de l''Indépendance, Blida',
    nom_representant = 'Prof. Rachid Boumediene',
    fonction = 'Directeur Scientifique',
    portee_accreditation = 'Étalonnage masses, balances, instruments de pesage, température'
WHERE email = 'oec.calibration1@algerac.dz';

-- Enrich expert profiles for test
UPDATE users SET 
    specialite = 'Essais mécaniques et matériaux de construction',
    experience = '15 ans d''expérience en évaluation de laboratoires',
    diplomes = 'Doctorat en Génie des Matériaux - USTHB',
    langues = 'Français, Arabe, Anglais',
    disponibilite = 'Disponible',
    domaine_expertise = 'Laboratoire d''Essais',
    sous_domaine_expertise = 'Matériaux de construction'
WHERE email = 'ree1@algerac.dz';

UPDATE users SET 
    specialite = 'Inspection industrielle et contrôle qualité',
    experience = '12 ans en audit et évaluation',
    diplomes = 'Master en Ingénierie Industrielle - ENP',
    langues = 'Français, Arabe',
    disponibilite = 'Disponible',
    domaine_expertise = 'Inspection',
    sous_domaine_expertise = 'Équipements industriels'
WHERE email = 'ree2@algerac.dz';

UPDATE users SET 
    specialite = 'Béton, ciment et matériaux cimentaires',
    experience = '10 ans de pratique en laboratoire d''essais',
    diplomes = 'Ingénieur en Génie Civil - ENPC',
    langues = 'Français, Arabe, Anglais',
    domaine_expertise = 'Laboratoire d''Essais',
    sous_domaine_expertise = 'Béton et ciment'
WHERE email = 'et1@algerac.dz';

UPDATE users SET 
    specialite = 'Granulats, sols et géotechnique',
    experience = '8 ans d''expérience terrain',
    diplomes = 'Master en Géotechnique - USTHB',
    langues = 'Français, Arabe',
    domaine_expertise = 'Laboratoire d''Essais',
    sous_domaine_expertise = 'Géotechnique'
WHERE email = 'et2@algerac.dz';

UPDATE users SET 
    specialite = 'Sécurité électrique et compatibilité électromagnétique',
    experience = '11 ans en essais électriques',
    diplomes = 'Doctorat en Génie Électrique - ENPC',
    langues = 'Français, Arabe, Anglais',
    domaine_expertise = 'Laboratoire d''Essais',
    sous_domaine_expertise = 'Électrique et électronique'
WHERE email = 'et3@algerac.dz';
