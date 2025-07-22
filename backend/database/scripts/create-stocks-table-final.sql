-- Script pour créer la table stocks avec la structure attendue par le contrôleur
-- et assurer la compatibilité avec le système existant

-- Créer la table stocks avec les colonnes attendues par le contrôleur
CREATE TABLE IF NOT EXISTS stocks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    magasin_id VARCHAR(50) NOT NULL,
    produit_id INT NOT NULL,
    quantite_disponible DECIMAL(10,2) DEFAULT 0,
    quantite_reservee DECIMAL(10,2) DEFAULT 0,
    derniere_entree DATETIME,
    derniere_sortie DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Index pour les performances
    INDEX idx_magasin_produit (magasin_id, produit_id),
    INDEX idx_magasin (magasin_id),
    INDEX idx_produit (produit_id),
    
    -- Contrainte d'unicité
    UNIQUE KEY unique_magasin_produit (magasin_id, produit_id),
    
    -- Clés étrangères
    FOREIGN KEY (magasin_id) REFERENCES magasins(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
);

-- Créer quelques données de test pour le magasin belair-garage
-- Seulement si la table est vide
INSERT IGNORE INTO stocks (magasin_id, produit_id, quantite_disponible, quantite_reservee, derniere_entree)
SELECT 
    'belair-garage' as magasin_id,
    p.id as produit_id,
    FLOOR(RAND() * 500) + 50 as quantite_disponible, -- Entre 50 et 550
    FLOOR(RAND() * 20) as quantite_reservee, -- Entre 0 et 20
    NOW() - INTERVAL FLOOR(RAND() * 30) DAY as derniere_entree -- Dans les 30 derniers jours
FROM produits p
WHERE p.actif = 1
LIMIT 10;

-- Créer quelques mouvements de stock de test
INSERT IGNORE INTO mouvements_stock (
    type_mouvement,
    produit_id,
    magasin_destination_id,
    quantite,
    reference_document,
    date_mouvement,
    created_by,
    description
)
SELECT 
    'entree' as type_mouvement,
    p.id as produit_id,
    'belair-garage' as magasin_destination_id,
    FLOOR(RAND() * 100) + 10 as quantite,
    CONCAT('ENT-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(p.id, 3, '0')) as reference_document,
    NOW() - INTERVAL FLOOR(RAND() * 7) DAY as date_mouvement,
    2 as created_by, -- Utilisateur operator
    'Entrée de test pour initialisation' as description
FROM produits p
WHERE p.actif = 1
LIMIT 5;

-- Vue pour faciliter les requêtes de stock avec informations complètes
CREATE OR REPLACE VIEW v_stock_complet AS
SELECT 
    s.*,
    m.nom as magasin_nom,
    p.nom as produit_nom,
    p.reference as produit_reference,
    p.categorie as produit_categorie,
    p.unite as produit_unite,
    p.seuil_alerte,
    (s.quantite_disponible <= p.seuil_alerte) as stock_faible,
    (s.quantite_disponible + s.quantite_reservee) as quantite_totale
FROM stocks s
JOIN magasins m ON s.magasin_id = m.id
JOIN produits p ON s.produit_id = p.id
WHERE p.actif = 1;