-- Frais d'enregistrement différés à la fin de l'évaluation (case cochée par la Consolidation).
-- À exécuter une fois si le schéma n'est pas géré par DDL_AUTO=update.
ALTER TABLE payments ADD COLUMN IF NOT EXISTS deferred_to_evaluation_end BOOLEAN DEFAULT FALSE;
