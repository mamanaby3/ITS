-- Check current table structures
USE its_maritime_stock;

-- Show all columns in navire_dispatching
SHOW COLUMNS FROM navire_dispatching;

-- Show all columns in navires
SHOW COLUMNS FROM navires;

-- Show all columns in navire_cargaison
SHOW COLUMNS FROM navire_cargaison;

-- Show all columns in mouvements_stock
SHOW COLUMNS FROM mouvements_stock;

-- Check if stocks table exists
SHOW TABLES LIKE 'stocks';
SHOW TABLES LIKE 'stock';