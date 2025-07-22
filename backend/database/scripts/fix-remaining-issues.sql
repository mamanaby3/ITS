-- Fix remaining issues after partial import
USE its_maritime_stock;

-- Check if foreign keys already exist before adding them
SELECT CONSTRAINT_NAME 
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'navire_dispatching' 
AND TABLE_SCHEMA = 'its_maritime_stock'
AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Only add constraints if they don't exist
-- For client_id
SET @constraint_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_NAME = 'navire_dispatching' 
    AND COLUMN_NAME = 'client_id'
    AND TABLE_SCHEMA = 'its_maritime_stock'
    AND REFERENCED_TABLE_NAME = 'clients'
);

SET @sql = IF(@constraint_exists = 0,
    'ALTER TABLE navire_dispatching ADD CONSTRAINT fk_navire_dispatching_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL',
    'SELECT "Foreign key for client_id already exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- For created_by
SET @constraint_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_NAME = 'navire_dispatching' 
    AND COLUMN_NAME = 'created_by'
    AND TABLE_SCHEMA = 'its_maritime_stock'
    AND REFERENCED_TABLE_NAME = 'utilisateurs'
);

SET @sql = IF(@constraint_exists = 0,
    'ALTER TABLE navire_dispatching ADD CONSTRAINT fk_navire_dispatching_created_by FOREIGN KEY (created_by) REFERENCES utilisateurs(id)',
    'SELECT "Foreign key for created_by already exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Continue with remaining updates
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

-- Verify final structure
SHOW CREATE TABLE navire_dispatching;