-- Corriger la table mouvements_stock
USE its_maritime_stock;

-- Vérifier la structure actuelle
DESCRIBE mouvements_stock;

-- Ajouter les colonnes si nécessaire (optionnel)
ALTER TABLE mouvements_stock 
ADD COLUMN IF NOT EXISTS navire_id INT AFTER reference_document,
ADD CONSTRAINT IF NOT EXISTS fk_navire_mouvement 
FOREIGN KEY (navire_id) REFERENCES navires(id);

-- Afficher la structure mise à jour
DESCRIBE mouvements_stock;