-- =====================================================
-- SCRIPT DE RÉINITIALISATION COMPLÈTE - ITS SÉNÉGAL
-- Système de Gestion de Stock Maritime
-- =====================================================

-- Supprimer la base de données si elle existe et la recréer
DROP DATABASE IF EXISTS its_senegal_stock;
CREATE DATABASE its_senegal_stock;
USE its_senegal_stock;

-- =====================================================
-- TABLES DE BASE
-- =====================================================

-- Table des magasins (7 magasins fixes)
CREATE TABLE magasins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(10) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    adresse TEXT,
    telephone VARCHAR(20),
    responsable VARCHAR(100),
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des utilisateurs
CREATE TABLE utilisateurs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    role ENUM('admin', 'manager', 'operator') NOT NULL,
    magasin_id INT,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (magasin_id) REFERENCES magasins(id)
);

-- Table des produits
CREATE TABLE produits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    categorie VARCHAR(50),
    unite VARCHAR(20) DEFAULT 'T',
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des clients
CREATE TABLE clients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    type ENUM('particulier', 'entreprise') DEFAULT 'entreprise',
    adresse TEXT,
    telephone VARCHAR(20),
    email VARCHAR(100),
    contact_nom VARCHAR(100),
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLES OPÉRATIONNELLES
-- =====================================================

-- Table des navires
CREATE TABLE navires (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom_navire VARCHAR(100) NOT NULL,
    numero_imo VARCHAR(20) UNIQUE,
    date_arrivee DATE NOT NULL,
    statut ENUM('attendu', 'arrive', 'receptionne', 'dispatche', 'termine') DEFAULT 'attendu',
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES utilisateurs(id)
);

-- Table des cargaisons (ce que contient le navire)
CREATE TABLE navire_cargaisons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    navire_id INT NOT NULL,
    produit_id INT NOT NULL,
    quantite_declaree DECIMAL(15,3) NOT NULL,
    quantite_reelle DECIMAL(15,3),
    origine VARCHAR(100),
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (navire_id) REFERENCES navires(id),
    FOREIGN KEY (produit_id) REFERENCES produits(id)
);

-- Table de dispatching (distribution depuis le navire)
CREATE TABLE navire_dispatching (
    id INT PRIMARY KEY AUTO_INCREMENT,
    navire_id INT NOT NULL,
    cargaison_id INT NOT NULL,
    magasin_id INT,
    client_id INT,
    type_destination ENUM('magasin', 'client') NOT NULL,
    quantite DECIMAL(15,3) NOT NULL,
    date_dispatching TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observations TEXT,
    dispatch_par INT NOT NULL,
    statut ENUM('planifie', 'confirme', 'annule') DEFAULT 'confirme',
    FOREIGN KEY (navire_id) REFERENCES navires(id),
    FOREIGN KEY (cargaison_id) REFERENCES navire_cargaisons(id),
    FOREIGN KEY (magasin_id) REFERENCES magasins(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (dispatch_par) REFERENCES utilisateurs(id),
    CHECK ((type_destination = 'magasin' AND magasin_id IS NOT NULL) OR 
           (type_destination = 'client' AND client_id IS NOT NULL))
);

-- Table des stocks par magasin (calculé automatiquement)
CREATE TABLE stock_magasin (
    id INT PRIMARY KEY AUTO_INCREMENT,
    magasin_id INT NOT NULL,
    produit_id INT NOT NULL,
    quantite_disponible DECIMAL(15,3) DEFAULT 0,
    derniere_mise_a_jour TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (magasin_id) REFERENCES magasins(id),
    FOREIGN KEY (produit_id) REFERENCES produits(id),
    UNIQUE KEY unique_magasin_produit (magasin_id, produit_id)
);

-- Table des livraisons (sorties depuis les magasins vers clients)
CREATE TABLE livraisons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reference VARCHAR(50) UNIQUE NOT NULL,
    magasin_id INT NOT NULL,
    client_id INT NOT NULL,
    produit_id INT NOT NULL,
    quantite DECIMAL(15,3) NOT NULL,
    date_livraison DATE NOT NULL,
    statut ENUM('planifie', 'en_cours', 'livre', 'annule') DEFAULT 'planifie',
    bon_livraison VARCHAR(100),
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    FOREIGN KEY (magasin_id) REFERENCES magasins(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (produit_id) REFERENCES produits(id),
    FOREIGN KEY (created_by) REFERENCES utilisateurs(id)
);

-- Table des mouvements de stock (traçabilité)
CREATE TABLE mouvements_stock (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type_mouvement ENUM('entree', 'sortie', 'transfert') NOT NULL,
    magasin_id INT NOT NULL,
    produit_id INT NOT NULL,
    quantite DECIMAL(15,3) NOT NULL,
    reference_document VARCHAR(100),
    navire_id INT,
    livraison_id INT,
    date_mouvement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observations TEXT,
    created_by INT NOT NULL,
    FOREIGN KEY (magasin_id) REFERENCES magasins(id),
    FOREIGN KEY (produit_id) REFERENCES produits(id),
    FOREIGN KEY (navire_id) REFERENCES navires(id),
    FOREIGN KEY (livraison_id) REFERENCES livraisons(id),
    FOREIGN KEY (created_by) REFERENCES utilisateurs(id)
);

-- =====================================================
-- VUES UTILES
-- =====================================================

-- Vue du stock actuel par magasin
CREATE VIEW v_stock_actuel AS
SELECT 
    m.nom as magasin,
    p.nom as produit,
    p.code as code_produit,
    sm.quantite_disponible,
    p.unite,
    sm.derniere_mise_a_jour
FROM stock_magasin sm
JOIN magasins m ON sm.magasin_id = m.id
JOIN produits p ON sm.produit_id = p.id
WHERE sm.quantite_disponible > 0
ORDER BY m.nom, p.nom;

-- Vue des dispatches en attente
CREATE VIEW v_dispatches_attente AS
SELECT 
    n.nom_navire,
    p.nom as produit,
    nd.quantite,
    CASE 
        WHEN nd.type_destination = 'magasin' THEN m.nom
        WHEN nd.type_destination = 'client' THEN c.nom
    END as destination,
    nd.type_destination,
    nd.date_dispatching,
    u.nom as dispatch_par
FROM navire_dispatching nd
JOIN navires n ON nd.navire_id = n.id
JOIN navire_cargaisons nc ON nd.cargaison_id = nc.id
JOIN produits p ON nc.produit_id = p.id
LEFT JOIN magasins m ON nd.magasin_id = m.id
LEFT JOIN clients c ON nd.client_id = c.id
JOIN utilisateurs u ON nd.dispatch_par = u.id
WHERE nd.statut = 'planifie'
ORDER BY nd.date_dispatching DESC;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger pour mettre à jour le stock après un dispatching vers magasin
DELIMITER //
CREATE TRIGGER after_dispatch_to_magasin
AFTER INSERT ON navire_dispatching
FOR EACH ROW
BEGIN
    IF NEW.type_destination = 'magasin' AND NEW.statut = 'confirme' THEN
        -- Récupérer le produit_id depuis la cargaison
        DECLARE v_produit_id INT;
        SELECT produit_id INTO v_produit_id 
        FROM navire_cargaisons 
        WHERE id = NEW.cargaison_id;
        
        -- Mettre à jour ou insérer dans stock_magasin
        INSERT INTO stock_magasin (magasin_id, produit_id, quantite_disponible)
        VALUES (NEW.magasin_id, v_produit_id, NEW.quantite)
        ON DUPLICATE KEY UPDATE 
        quantite_disponible = quantite_disponible + NEW.quantite;
        
        -- Enregistrer le mouvement
        INSERT INTO mouvements_stock (
            type_mouvement, magasin_id, produit_id, quantite,
            reference_document, navire_id, created_by
        ) VALUES (
            'entree', NEW.magasin_id, v_produit_id, NEW.quantite,
            CONCAT('DISPATCH-', NEW.id), NEW.navire_id, NEW.dispatch_par
        );
    END IF;
END//
DELIMITER ;

-- Trigger pour mettre à jour le stock après une livraison
DELIMITER //
CREATE TRIGGER after_livraison
AFTER UPDATE ON livraisons
FOR EACH ROW
BEGIN
    IF NEW.statut = 'livre' AND OLD.statut != 'livre' THEN
        -- Diminuer le stock
        UPDATE stock_magasin 
        SET quantite_disponible = quantite_disponible - NEW.quantite
        WHERE magasin_id = NEW.magasin_id 
        AND produit_id = NEW.produit_id;
        
        -- Enregistrer le mouvement
        INSERT INTO mouvements_stock (
            type_mouvement, magasin_id, produit_id, quantite,
            reference_document, livraison_id, created_by
        ) VALUES (
            'sortie', NEW.magasin_id, NEW.produit_id, NEW.quantite,
            NEW.reference, NEW.id, NEW.created_by
        );
    END IF;
END//
DELIMITER ;

-- =====================================================
-- DONNÉES DE BASE
-- =====================================================

-- Insérer les 7 magasins
INSERT INTO magasins (code, nom, adresse, telephone) VALUES
('MAG01', 'Magasin Port Autonome', 'Zone Portuaire, Dakar', '+221 33 849 45 45'),
('MAG02', 'Magasin Bel Air', 'Route de Bel Air, Dakar', '+221 33 832 10 10'),
('MAG03', 'Magasin Thies', 'Zone Industrielle, Thies', '+221 33 951 20 20'),
('MAG04', 'Magasin Rufisque', 'Boulevard Maurice Gueye, Rufisque', '+221 33 836 30 30'),
('MAG05', 'Magasin Diamniado', 'Cité Industrielle, Diamniadio', '+221 33 859 40 40'),
('MAG06', 'Magasin Mbour', 'Route de Mbour, Saly', '+221 33 957 50 50'),
('MAG07', 'Magasin Saint-Louis', 'Avenue Jean Mermoz, Saint-Louis', '+221 33 961 60 60');

-- Insérer les produits de base
INSERT INTO produits (code, nom, categorie, unite) VALUES
('RIZ001', 'Riz Brisé 25%', 'Céréales', 'T'),
('RIZ002', 'Riz Parfumé', 'Céréales', 'T'),
('RIZ003', 'Riz Paddy', 'Céréales', 'T'),
('BLE001', 'Blé Tendre', 'Céréales', 'T'),
('MAIS001', 'Maïs Jaune', 'Céréales', 'T'),
('SUCRE001', 'Sucre Blanc', 'Denrées', 'T'),
('SUCRE002', 'Sucre Roux', 'Denrées', 'T'),
('HUILE001', 'Huile de Palme', 'Huiles', 'T'),
('HUILE002', 'Huile de Soja', 'Huiles', 'T'),
('FARINE001', 'Farine de Blé', 'Denrées', 'T');

-- Insérer des clients de base
INSERT INTO clients (code, nom, type, adresse, telephone) VALUES
('CLI001', 'Grands Moulins de Dakar', 'entreprise', 'Zone Industrielle, Dakar', '+221 33 832 62 30'),
('CLI002', 'SENTENAC Sénégal', 'entreprise', 'Km 18 Route de Rufisque', '+221 33 879 17 17'),
('CLI003', 'La Sénégalaise des Eaux', 'entreprise', 'Route du Front de Terre', '+221 33 839 37 00'),
('CLI004', 'Boulangerie Jaune', 'entreprise', 'Avenue Lamine Gueye', '+221 33 842 25 25'),
('CLI005', 'Supermarché Casino', 'entreprise', 'Almadies, Dakar', '+221 33 868 69 69');

-- Insérer des utilisateurs de test avec mots de passe simples
-- Password pour tous: 123456 (hashé avec bcrypt)
INSERT INTO utilisateurs (email, password, nom, prenom, role, magasin_id) VALUES
-- Manager principal
('manager@its.sn', '$2b$10$YourHashedPasswordHere', 'DIALLO', 'Mamadou', 'manager', NULL),
-- Chefs de magasin (1 par magasin)
('magasin1@its.sn', '$2b$10$YourHashedPasswordHere', 'NDIAYE', 'Oumar', 'operator', 1),
('magasin2@its.sn', '$2b$10$YourHashedPasswordHere', 'FALL', 'Amadou', 'operator', 2),
('magasin3@its.sn', '$2b$10$YourHashedPasswordHere', 'SECK', 'Ibrahima', 'operator', 3),
('magasin4@its.sn', '$2b$10$YourHashedPasswordHere', 'DIOP', 'Cheikh', 'operator', 4),
('magasin5@its.sn', '$2b$10$YourHashedPasswordHere', 'BA', 'Moussa', 'operator', 5),
('magasin6@its.sn', '$2b$10$YourHashedPasswordHere', 'SOW', 'Abdoulaye', 'operator', 6),
('magasin7@its.sn', '$2b$10$YourHashedPasswordHere', 'SARR', 'Modou', 'operator', 7);

-- =====================================================
-- PROCÉDURES UTILES
-- =====================================================

-- Procédure pour obtenir le stock d'un magasin
DELIMITER //
CREATE PROCEDURE sp_get_stock_magasin(IN p_magasin_id INT)
BEGIN
    SELECT 
        p.code,
        p.nom as produit,
        sm.quantite_disponible,
        p.unite,
        sm.derniere_mise_a_jour
    FROM stock_magasin sm
    JOIN produits p ON sm.produit_id = p.id
    WHERE sm.magasin_id = p_magasin_id
    AND sm.quantite_disponible > 0
    ORDER BY p.nom;
END//
DELIMITER ;

-- Procédure pour obtenir le rapport d'écarts
DELIMITER //
CREATE PROCEDURE sp_rapport_ecarts(
    IN p_date_debut DATE,
    IN p_date_fin DATE,
    IN p_magasin_id INT
)
BEGIN
    SELECT 
        m.nom as magasin,
        p.nom as produit,
        COALESCE(SUM(nd.quantite), 0) as quantite_recue,
        COALESCE(SUM(l.quantite), 0) as quantite_livree,
        COALESCE(SUM(nd.quantite), 0) - COALESCE(SUM(l.quantite), 0) as ecart
    FROM magasins m
    CROSS JOIN produits p
    LEFT JOIN navire_dispatching nd ON nd.magasin_id = m.id 
        AND nd.statut = 'confirme'
        AND nd.date_dispatching BETWEEN p_date_debut AND p_date_fin
    LEFT JOIN navire_cargaisons nc ON nd.cargaison_id = nc.id AND nc.produit_id = p.id
    LEFT JOIN livraisons l ON l.magasin_id = m.id 
        AND l.produit_id = p.id
        AND l.statut = 'livre'
        AND l.date_livraison BETWEEN p_date_debut AND p_date_fin
    WHERE (p_magasin_id IS NULL OR m.id = p_magasin_id)
    GROUP BY m.id, p.id
    HAVING quantite_recue > 0 OR quantite_livree > 0
    ORDER BY m.nom, p.nom;
END//
DELIMITER ;

-- =====================================================
-- INFORMATIONS DE CONNEXION
-- =====================================================
/*
CONNEXIONS DE TEST:
==================

Manager Principal:
- Email: manager@its.sn
- Mot de passe: 123456

Chefs de Magasin:
- Email: magasin1@its.sn (Magasin Port Autonome)
- Email: magasin2@its.sn (Magasin Bel Air)
- Email: magasin3@its.sn (Magasin Thies)
- Email: magasin4@its.sn (Magasin Rufisque)
- Email: magasin5@its.sn (Magasin Diamniado)
- Email: magasin6@its.sn (Magasin Mbour)
- Email: magasin7@its.sn (Magasin Saint-Louis)
- Mot de passe pour tous: 123456

WORKFLOW:
=========
1. Le manager reçoit un navire et enregistre sa cargaison
2. Le manager dispatche vers les magasins ou directement aux clients
3. Les chefs de magasin voient leur stock augmenter automatiquement
4. Les chefs de magasin créent des livraisons vers les clients
5. Le stock diminue automatiquement après livraison
6. Le manager peut voir tous les stocks et générer des rapports d'écarts
*/

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================