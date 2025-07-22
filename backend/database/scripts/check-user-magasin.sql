-- Vérifier la liaison utilisateur-magasin
USE its_maritime_stock;

-- 1. Voir la structure de la table utilisateurs
DESCRIBE utilisateurs;

-- 2. Voir les utilisateurs et leurs magasins
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
WHERE u.actif = 1;

-- 3. Vérifier quels utilisateurs n'ont pas de magasin assigné
SELECT 
    id, nom, prenom, email, role, magasin_id
FROM utilisateurs 
WHERE magasin_id IS NULL AND role = 'operator';

-- 4. Exemple pour assigner un magasin à un utilisateur
-- UPDATE utilisateurs SET magasin_id = 'yarakh' WHERE id = 2;