-- Script complet pour corriger la table clients
USE its_maritime_stock;

-- 1. D'abord, voyons la structure actuelle
SHOW COLUMNS FROM clients;

-- 2. Ajouter les colonnes manquantes si elles n'existent pas
-- Ajouter type_client si manquant
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS type_client ENUM('entreprise', 'particulier', 'gouvernement', 'ong') DEFAULT 'entreprise' AFTER nom;

-- Ajouter encours_credit si manquant
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS encours_credit DECIMAL(15,2) DEFAULT 0 AFTER credit_limite;

-- 3. Vérifier la structure finale
DESCRIBE clients;

-- 4. Afficher quelques enregistrements pour vérifier
SELECT * FROM clients LIMIT 5;