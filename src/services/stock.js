// src/services/stock.js
import MockApiService from './mockApi';
import api from './api';
import { API_ENDPOINTS } from '../config/api';

// Pour le développement, utiliser le mockAPI
const useMockAPI = import.meta.env.DEV;
const mockAPI = MockApiService;

// Helper pour obtenir le contexte magasin actuel
const getCurrentMagasinContext = () => {
    const user = JSON.parse(localStorage.getItem('its_user_data') || '{}');
    const currentMagasin = localStorage.getItem('its_current_magasin') || user.magasin_id;
    return { user, currentMagasin };
};

class StockService {
    constructor() {
        this.stockCollection = 'its_maritime_stock';
        this.mouvementsCollection = 'its_maritime_mouvements';
        this.emplacementsCollection = 'its_maritime_emplacements';
        this.receptionsCollection = 'its_maritime_receptions';
        this.initializeEmplacements();
    }

    // Initialiser les emplacements
    initializeEmplacements() {
        if (!localStorage.getItem(this.emplacementsCollection)) {
            const emplacements = [];
            // Génération automatique d'emplacements
            const zones = ['A', 'B', 'C', 'D'];
            for (let zone of zones) {
                for (let allee = 1; allee <= 5; allee++) {
                    for (let position = 1; position <= 10; position++) {
                        emplacements.push({
                            id: `${zone}-${allee.toString().padStart(2, '0')}-${position.toString().padStart(2, '0')}`,
                            zone,
                            allee,
                            position,
                            disponible: true,
                            capacite: 100
                        });
                    }
                }
            }
            localStorage.setItem(this.emplacementsCollection, JSON.stringify(emplacements));
        }
    }

    // Récupérer tout le stock (filtré par magasin)
    async getAllStock(filters = {}) {
        const { user, currentMagasin } = getCurrentMagasinContext();
        
        // Ajouter le filtre magasin si nécessaire
        if (user.role !== 'admin' && currentMagasin && !filters.magasin_id) {
            filters.magasin_id = currentMagasin;
        }
        
        const stock = await MockApiService.getStock(filters);
        const produits = await MockApiService.getProduits();

        return stock.map(item => {
            const produit = produits.find(p => p.id === item.produitId);
            return {
                ...item,
                produit: produit || null
            };
        });
    }

    // Nouvelle méthode : Alias pour getAllStock pour compatibilité avec les rapports
    async getAll(filters = {}) {
        return this.getAllStock(filters);
    }

    // Récupérer le stock par produit
    async getStockByProduit(produitId) {
        const stock = await mockAPI.getStock();
        return stock.filter(item => item.produitId === parseInt(produitId));
    }

    // Récupérer le stock par magasin
    async getStockByMagasin(magasinId) {
        if (!useMockAPI) {
            try {
                const response = await api.get(API_ENDPOINTS.STOCK.BY_MAGASIN(magasinId));
                
                // Transformer les données pour correspondre au format attendu par le frontend
                return response.data?.map(item => ({
                    id: item.id,
                    produitId: item.produit_id,
                    magasin_id: item.magasin_id,
                    quantite: item.quantite_disponible || item.quantite,
                    quantite_disponible: item.quantite_disponible,
                    quantite_reservee: item.quantite_reservee || 0,
                    emplacement: item.emplacement || 'Zone principale',
                    lot: item.lot || null,
                    dateExpiration: item.date_expiration,
                    prixUnitaire: item.prix_unitaire || item.produit?.prix_unitaire || 0,
                    seuil_alerte: item.seuil_alerte || item.produit?.seuil_alerte || 50,
                    derniere_entree: item.derniere_entree,
                    derniere_sortie: item.derniere_sortie,
                    produit: {
                        id: item.produit_id,
                        nom: item.produit_nom,
                        reference: item.produit_reference,
                        categorie: item.categorie,
                        unite: item.unite,
                        prix: item.prix_unitaire || item.produit?.prix_unitaire || 0,
                        seuil_alerte: item.seuil_alerte || item.produit?.seuil_alerte || 50
                    }
                })) || [];
            } catch (error) {
                console.error('Erreur API getStockByMagasin:', error);
                // Fallback vers mockAPI en cas d'erreur
                const stock = await mockAPI.getStock();
                return stock.filter(item => item.magasin_id === magasinId);
            }
        }
        
        // Mode Mock API
        const stock = await mockAPI.getStock();
        return stock.filter(item => item.magasin_id === magasinId);
    }

    // Récupérer le stock par magasin (API réelle)
    async getByMagasin(magasinId) {
        if (!useMockAPI) {
            const response = await fetch(`/api/stock/magasin/${magasinId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('its_token')}`
                }
            });
            const data = await response.json();
            return data.data;
        }
        return this.getStockByMagasin(magasinId);
    }

    // Enregistrer une entrée (API réelle)
    async enregistrerEntree(entreeData) {
        if (!useMockAPI) {
            const response = await fetch('/api/stock/entree', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('its_token')}`
                },
                body: JSON.stringify(entreeData)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de l\'enregistrement');
            }
            return data.data;
        }
        return this.entreeStock(entreeData);
    }

    // Récupérer les entrées du jour (API réelle)
    async getEntreesJour(magasinId) {
        if (!useMockAPI) {
            const response = await fetch(`/api/stock/entrees-jour/${magasinId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('its_token')}`
                }
            });
            const data = await response.json();
            return data.data;
        }
        // Pour le mock, récupérer les mouvements d'entrée du jour
        const today = new Date().toISOString().split('T')[0];
        const mouvements = await this.getMouvements();
        return mouvements.filter(m => 
            m.type === 'entree' && 
            m.date.startsWith(today) &&
            (!magasinId || m.magasin_id === magasinId)
        );
    }

    // Récupérer les alertes de stock
    async getAlertes() {
        const stock = await this.getAllStock();
        const alertes = [];
        
        stock.forEach(item => {
            if (item.quantite <= 0) {
                alertes.push({
                    id: `rupture-${item.id}`,
                    type: 'rupture',
                    produit: item.produit,
                    quantite_restante: 0,
                    message: `Rupture de stock: ${item.produit?.nom}`,
                    created_at: new Date().toISOString()
                });
            } else if (item.quantite < 50) {
                alertes.push({
                    id: `stock_bas-${item.id}`,
                    type: 'stock_bas',
                    produit: item.produit,
                    quantite_restante: item.quantite,
                    message: `Stock faible: ${item.produit?.nom} - ${item.quantite} T restantes`,
                    created_at: new Date().toISOString()
                });
            }
        });
        
        return alertes;
    }

    // Entrée de stock
    async entreeStock(entreeData) {
        this.validateEntree(entreeData);

        // Créer l'entrée de stock
        const stockEntry = {
            produitId: entreeData.produitId,
            quantite: entreeData.quantite,
            emplacement: entreeData.emplacement,
            lot: entreeData.lot || this.generateLotNumber(),
            dateExpiration: entreeData.dateExpiration,
            status: 'disponible',
            prixUnitaire: entreeData.prixUnitaire || 0,
            fournisseur: entreeData.fournisseur || '',
            dateReception: new Date().toISOString()
        };

        const newStock = await mockAPI.ajouterStock(stockEntry);

        // Enregistrer le mouvement avec toutes les infos de livraison
        await this.createMouvement({
            type: 'entree',
            produitId: entreeData.produitId,
            quantite: entreeData.quantite,
            motif: entreeData.motif || 'Entrée de stock',
            reference: entreeData.numero_bl || this.generateReference('ENT'),
            utilisateur: entreeData.utilisateur || 'Système',
            details: {
                emplacement: entreeData.emplacement,
                lot: stockEntry.lot,
                fournisseur: entreeData.fournisseur,
                client_id: entreeData.client_id,
                numero_bl: entreeData.numero_bl,
                date_livraison: entreeData.date_livraison,
                transporteur: entreeData.transporteur,
                nom_chauffeur: entreeData.nom_chauffeur,
                telephone_chauffeur: entreeData.telephone_chauffeur,
                numero_camion: entreeData.numero_camion,
                prix_unitaire: entreeData.prix_unitaire,
                observations: entreeData.observations
            }
        });

        return newStock;
    }

    // Sortie de stock
    async sortieStock(sortieData) {
        this.validateSortie(sortieData);

        const stock = await this.getStockByProduit(sortieData.produitId);
        const quantiteDisponible = stock.reduce((sum, item) => sum + item.quantite, 0);

        if (quantiteDisponible < sortieData.quantite) {
            throw new Error(`Stock insuffisant. Disponible: ${quantiteDisponible}, Demandé: ${sortieData.quantite}`);
        }

        // Déduire du stock (FIFO - First In, First Out)
        let quantiteRestante = sortieData.quantite;
        const stockUpdates = [];

        for (let stockItem of stock.sort((a, b) => new Date(a.dateReception) - new Date(b.dateReception))) {
            if (quantiteRestante <= 0) break;

            if (stockItem.quantite > 0) {
                const quantitePrelevee = Math.min(stockItem.quantite, quantiteRestante);
                const nouvelleQuantite = stockItem.quantite - quantitePrelevee;

                await mockAPI.retirerStock(stockItem.id, quantitePrelevee);

                stockUpdates.push({
                    stockId: stockItem.id,
                    quantitePrelevee,
                    emplacement: stockItem.emplacement,
                    lot: stockItem.lot
                });

                quantiteRestante -= quantitePrelevee;
            }
        }

        // Enregistrer le mouvement
        await this.createMouvement({
            type: 'sortie',
            produitId: sortieData.produitId,
            quantite: sortieData.quantite,
            motif: sortieData.motif || 'Sortie de stock',
            reference: this.generateReference('SOR'),
            utilisateur: sortieData.utilisateur || 'Système',
            details: {
                client: sortieData.client,
                stockUpdates
            }
        });

        return stockUpdates;
    }

    // Transfert de stock entre emplacements
    async transfertStock(transfertData) {
        const { stockId, nouvelEmplacement, quantite, motif, utilisateur } = transfertData;

        const allStock = await mockAPI.getStock();
        const stockItem = allStock.find(item => item.id === stockId);
        if (!stockItem) {
            throw new Error('Item de stock introuvable');
        }

        if (quantite > stockItem.quantite) {
            throw new Error('Quantité de transfert supérieure au stock disponible');
        }

        // Vérifier la disponibilité de l'emplacement
        const emplacementDisponible = await this.isEmplacementDisponible(nouvelEmplacement);
        if (!emplacementDisponible) {
            throw new Error('Emplacement de destination non disponible');
        }

        if (quantite === stockItem.quantite) {
            // Transfert total - modifier l'emplacement
            // Mise à jour de l'emplacement directe via mockAPI
            stockItem.emplacement = nouvelEmplacement;
            await mockAPI.updateStock(stockId, stockItem);
        } else {
            // Transfert partiel - diviser le stock
            // Réduire la quantité du stock existant
            await mockAPI.retirerStock(stockId, quantite);

            // Créer un nouveau stock pour l'emplacement de destination
            await mockAPI.ajouterStock({
                ...stockItem,
                id: undefined,
                quantite,
                emplacement: nouvelEmplacement
            });
        }

        // Enregistrer le mouvement
        await this.createMouvement({
            type: 'transfert',
            produitId: stockItem.produitId,
            quantite,
            motif: motif || 'Transfert d\'emplacement',
            reference: this.generateReference('TRF'),
            utilisateur: utilisateur || 'Système',
            details: {
                ancienEmplacement: stockItem.emplacement,
                nouvelEmplacement,
                stockId
            }
        });

        return true;
    }

    // Créer un mouvement de stock
    async createMouvement(mouvementData) {
        // Enregistrer le mouvement dans mockAPI
        return await mockAPI.ajouterTransaction({
            ...mouvementData,
            date: new Date().toISOString()
        });
    }

    // Récupérer tous les mouvements
    async getAllMouvements() {
        return await this.getMouvements();
    }

    // Récupérer les mouvements
    async getMouvements(filters = {}) {
        let mouvements = await mockAPI.getTransactions();
        const produits = await mockAPI.getProduits();

        // Enrichir avec les données produit
        mouvements = mouvements.map(mouvement => {
            const produit = produits.find(p => p.id === mouvement.produitId);
            return {
                ...mouvement,
                produit: produit || null
            };
        });

        // Appliquer les filtres
        if (filters.type) {
            mouvements = mouvements.filter(m => m.type === filters.type);
        }
        if (filters.produitId) {
            mouvements = mouvements.filter(m => m.produitId === parseInt(filters.produitId));
        }
        if (filters.dateDebut) {
            mouvements = mouvements.filter(m => new Date(m.date) >= new Date(filters.dateDebut));
        }
        if (filters.dateFin) {
            mouvements = mouvements.filter(m => new Date(m.date) <= new Date(filters.dateFin));
        }

        return mouvements.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Récupérer les emplacements
    async getEmplacements() {
        return JSON.parse(localStorage.getItem(this.emplacementsCollection) || '[]');
    }

    // Vérifier la disponibilité d'un emplacement
    async isEmplacementDisponible(emplacementId) {
        const stock = await mockAPI.getStock();
        const emplacementOccupe = stock.some(item =>
            item.emplacement === emplacementId && item.quantite > 0
        );
        return !emplacementOccupe;
    }

    // Récupérer les emplacements libres
    async getEmplacementsLibres() {
        const emplacements = await this.getEmplacements();
        const stock = await mockAPI.getStock();
        const emplacementsOccupes = new Set(
            stock.filter(item => item.quantite > 0).map(item => item.emplacement)
        );

        return emplacements.filter(emp => !emplacementsOccupes.has(emp.id));
    }

    // Inventaire
    async getInventaire() {
        const stock = await this.getAllStock();
        const produits = await mockAPI.getProduits();

        const inventaire = {};

        // Grouper par produit
        stock.forEach(item => {
            if (!inventaire[item.produitId]) {
                const produit = produits.find(p => p.id === item.produitId);
                inventaire[item.produitId] = {
                    produit,
                    quantiteTotal: 0,
                    valeurTotal: 0,
                    emplacements: [],
                    lots: []
                };
            }

            inventaire[item.produitId].quantiteTotal += item.quantite;
            inventaire[item.produitId].valeurTotal += item.quantite * (item.prixUnitaire || inventaire[item.produitId].produit?.prix || 0);
            inventaire[item.produitId].emplacements.push({
                emplacement: item.emplacement,
                quantite: item.quantite,
                lot: item.lot
            });

            if (!inventaire[item.produitId].lots.includes(item.lot)) {
                inventaire[item.produitId].lots.push(item.lot);
            }
        });

        return Object.values(inventaire);
    }

    // Alertes de stock
    async getAlertes() {
        const stock = await this.getAllStock();
        const produits = await mockAPI.getProduits();
        const alertes = [];

        // Grouper le stock par produit
        const stockParProduit = {};
        stock.forEach(item => {
            if (!stockParProduit[item.produitId]) {
                stockParProduit[item.produitId] = 0;
            }
            stockParProduit[item.produitId] += item.quantite;
        });

        // Vérifier les seuils
        produits.forEach(produit => {
            const quantiteTotal = stockParProduit[produit.id] || 0;

            if (quantiteTotal === 0) {
                alertes.push({
                    type: 'rupture',
                    produit,
                    quantiteActuelle: quantiteTotal,
                    seuil: produit.seuil || produit.seuilAlerte || 0,
                    message: `Produit en rupture de stock`
                });
            } else if (quantiteTotal <= (produit.seuil || produit.seuilAlerte || 0)) {
                alertes.push({
                    type: 'stock_bas',
                    produit,
                    quantiteActuelle: quantiteTotal,
                    seuil: produit.seuil || produit.seuilAlerte || 0,
                    message: `Stock faible (${quantiteTotal} unités restantes)`
                });
            }
        });

        // Vérifier les dates d'expiration
        const dateLimite = new Date();
        dateLimite.setDate(dateLimite.getDate() + 30); // 30 jours

        stock.forEach(item => {
            if (item.dateExpiration && new Date(item.dateExpiration) <= dateLimite) {
                const produit = produits.find(p => p.id === item.produitId);
                alertes.push({
                    type: 'expiration',
                    produit,
                    quantiteActuelle: item.quantite,
                    dateExpiration: item.dateExpiration,
                    emplacement: item.emplacement,
                    message: `Produit expirant bientôt (${new Date(item.dateExpiration).toLocaleDateString()})`
                });
            }
        });

        return alertes;
    }

    // Statistiques du stock
    async getStockStats() {
        const stock = await this.getAllStock();
        const mouvements = await this.getMouvements();
        const produits = await mockAPI.getProduits();
        
        // Calculer les statistiques
        const totalArticles = produits.length;
        const totalQuantite = stock.reduce((sum, item) => sum + item.quantite, 0);
        const valeurTotale = stock.reduce((sum, item) => 
            sum + (item.quantite * (item.prixUnitaire || item.produit?.prix || 0)), 0
        );
        
        // Mouvements du jour
        const today = new Date().toISOString().split('T')[0];
        const mouvementsToday = mouvements.filter(m => 
            m.date.startsWith(today)
        );
        const entreesToday = mouvementsToday.filter(m => m.type === 'entree').length;
        const sortiesToday = mouvementsToday.filter(m => m.type === 'sortie').length;
        
        // Produits en rupture ou stock bas
        const stockParProduit = {};
        stock.forEach(item => {
            if (!stockParProduit[item.produitId]) {
                stockParProduit[item.produitId] = 0;
            }
            stockParProduit[item.produitId] += item.quantite;
        });
        
        let produitsEnRupture = 0;
        produits.forEach(produit => {
            const quantite = stockParProduit[produit.id] || 0;
            const seuil = produit.seuil || produit.seuilAlerte || 0;
            if (quantite === 0 || quantite <= seuil) {
                produitsEnRupture++;
            }
        });
        
        return {
            totalArticles,
            totalQuantite,
            valeurTotale,
            entreesToday,
            sortiesToday,
            produitsEnRupture
        };
    }

    // Génération de numéros
    generateLotNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `LOT-${year}${month}${day}-${random}`;
    }

    generateReference(prefix) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const time = Date.now().toString().slice(-4);
        return `${prefix}-${year}${month}${day}-${time}`;
    }

    // Validation
    validateEntree(entreeData) {
        const errors = [];

        if (!entreeData.produitId) {
            errors.push('Le produit est obligatoire');
        }
        if (!entreeData.quantite || entreeData.quantite <= 0) {
            errors.push('La quantité doit être supérieure à 0');
        }
        if (!entreeData.emplacement) {
            errors.push('L\'emplacement est obligatoire');
        }

        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
    }

    validateSortie(sortieData) {
        const errors = [];

        if (!sortieData.produitId) {
            errors.push('Le produit est obligatoire');
        }
        if (!sortieData.quantite || sortieData.quantite <= 0) {
            errors.push('La quantité doit être supérieure à 0');
        }

        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
    }

    // Méthode pour la réception navire avec dispatch automatique
    async receptionNavire(receptionData) {
        try {
            const { user, currentMagasin } = getCurrentMagasinContext();
            
            // Enregistrer la réception principale
            const reception = {
                id: Date.now().toString(),
                ...receptionData,
                date: new Date().toISOString(),
                status: 'completed',
                createdBy: user.id
            };

            // Sauvegarder la réception dans une collection dédiée
            const receptions = mockAPI.getCollection(this.receptionsCollection) || [];
            receptions.push(reception);
            mockAPI.setCollection(this.receptionsCollection, receptions);

            // Créer les entrées de stock pour chaque magasin
            const mouvements = mockAPI.getCollection(this.mouvementsCollection) || [];
            const stock = mockAPI.getCollection(this.stockCollection) || [];

            for (const produit of receptionData.produits) {
                // Pour chaque distribution de produit
                for (const dispatch of produit.dispatch) {
                    if (dispatch.quantite > 0) {
                        // Créer le mouvement d'entrée
                        const mouvement = {
                            id: Date.now().toString() + '_' + dispatch.magasin_id,
                            type: 'entree',
                            date: new Date().toISOString(),
                            produit_id: produit.produit_id,
                            magasin_id: dispatch.magasin_id,
                            quantite: dispatch.quantite,
                            lot: produit.lot,
                            dateExpiration: produit.dateExpiration,
                            prixUnitaire: produit.prixUnitaire,
                            motif: `Réception navire ${receptionData.navire}`,
                            reference: `REC-${reception.id}`,
                            fournisseur: receptionData.fournisseur,
                            utilisateur: user.nom,
                            utilisateur_id: user.id
                        };
                        mouvements.push(mouvement);

                        // Mettre à jour le stock pour ce magasin
                        const stockKey = `${produit.produit_id}_${dispatch.magasin_id}`;
                        let stockItem = stock.find(s => 
                            s.produit_id === produit.produit_id && 
                            s.magasin_id === dispatch.magasin_id
                        );

                        if (stockItem) {
                            stockItem.quantite += dispatch.quantite;
                            stockItem.dernierMouvement = new Date().toISOString();
                        } else {
                            stock.push({
                                id: Date.now().toString() + '_stock_' + stockKey,
                                produit_id: produit.produit_id,
                                magasin_id: dispatch.magasin_id,
                                quantite: dispatch.quantite,
                                emplacement: 'Zone de stockage principale',
                                lot: produit.lot,
                                dateExpiration: produit.dateExpiration,
                                dernierMouvement: new Date().toISOString()
                            });
                        }
                    }
                }
            }

            // Sauvegarder les collections mises à jour
            mockAPI.setCollection(this.mouvementsCollection, mouvements);
            mockAPI.setCollection(this.stockCollection, stock);

            return reception;
        } catch (error) {
            console.error('Erreur lors de la réception navire:', error);
            throw error;
        }
    }
}

// Export des fonctions pour compatibilité avec d'autres services
export const stockService = new StockService();

// Nouvelle méthode pour enregistrer une entrée via l'API
stockService.ajouterEntree = async function(entreeData) {
    const magasinId = entreeData.magasin_id;
    
    try {
        // Utiliser le service API centralisé et les endpoints définis
        const response = await api.post(API_ENDPOINTS.STOCK_MAGASINIER.ENTREE(magasinId), {
            produit_id: entreeData.produit_id,
            quantite: entreeData.quantite,
            numero_lot: entreeData.numero_lot,
            date_peremption: entreeData.date_peremption,
            notes: entreeData.notes
        });

        return response;
    } catch (error) {
        console.error('Erreur ajouterEntree:', error);
        throw error;
    }
};

// Méthode pour récupérer le stock du jour d'un magasin
stockService.getStockJour = async function(magasinId) {
    try {
        const response = await api.get(API_ENDPOINTS.STOCK_MAGASINIER.JOUR(magasinId));
        return response;
    } catch (error) {
        console.error('Erreur getStockJour:', error);
        throw error;
    }
};

// Méthode pour initialiser le stock du jour
stockService.initialiserStockJour = async function(magasinId, stockData) {
    try {
        const response = await api.post(API_ENDPOINTS.STOCK_MAGASINIER.INITIALISER(magasinId), stockData);
        return response;
    } catch (error) {
        console.error('Erreur initialiserStockJour:', error);
        throw error;
    }
};

// Méthode pour enregistrer une sortie
stockService.enregistrerSortie = async function(sortieData) {
    const magasinId = sortieData.magasin_id;
    
    try {
        const response = await api.post(API_ENDPOINTS.STOCK_MAGASINIER.SORTIE(magasinId), {
            produit_id: sortieData.produit_id,
            quantite: sortieData.quantite,
            destination: sortieData.destination,
            notes: sortieData.notes
        });
        return response;
    } catch (error) {
        console.error('Erreur enregistrerSortie:', error);
        throw error;
    }
};

// Méthode pour obtenir le résumé du stock
stockService.getResumeStock = async function(magasinId) {
    try {
        const response = await api.get(API_ENDPOINTS.STOCK_MAGASINIER.RESUME(magasinId));
        return response;
    } catch (error) {
        console.error('Erreur getResumeStock:', error);
        throw error;
    }
};

// Méthode pour obtenir l'historique des mouvements
stockService.getHistoriqueMouvements = async function(magasinId, filters = {}) {
    try {
        const response = await api.get(API_ENDPOINTS.STOCK_MAGASINIER.HISTORIQUE(magasinId), filters);
        return response;
    } catch (error) {
        console.error('Erreur getHistoriqueMouvements:', error);
        throw error;
    }
};

export default stockService;