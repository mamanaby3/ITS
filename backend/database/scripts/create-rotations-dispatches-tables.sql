-- Script pour créer les tables rotations et dispatches
USE its_maritime_stock;

-- Table des chauffeurs si elle n'existe pas
CREATE TABLE IF NOT EXISTS chauffeurs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(255) NOT NULL,
    telephone VARCHAR(50),
    numero_permis VARCHAR(100) UNIQUE,
    numero_camion VARCHAR(50),
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des dispatches (expéditions entre magasins)
CREATE TABLE IF NOT EXISTS dispatches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_dispatch VARCHAR(50) UNIQUE NOT NULL,
    produit_id INT NOT NULL,
    magasin_source_id VARCHAR(50) NOT NULL,
    magasin_destination_id VARCHAR(50) NOT NULL,
    client_id INT,
    quantite_totale DECIMAL(10,2) NOT NULL,
    statut ENUM('planifie', 'en_cours', 'complete', 'annule') DEFAULT 'planifie',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    notes TEXT,
    FOREIGN KEY (produit_id) REFERENCES produits(id),
    FOREIGN KEY (magasin_source_id) REFERENCES magasins(id),
    FOREIGN KEY (magasin_destination_id) REFERENCES magasins(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (created_by) REFERENCES utilisateurs(id)
);

-- Table des rotations (livraisons individuelles d'un dispatch)
CREATE TABLE IF NOT EXISTS rotations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_rotation VARCHAR(50) UNIQUE NOT NULL,
    dispatch_id INT NOT NULL,
    chauffeur_id INT NOT NULL,
    quantite_prevue DECIMAL(10,2) NOT NULL,
    quantite_livree DECIMAL(10,2),
    statut ENUM('planifie', 'en_transit', 'livre', 'annule') DEFAULT 'planifie',
    date_depart TIMESTAMP NULL,
    heure_depart TIMESTAMP NULL,
    date_arrivee TIMESTAMP NULL,
    heure_arrivee TIMESTAMP NULL,
    reception_par INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (dispatch_id) REFERENCES dispatches(id),
    FOREIGN KEY (chauffeur_id) REFERENCES chauffeurs(id),
    FOREIGN KEY (reception_par) REFERENCES utilisateurs(id)
);

-- Index pour améliorer les performances
CREATE INDEX idx_dispatches_statut ON dispatches(statut);
CREATE INDEX idx_dispatches_magasin_source ON dispatches(magasin_source_id);
CREATE INDEX idx_dispatches_magasin_destination ON dispatches(magasin_destination_id);
CREATE INDEX idx_rotations_statut ON rotations(statut);
CREATE INDEX idx_rotations_dispatch ON rotations(dispatch_id);
CREATE INDEX idx_rotations_chauffeur ON rotations(chauffeur_id);

-- Insérer quelques chauffeurs de test
INSERT INTO chauffeurs (nom, telephone, numero_permis, numero_camion) VALUES
('Amadou Diallo', '+221 77 123 45 67', 'SN2021001', 'DK-1234-AB'),
('Moussa Ndiaye', '+221 78 234 56 78', 'SN2021002', 'DK-5678-CD'),
('Ibrahima Fall', '+221 76 345 67 89', 'SN2021003', 'DK-9012-EF')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;