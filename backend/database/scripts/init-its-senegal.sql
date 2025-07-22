-- Script d'initialisation de la base de données ITS Sénégal
-- Base de données pour la gestion de stock maritime

-- Créer la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS its_maritime_stock CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE its_maritime_stock;

-- =====================================================
-- CRÉATION DES TABLES
-- =====================================================

-- Table des catégories de produits
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des magasins/entrepôts
CREATE TABLE IF NOT EXISTS magasins (
    id VARCHAR(50) PRIMARY KEY,
    nom VARCHAR(200) NOT NULL,
    ville VARCHAR(100) NOT NULL,
    adresse TEXT,
    telephone VARCHAR(20),
    responsable VARCHAR(200),
    capacite_max DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ville (ville)
);

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS utilisateurs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('manager', 'operator') NOT NULL DEFAULT 'operator',
    magasin_id VARCHAR(50),
    actif BOOLEAN DEFAULT TRUE,
    derniere_connexion TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (magasin_id) REFERENCES magasins(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- Table des produits
CREATE TABLE IF NOT EXISTS produits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reference VARCHAR(50) NOT NULL UNIQUE,
    nom VARCHAR(200) NOT NULL,
    categorie_id INT,
    description TEXT,
    unite ENUM('tonnes', 'kg', 'sacs', 'conteneurs') DEFAULT 'tonnes',
    poids_unitaire DECIMAL(10,3) DEFAULT 1.000,
    prix_unitaire DECIMAL(15,2) DEFAULT 0,
    seuil_alerte DECIMAL(10,2) DEFAULT 50,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (categorie_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    INDEX idx_reference (reference),
    INDEX idx_categorie (categorie_id)
);

-- Table des clients
CREATE TABLE IF NOT EXISTS clients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    nom VARCHAR(200) NOT NULL,
    type ENUM('entreprise', 'particulier', 'gouvernement') DEFAULT 'entreprise',
    email VARCHAR(255),
    telephone VARCHAR(20),
    adresse TEXT,
    ville VARCHAR(100),
    pays VARCHAR(100) DEFAULT 'Sénégal',
    contact_principal VARCHAR(200),
    credit_limite DECIMAL(15,2) DEFAULT 0,
    credit_utilise DECIMAL(15,2) DEFAULT 0,
    delai_paiement INT DEFAULT 30,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    INDEX idx_code (code),
    INDEX idx_nom (nom)
);

-- Table des stocks
CREATE TABLE IF NOT EXISTS stocks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    produit_id INT NOT NULL,
    magasin_id VARCHAR(50) NOT NULL,
    quantite_disponible DECIMAL(15,3) DEFAULT 0,
    quantite_reservee DECIMAL(15,3) DEFAULT 0,
    valeur_unitaire DECIMAL(15,2) DEFAULT 0,
    lot_number VARCHAR(100),
    date_entree DATE,
    date_expiration DATE,
    emplacement VARCHAR(100),
    derniere_entree TIMESTAMP NULL,
    derniere_sortie TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE,
    FOREIGN KEY (magasin_id) REFERENCES magasins(id) ON DELETE CASCADE,
    UNIQUE KEY unique_produit_magasin_lot (produit_id, magasin_id, lot_number),
    INDEX idx_produit_magasin (produit_id, magasin_id)
);

-- Table des mouvements de stock
CREATE TABLE IF NOT EXISTS mouvements_stock (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type_mouvement ENUM('entree', 'sortie', 'transfert', 'ajustement', 'perte', 'retour') NOT NULL,
    produit_id INT NOT NULL,
    magasin_source_id VARCHAR(50),
    magasin_destination_id VARCHAR(50),
    quantite DECIMAL(15,3) NOT NULL,
    prix_unitaire DECIMAL(15,2),
    reference_document VARCHAR(100),
    date_mouvement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    lot_number VARCHAR(100),
    client_id INT,
    navire_id INT,
    created_by INT NOT NULL,
    validated_by INT,
    validated_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE,
    FOREIGN KEY (magasin_source_id) REFERENCES magasins(id) ON DELETE SET NULL,
    FOREIGN KEY (magasin_destination_id) REFERENCES magasins(id) ON DELETE SET NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES utilisateurs(id),
    FOREIGN KEY (validated_by) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    INDEX idx_type_date (type_mouvement, date_mouvement),
    INDEX idx_produit (produit_id),
    INDEX idx_reference (reference_document)
);

-- Table des navires
CREATE TABLE IF NOT EXISTS navires (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom_navire VARCHAR(200) NOT NULL,
    numero_imo VARCHAR(20) UNIQUE,
    pavillon VARCHAR(100),
    port_chargement VARCHAR(200),
    port_dechargement VARCHAR(200) DEFAULT 'Dakar',
    date_arrivee_prevue DATE,
    date_arrivee_reelle DATE,
    statut ENUM('attendu', 'arrive', 'en_dechargement', 'receptionne', 'dispatche') DEFAULT 'attendu',
    numero_connaissement VARCHAR(100),
    agent_maritime VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    INDEX idx_statut (statut),
    INDEX idx_date_arrivee (date_arrivee_prevue)
);

-- Table de la cargaison des navires
CREATE TABLE IF NOT EXISTS navire_cargaison (
    id INT PRIMARY KEY AUTO_INCREMENT,
    navire_id INT NOT NULL,
    produit_id INT NOT NULL,
    quantite_declaree DECIMAL(15,3) NOT NULL,
    quantite_recue DECIMAL(15,3) DEFAULT 0,
    unite VARCHAR(20) DEFAULT 'tonnes',
    origine VARCHAR(100),
    numero_lot VARCHAR(100),
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (navire_id) REFERENCES navires(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE,
    INDEX idx_navire (navire_id)
);

-- Table du dispatching navire vers magasins
CREATE TABLE IF NOT EXISTS navire_dispatching (
    id INT PRIMARY KEY AUTO_INCREMENT,
    navire_id INT NOT NULL,
    cargaison_id INT NOT NULL,
    magasin_id VARCHAR(50) NOT NULL,
    quantite DECIMAL(15,3) NOT NULL,
    date_dispatching TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut ENUM('planifie', 'en_cours', 'complete') DEFAULT 'planifie',
    observations TEXT,
    created_by INT NOT NULL,
    FOREIGN KEY (navire_id) REFERENCES navires(id) ON DELETE CASCADE,
    FOREIGN KEY (cargaison_id) REFERENCES navire_cargaison(id) ON DELETE CASCADE,
    FOREIGN KEY (magasin_id) REFERENCES magasins(id),
    FOREIGN KEY (created_by) REFERENCES utilisateurs(id),
    INDEX idx_navire_statut (navire_id, statut)
);

-- Table des commandes
CREATE TABLE IF NOT EXISTS commandes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_commande VARCHAR(50) NOT NULL UNIQUE,
    client_id INT NOT NULL,
    date_commande DATE NOT NULL,
    date_livraison_souhaitee DATE,
    statut ENUM('brouillon', 'confirmee', 'en_preparation', 'prete', 'en_livraison', 'livree', 'annulee') DEFAULT 'brouillon',
    montant_total DECIMAL(15,2) DEFAULT 0,
    montant_paye DECIMAL(15,2) DEFAULT 0,
    mode_paiement VARCHAR(50),
    conditions_paiement TEXT,
    adresse_livraison TEXT,
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    validated_by INT,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (created_by) REFERENCES utilisateurs(id),
    FOREIGN KEY (validated_by) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    INDEX idx_numero (numero_commande),
    INDEX idx_statut_date (statut, date_commande),
    INDEX idx_client (client_id)
);

-- Table des lignes de commande
CREATE TABLE IF NOT EXISTS commande_lignes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    commande_id INT NOT NULL,
    produit_id INT NOT NULL,
    quantite DECIMAL(15,3) NOT NULL,
    prix_unitaire DECIMAL(15,2) NOT NULL,
    montant_ligne DECIMAL(15,2) GENERATED ALWAYS AS (quantite * prix_unitaire) STORED,
    magasin_id VARCHAR(50),
    statut ENUM('en_attente', 'reserve', 'prepare', 'livre') DEFAULT 'en_attente',
    FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id),
    FOREIGN KEY (magasin_id) REFERENCES magasins(id) ON DELETE SET NULL,
    INDEX idx_commande (commande_id)
);

-- =====================================================
-- INSERTION DES DONNÉES DE BASE
-- =====================================================

-- Insertion des catégories
INSERT INTO categories (nom, description) VALUES
('Céréales', 'Maïs, Blé, Riz, Mil, Sorgho'),
('Légumineuses', 'Soja, Arachide, Niébé'),
('Sons et Farines', 'Son de blé, Son de maïs, Farines'),
('Aliments Composés', 'Aliments pour volaille, bétail'),
('Huiles', 'Huiles végétales, tourteaux'),
('Autres', 'Autres produits agricoles');

-- Insertion des magasins ITS Sénégal
INSERT INTO magasins (id, nom, ville, adresse, telephone, capacite_max) VALUES
('plateforme-belair', 'Plateforme Belair', 'Dakar', 'Belair, Dakar', '+221 33 XXX XX XX', 5000),
('sips-pikine', 'SIPS Pikine', 'Pikine', 'Zone Industrielle Pikine', '+221 33 XXX XX XX', 3000),
('belair-garage', 'Belair Garage/Magasin', 'Dakar', 'Belair, près du garage', '+221 33 XXX XX XX', 2000),
('yarakh', 'Entrepôt Yarakh', 'Dakar', 'Yarakh, Dakar', '+221 33 XXX XX XX', 4000),
('thiaroye-km14', 'Thiaroye KM 14', 'Thiaroye', 'Route de Rufisque, KM 14', '+221 33 XXX XX XX', 3500),
('km16-thiaroye', 'KM 16 Thiaroye sur Mer', 'Thiaroye', 'Thiaroye sur Mer, KM 16', '+221 33 XXX XX XX', 3000),
('rufisque', 'Entrepôt Rufisque', 'Rufisque', 'Zone Industrielle Rufisque', '+221 33 XXX XX XX', 4500);

-- Insertion de l'utilisateur administrateur (mot de passe: Admin123!)
-- Le hash est pour le mot de passe 'Admin123!'
INSERT INTO utilisateurs (nom, prenom, email, password_hash, role, magasin_id) VALUES
('Administrateur', 'ITS', 'admin@its-senegal.com', '$2a$10$YourHashHere', 'manager', NULL);

-- Insertion des opérateurs pour chaque magasin (mot de passe: Operator123!)
INSERT INTO utilisateurs (nom, prenom, email, password_hash, role, magasin_id) VALUES
('Diallo', 'Mamadou', 'operator.plateforme@its-senegal.com', '$2a$10$YourHashHere', 'operator', 'plateforme-belair'),
('Ndiaye', 'Fatou', 'operator.sips@its-senegal.com', '$2a$10$YourHashHere', 'operator', 'sips-pikine'),
('Fall', 'Ibrahima', 'operator.belair@its-senegal.com', '$2a$10$YourHashHere', 'operator', 'belair-garage'),
('Sow', 'Aissatou', 'operator.yarakh@its-senegal.com', '$2a$10$YourHashHere', 'operator', 'yarakh'),
('Ba', 'Ousmane', 'operator.thiaroye@its-senegal.com', '$2a$10$YourHashHere', 'operator', 'thiaroye-km14'),
('Sarr', 'Mariama', 'operator.km16@its-senegal.com', '$2a$10$YourHashHere', 'operator', 'km16-thiaroye'),
('Diouf', 'Cheikh', 'operator.rufisque@its-senegal.com', '$2a$10$YourHashHere', 'operator', 'rufisque');

-- Insertion des produits principaux
INSERT INTO produits (reference, nom, categorie_id, description, unite, prix_unitaire, seuil_alerte) VALUES
-- Céréales
('MAIS-001', 'Maïs Jaune', 1, 'Maïs jaune importé, qualité supérieure', 'tonnes', 180000, 100),
('MAIS-002', 'Maïs Blanc', 1, 'Maïs blanc local', 'tonnes', 175000, 80),
('RIZ-001', 'Riz Brisé 25%', 1, 'Riz brisé 25% importé', 'tonnes', 250000, 150),
('RIZ-002', 'Riz Parfumé', 1, 'Riz parfumé importé', 'tonnes', 350000, 50),
('BLE-001', 'Blé Tendre', 1, 'Blé tendre pour meunerie', 'tonnes', 220000, 120),
('BLE-002', 'Blé Dur', 1, 'Blé dur pour pâtes', 'tonnes', 240000, 80),

-- Légumineuses
('SOJA-001', 'Soja Grain', 2, 'Soja en grain pour alimentation animale', 'tonnes', 280000, 100),
('SOJA-002', 'Tourteau de Soja', 2, 'Tourteau de soja haute protéine', 'tonnes', 320000, 150),

-- Sons et Farines
('SON-BLE-001', 'Son de Blé', 3, 'Son de blé pour alimentation animale', 'tonnes', 120000, 200),
('SON-MAIS-001', 'Son de Maïs', 3, 'Son de maïs pour alimentation animale', 'tonnes', 110000, 150),
('FARINE-001', 'Farine de Blé', 3, 'Farine de blé type 55', 'tonnes', 300000, 50),

-- Aliments Composés
('ALIM-VOL-001', 'Aliment Volaille Démarrage', 4, 'Aliment composé pour poussins', 'tonnes', 380000, 80),
('ALIM-VOL-002', 'Aliment Volaille Finition', 4, 'Aliment composé pour poulets de chair', 'tonnes', 360000, 100),
('ALIM-BET-001', 'Aliment Bétail', 4, 'Aliment composé pour bovins', 'tonnes', 250000, 60);

-- Insertion des clients principaux
INSERT INTO clients (code, nom, type, email, telephone, adresse, ville, contact_principal, credit_limite) VALUES
('GMD-001', 'GMD (Grands Moulins de Dakar)', 'entreprise', 'contact@gmd.sn', '+221 33 839 70 00', 'Zone Industrielle, BP 2068', 'Dakar', 'Direction Achats', 500000000),
('AVISEN-001', 'AVISEN SA', 'entreprise', 'info@avisen.sn', '+221 33 XXX XX XX', 'Route de Rufisque', 'Dakar', 'Service Approvisionnement', 300000000),
('NMA-001', 'NMA Sanders Sénégal', 'entreprise', 'contact@nma-sanders.sn', '+221 33 XXX XX XX', 'Zone Industrielle Mbao', 'Dakar', 'Direction Commerciale', 400000000),
('SEDIMA-001', 'SEDIMA SA', 'entreprise', 'achats@sedima.sn', '+221 33 XXX XX XX', 'Autoroute Dakar-Thiès', 'Thiès', 'Service Achats', 600000000),
('PRODAS-001', 'PRODAS', 'entreprise', 'contact@prodas.sn', '+221 33 XXX XX XX', 'Zone Industrielle', 'Dakar', 'Direction', 200000000),
('SENTENAC-001', 'SENTENAC', 'entreprise', 'info@sentenac.sn', '+221 33 XXX XX XX', 'Route de Thiès', 'Dakar', 'Service Commercial', 250000000);

-- Insertion de stocks initiaux (exemple)
INSERT INTO stocks (produit_id, magasin_id, quantite_disponible, lot_number, date_entree, valeur_unitaire) VALUES
-- Plateforme Belair
(1, 'plateforme-belair', 500, 'LOT-2024-001', CURDATE(), 180000),
(3, 'plateforme-belair', 300, 'LOT-2024-002', CURDATE(), 250000),
(7, 'plateforme-belair', 200, 'LOT-2024-003', CURDATE(), 280000),

-- SIPS Pikine
(2, 'sips-pikine', 250, 'LOT-2024-004', CURDATE(), 175000),
(9, 'sips-pikine', 400, 'LOT-2024-005', CURDATE(), 120000),
(12, 'sips-pikine', 150, 'LOT-2024-006', CURDATE(), 380000),

-- Yarakh
(5, 'yarakh', 350, 'LOT-2024-007', CURDATE(), 220000),
(8, 'yarakh', 180, 'LOT-2024-008', CURDATE(), 320000),
(10, 'yarakh', 300, 'LOT-2024-009', CURDATE(), 110000);

-- =====================================================
-- CRÉATION DES VUES
-- =====================================================

-- Vue pour le stock global par produit
CREATE OR REPLACE VIEW v_stock_global AS
SELECT 
    p.id AS produit_id,
    p.reference,
    p.nom AS produit_nom,
    c.nom AS categorie,
    p.unite,
    SUM(s.quantite_disponible) AS quantite_totale,
    SUM(s.quantite_reservee) AS quantite_reservee_totale,
    SUM(s.quantite_disponible - s.quantite_reservee) AS quantite_libre,
    p.seuil_alerte,
    CASE 
        WHEN SUM(s.quantite_disponible) <= p.seuil_alerte THEN 'ALERTE'
        WHEN SUM(s.quantite_disponible) <= p.seuil_alerte * 1.5 THEN 'FAIBLE'
        ELSE 'OK'
    END AS statut_stock,
    AVG(s.valeur_unitaire) AS valeur_unitaire_moyenne,
    SUM(s.quantite_disponible * s.valeur_unitaire) AS valeur_totale
FROM produits p
LEFT JOIN stocks s ON p.id = s.produit_id
LEFT JOIN categories c ON p.categorie_id = c.id
WHERE p.actif = TRUE
GROUP BY p.id;

-- Vue pour les mouvements détaillés
CREATE OR REPLACE VIEW v_mouvements_details AS
SELECT 
    m.id,
    m.type_mouvement,
    m.date_mouvement,
    p.reference AS produit_reference,
    p.nom AS produit_nom,
    m.quantite,
    ms.nom AS magasin_source,
    md.nom AS magasin_destination,
    c.nom AS client_nom,
    m.reference_document,
    m.description,
    u.nom AS created_by_nom,
    u.prenom AS created_by_prenom,
    u.role AS created_by_role,
    m.prix_unitaire,
    (m.quantite * m.prix_unitaire) AS valeur_totale
FROM mouvements_stock m
JOIN produits p ON m.produit_id = p.id
LEFT JOIN magasins ms ON m.magasin_source_id = ms.id
LEFT JOIN magasins md ON m.magasin_destination_id = md.id
LEFT JOIN clients c ON m.client_id = c.id
JOIN utilisateurs u ON m.created_by = u.id
ORDER BY m.date_mouvement DESC;

-- =====================================================
-- PROCÉDURES STOCKÉES
-- =====================================================

DELIMITER //

-- Procédure pour enregistrer une entrée de stock depuis un navire
CREATE PROCEDURE sp_entree_depuis_navire(
    IN p_navire_id INT,
    IN p_cargaison_id INT,
    IN p_magasin_id VARCHAR(50),
    IN p_quantite DECIMAL(15,3),
    IN p_user_id INT
)
BEGIN
    DECLARE v_produit_id INT;
    DECLARE v_lot_number VARCHAR(100);
    DECLARE v_prix_unitaire DECIMAL(15,2);
    
    -- Récupérer les informations de la cargaison
    SELECT produit_id, numero_lot INTO v_produit_id, v_lot_number
    FROM navire_cargaison
    WHERE id = p_cargaison_id;
    
    -- Récupérer le prix unitaire du produit
    SELECT prix_unitaire INTO v_prix_unitaire
    FROM produits
    WHERE id = v_produit_id;
    
    -- Insérer ou mettre à jour le stock
    INSERT INTO stocks (produit_id, magasin_id, quantite_disponible, lot_number, date_entree, valeur_unitaire)
    VALUES (v_produit_id, p_magasin_id, p_quantite, v_lot_number, CURDATE(), v_prix_unitaire)
    ON DUPLICATE KEY UPDATE
        quantite_disponible = quantite_disponible + p_quantite,
        derniere_entree = NOW();
    
    -- Enregistrer le mouvement
    INSERT INTO mouvements_stock (
        type_mouvement, produit_id, magasin_destination_id, quantite,
        prix_unitaire, reference_document, description, lot_number,
        navire_id, created_by
    ) VALUES (
        'entree', v_produit_id, p_magasin_id, p_quantite,
        v_prix_unitaire, CONCAT('NAV-', p_navire_id), 
        'Réception depuis navire', v_lot_number,
        p_navire_id, p_user_id
    );
    
    -- Mettre à jour le dispatching
    UPDATE navire_dispatching 
    SET statut = 'complete' 
    WHERE id = p_cargaison_id;
END//

-- Procédure pour enregistrer une vente
CREATE PROCEDURE sp_enregistrer_vente(
    IN p_produit_id INT,
    IN p_magasin_id VARCHAR(50),
    IN p_quantite DECIMAL(15,3),
    IN p_client_id INT,
    IN p_prix_vente DECIMAL(15,2),
    IN p_reference VARCHAR(100),
    IN p_user_id INT
)
BEGIN
    DECLARE v_quantite_dispo DECIMAL(15,3);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Erreur lors de l\'enregistrement de la vente';
    END;
    
    START TRANSACTION;
    
    -- Vérifier la disponibilité du stock
    SELECT quantite_disponible - quantite_reservee INTO v_quantite_dispo
    FROM stocks
    WHERE produit_id = p_produit_id AND magasin_id = p_magasin_id
    FOR UPDATE;
    
    IF v_quantite_dispo < p_quantite THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock insuffisant';
    END IF;
    
    -- Mettre à jour le stock
    UPDATE stocks
    SET quantite_disponible = quantite_disponible - p_quantite,
        derniere_sortie = NOW()
    WHERE produit_id = p_produit_id AND magasin_id = p_magasin_id;
    
    -- Enregistrer le mouvement
    INSERT INTO mouvements_stock (
        type_mouvement, produit_id, magasin_source_id, quantite,
        prix_unitaire, reference_document, client_id, created_by
    ) VALUES (
        'sortie', p_produit_id, p_magasin_id, p_quantite,
        p_prix_vente, p_reference, p_client_id, p_user_id
    );
    
    COMMIT;
END//

DELIMITER ;

-- =====================================================
-- TRIGGERS
-- =====================================================

DELIMITER //

-- Trigger pour mettre à jour le montant total des commandes
CREATE TRIGGER update_commande_total
AFTER INSERT ON commande_lignes
FOR EACH ROW
BEGIN
    UPDATE commandes 
    SET montant_total = (
        SELECT SUM(montant_ligne) 
        FROM commande_lignes 
        WHERE commande_id = NEW.commande_id
    )
    WHERE id = NEW.commande_id;
END//

-- Trigger pour générer automatiquement les références
CREATE TRIGGER before_insert_produit
BEFORE INSERT ON produits
FOR EACH ROW
BEGIN
    IF NEW.reference IS NULL OR NEW.reference = '' THEN
        SET NEW.reference = CONCAT(
            UPPER(LEFT(REPLACE(NEW.nom, ' ', ''), 3)), 
            '-', 
            LPAD((SELECT COUNT(*) + 1 FROM produits), 3, '0')
        );
    END IF;
END//

DELIMITER ;

-- =====================================================
-- INDEXES ADDITIONNELS POUR PERFORMANCE
-- =====================================================

CREATE INDEX idx_stock_alert ON stocks (produit_id, quantite_disponible);
CREATE INDEX idx_mouvement_date_type ON mouvements_stock (date_mouvement, type_mouvement);
CREATE INDEX idx_client_actif ON clients (actif, nom);

-- =====================================================
-- NOTES D'UTILISATION
-- =====================================================

-- Pour exécuter ce script:
-- 1. Ouvrez phpMyAdmin dans XAMPP
-- 2. Sélectionnez ou créez la base 'its_maritime_stock'
-- 3. Allez dans l'onglet SQL
-- 4. Copiez-collez ce script et exécutez-le

-- IMPORTANT: Après l'exécution, vous devez:
-- 1. Générer les hash des mots de passe avec bcrypt
-- 2. Mettre à jour les mots de passe dans la table utilisateurs
-- 3. Ou utiliser le script Node.js init-db.js qui gère automatiquement les mots de passe

-- Comptes par défaut (à mettre à jour avec les vrais hash):
-- Admin: admin@its-senegal.com / Admin123!
-- Operators: operator.XXX@its-senegal.com / Operator123!