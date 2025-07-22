-- Complete fix for remaining issues
USE its_maritime_stock;

-- Update existing records to have default values
UPDATE navire_dispatching 
SET statut = 'en_attente' 
WHERE statut IS NULL;

UPDATE navire_dispatching 
SET date_chargement = created_at 
WHERE date_chargement IS NULL;

UPDATE navire_dispatching 
SET quantite_chargee = quantite 
WHERE quantite_chargee IS NULL;

-- Skip created_by update as dispatch_par might not exist

-- Check the final structure
DESCRIBE navire_dispatching;
DESCRIBE navire_cargaison;
DESCRIBE stocks;
DESCRIBE mouvements_stock;

-- Show sample data to verify
SELECT COUNT(*) as total_dispatches FROM navire_dispatching;
SELECT COUNT(*) as total_navires FROM navires;
SELECT COUNT(*) as total_mouvements FROM mouvements_stock;