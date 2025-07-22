-- Script pour créer les tables manquantes dans la base de données
-- Base: its_maritime_stock
-- Tables manquantes: stocks, clients, commandes, commande_details, mouvements_stock, livraisons

USE its_maritime_stock;

-- Table des stocks par magasin
CREATE TABLE IF NOT EXISTS stocks (
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
CREATE TABLE IF NOT EXISTS clients (
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
CREATE TABLE IF NOT EXISTS mouvements_stock (
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
CREATE TABLE IF NOT EXISTS commandes (
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
CREATE TABLE IF NOT EXISTS commande_details (
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
CREATE TABLE IF NOT EXISTS livraisons (
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

-- Message de confirmation
SELECT 'Tables créées avec succès!' AS message;