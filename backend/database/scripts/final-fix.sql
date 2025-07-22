-- Final fix for all remaining issues
USE its_maritime_stock;

-- 1. Handle stocks/stock table confusion
-- First check if both tables exist
SET @stock_exists = (SELECT COUNT(*) FROM information_schema.tables 
                     WHERE table_schema = 'its_maritime_stock' 
                     AND table_name = 'stock');

SET @stocks_exists = (SELECT COUNT(*) FROM information_schema.tables 
                      WHERE table_schema = 'its_maritime_stock' 
                      AND table_name = 'stocks');

-- If only 'stock' exists, rename it to 'stocks'
SET @sql = IF(@stock_exists = 1 AND @stocks_exists = 0,
    'RENAME TABLE stock TO stocks',
    'SELECT "stocks table already exists or both tables exist"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Add missing columns to stocks table
ALTER TABLE stocks
ADD COLUMN IF NOT EXISTS quantite DECIMAL(15,3) AFTER magasin_id,
ADD COLUMN IF NOT EXISTS quantite_disponible DECIMAL(15,3) AFTER quantite,
ADD COLUMN IF NOT EXISTS derniere_entree DATETIME AFTER prix_unitaire;

-- 3. Update quantite_disponible based on existing data
-- First check what columns we have
SET @has_quantite = (
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_schema = 'its_maritime_stock' 
    AND table_name = 'stocks' 
    AND column_name = 'quantite'
);

SET @has_quantite_disponible = (
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_schema = 'its_maritime_stock' 
    AND table_name = 'stocks' 
    AND column_name = 'quantite_disponible'
);

-- Update only if both columns exist
SET @sql = IF(@has_quantite = 1 AND @has_quantite_disponible = 1,
    'UPDATE stocks SET quantite_disponible = quantite WHERE quantite_disponible IS NULL',
    'SELECT "Skipping quantite_disponible update"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Show final structure
DESCRIBE stocks;