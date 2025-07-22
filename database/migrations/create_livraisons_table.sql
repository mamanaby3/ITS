-- Migration: Create livraisons table
-- Description: Table pour enregistrer les livraisons prévues par le manager
-- Date: 2024-01-15
-- Database: its_maritime_stock

USE its_maritime_stock;

CREATE TABLE IF NOT EXISTS livraisons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Informations de base
    numero_bon_livraison VARCHAR(50) UNIQUE NOT NULL,
    date_livraison DATE NOT NULL,
    heure_depart TIME,
    
    -- Produit et quantité
    produit_id INT NOT NULL,
    quantite DECIMAL(10, 2) NOT NULL COMMENT 'Quantité en tonnes',
    
    -- Type de livraison et destination
    type_livraison ENUM('magasin', 'client', 'particulier') NOT NULL DEFAULT 'magasin',
    magasin_id INT NULL COMMENT 'Si livraison vers magasin',
    client_id INT NULL COMMENT 'Si livraison vers client',
    
    -- Informations particulier (si applicable)
    particulier_nom VARCHAR(100) NULL,
    particulier_telephone VARCHAR(20) NULL,
    particulier_adresse TEXT NULL,
    
    -- Informations de transport
    transporteur VARCHAR(100) NOT NULL,
    numero_camion VARCHAR(50) NOT NULL,
    nom_chauffeur VARCHAR(100) NOT NULL,
    permis_chauffeur VARCHAR(50) NOT NULL,
    telephone_chauffeur VARCHAR(20) NULL,
    
    -- Destination et observations
    destination_finale VARCHAR(255) NULL,
    observations TEXT NULL,
    
    -- Statut de la livraison
    statut ENUM('planifie', 'en_cours', 'livre', 'annule', 'retard') NOT NULL DEFAULT 'planifie',
    
    -- Informations de réception (remplies après livraison)
    date_reception DATE NULL,
    heure_reception TIME NULL,
    quantite_recue DECIMAL(10, 2) NULL COMMENT 'Quantité effectivement reçue',
    ecart DECIMAL(10, 2) GENERATED ALWAYS AS (quantite - IFNULL(quantite_recue, 0)) STORED,
    motif_ecart TEXT NULL,
    
    -- Référence au mouvement d'entrée créé par le magasinier
    mouvement_entree_id INT NULL,
    
    -- Métadonnées
    created_by INT NOT NULL COMMENT 'Manager qui a créé la livraison',
    updated_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Contraintes
    FOREIGN KEY (produit_id) REFERENCES produits(id),
    FOREIGN KEY (magasin_id) REFERENCES magasins(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (mouvement_entree_id) REFERENCES mouvements(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    
    -- Index pour les performances
    INDEX idx_date_livraison (date_livraison),
    INDEX idx_statut (statut),
    INDEX idx_magasin (magasin_id),
    INDEX idx_client (client_id),
    INDEX idx_produit (produit_id),
    INDEX idx_numero_camion (numero_camion),
    INDEX idx_chauffeur (nom_chauffeur),
    
    -- Contraintes de validation
    CONSTRAINT chk_quantite CHECK (quantite > 0),
    CONSTRAINT chk_quantite_recue CHECK (quantite_recue IS NULL OR quantite_recue >= 0),
    CONSTRAINT chk_destination CHECK (
        (type_livraison = 'magasin' AND magasin_id IS NOT NULL) OR
        (type_livraison = 'client' AND client_id IS NOT NULL) OR
        (type_livraison = 'particulier' AND particulier_nom IS NOT NULL AND particulier_telephone IS NOT NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Commentaires sur la table
ALTER TABLE livraisons COMMENT = 'Table des livraisons planifiées par le manager et leur suivi';

-- Trigger pour générer automatiquement le numéro de bon si non fourni
DELIMITER //
CREATE TRIGGER before_insert_livraison
BEFORE INSERT ON livraisons
FOR EACH ROW
BEGIN
    IF NEW.numero_bon_livraison IS NULL OR NEW.numero_bon_livraison = '' THEN
        SET NEW.numero_bon_livraison = CONCAT('BL-', YEAR(NEW.date_livraison), '-', LPAD((SELECT COUNT(*) + 1 FROM livraisons WHERE YEAR(date_livraison) = YEAR(NEW.date_livraison)), 5, '0'));
    END IF;
END//
DELIMITER ;

-- Trigger pour mettre à jour le statut automatiquement
DELIMITER //
CREATE TRIGGER after_update_livraison_reception
AFTER UPDATE ON livraisons
FOR EACH ROW
BEGIN
    -- Si une quantité reçue est enregistrée et le statut est toujours 'en_cours', passer à 'livre'
    IF NEW.quantite_recue IS NOT NULL AND OLD.quantite_recue IS NULL AND NEW.statut = 'en_cours' THEN
        UPDATE livraisons SET statut = 'livre' WHERE id = NEW.id;
    END IF;
END//
DELIMITER ;

-- Vue pour faciliter les requêtes de comparaison
CREATE OR REPLACE VIEW v_livraisons_comparaison AS
SELECT 
    l.id,
    l.numero_bon_livraison,
    l.date_livraison,
    l.type_livraison,
    p.nom as produit_nom,
    p.reference as produit_reference,
    l.quantite as quantite_prevue,
    l.quantite_recue,
    l.ecart,
    CASE 
        WHEN l.quantite_recue IS NULL THEN 'Non reçu'
        WHEN ABS(l.ecart) < 0.01 THEN 'Conforme'
        WHEN l.ecart > 0 THEN 'Manquant'
        ELSE 'Excédent'
    END as statut_comparaison,
    l.statut as statut_livraison,
    COALESCE(mag.nom, cl.nom, l.particulier_nom) as destination_nom,
    l.transporteur,
    l.numero_camion,
    l.nom_chauffeur,
    u.nom as created_by_nom
FROM livraisons l
JOIN produits p ON l.produit_id = p.id
LEFT JOIN magasins mag ON l.magasin_id = mag.id
LEFT JOIN clients cl ON l.client_id = cl.id
LEFT JOIN users u ON l.created_by = u.id;

-- Permissions (ajuster selon vos besoins)
-- GRANT SELECT, INSERT, UPDATE ON livraisons TO 'manager_role'@'localhost';
-- GRANT SELECT ON livraisons TO 'magasinier_role'@'localhost';
-- GRANT SELECT ON v_livraisons_comparaison TO 'all_users'@'localhost';