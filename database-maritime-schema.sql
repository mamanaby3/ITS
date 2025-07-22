-- =============================================================================
-- SCHEMA DE BASE DE DONNÉES - ITS SÉNÉGAL (MARITIME IMPORT/EXPORT)
-- =============================================================================
-- Conçu pour XAMPP/MySQL
-- Base de données pour la gestion des réceptions navires et stock maritime

-- Créer la base de données
CREATE DATABASE IF NOT EXISTS its_maritime_stock CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE its_maritime_stock;

-- =============================================================================
-- TABLES DE BASE
-- =============================================================================

-- Table des magasins/entrepôts
CREATE TABLE magasins (
    id VARCHAR(20) PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    ville VARCHAR(50) NOT NULL,
    zone VARCHAR(50),
    capacite_tonnes DECIMAL(15,2) DEFAULT 0,
    adresse TEXT,
    telephone VARCHAR(20),
    email VARCHAR(100),
    responsable VARCHAR(100),
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des utilisateurs (roles simplifiés: manager, operator)
CREATE TABLE utilisateurs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    telephone VARCHAR(20),
    role ENUM('manager', 'operator') NOT NULL,
    magasin_id VARCHAR(20), -- NULL pour manager (accès global)
    actif BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (magasin_id) REFERENCES magasins(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- Table des produits maritimes
CREATE TABLE produits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reference VARCHAR(50) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    categorie ENUM('cereales', 'legumineuses', 'oleagineux', 'engrais', 'autres') NOT NULL,
    unite ENUM('tonnes', 'kg', 'sacs', 'conteneurs') DEFAULT 'tonnes',
    prix_tonne DECIMAL(15,2) DEFAULT 0,
    seuil_alerte DECIMAL(15,2) DEFAULT 100, -- en tonnes
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_categorie (categorie),
    INDEX idx_nom (nom)
);

-- Table des navires réceptionnés
CREATE TABLE navires (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom_navire VARCHAR(100) NOT NULL,
    numero_imo VARCHAR(20) NOT NULL,
    date_arrivee DATETIME NOT NULL,
    port VARCHAR(50) DEFAULT 'Port de Dakar',
    numero_connaissement VARCHAR(50),
    agent_maritime VARCHAR(100),
    statut ENUM('receptionne', 'dispatche') DEFAULT 'receptionne',
    date_reception DATETIME,
    reception_par INT,
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reception_par) REFERENCES utilisateurs(id),
    INDEX idx_statut (statut),
    INDEX idx_date_arrivee (date_arrivee)
);

-- Table de la cargaison des navires
CREATE TABLE navire_cargaison (
    id INT PRIMARY KEY AUTO_INCREMENT,
    navire_id INT NOT NULL,
    produit_id INT NOT NULL,
    quantite DECIMAL(15,3) NOT NULL,
    unite ENUM('tonnes', 'kg', 'sacs', 'conteneurs') DEFAULT 'tonnes',
    origine VARCHAR(100) NOT NULL,
    etat_cargaison VARCHAR(50) DEFAULT 'Bon état',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (navire_id) REFERENCES navires(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id),
    INDEX idx_navire (navire_id)
);

-- Table du dispatching (distribution navire vers magasins)
CREATE TABLE navire_dispatching (
    id INT PRIMARY KEY AUTO_INCREMENT,
    navire_id INT NOT NULL,
    cargaison_id INT NOT NULL,
    magasin_id VARCHAR(20) NOT NULL,
    quantite DECIMAL(15,3) NOT NULL,
    date_dispatch DATETIME DEFAULT CURRENT_TIMESTAMP,
    dispatch_par INT NOT NULL,
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (navire_id) REFERENCES navires(id) ON DELETE CASCADE,
    FOREIGN KEY (cargaison_id) REFERENCES navire_cargaison(id) ON DELETE CASCADE,
    FOREIGN KEY (magasin_id) REFERENCES magasins(id),
    FOREIGN KEY (dispatch_par) REFERENCES utilisateurs(id),
    INDEX idx_navire_dispatch (navire_id),
    INDEX idx_magasin_dispatch (magasin_id)
);

-- Table des stocks par magasin
CREATE TABLE stocks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    produit_id INT NOT NULL,
    magasin_id VARCHAR(20) NOT NULL,
    quantite_disponible DECIMAL(15,3) NOT NULL DEFAULT 0,
    quantite_reservee DECIMAL(15,3) NOT NULL DEFAULT 0,
    derniere_entree DATE,
    derniere_sortie DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (produit_id) REFERENCES produits(id),
    FOREIGN KEY (magasin_id) REFERENCES magasins(id),
    UNIQUE KEY unique_produit_magasin (produit_id, magasin_id),
    INDEX idx_magasin_stock (magasin_id),
    INDEX idx_produit_stock (produit_id)
);

-- Table des clients
CREATE TABLE clients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    type_client ENUM('entreprise', 'particulier', 'gouvernement', 'ong') DEFAULT 'entreprise',
    email VARCHAR(100),
    telephone VARCHAR(20),
    adresse TEXT,
    ville VARCHAR(50),
    pays VARCHAR(50) DEFAULT 'Sénégal',
    credit_limite DECIMAL(15,2) DEFAULT 0,
    encours_credit DECIMAL(15,2) DEFAULT 0,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nom_client (nom),
    INDEX idx_code_client (code)
);

-- Table des mouvements de stock (entrées/sorties)
CREATE TABLE mouvements_stock (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type_mouvement ENUM('entree', 'sortie', 'transfert', 'ajustement') NOT NULL,
    produit_id INT NOT NULL,
    magasin_origine_id VARCHAR(20) NOT NULL,
    magasin_destination_id VARCHAR(20), -- Pour transferts
    client_id INT, -- Pour les sorties clients
    quantite DECIMAL(15,3) NOT NULL,
    reference_document VARCHAR(50) NOT NULL, -- BL, Facture, etc.
    navire_id INT, -- Si lié à une réception navire
    date_mouvement DATETIME NOT NULL,
    observations TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produit_id) REFERENCES produits(id),
    FOREIGN KEY (magasin_origine_id) REFERENCES magasins(id),
    FOREIGN KEY (magasin_destination_id) REFERENCES magasins(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (navire_id) REFERENCES navires(id),
    FOREIGN KEY (created_by) REFERENCES utilisateurs(id),
    INDEX idx_type_mouvement (type_mouvement),
    INDEX idx_date_mouvement (date_mouvement),
    INDEX idx_magasin_mouvement (magasin_origine_id),
    INDEX idx_client_mouvement (client_id)
);

-- Table des commandes clients
CREATE TABLE commandes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_commande VARCHAR(20) UNIQUE NOT NULL,
    client_id INT NOT NULL,
    magasin_id VARCHAR(20) NOT NULL,
    date_commande DATE NOT NULL,
    date_livraison_prevue DATE,
    statut ENUM('brouillon', 'confirmee', 'en_preparation', 'prete', 'livree', 'annulee') DEFAULT 'brouillon',
    montant_total DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (magasin_id) REFERENCES magasins(id),
    FOREIGN KEY (created_by) REFERENCES utilisateurs(id),
    INDEX idx_client_commande (client_id),
    INDEX idx_statut_commande (statut),
    INDEX idx_date_commande (date_commande)
);

-- Table des détails de commande
CREATE TABLE commande_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    commande_id INT NOT NULL,
    produit_id INT NOT NULL,
    quantite DECIMAL(15,3) NOT NULL,
    prix_unitaire DECIMAL(15,2) NOT NULL,
    montant_ligne DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id),
    INDEX idx_commande_detail (commande_id)
);

-- Table des livraisons
CREATE TABLE livraisons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_livraison VARCHAR(20) UNIQUE NOT NULL,
    commande_id INT NOT NULL,
    date_livraison DATETIME NOT NULL,
    transporteur VARCHAR(100),
    matricule_vehicule VARCHAR(50),
    nom_chauffeur VARCHAR(100),
    telephone_chauffeur VARCHAR(20),
    statut ENUM('programmee', 'en_cours', 'livree', 'annulee') DEFAULT 'programmee',
    bon_livraison VARCHAR(50),
    signature_client TEXT, -- Peut stocker une signature base64
    observations TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (commande_id) REFERENCES commandes(id),
    FOREIGN KEY (created_by) REFERENCES utilisateurs(id),
    INDEX idx_commande_livraison (commande_id),
    INDEX idx_date_livraison (date_livraison)
);

-- =============================================================================
-- TRIGGERS POUR LA GESTION AUTOMATIQUE DES STOCKS
-- =============================================================================

DELIMITER $$

-- Trigger pour mettre à jour le stock après un mouvement
CREATE TRIGGER after_mouvement_stock_insert
AFTER INSERT ON mouvements_stock
FOR EACH ROW
BEGIN
    IF NEW.type_mouvement = 'entree' THEN
        INSERT INTO stocks (produit_id, magasin_id, quantite_disponible, derniere_entree)
        VALUES (NEW.produit_id, NEW.magasin_origine_id, NEW.quantite, NEW.date_mouvement)
        ON DUPLICATE KEY UPDATE
            quantite_disponible = quantite_disponible + NEW.quantite,
            derniere_entree = NEW.date_mouvement;
    
    ELSEIF NEW.type_mouvement = 'sortie' THEN
        UPDATE stocks 
        SET quantite_disponible = quantite_disponible - NEW.quantite,
            derniere_sortie = NEW.date_mouvement
        WHERE produit_id = NEW.produit_id AND magasin_id = NEW.magasin_origine_id;
    
    ELSEIF NEW.type_mouvement = 'transfert' THEN
        -- Sortie du magasin origine
        UPDATE stocks 
        SET quantite_disponible = quantite_disponible - NEW.quantite,
            derniere_sortie = NEW.date_mouvement
        WHERE produit_id = NEW.produit_id AND magasin_id = NEW.magasin_origine_id;
        
        -- Entrée dans le magasin destination
        INSERT INTO stocks (produit_id, magasin_id, quantite_disponible, derniere_entree)
        VALUES (NEW.produit_id, NEW.magasin_destination_id, NEW.quantite, NEW.date_mouvement)
        ON DUPLICATE KEY UPDATE
            quantite_disponible = quantite_disponible + NEW.quantite,
            derniere_entree = NEW.date_mouvement;
    END IF;
END$$

DELIMITER ;

-- =============================================================================
-- VUES POUR FACILITER LES REQUÊTES
-- =============================================================================

-- Vue stock global par produit
CREATE OR REPLACE VIEW v_stock_global AS
SELECT 
    p.id AS produit_id,
    p.reference,
    p.nom AS produit_nom,
    p.categorie,
    p.unite,
    SUM(s.quantite_disponible) AS stock_total,
    SUM(s.quantite_reservee) AS reserve_total,
    COUNT(DISTINCT s.magasin_id) AS nb_magasins
FROM produits p
LEFT JOIN stocks s ON p.id = s.produit_id
GROUP BY p.id, p.reference, p.nom, p.categorie, p.unite;

-- Vue mouvements détaillés
CREATE OR REPLACE VIEW v_mouvements_details AS
SELECT 
    m.id,
    m.type_mouvement,
    m.date_mouvement,
    m.quantite,
    m.reference_document,
    p.nom AS produit,
    p.categorie,
    mag_orig.nom AS magasin_origine,
    mag_dest.nom AS magasin_destination,
    c.nom AS client,
    n.nom_navire,
    n.numero_imo,
    CONCAT(u.prenom, ' ', u.nom) AS operateur,
    u.role AS role_operateur,
    m.observations
FROM mouvements_stock m
JOIN produits p ON m.produit_id = p.id
JOIN magasins mag_orig ON m.magasin_origine_id = mag_orig.id
LEFT JOIN magasins mag_dest ON m.magasin_destination_id = mag_dest.id
LEFT JOIN clients c ON m.client_id = c.id
LEFT JOIN navires n ON m.navire_id = n.id
JOIN utilisateurs u ON m.created_by = u.id
ORDER BY m.date_mouvement DESC;

-- =============================================================================
-- DONNÉES INITIALES
-- =============================================================================

-- Insertion des magasins
INSERT INTO magasins (id, nom, ville, zone, capacite_tonnes) VALUES
('dkr-port', 'Entrepôt Principal Port', 'Dakar', 'Port', 50000),
('dkr-ind', 'Entrepôt Zone Industrielle', 'Dakar', 'Zone Industrielle', 30000),
('thies', 'Entrepôt Thiès', 'Thiès', 'Centre', 20000),
('stl', 'Entrepôt Saint-Louis', 'Saint-Louis', 'Nord', 15000),
('kaol', 'Entrepôt Kaolack', 'Kaolack', 'Centre', 25000),
('zigui', 'Entrepôt Ziguinchor', 'Ziguinchor', 'Sud', 10000),
('tamb', 'Entrepôt Tambacounda', 'Tambacounda', 'Est', 15000);

-- Insertion d'un utilisateur manager par défaut (mot de passe: Manager123!)
INSERT INTO utilisateurs (email, password, nom, prenom, role, magasin_id) VALUES
('manager@its-senegal.com', '$2a$10$EGuFIQvEnHZg7wj5.DgYYuW4U7NPBwy6af9V5mRoSh/S1N5t2BxBq', 'DIALLO', 'Mamadou', 'manager', NULL);

-- Insertion de produits types
INSERT INTO produits (reference, nom, categorie, unite, prix_tonne, seuil_alerte) VALUES
('MAIS-001', 'Maïs jaune', 'cereales', 'tonnes', 150000, 500),
('SOJA-001', 'Soja', 'legumineuses', 'tonnes', 280000, 300),
('BLE-001', 'Blé tendre', 'cereales', 'tonnes', 180000, 400),
('RIZ-001', 'Riz parfumé', 'cereales', 'tonnes', 350000, 200),
('MIL-001', 'Mil', 'cereales', 'tonnes', 120000, 150),
('ARACH-001', 'Arachide', 'legumineuses', 'tonnes', 320000, 250),
('TOUR-001', 'Tournesol', 'oleagineux', 'tonnes', 300000, 100),
('ENGR-001', 'Engrais NPK', 'engrais', 'tonnes', 450000, 200);

-- Insertion de clients types
INSERT INTO clients (code, nom, type_client, ville, telephone) VALUES
('CL-001', 'SENAC', 'entreprise', 'Dakar', '+221 33 123 45 67'),
('CL-002', 'Grands Moulins de Dakar', 'entreprise', 'Dakar', '+221 33 234 56 78'),
('CL-003', 'SODEFITEX', 'entreprise', 'Tambacounda', '+221 33 345 67 89'),
('CL-004', 'NMA Sanders', 'entreprise', 'Dakar', '+221 33 456 78 90'),
('CL-005', 'SEDIMA', 'entreprise', 'Thiès', '+221 33 567 89 01');

-- =============================================================================
-- PROCÉDURES STOCKÉES UTILES
-- =============================================================================

DELIMITER $$

-- Procédure pour créer une entrée depuis un dispatching navire
CREATE PROCEDURE sp_entree_depuis_navire(
    IN p_navire_id INT,
    IN p_cargaison_id INT,
    IN p_magasin_id VARCHAR(20),
    IN p_quantite DECIMAL(15,3),
    IN p_user_id INT
)
BEGIN
    DECLARE v_produit_id INT;
    DECLARE v_reference VARCHAR(50);
    
    -- Récupérer le produit_id depuis la cargaison
    SELECT produit_id INTO v_produit_id 
    FROM navire_cargaison 
    WHERE id = p_cargaison_id;
    
    -- Générer une référence
    SET v_reference = CONCAT('REC-NAV-', YEAR(NOW()), '-', LPAD(p_navire_id, 4, '0'));
    
    -- Créer le mouvement d'entrée
    INSERT INTO mouvements_stock (
        type_mouvement, produit_id, magasin_origine_id, 
        quantite, reference_document, navire_id, 
        date_mouvement, created_by
    ) VALUES (
        'entree', v_produit_id, p_magasin_id,
        p_quantite, v_reference, p_navire_id,
        NOW(), p_user_id
    );
    
    -- Enregistrer le dispatching
    INSERT INTO navire_dispatching (
        navire_id, cargaison_id, magasin_id,
        quantite, dispatch_par
    ) VALUES (
        p_navire_id, p_cargaison_id, p_magasin_id,
        p_quantite, p_user_id
    );
END$$

-- Procédure pour vérifier le stock disponible
CREATE PROCEDURE sp_verifier_stock_disponible(
    IN p_produit_id INT,
    IN p_magasin_id VARCHAR(20),
    OUT p_disponible DECIMAL(15,3)
)
BEGIN
    SELECT COALESCE(quantite_disponible - quantite_reservee, 0) 
    INTO p_disponible
    FROM stocks
    WHERE produit_id = p_produit_id 
    AND magasin_id = p_magasin_id;
END$$

DELIMITER ;

-- =============================================================================
-- FIN DU SCRIPT
-- =============================================================================