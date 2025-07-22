-- Vérifier la structure de la table navires
USE its_maritime_stock;

-- Afficher la structure de la table navires
SHOW CREATE TABLE navires;

-- Afficher les colonnes
DESCRIBE navires;

-- Vérifier si la colonne reception_par existe
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'its_maritime_stock' 
AND TABLE_NAME = 'navires' 
AND COLUMN_NAME = 'reception_par';

-- Si la colonne n'existe pas, l'ajouter
ALTER TABLE navires 
ADD COLUMN IF NOT EXISTS reception_par INT,
ADD FOREIGN KEY IF NOT EXISTS (reception_par) REFERENCES utilisateurs(id);