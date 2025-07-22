-- Vérifier les tables existantes dans its_maritime_stock
USE its_maritime_stock;

-- Afficher toutes les tables
SHOW TABLES;

-- Vérifier si les tables nécessaires existent
SELECT 
    'produits' as table_name,
    IF(EXISTS(SELECT 1 FROM information_schema.tables 
              WHERE table_schema = 'its_maritime_stock' 
              AND table_name = 'produits'), 'OUI', 'NON') as existe
UNION
SELECT 
    'magasins',
    IF(EXISTS(SELECT 1 FROM information_schema.tables 
              WHERE table_schema = 'its_maritime_stock' 
              AND table_name = 'magasins'), 'OUI', 'NON')
UNION
SELECT 
    'clients',
    IF(EXISTS(SELECT 1 FROM information_schema.tables 
              WHERE table_schema = 'its_maritime_stock' 
              AND table_name = 'clients'), 'OUI', 'NON')
UNION
SELECT 
    'mouvements',
    IF(EXISTS(SELECT 1 FROM information_schema.tables 
              WHERE table_schema = 'its_maritime_stock' 
              AND table_name = 'mouvements'), 'OUI', 'NON')
UNION
SELECT 
    'users',
    IF(EXISTS(SELECT 1 FROM information_schema.tables 
              WHERE table_schema = 'its_maritime_stock' 
              AND table_name = 'users'), 'OUI', 'NON');