-- Migration: Create livraisons table (Version simplifiée)
-- Description: Table pour enregistrer les livraisons prévues par le manager
-- Date: 2024-01-15
-- Database: its_maritime_stock

USE its_maritime_stock;

-- Supprimer la table si elle existe déjà
DROP TABLE IF EXISTS livraisons;

-- Créer la table livraisons
CREATE TABLE livraisons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Informations de base
    numero_bon_livraison VARCHAR(50) UNIQUE,
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
    ecart DECIMAL(10, 2) NULL COMMENT 'Écart calculé entre quantite et quantite_recue',
    motif_ecart TEXT NULL,
    
    -- Référence au mouvement d'entrée créé par le magasinier
    mouvement_entree_id INT NULL,
    
    -- Métadonnées
    created_by INT NOT NULL COMMENT 'Manager qui a créé la livraison',
    updated_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Index pour les performances
    INDEX idx_date_livraison (date_livraison),
    INDEX idx_statut (statut),
    INDEX idx_magasin (magasin_id),
    INDEX idx_client (client_id),
    INDEX idx_produit (produit_id),
    INDEX idx_numero_camion (numero_camion),
    INDEX idx_chauffeur (nom_chauffeur)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ajouter les clés étrangères après la création de la table
ALTER TABLE livraisons
    ADD CONSTRAINT fk_livraisons_produit FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Vérifier si la table magasins existe avant d'ajouter la contrainte
ALTER TABLE livraisons
    ADD CONSTRAINT fk_livraisons_magasin FOREIGN KEY (magasin_id) REFERENCES magasins(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Vérifier si la table clients existe avant d'ajouter la contrainte
ALTER TABLE livraisons
    ADD CONSTRAINT fk_livraisons_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- La contrainte pour mouvements sera ajoutée seulement si la colonne existe
-- ALTER TABLE livraisons
--     ADD CONSTRAINT fk_livraisons_mouvement FOREIGN KEY (mouvement_entree_id) REFERENCES mouvements(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- La contrainte pour users sera ajoutée seulement si la table existe
-- ALTER TABLE livraisons
--     ADD CONSTRAINT fk_livraisons_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- ALTER TABLE livraisons
--     ADD CONSTRAINT fk_livraisons_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Trigger pour générer automatiquement le numéro de bon si non fourni
DELIMITER $$
CREATE TRIGGER before_insert_livraison
BEFORE INSERT ON livraisons
FOR EACH ROW
BEGIN
    -- Générer le numéro de bon automatiquement si non fourni
    IF NEW.numero_bon_livraison IS NULL OR NEW.numero_bon_livraison = '' THEN
        SET @count = (SELECT COUNT(*) + 1 FROM livraisons WHERE YEAR(date_livraison) = YEAR(NEW.date_livraison));
        SET NEW.numero_bon_livraison = CONCAT('BL-', YEAR(NEW.date_livraison), '-', LPAD(@count, 5, '0'));
    END IF;
    
    -- Vérifier que la quantité est positive
    IF NEW.quantite <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La quantité doit être positive';
    END IF;
END$$

-- Trigger pour calculer l'écart après mise à jour
CREATE TRIGGER before_update_livraison
BEFORE UPDATE ON livraisons
FOR EACH ROW
BEGIN
    -- Calculer l'écart si une quantité reçue est enregistrée
    IF NEW.quantite_recue IS NOT NULL THEN
        SET NEW.ecart = NEW.quantite - NEW.quantite_recue;
        
        -- Si la quantité reçue est enregistrée et le statut est 'en_cours', passer à 'livre'
        IF NEW.statut = 'en_cours' AND OLD.quantite_recue IS NULL THEN
            SET NEW.statut = 'livre';
            SET NEW.date_reception = IFNULL(NEW.date_reception, CURDATE());
            SET NEW.heure_reception = IFNULL(NEW.heure_reception, CURTIME());
        END IF;
    END IF;
    
    -- Vérifier que la quantité reçue n'est pas négative
    IF NEW.quantite_recue IS NOT NULL AND NEW.quantite_recue < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La quantité reçue ne peut pas être négative';
    END IF;
END$$
DELIMITER ;

-- Créer une vue pour faciliter les comparaisons
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
    CASE 
        WHEN l.type_livraison = 'magasin' THEN mag.nom
        WHEN l.type_livraison = 'client' THEN cl.nom
        ELSE l.particulier_nom
    END as destination_nom,
    l.transporteur,
    l.numero_camion,
    l.nom_chauffeur,
    l.created_by,
    l.created_at,
    l.updated_at
FROM livraisons l
LEFT JOIN produits p ON l.produit_id = p.id
LEFT JOIN magasins mag ON l.magasin_id = mag.id
LEFT JOIN clients cl ON l.client_id = cl.id;

-- Message de succès
SELECT 'Table livraisons créée avec succès!' AS Message;