-- Fix navire_dispatching table to resolve 500 errors
USE its_maritime_stock;

-- Skip navires table column rename (already has correct name)

-- Add missing columns to navire_dispatching table
ALTER TABLE navire_dispatching 
ADD COLUMN IF NOT EXISTS numero_camion VARCHAR(100) AFTER quantite,
ADD COLUMN IF NOT EXISTS transporteur VARCHAR(255) AFTER numero_camion,
ADD COLUMN IF NOT EXISTS destination VARCHAR(255) AFTER transporteur,
ADD COLUMN IF NOT EXISTS quantite_chargee DECIMAL(10,2) AFTER destination,
ADD COLUMN IF NOT EXISTS statut ENUM('en_attente', 'chargement', 'en_route', 'livre') DEFAULT 'en_attente' AFTER quantite_chargee,
ADD COLUMN IF NOT EXISTS date_chargement DATETIME AFTER statut,
ADD COLUMN IF NOT EXISTS heure_depart TIME AFTER date_chargement,
ADD COLUMN IF NOT EXISTS client_id INT AFTER magasin_id,
ADD COLUMN IF NOT EXISTS created_by INT AFTER dispatch_par;

-- Drop existing constraints if they exist and recreate them
ALTER TABLE navire_dispatching
DROP FOREIGN KEY IF EXISTS fk_navire_dispatching_client,
DROP FOREIGN KEY IF EXISTS fk_navire_dispatching_created_by;

-- Add foreign key for client_id
ALTER TABLE navire_dispatching
ADD CONSTRAINT fk_navire_dispatching_client 
FOREIGN KEY (client_id) REFERENCES clients(id)
ON DELETE SET NULL;

-- Add foreign key for created_by
ALTER TABLE navire_dispatching
ADD CONSTRAINT fk_navire_dispatching_created_by 
FOREIGN KEY (created_by) REFERENCES utilisateurs(id);

-- Update existing records to have default values
UPDATE navire_dispatching 
SET statut = 'en_attente' 
WHERE statut IS NULL;

UPDATE navire_dispatching 
SET date_chargement = date_dispatch 
WHERE date_chargement IS NULL;

UPDATE navire_dispatching 
SET quantite_chargee = quantite 
WHERE quantite_chargee IS NULL;

UPDATE navire_dispatching 
SET created_by = dispatch_par 
WHERE created_by IS NULL AND dispatch_par IS NOT NULL;

-- Also fix navire_cargaison table
ALTER TABLE navire_cargaison
ADD COLUMN IF NOT EXISTS quantite_declaree DECIMAL(10,2) AFTER quantite,
ADD COLUMN IF NOT EXISTS quantite_recue DECIMAL(10,2) AFTER quantite_declaree;

-- Update existing records
UPDATE navire_cargaison 
SET quantite_declaree = quantite,
    quantite_recue = quantite
WHERE quantite_declaree IS NULL;

-- Fix stocks table name issue
RENAME TABLE IF EXISTS stock TO stocks;

-- Add missing columns to stocks table
ALTER TABLE stocks
ADD COLUMN IF NOT EXISTS quantite_disponible DECIMAL(10,2) AFTER quantite,
ADD COLUMN IF NOT EXISTS derniere_entree DATETIME AFTER valeur_totale;

-- Update existing records
UPDATE stocks 
SET quantite_disponible = quantite
WHERE quantite_disponible IS NULL;

-- Fix mouvements_stock table
ALTER TABLE mouvements_stock
ADD COLUMN IF NOT EXISTS type_mouvement ENUM('entree', 'sortie', 'transfert', 'ajustement') AFTER id,
ADD COLUMN IF NOT EXISTS magasin_origine_id VARCHAR(50) AFTER magasin_id,
ADD COLUMN IF NOT EXISTS magasin_destination_id VARCHAR(50) AFTER magasin_origine_id,
ADD COLUMN IF NOT EXISTS reference_document VARCHAR(100) AFTER prix_unitaire,
ADD COLUMN IF NOT EXISTS navire_id INT AFTER reference_document,
ADD COLUMN IF NOT EXISTS date_mouvement DATETIME AFTER navire_id,
ADD COLUMN IF NOT EXISTS created_by INT AFTER utilisateur_id;

-- Drop and recreate foreign keys
ALTER TABLE mouvements_stock
DROP FOREIGN KEY IF EXISTS fk_mouvements_navire;

ALTER TABLE mouvements_stock
ADD CONSTRAINT fk_mouvements_navire 
FOREIGN KEY (navire_id) REFERENCES navires(id)
ON DELETE SET NULL;

-- Update type column to type_mouvement if needed
UPDATE mouvements_stock 
SET type_mouvement = type
WHERE type_mouvement IS NULL AND type IS NOT NULL;

-- Set date_mouvement from created_at if null
UPDATE mouvements_stock 
SET date_mouvement = created_at
WHERE date_mouvement IS NULL;

-- Set created_by from utilisateur_id if null
UPDATE mouvements_stock 
SET created_by = utilisateur_id
WHERE created_by IS NULL;

-- Verify the structures
DESCRIBE navire_dispatching;
DESCRIBE navire_cargaison;
DESCRIBE stocks;
DESCRIBE mouvements_stock;