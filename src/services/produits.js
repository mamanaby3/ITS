// src/services/produits.js
import api from './api';

class ProduitsService {
    constructor() {
        this.collection = 'its_produits';
        this.initializeCategories();
    }

    // Initialiser les catégories par défaut
    initializeCategories() {
        if (!localStorage.getItem('its_categories')) {
            const categories = [
                'Céréales',
                'Maïs',
                'Soja',
                'Blé',
                'Riz',
                'Légumineuses',
                'Oléagineux',
                'Engrais',
                'Produits Agricoles',
                'Matières Premières',
                'Conteneurs Vrac',
                'Conteneurs Frigorifiques',
                'Import',
                'Export',
                'Autres'
            ];
            localStorage.setItem('its_categories', JSON.stringify(categories));
        }
    }

    // Récupérer tous les produits
    async getAllProduits() {
        try {
            const response = await api.get('/api/produits');
            // L'intercepteur API retourne déjà les données
            return response.data || response;
        } catch (error) {
            console.error('Erreur lors de la récupération des produits:', error);
            throw error;
        }
    }

    // Alias pour compatibilité
    async getAll() {
        return await this.getAllProduits();
    }

    // Récupérer un produit par ID
    async getProduitById(id) {
        const produits = await mockAPI.getProduits();
        const produit = produits.find(p => p.id === parseInt(id));
        if (!produit) {
            throw new Error('Produit non trouvé');
        }
        return produit;
    }

    // Créer un nouveau produit
    async createProduit(produitData) {
        // Validation des données
        this.validateProduit(produitData);

        // Vérifier l'unicité de la référence
        const existingProduits = await this.getAllProduits();
        const referenceExists = existingProduits.some(p =>
            p.reference.toLowerCase() === produitData.reference.toLowerCase()
        );

        if (referenceExists) {
            throw new Error('Cette référence existe déjà');
        }

        return await mockAPI.ajouterProduit(produitData);
    }

    // Mettre à jour un produit
    async updateProduit(id, produitData) {
        this.validateProduit(produitData);

        // Vérifier l'unicité de la référence (exclure le produit actuel)
        const existingProduits = await this.getAllProduits();
        const referenceExists = existingProduits.some(p =>
            p.id !== parseInt(id) &&
            p.reference.toLowerCase() === produitData.reference.toLowerCase()
        );

        if (referenceExists) {
            throw new Error('Cette référence existe déjà');
        }

        return await mockAPI.modifierProduit(id, produitData);
    }

    // Supprimer un produit
    async deleteProduit(id) {
        // Vérifier si le produit est utilisé dans le stock
        const stock = await mockAPI.getStock();
        const isUsedInStock = stock.some(s => s.produitId === parseInt(id));

        if (isUsedInStock) {
            throw new Error('Impossible de supprimer ce produit car il est présent en stock');
        }

        // Au lieu de supprimer, on désactive le produit
        return await mockAPI.modifierProduit(id, { actif: false });
    }

    // Rechercher des produits
    async searchProduits(query) {
        const produits = await this.getAllProduits();
        const searchTerm = query.toLowerCase();

        return produits.filter(produit =>
            produit.nom.toLowerCase().includes(searchTerm) ||
            produit.reference.toLowerCase().includes(searchTerm) ||
            produit.categorie.toLowerCase().includes(searchTerm) ||
            (produit.description && produit.description.toLowerCase().includes(searchTerm))
        );
    }

    // Filtrer par catégorie
    async filterByCategorie(categorie) {
        const produits = await this.getAllProduits();
        return produits.filter(produit => produit.categorie === categorie);
    }

    // Récupérer les catégories
    getCategories() {
        return JSON.parse(localStorage.getItem('its_categories') || '[]');
    }

    // Ajouter une catégorie
    addCategorie(categorie) {
        const categories = this.getCategories();
        if (!categories.includes(categorie)) {
            categories.push(categorie);
            localStorage.setItem('its_categories', JSON.stringify(categories));
        }
        return categories;
    }

    // Validation des données produit
    validateProduit(produit) {
        const errors = [];

        if (!produit.nom || produit.nom.trim().length < 2) {
            errors.push('Le nom du produit doit contenir au moins 2 caractères');
        }

        if (!produit.reference || produit.reference.trim().length < 2) {
            errors.push('La référence doit contenir au moins 2 caractères');
        }

        if (!produit.categorie || produit.categorie.trim().length === 0) {
            errors.push('La catégorie est obligatoire');
        }

        if (produit.prixUnitaire !== undefined && produit.prixUnitaire < 0) {
            errors.push('Le prix unitaire ne peut pas être négatif');
        }

        if (produit.seuilAlerte !== undefined && produit.seuilAlerte < 0) {
            errors.push('Le seuil d\'alerte ne peut pas être négatif');
        }

        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
    }

    // Statistiques des produits
    async getProduitsStats() {
        const produits = await this.getAllProduits();
        const stock = await mockAPI.getStock();

        const stats = {
            total: produits.length,
            categories: {},
            moyennePrix: 0,
            moyenneMarge: 0,
            produitsEnStock: 0,
            produitsHorsStock: 0
        };

        // Calculer les statistiques par catégorie
        produits.forEach(produit => {
            if (!stats.categories[produit.categorie]) {
                stats.categories[produit.categorie] = 0;
            }
            stats.categories[produit.categorie]++;
        });

        // Calculer les moyennes
        if (produits.length > 0) {
            const totalPrix = produits.reduce((sum, p) => sum + (p.prixUnitaire || 0), 0);
            stats.moyennePrix = totalPrix / produits.length;
        }

        // Compter les produits en stock vs hors stock
        const produitsIds = new Set(produits.map(p => p.id));
        const stockIds = new Set(stock.map(s => s.produitId));

        stats.produitsEnStock = produits.filter(p => stockIds.has(p.id)).length;
        stats.produitsHorsStock = produits.length - stats.produitsEnStock;

        return stats;
    }

    // Récupérer les produits avec leur quantité en stock
    async getProduitsWithStock() {
        const produits = await this.getAllProduits();
        const stock = await mockAPI.getStock();

        return produits.map(produit => {
            const stockItems = stock.filter(s => s.produitId === produit.id);
            const quantiteTotal = stockItems.reduce((sum, s) => sum + s.quantite, 0);

            return {
                ...produit,
                quantiteEnStock: quantiteTotal,
                emplacements: stockItems.map(s => s.emplacement),
                status: quantiteTotal <= (produit.seuilAlerte || 0) ? 'rupture' : 'disponible'
            };
        });
    }
}

export default new ProduitsService();