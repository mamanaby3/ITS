-- Étape 1 : Ajouter les colonnes manquantes
USE its_maritime_stock;

-- Ajouter les colonnes manquantes
ALTER TABLE navires 
ADD COLUMN IF NOT EXISTS date_arrivee DATE,
ADD COLUMN IF NOT EXISTS port VARCHAR(200),
ADD COLUMN IF NOT EXISTS reception_par INT,
ADD COLUMN IF NOT EXISTS date_reception DATETIME,
ADD COLUMN IF NOT EXISTS observations TEXT;

-- Copier les données existantes
UPDATE navires 
SET date_arrivee = COALESCE(date_arrivee_reelle, date_arrivee_prevue)
WHERE date_arrivee IS NULL;

UPDATE navires 
SET port = port_dechargement
WHERE port IS NULL;

-- Vérifier la structure
DESCRIBE navires;