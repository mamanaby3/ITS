-- Ajouter la colonne encours_credit à la table clients
USE its_maritime_stock;

-- Vérifier si la colonne existe déjà
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'its_maritime_stock' 
AND TABLE_NAME = 'clients' 
AND COLUMN_NAME = 'encours_credit';

-- Ajouter la colonne si elle n'existe pas
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS encours_credit DECIMAL(15,2) DEFAULT 0 AFTER credit_limite;

-- Vérifier la structure finale
DESCRIBE clients;