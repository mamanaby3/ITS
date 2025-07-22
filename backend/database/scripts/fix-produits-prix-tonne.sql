-- Vérifier et corriger la table produits
USE its_maritime_stock;

-- Afficher la structure actuelle
DESCRIBE produits;

-- Ajouter la colonne prix_tonne si elle n'existe pas
ALTER TABLE produits 
ADD COLUMN IF NOT EXISTS prix_tonne DECIMAL(15,2) DEFAULT 0 AFTER unite;

-- Vérifier la structure mise à jour
DESCRIBE produits;