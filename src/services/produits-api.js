// Service pour la gestion des produits via l'API réelle
import api from './api';

class ProduitsApiService {
    // Récupérer tous les produits
    async getAll(params = {}) {
        try {
            const response = await api.get('/produits', { params });
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des produits:', error);
            throw error;
        }
    }

    // Récupérer un produit par ID
    async getById(id) {
        try {
            const response = await api.get(`/produits/${id}`);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération du produit:', error);
            throw error;
        }
    }

    // Créer un nouveau produit
    async create(produitData) {
        try {
            const response = await api.post('/produits', produitData);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la création du produit:', error);
            throw error;
        }
    }

    // Mettre à jour un produit
    async update(id, produitData) {
        try {
            const response = await api.put(`/produits/${id}`, produitData);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du produit:', error);
            throw error;
        }
    }

    // Supprimer un produit
    async delete(id) {
        try {
            const response = await api.delete(`/produits/${id}`);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la suppression du produit:', error);
            throw error;
        }
    }

    // Récupérer les catégories
    async getCategories() {
        try {
            const response = await api.get('/produits/categories');
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des catégories:', error);
            throw error;
        }
    }
}

export default new ProduitsApiService();