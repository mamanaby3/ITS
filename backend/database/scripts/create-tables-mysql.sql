-- Script de création des tables pour ITS Maritime Stock
-- Base de données : its_maritime_stock

-- Créer la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS its_maritime_stock;
USE its_maritime_stock;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS utilisateurs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('manager', 'operator') NOT NULL,
    magasin_id VARCHAR(50),
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des magasins
CREATE TABLE IF NOT EXISTS magasins (
    id VARCHAR(50) PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    ville VARCHAR(100) NOT NULL,
    zone VARCHAR(100),
    adresse TEXT,
    capacite DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des produits
CREATE TABLE IF NOT EXISTS produits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reference VARCHAR(50) UNIQUE NOT NULL,
    nom VARCHAR(255) NOT NULL,
    categorie VARCHAR(100),
    description TEXT,
    unite VARCHAR(50) DEFAULT 'tonnes',
    prix_unitaire DECIMAL(12,2),
    seuil_alerte DECIMAL(10,2) DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des navires
CREATE TABLE IF NOT EXISTS navires (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom_navire VARCHAR(255) NOT NULL,
    numero_imo VARCHAR(50) UNIQUE,
    date_arrivee DATE NOT NULL,
    port VARCHAR(255),
    statut ENUM('en_attente', 'receptionne', 'dispatche') DEFAULT 'en_attente',
    numero_connaissement VARCHAR(100),
    agent_maritime VARCHAR(255),
    date_reception TIMESTAMP NULL,
    reception_par INT,
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reception_par) REFERENCES utilisateurs(id)
);

-- Table de la cargaison des navires
CREATE TABLE IF NOT EXISTS navire_cargaison (
    id INT PRIMARY KEY AUTO_INCREMENT,
    navire_id INT NOT NULL,
    produit_id INT NOT NULL,
    quantite DECIMAL(10,2) NOT NULL,
    unite VARCHAR(50) DEFAULT 'tonnes',
    origine VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (navire_id) REFERENCES navires(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id)
);

-- Table du dispatching des navires
CREATE TABLE IF NOT EXISTS navire_dispatching (
    id INT PRIMARY KEY AUTO_INCREMENT,
    navire_id INT NOT NULL,
    cargaison_id INT NOT NULL,
    magasin_id VARCHAR(50) NOT NULL,
    quantite DECIMAL(10,2) NOT NULL,
    date_dispatch TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dispatch_par INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (navire_id) REFERENCES navires(id) ON DELETE CASCADE,
    FOREIGN KEY (cargaison_id) REFERENCES navire_cargaison(id) ON DELETE CASCADE,
    FOREIGN KEY (magasin_id) REFERENCES magasins(id),
    FOREIGN KEY (dispatch_par) REFERENCES utilisateurs(id)
);

-- Table du stock
CREATE TABLE IF NOT EXISTS stock (
    id INT PRIMARY KEY AUTO_INCREMENT,
    produit_id INT NOT NULL,
    magasin_id VARCHAR(50) NOT NULL,
    quantite DECIMAL(10,2) NOT NULL DEFAULT 0,
    prix_unitaire DECIMAL(12,2),
    valeur_totale DECIMAL(15,2),
    derniere_entree DATE,
    derniere_sortie DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (produit_id) REFERENCES produits(id),
    FOREIGN KEY (magasin_id) REFERENCES magasins(id),
    UNIQUE KEY unique_produit_magasin (produit_id, magasin_id)
);

-- Table des mouvements de stock
CREATE TABLE IF NOT EXISTS mouvements_stock (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('entree', 'sortie', 'transfert', 'ajustement') NOT NULL,
    produit_id INT NOT NULL,
    magasin_id VARCHAR(50) NOT NULL,
    quantite DECIMAL(10,2) NOT NULL,
    prix_unitaire DECIMAL(12,2),
    reference VARCHAR(100),
    motif TEXT,
    utilisateur_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produit_id) REFERENCES produits(id),
    FOREIGN KEY (magasin_id) REFERENCES magasins(id),
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);

-- Table des clients
CREATE TABLE IF NOT EXISTS clients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code_client VARCHAR(50) UNIQUE NOT NULL,
    nom VARCHAR(255) NOT NULL,
    type ENUM('entreprise', 'particulier', 'gouvernement') NOT NULL,
    telephone VARCHAR(50),
    email VARCHAR(255),
    adresse TEXT,
    ville VARCHAR(100),
    pays VARCHAR(100) DEFAULT 'Sénégal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des commandes
CREATE TABLE IF NOT EXISTS commandes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_commande VARCHAR(50) UNIQUE NOT NULL,
    client_id INT NOT NULL,
    date_commande DATE NOT NULL,
    statut ENUM('brouillon', 'confirmee', 'en_preparation', 'prete', 'en_livraison', 'livree', 'annulee') DEFAULT 'brouillon',
    montant_total DECIMAL(15,2),
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (created_by) REFERENCES utilisateurs(id)
);

-- Table des lignes de commande
CREATE TABLE IF NOT EXISTS commande_lignes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    commande_id INT NOT NULL,
    produit_id INT NOT NULL,
    quantite DECIMAL(10,2) NOT NULL,
    prix_unitaire DECIMAL(12,2) NOT NULL,
    montant_ligne DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id)
);

-- Créer uniquement l'utilisateur admin par défaut (mot de passe: Admin123!)
-- Les autres données seront ajoutées via l'interface
INSERT INTO utilisateurs (nom, prenom, email, password_hash, role) VALUES
('Administrateur', 'ITS', 'admin@its-senegal.com', '$2a$10$YourHashedPasswordHere', 'manager')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;