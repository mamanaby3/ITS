-- Check livraisons table structure
USE its_maritime_stock;

-- Check if livraisons table exists
SHOW TABLES LIKE 'livraisons';

-- If exists, show structure
DESCRIBE livraisons;

-- Show sample data
SELECT * FROM livraisons LIMIT 5;