-- Vérifier la structure de la table mouvements_stock
USE its_maritime_stock;

-- Afficher la structure de la table
DESCRIBE mouvements_stock;

-- Afficher les colonnes liées aux magasins
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'its_maritime_stock' 
AND TABLE_NAME = 'mouvements_stock'
AND COLUMN_NAME LIKE '%magasin%';