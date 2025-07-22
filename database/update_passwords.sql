-- =====================================================
-- MISE À JOUR DES MOTS DE PASSE
-- =====================================================

USE its_senegal_stock;

-- Hash bcrypt pour le mot de passe "123456"
-- Ce hash a été généré avec bcrypt (10 rounds)
SET @password_hash = '$2b$10$4iXdsgbsVKb8hTt8wIrXXOQKYwGYOuUuJx3xKvWjHAYJXitWXbH2W';

-- Mettre à jour tous les mots de passe
UPDATE utilisateurs SET password = @password_hash;

-- Vérifier que les utilisateurs ont bien été créés
SELECT 
    id,
    email,
    nom,
    prenom,
    role,
    CASE 
        WHEN magasin_id IS NULL THEN 'Aucun'
        ELSE (SELECT nom FROM magasins WHERE id = utilisateurs.magasin_id)
    END as magasin,
    actif
FROM utilisateurs
ORDER BY role DESC, magasin_id;

-- Message de confirmation
SELECT 'Mots de passe mis à jour avec succès!' AS Message;
SELECT 'Utilisez le mot de passe: 123456 pour tous les comptes' AS Info;