-- Paiement par chèque: banque émettrice, enregistrée par la Consolidation.
-- À exécuter une fois si le schéma n'est pas géré par DDL_AUTO=update.
ALTER TABLE payments ADD COLUMN IF NOT EXISTS check_bank VARCHAR(255);
