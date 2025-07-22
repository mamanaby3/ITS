// src/services/produitsApi.js
import api from './api';
import { API_ENDPOINTS } from '../config/api';

class ProduitsApiService {
    // Récupérer tous les produits
    async getAll(filters = {}) {
        try {
            const response = await api.get(API_ENDPOINTS.PRODUITS.LIST, filters);
            return response.data || [];
        } catch (error) {
            console.error('Erreur lors de la récupération des produits:', error);
            throw error;
        }
    }

    // Récupérer un produit par ID
    async getById(id) {
        try {
            const response = await api.get(API_ENDPOINTS.PRODUITS.BY_ID(id));
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération du produit:', error);
            throw error;
        }
    }

    // Créer un nouveau produit
    async create(produitData) {
        try {
            const response = await api.post(API_ENDPOINTS.PRODUITS.CREATE, produitData);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la création du produit:', error);
            throw error;
        }
    }

    // Mettre à jour un produit
    async update(id, produitData) {
        try {
            const response = await api.put(API_ENDPOINTS.PRODUITS.UPDATE(id), produitData);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du produit:', error);
            throw error;
        }
    }

    // Supprimer un produit
    async delete(id) {
        try {
            const response = await api.delete(API_ENDPOINTS.PRODUITS.DELETE(id));
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la suppression du produit:', error);
            throw error;
        }
    }

    // Rechercher des produits
    async search(searchTerm) {
        try {
            const response = await api.get(API_ENDPOINTS.PRODUITS.LIST, {
                search: searchTerm
            });
            return response.data || [];
        } catch (error) {
            console.error('Erreur lors de la recherche de produits:', error);
            throw error;
        }
    }

    // Méthodes pour compatibilité avec l'interface existante
    async getAllProduits() {
        return this.getAll();
    }

    async getProduitById(id) {
        return this.getById(id);
    }

    async createProduit(data) {
        return this.create(data);
    }

    async updateProduit(id, data) {
        return this.update(id, data);
    }

    async deleteProduit(id) {
        return this.delete(id);
    }

    async searchProduits(term) {
        return this.search(term);
    }

    async getProduitsStats() {
        try {
            const response = await api.get('/produits/stats');
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des stats produits:', error);
            throw error;
        }
    }

    async getProduitsWithStock() {
        try {
            const response = await api.get('/produits/with-stock');
            return response.data || [];
        } catch (error) {
            console.error('Erreur lors de la récupération des produits avec stock:', error);
            throw error;
        }
    }

    async getCategories() {
        try {
            const response = await api.get('/produits/categories');
            return response.data || [];
        } catch (error) {
            console.error('Erreur lors de la récupération des catégories:', error);
            throw error;
        }
    }
}

// Export de l'instance
export const produitsApiService = new ProduitsApiService();
export default produitsApiService;