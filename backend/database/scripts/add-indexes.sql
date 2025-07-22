-- Script d'optimisation des performances avec ajout d'index
-- ITS Sénégal - Système de gestion de stock

-- Index pour améliorer les performances des requêtes fréquentes

-- Table produits
CREATE INDEX IF NOT EXISTS idx_produits_nom ON produits(nom);
CREATE INDEX IF NOT EXISTS idx_produits_reference ON produits(reference);
CREATE INDEX IF NOT EXISTS idx_produits_categorie ON produits(categorie);
CREATE INDEX IF NOT EXISTS idx_produits_magasin ON produits(magasin_id);

-- Table stocks
CREATE INDEX IF NOT EXISTS idx_stocks_produit_magasin ON stocks(produit_id, magasin_id);
CREATE INDEX IF NOT EXISTS idx_stocks_quantite ON stocks(quantite);
CREATE INDEX IF NOT EXISTS idx_stocks_seuil ON stocks(seuil_critique);

-- Table mouvements
CREATE INDEX IF NOT EXISTS idx_mouvements_date ON mouvements(date);
CREATE INDEX IF NOT EXISTS idx_mouvements_produit ON mouvements(produit_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_magasin ON mouvements(magasin_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_type ON mouvements(type_mouvement);
CREATE INDEX IF NOT EXISTS idx_mouvements_utilisateur ON mouvements(utilisateur_id);

-- Table commandes
CREATE INDEX IF NOT EXISTS idx_commandes_numero ON commandes(numero);
CREATE INDEX IF NOT EXISTS idx_commandes_statut ON commandes(statut);
CREATE INDEX IF NOT EXISTS idx_commandes_client ON commandes(client_id);
CREATE INDEX IF NOT EXISTS idx_commandes_date ON commandes(date_commande);
CREATE INDEX IF NOT EXISTS idx_commandes_magasin ON commandes(magasin_id);

-- Table commande_produits
CREATE INDEX IF NOT EXISTS idx_commande_produits_commande ON commande_produits(commande_id);
CREATE INDEX IF NOT EXISTS idx_commande_produits_produit ON commande_produits(produit_id);

-- Table livraisons
CREATE INDEX IF NOT EXISTS idx_livraisons_numero ON livraisons(numero);
CREATE INDEX IF NOT EXISTS idx_livraisons_commande ON livraisons(commande_id);
CREATE INDEX IF NOT EXISTS idx_livraisons_date ON livraisons(date_livraison);
CREATE INDEX IF NOT EXISTS idx_livraisons_statut ON livraisons(statut);

-- Table clients
CREATE INDEX IF NOT EXISTS idx_clients_nom ON clients(nom);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_telephone ON clients(telephone);
CREATE INDEX IF NOT EXISTS idx_clients_magasin ON clients(magasin_id);

-- Table utilisateurs
CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_role ON utilisateurs(role);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_magasin ON utilisateurs(magasin_id);

-- Index composites pour les requêtes complexes fréquentes

-- Recherche de produits par magasin et catégorie
CREATE INDEX IF NOT EXISTS idx_produits_magasin_categorie ON produits(magasin_id, categorie);

-- Mouvements par date et type
CREATE INDEX IF NOT EXISTS idx_mouvements_date_type ON mouvements(date, type_mouvement);

-- Commandes par client et statut
CREATE INDEX IF NOT EXISTS idx_commandes_client_statut ON commandes(client_id, statut);

-- Stocks critiques par magasin
CREATE INDEX IF NOT EXISTS idx_stocks_magasin_critique ON stocks(magasin_id, quantite, seuil_critique);

-- Analyse des performances après ajout des index
ANALYZE TABLE produits;
ANALYZE TABLE stocks;
ANALYZE TABLE mouvements;
ANALYZE TABLE commandes;
ANALYZE TABLE commande_produits;
ANALYZE TABLE livraisons;
ANALYZE TABLE clients;
ANALYZE TABLE utilisateurs;