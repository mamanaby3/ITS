-- Vérifier et corriger la table navire_dispatching
USE its_maritime_stock;

-- Afficher la structure actuelle
DESCRIBE navire_dispatching;

-- Ajouter la colonne dispatch_par si elle n'existe pas
ALTER TABLE navire_dispatching 
ADD COLUMN IF NOT EXISTS dispatch_par INT AFTER created_by;

-- Ajouter la clé étrangère si nécessaire
ALTER TABLE navire_dispatching
ADD CONSTRAINT IF NOT EXISTS fk_dispatch_par 
FOREIGN KEY (dispatch_par) REFERENCES utilisateurs(id);

-- Vérifier aussi la table mouvements_stock
DESCRIBE mouvements_stock;

-- Vérifier la structure finale
SHOW CREATE TABLE navire_dispatching;