-- =====================================================
-- SCRIPT DE CORRECTION POUR L'APPLICATION
-- Assure la compatibilité avec l'application existante
-- =====================================================

USE its_maritime_stock;

-- =====================================================
-- VÉRIFICATION ET AJUSTEMENT DES TABLES CRITIQUES
-- =====================================================

-- S'assurer que la table commande_details existe (alias pour commande_lignes)
CREATE TABLE IF NOT EXISTS commande_details AS SELECT * FROM commande_lignes WHERE 1=0;

-- Si commande_lignes existe mais pas commande_details, créer une vue
DROP VIEW IF EXISTS commande_details;
CREATE VIEW commande_details AS SELECT * FROM commande_lignes;

-- S'assurer que certaines colonnes existent avec les bons noms
ALTER TABLE produits 
    ADD COLUMN IF NOT EXISTS categorie VARCHAR(100),
    ADD COLUMN IF NOT EXISTS prix_unitaire DECIMAL(15,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS seuil_alerte DECIMAL(10,2) DEFAULT 50;

-- S'assurer que la table stocks a toutes les colonnes nécessaires
ALTER TABLE stocks
    ADD COLUMN IF NOT EXISTS quantite DECIMAL(15,3) GENERATED ALWAYS AS (quantite_disponible) STORED,
    ADD COLUMN IF NOT EXISTS valeur_stock DECIMAL(15,2) GENERATED ALWAYS AS (quantite_disponible * valeur_unitaire) STORED;

-- =====================================================
-- CRÉATION DES ALIAS ET VUES POUR COMPATIBILITÉ
-- =====================================================

-- Vue pour avoir une table "stock" (singulier) si l'app l'utilise
DROP VIEW IF EXISTS stock;
CREATE VIEW stock AS SELECT * FROM stocks;

-- Vue pour navire_cargaisons (pluriel) si utilisé
DROP VIEW IF EXISTS navire_cargaisons;
CREATE VIEW navire_cargaisons AS SELECT * FROM navire_cargaison;

-- =====================================================
-- AJOUT DES UTILISATEURS PAR DÉFAUT
-- =====================================================

-- Supprimer les utilisateurs existants pour éviter les doublons
DELETE FROM utilisateurs WHERE email IN ('admin@its-senegal.com', 'manager@its-senegal.com');

-- Insérer l'admin avec un mot de passe simple (à changer en production)
-- Mot de passe: admin123
INSERT INTO utilisateurs (nom, prenom, email, password_hash, role) VALUES
('Admin', 'ITS', 'admin@its-senegal.com', '$2b$10$YKgmWtY2kUNLZLKKKKKKKeO8nQzjHwQV3RVfDiGGI2rH6N0p3OETG', 'manager'),
('Manager', 'ITS', 'manager@its-senegal.com', '$2b$10$YKgmWtY2kUNLZLKKKKKKKeO8nQzjHwQV3RVfDiGGI2rH6N0p3OETG', 'manager');

-- =====================================================
-- DONNÉES DE TEST MINIMALES
-- =====================================================

-- S'assurer qu'il y a au moins quelques produits
INSERT IGNORE INTO produits (reference, nom, categorie, unite, prix_unitaire) VALUES
('PROD-001', 'Maïs Jaune', 'Céréales', 'tonnes', 180000),
('PROD-002', 'Riz Brisé', 'Céréales', 'tonnes', 250000),
('PROD-003', 'Blé Tendre', 'Céréales', 'tonnes', 220000),
('PROD-004', 'Soja', 'Légumineuses', 'tonnes', 280000);

-- S'assurer qu'il y a au moins un client
INSERT IGNORE INTO clients (code, nom, type, telephone, email) VALUES
('CLI-001', 'Client Test', 'entreprise', '+221 77 123 45 67', 'test@client.com');

-- =====================================================
-- PROCÉDURE DE VÉRIFICATION
-- =====================================================

DELIMITER //

DROP PROCEDURE IF EXISTS sp_verifier_base//
CREATE PROCEDURE sp_verifier_base()
BEGIN
    SELECT 'VÉRIFICATION DE LA BASE DE DONNÉES' AS Etape;
    
    -- Vérifier les tables principales
    SELECT 
        'Tables principales' AS Verification,
        COUNT(*) AS Nombre
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = 'its_maritime_stock'
    AND TABLE_NAME IN ('magasins', 'utilisateurs', 'produits', 'clients', 'stocks', 
                       'navires', 'commandes', 'mouvements_stock');
    
    -- Vérifier les utilisateurs
    SELECT 
        'Utilisateurs' AS Type,
        email,
        role,
        actif
    FROM utilisateurs
    WHERE role IN ('admin', 'manager');
    
    -- Vérifier les produits
    SELECT 
        'Produits disponibles' AS Type,
        COUNT(*) AS Nombre
    FROM produits
    WHERE actif = TRUE;
    
    -- Vérifier les magasins
    SELECT 
        'Magasins' AS Type,
        COUNT(*) AS Nombre
    FROM magasins;
END//

DELIMITER ;

-- Exécuter la vérification
CALL sp_verifier_base();

-- =====================================================
-- CONFIGURATION FINALE
-- =====================================================

-- S'assurer que les foreign keys sont activées
SET FOREIGN_KEY_CHECKS = 1;

-- Message de confirmation
SELECT 'Base de données configurée et prête pour l\'application!' AS Message;