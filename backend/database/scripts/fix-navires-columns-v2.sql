-- Corriger la table navires pour correspondre au contrôleur
USE its_maritime_stock;

-- Ajouter les colonnes manquantes
ALTER TABLE navires 
ADD COLUMN IF NOT EXISTS date_arrivee DATE AFTER date_arrivee_reelle,
ADD COLUMN IF NOT EXISTS port VARCHAR(200) AFTER port_dechargement,
ADD COLUMN IF NOT EXISTS reception_par INT AFTER created_by,
ADD COLUMN IF NOT EXISTS date_reception DATETIME AFTER statut,
ADD COLUMN IF NOT EXISTS observations TEXT;

-- Vérifier si la contrainte existe déjà
SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = 'its_maritime_stock' 
AND TABLE_NAME = 'navires' 
AND CONSTRAINT_NAME = 'fk_reception_par';

-- Ajouter la clé étrangère pour reception_par (sans IF NOT EXISTS)
ALTER TABLE navires
ADD CONSTRAINT fk_reception_par 
FOREIGN KEY (reception_par) REFERENCES utilisateurs(id) ON DELETE SET NULL;

-- Copier les données existantes si nécessaire
UPDATE navires 
SET date_arrivee = COALESCE(date_arrivee_reelle, date_arrivee_prevue)
WHERE date_arrivee IS NULL;

UPDATE navires 
SET port = port_dechargement
WHERE port IS NULL;

-- Vérifier la structure finale
DESCRIBE navires;