-- Debug script to check navires data
USE its_maritime_stock;

-- 1. Show all navires in the database
SELECT 'All navires in database:' as info;
SELECT id, nom_navire, numero_imo, date_arrivee, statut 
FROM navires 
ORDER BY id;

-- 2. Count total navires
SELECT 'Total navires count:' as info;
SELECT COUNT(*) as total_navires FROM navires;

-- 3. Check for specific date
SELECT 'Navires for 2025-07-07:' as info;
SELECT id, nom_navire, date_arrivee 
FROM navires 
WHERE DATE(date_arrivee) = '2025-07-07';

-- 4. Check navire_cargaison
SELECT 'Navire cargaison entries:' as info;
SELECT nc.navire_id, n.nom_navire, COUNT(*) as cargaison_count
FROM navire_cargaison nc
JOIN navires n ON nc.navire_id = n.id
GROUP BY nc.navire_id, n.nom_navire;

-- 5. Check mouvements_stock
SELECT 'Mouvements stock with navire_id:' as info;
SELECT DISTINCT navire_id, COUNT(*) as movement_count
FROM mouvements_stock
WHERE navire_id IS NOT NULL
GROUP BY navire_id;