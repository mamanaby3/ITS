-- Vérifier les tables existantes dans la base de données
USE its_maritime_stock;

-- Afficher toutes les tables
SHOW TABLES;

-- Vérifier spécifiquement si la table clients existe
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'its_maritime_stock' 
AND TABLE_NAME = 'clients';

-- Vérifier la structure de la table clients si elle existe
DESCRIBE clients;