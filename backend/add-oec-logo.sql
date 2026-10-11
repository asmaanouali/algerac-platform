-- Logo facultatif de l'organisme (OEC), remplace le champ "Sigle" du formulaire d'inscription.
-- À exécuter une fois si le schéma n'est pas géré par DDL_AUTO=update.
ALTER TABLE users ADD COLUMN IF NOT EXISTS logo_base64 TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS logo_mime_type VARCHAR(255);
