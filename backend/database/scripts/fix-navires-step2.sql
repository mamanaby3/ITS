-- Étape 2 : Ajouter la contrainte de clé étrangère
USE its_maritime_stock;

-- Supprimer la contrainte si elle existe déjà
ALTER TABLE navires DROP FOREIGN KEY IF EXISTS fk_reception_par;

-- Ajouter la nouvelle contrainte
ALTER TABLE navires
ADD CONSTRAINT fk_reception_par 
FOREIGN KEY (reception_par) REFERENCES utilisateurs(id) ON DELETE SET NULL;

-- Vérifier les contraintes
SHOW CREATE TABLE navires;