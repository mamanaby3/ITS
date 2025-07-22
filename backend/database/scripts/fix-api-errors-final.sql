-- Fix API errors based on actual table structure
USE its_maritime_stock;

-- 1. Fix navire_dispatching statut values
ALTER TABLE navire_dispatching 
MODIFY COLUMN statut ENUM('planifie','en_cours','complete','en_attente','chargement','en_route','livre') DEFAULT 'en_attente';

-- Update existing statut values
UPDATE navire_dispatching 
SET statut = 'en_attente' 
WHERE statut = 'planifie';

UPDATE navire_dispatching 
SET statut = 'chargement' 
WHERE statut = 'en_cours';

-- 2. Set default values for nullable fields
UPDATE navire_dispatching 
SET date_chargement = NOW() 
WHERE date_chargement IS NULL;

UPDATE navire_dispatching 
SET quantite_chargee = quantite 
WHERE quantite_chargee IS NULL;

-- 3. Create missing created_at column in navire_dispatching
ALTER TABLE navire_dispatching
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER dispatch_par;

-- 4. Fix navire_cargaison - add missing quantite column
ALTER TABLE navire_cargaison
ADD COLUMN IF NOT EXISTS quantite DECIMAL(15,3) AFTER produit_id;

UPDATE navire_cargaison
SET quantite = quantite_declaree
WHERE quantite IS NULL;

-- 5. Ensure stocks table has the required columns
ALTER TABLE stocks
ADD COLUMN IF NOT EXISTS quantite_disponible DECIMAL(15,3) AFTER quantite;

UPDATE stocks
SET quantite_disponible = quantite
WHERE quantite_disponible IS NULL;

-- 6. Show final structures
SELECT 'navire_dispatching structure:' as info;
DESCRIBE navire_dispatching;

SELECT 'navire_cargaison structure:' as info;
DESCRIBE navire_cargaison;

SELECT 'stocks structure:' as info;
DESCRIBE stocks;