-- Script pour ajouter le champ destination aux produits
USE its_maritime_stock;

-- Ajouter la colonne destination à la table produits
ALTER TABLE produits 
ADD COLUMN IF NOT EXISTS destination ENUM('stockage', 'distribution', 'transformation', 'export') DEFAULT 'stockage' AFTER unite,
ADD COLUMN IF NOT EXISTS peut_etre_distribue BOOLEAN DEFAULT TRUE AFTER destination,
ADD COLUMN IF NOT EXISTS notes_destination TEXT AFTER peut_etre_distribue;

-- Mettre à jour les produits existants avec des destinations appropriées
UPDATE produits 
SET destination = CASE
    WHEN categorie = 'Céréales' THEN 'stockage'
    WHEN categorie = 'Aliments pour animaux' THEN 'distribution'
    WHEN categorie = 'Produits transformés' THEN 'transformation'
    ELSE 'stockage'
END
WHERE destination IS NULL;

-- Ajouter un index pour améliorer les performances
CREATE INDEX idx_produits_destination ON produits(destination);