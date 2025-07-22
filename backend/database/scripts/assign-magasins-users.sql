-- Assigner des magasins aux utilisateurs
USE its_maritime_stock;

-- Voir les utilisateurs actuels
SELECT id, nom, prenom, email, role, magasin_id FROM utilisateurs WHERE actif = 1;

-- Voir les magasins disponibles
SELECT id, nom, ville FROM magasins;

-- Exemples d'assignation de magasins aux opérateurs
-- Modifiez les IDs selon vos utilisateurs et magasins

-- Assigner le magasin 'yarakh' à l'utilisateur avec l'ID 2 (si c'est un opérateur)
UPDATE utilisateurs 
SET magasin_id = 'yarakh' 
WHERE id = 2 AND role = 'operator';

-- Assigner le magasin 'belair-garage' à l'utilisateur avec l'ID 3
UPDATE utilisateurs 
SET magasin_id = 'belair-garage' 
WHERE id = 3 AND role = 'operator';

-- Assigner le magasin 'plateforme-belair' à l'utilisateur avec l'ID 4
UPDATE utilisateurs 
SET magasin_id = 'plateforme-belair' 
WHERE id = 4 AND role = 'operator';

-- Vérifier les assignations
SELECT 
    u.id,
    u.nom,
    u.prenom,
    u.email,
    u.role,
    u.magasin_id,
    m.nom as magasin_nom,
    m.ville as magasin_ville
FROM utilisateurs u
LEFT JOIN magasins m ON u.magasin_id = m.id
WHERE u.actif = 1
ORDER BY u.role, u.nom;