-- Vérifier toutes les tables liées aux navires
USE its_maritime_stock;

-- 1. Table navires
SHOW COLUMNS FROM navires;

-- 2. Table navire_cargaison
SHOW COLUMNS FROM navire_cargaison;

-- 3. Table navire_dispatching
SHOW COLUMNS FROM navire_dispatching;

-- 4. Vérifier les clés étrangères
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE
    REFERENCED_TABLE_NAME IS NOT NULL
    AND TABLE_SCHEMA = 'its_maritime_stock'
    AND TABLE_NAME IN ('navires', 'navire_cargaison', 'navire_dispatching');