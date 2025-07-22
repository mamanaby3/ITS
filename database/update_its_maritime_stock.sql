-- =====================================================
-- MISE À JOUR DE LA BASE ITS_MARITIME_STOCK
-- Système de Gestion de Stock Maritime ITS Sénégal
-- =====================================================

-- Utiliser la base de données existante
USE its_maritime_stock;

-- =====================================================
-- AJOUT DES TABLES MANQUANTES
-- =====================================================

-- Table des livraisons (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS livraisons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_livraison VARCHAR(50) UNIQUE NOT NULL,
    commande_id INT,
    date_livraison DATE NOT NULL,
    heure_livraison TIME,
    statut ENUM('planifiee', 'en_cours', 'livree', 'annulee') DEFAULT 'planifiee',
    chauffeur_nom VARCHAR(100),
    vehicule VARCHAR(50),
    adresse_livraison TEXT,
    observations TEXT,
    signature_client VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (commande_id) REFERENCES commandes(id),
    FOREIGN KEY (created_by) REFERENCES utilisateurs(id),
    INDEX idx_statut (statut),
    INDEX idx_date (date_livraison)
);

-- Table des détails de livraison
CREATE TABLE IF NOT EXISTS livraison_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    livraison_id INT NOT NULL,
    produit_id INT NOT NULL,
    quantite_prevue DECIMAL(15,3) NOT NULL,
    quantite_livree DECIMAL(15,3) DEFAULT 0,
    observations TEXT,
    FOREIGN KEY (livraison_id) REFERENCES livraisons(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id),
    INDEX idx_livraison (livraison_id)
);

-- Table des chauffeurs
CREATE TABLE IF NOT EXISTS chauffeurs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100),
    telephone VARCHAR(20),
    permis_numero VARCHAR(50),
    permis_expiration DATE,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des rotations
CREATE TABLE IF NOT EXISTS rotations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_rotation VARCHAR(50) UNIQUE NOT NULL,
    navire_id INT NOT NULL,
    date_rotation DATE NOT NULL,
    statut ENUM('planifiee', 'en_cours', 'terminee', 'annulee') DEFAULT 'planifiee',
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (navire_id) REFERENCES navires(id),
    FOREIGN KEY (created_by) REFERENCES utilisateurs(id),
    INDEX idx_statut (statut),
    INDEX idx_date (date_rotation)
);

-- Table des dispatches
CREATE TABLE IF NOT EXISTS dispatches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rotation_id INT NOT NULL,
    produit_id INT NOT NULL,
    magasin_id VARCHAR(50) NOT NULL,
    quantite DECIMAL(15,3) NOT NULL,
    chauffeur_id INT,
    vehicule VARCHAR(50),
    heure_depart TIME,
    heure_arrivee TIME,
    statut ENUM('planifie', 'en_transit', 'livre', 'annule') DEFAULT 'planifie',
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rotation_id) REFERENCES rotations(id),
    FOREIGN KEY (produit_id) REFERENCES produits(id),
    FOREIGN KEY (magasin_id) REFERENCES magasins(id),
    FOREIGN KEY (chauffeur_id) REFERENCES chauffeurs(id),
    INDEX idx_rotation (rotation_id),
    INDEX idx_statut (statut)
);

-- =====================================================
-- AJOUT DES COLONNES MANQUANTES
-- =====================================================

-- Ajouter les colonnes manquantes dans la table navires si elles n'existent pas
ALTER TABLE navires 
    ADD COLUMN IF NOT EXISTS port_chargement VARCHAR(200),
    ADD COLUMN IF NOT EXISTS port_dechargement VARCHAR(200) DEFAULT 'Dakar',
    ADD COLUMN IF NOT EXISTS date_arrivee_prevue DATE AFTER date_arrivee_reelle,
    ADD COLUMN IF NOT EXISTS numero_connaissement VARCHAR(100),
    ADD COLUMN IF NOT EXISTS agent_maritime VARCHAR(200);

-- Ajouter la colonne quantite_recue dans navire_cargaison si elle n'existe pas
ALTER TABLE navire_cargaison
    ADD COLUMN IF NOT EXISTS quantite_recue DECIMAL(15,3) DEFAULT 0 AFTER quantite_declaree;

-- Ajouter les colonnes manquantes dans la table stocks
ALTER TABLE stocks
    ADD COLUMN IF NOT EXISTS quantite_reservee DECIMAL(15,3) DEFAULT 0 AFTER quantite_disponible,
    ADD COLUMN IF NOT EXISTS lot_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS date_entree DATE,
    ADD COLUMN IF NOT EXISTS date_expiration DATE,
    ADD COLUMN IF NOT EXISTS emplacement VARCHAR(100);

-- Ajouter les colonnes manquantes dans la table mouvements_stock
ALTER TABLE mouvements_stock
    ADD COLUMN IF NOT EXISTS lot_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS navire_id INT,
    ADD COLUMN IF NOT EXISTS validated_by INT,
    ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP NULL,
    ADD CONSTRAINT IF NOT EXISTS fk_mouvements_navire FOREIGN KEY (navire_id) REFERENCES navires(id),
    ADD CONSTRAINT IF NOT EXISTS fk_mouvements_validated_by FOREIGN KEY (validated_by) REFERENCES utilisateurs(id);

-- Ajouter les colonnes manquantes dans la table clients
ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS contact_principal VARCHAR(200),
    ADD COLUMN IF NOT EXISTS credit_limite DECIMAL(15,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS credit_utilise DECIMAL(15,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS delai_paiement INT DEFAULT 30;

-- Ajouter la colonne montant_ligne générée dans commande_lignes
ALTER TABLE commande_lignes
    DROP COLUMN IF EXISTS montant_ligne,
    ADD COLUMN montant_ligne DECIMAL(15,2) GENERATED ALWAYS AS (quantite * prix_unitaire) STORED;

-- =====================================================
-- CRÉATION DES VUES UTILES
-- =====================================================

-- Vue pour le stock global par produit
CREATE OR REPLACE VIEW v_stock_global AS
SELECT 
    p.id AS produit_id,
    p.reference,
    p.nom AS produit_nom,
    c.nom AS categorie,
    p.unite,
    COALESCE(SUM(s.quantite_disponible), 0) AS quantite_totale,
    COALESCE(SUM(s.quantite_reservee), 0) AS quantite_reservee_totale,
    COALESCE(SUM(s.quantite_disponible - s.quantite_reservee), 0) AS quantite_libre,
    p.seuil_alerte,
    CASE 
        WHEN COALESCE(SUM(s.quantite_disponible), 0) <= p.seuil_alerte THEN 'ALERTE'
        WHEN COALESCE(SUM(s.quantite_disponible), 0) <= p.seuil_alerte * 1.5 THEN 'FAIBLE'
        ELSE 'OK'
    END AS statut_stock,
    COALESCE(AVG(s.valeur_unitaire), p.prix_unitaire) AS valeur_unitaire_moyenne,
    COALESCE(SUM(s.quantite_disponible * s.valeur_unitaire), 0) AS valeur_totale
FROM produits p
LEFT JOIN stocks s ON p.id = s.produit_id
LEFT JOIN categories c ON p.categorie_id = c.id
WHERE p.actif = TRUE
GROUP BY p.id;

-- Vue pour les stocks par magasin
CREATE OR REPLACE VIEW v_stock_par_magasin AS
SELECT 
    m.id AS magasin_id,
    m.nom AS magasin_nom,
    p.id AS produit_id,
    p.reference AS produit_reference,
    p.nom AS produit_nom,
    COALESCE(s.quantite_disponible, 0) AS quantite_disponible,
    COALESCE(s.quantite_reservee, 0) AS quantite_reservee,
    COALESCE(s.quantite_disponible - s.quantite_reservee, 0) AS quantite_libre,
    s.valeur_unitaire,
    s.lot_number,
    s.date_entree,
    s.derniere_entree,
    s.derniere_sortie
FROM magasins m
CROSS JOIN produits p
LEFT JOIN stocks s ON s.magasin_id = m.id AND s.produit_id = p.id
WHERE p.actif = TRUE
ORDER BY m.nom, p.nom;

-- Vue pour les navires avec leur statut
CREATE OR REPLACE VIEW v_navires_statut AS
SELECT 
    n.id,
    n.nom_navire,
    n.numero_imo,
    n.statut,
    n.date_arrivee_prevue,
    n.date_arrivee_reelle,
    n.port_chargement,
    n.port_dechargement,
    COUNT(DISTINCT nc.id) AS nombre_produits,
    COALESCE(SUM(nc.quantite_declaree), 0) AS tonnage_total_declare,
    COALESCE(SUM(nc.quantite_recue), 0) AS tonnage_total_recu,
    CASE 
        WHEN n.statut = 'dispatche' THEN 100
        WHEN n.statut = 'receptionne' THEN 75
        WHEN n.statut = 'en_dechargement' THEN 50
        WHEN n.statut = 'arrive' THEN 25
        ELSE 0
    END AS progression_pct
FROM navires n
LEFT JOIN navire_cargaison nc ON n.id = nc.navire_id
GROUP BY n.id;

-- =====================================================
-- CRÉATION DES TRIGGERS
-- =====================================================

DELIMITER //

-- Trigger pour mettre à jour automatiquement les stocks lors des mouvements
DROP TRIGGER IF EXISTS after_mouvement_stock//
CREATE TRIGGER after_mouvement_stock
AFTER INSERT ON mouvements_stock
FOR EACH ROW
BEGIN
    -- Entrée de stock
    IF NEW.type_mouvement = 'entree' AND NEW.magasin_destination_id IS NOT NULL THEN
        INSERT INTO stocks (produit_id, magasin_id, quantite_disponible, valeur_unitaire, lot_number, date_entree)
        VALUES (NEW.produit_id, NEW.magasin_destination_id, NEW.quantite, NEW.prix_unitaire, NEW.lot_number, CURDATE())
        ON DUPLICATE KEY UPDATE
            quantite_disponible = quantite_disponible + NEW.quantite,
            derniere_entree = NOW();
    END IF;
    
    -- Sortie de stock
    IF NEW.type_mouvement = 'sortie' AND NEW.magasin_source_id IS NOT NULL THEN
        UPDATE stocks 
        SET quantite_disponible = quantite_disponible - NEW.quantite,
            derniere_sortie = NOW()
        WHERE produit_id = NEW.produit_id AND magasin_id = NEW.magasin_source_id;
    END IF;
    
    -- Transfert entre magasins
    IF NEW.type_mouvement = 'transfert' AND NEW.magasin_source_id IS NOT NULL AND NEW.magasin_destination_id IS NOT NULL THEN
        -- Sortie du magasin source
        UPDATE stocks 
        SET quantite_disponible = quantite_disponible - NEW.quantite,
            derniere_sortie = NOW()
        WHERE produit_id = NEW.produit_id AND magasin_id = NEW.magasin_source_id;
        
        -- Entrée dans le magasin destination
        INSERT INTO stocks (produit_id, magasin_id, quantite_disponible, valeur_unitaire, lot_number, date_entree)
        VALUES (NEW.produit_id, NEW.magasin_destination_id, NEW.quantite, NEW.prix_unitaire, NEW.lot_number, CURDATE())
        ON DUPLICATE KEY UPDATE
            quantite_disponible = quantite_disponible + NEW.quantite,
            derniere_entree = NOW();
    END IF;
END//

-- Trigger pour générer automatiquement les numéros
DROP TRIGGER IF EXISTS before_insert_navire//
CREATE TRIGGER before_insert_navire
BEFORE INSERT ON navires
FOR EACH ROW
BEGIN
    IF NEW.numero_imo IS NULL OR NEW.numero_imo = '' THEN
        SET NEW.numero_imo = CONCAT('IMO', YEAR(NOW()), LPAD((SELECT COUNT(*) + 1 FROM navires WHERE YEAR(created_at) = YEAR(NOW())), 4, '0'));
    END IF;
END//

DROP TRIGGER IF EXISTS before_insert_commande//
CREATE TRIGGER before_insert_commande
BEFORE INSERT ON commandes
FOR EACH ROW
BEGIN
    IF NEW.numero_commande IS NULL OR NEW.numero_commande = '' THEN
        SET NEW.numero_commande = CONCAT('CMD-', YEAR(NOW()), LPAD((SELECT COUNT(*) + 1 FROM commandes WHERE YEAR(created_at) = YEAR(NOW())), 5, '0'));
    END IF;
END//

DROP TRIGGER IF EXISTS before_insert_livraison//
CREATE TRIGGER before_insert_livraison
BEFORE INSERT ON livraisons
FOR EACH ROW
BEGIN
    IF NEW.numero_livraison IS NULL OR NEW.numero_livraison = '' THEN
        SET NEW.numero_livraison = CONCAT('LIV-', YEAR(NOW()), LPAD((SELECT COUNT(*) + 1 FROM livraisons WHERE YEAR(created_at) = YEAR(NOW())), 5, '0'));
    END IF;
END//

DELIMITER ;

-- =====================================================
-- PROCÉDURES STOCKÉES UTILES
-- =====================================================

DELIMITER //

-- Procédure pour dispatcher un navire vers les magasins
DROP PROCEDURE IF EXISTS sp_dispatcher_navire//
CREATE PROCEDURE sp_dispatcher_navire(
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
    WHERE id = p_cargaison_id AND navire_id = p_navire_id;
    
    -- Récupérer le prix unitaire du produit
    SELECT prix_unitaire INTO v_prix_unitaire
    FROM produits
    WHERE id = v_produit_id;
    
    -- Créer le dispatching
    INSERT INTO navire_dispatching (navire_id, cargaison_id, magasin_id, quantite, statut, created_by)
    VALUES (p_navire_id, p_cargaison_id, p_magasin_id, p_quantite, 'complete', p_user_id);
    
    -- Créer le mouvement d'entrée
    INSERT INTO mouvements_stock (
        type_mouvement, produit_id, magasin_destination_id, quantite,
        prix_unitaire, reference_document, description, lot_number,
        navire_id, created_by
    ) VALUES (
        'entree', v_produit_id, p_magasin_id, p_quantite,
        v_prix_unitaire, CONCAT('NAV-', p_navire_id), 
        CONCAT('Réception depuis navire ', (SELECT nom_navire FROM navires WHERE id = p_navire_id)),
        v_lot_number, p_navire_id, p_user_id
    );
    
    -- Mettre à jour la quantité reçue
    UPDATE navire_cargaison 
    SET quantite_recue = quantite_recue + p_quantite
    WHERE id = p_cargaison_id;
END//

-- Procédure pour créer une livraison depuis une commande
DROP PROCEDURE IF EXISTS sp_creer_livraison//
CREATE PROCEDURE sp_creer_livraison(
    IN p_commande_id INT,
    IN p_date_livraison DATE,
    IN p_chauffeur_nom VARCHAR(100),
    IN p_vehicule VARCHAR(50),
    IN p_user_id INT
)
BEGIN
    DECLARE v_livraison_id INT;
    DECLARE v_client_id INT;
    DECLARE v_adresse TEXT;
    
    -- Récupérer les infos de la commande
    SELECT client_id, adresse_livraison INTO v_client_id, v_adresse
    FROM commandes
    WHERE id = p_commande_id;
    
    -- Créer la livraison
    INSERT INTO livraisons (
        commande_id, date_livraison, statut, chauffeur_nom, 
        vehicule, adresse_livraison, created_by
    ) VALUES (
        p_commande_id, p_date_livraison, 'planifiee', p_chauffeur_nom,
        p_vehicule, v_adresse, p_user_id
    );
    
    SET v_livraison_id = LAST_INSERT_ID();
    
    -- Copier les lignes de commande vers les détails de livraison
    INSERT INTO livraison_details (livraison_id, produit_id, quantite_prevue)
    SELECT v_livraison_id, produit_id, quantite
    FROM commande_lignes
    WHERE commande_id = p_commande_id;
    
    -- Mettre à jour le statut de la commande
    UPDATE commandes 
    SET statut = 'en_livraison'
    WHERE id = p_commande_id;
    
    SELECT v_livraison_id AS livraison_id;
END//

DELIMITER ;

-- =====================================================
-- INDEXES POUR OPTIMISATION
-- =====================================================

-- Indexes pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_stocks_produit_magasin ON stocks(produit_id, magasin_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_date ON mouvements_stock(date_mouvement);
CREATE INDEX IF NOT EXISTS idx_mouvements_type ON mouvements_stock(type_mouvement);
CREATE INDEX IF NOT EXISTS idx_navires_statut ON navires(statut);
CREATE INDEX IF NOT EXISTS idx_commandes_client ON commandes(client_id);
CREATE INDEX IF NOT EXISTS idx_commandes_statut ON commandes(statut);

-- =====================================================
-- VÉRIFICATION ET RAPPORT
-- =====================================================

-- Afficher un rapport des tables mises à jour
SELECT 'Base de données its_maritime_stock mise à jour avec succès!' AS Message;

-- Vérifier les tables
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME,
    UPDATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'its_maritime_stock'
ORDER BY TABLE_NAME;