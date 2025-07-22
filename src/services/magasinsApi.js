// src/services/magasinsApi.js
import api from './api';
import { API_ENDPOINTS } from '../config/api';

class MagasinsApiService {
    // Récupérer tous les magasins
    async getAll(filters = {}) {
        try {
            const response = await api.get(API_ENDPOINTS.MAGASINS.LIST, filters);
            return response.data || [];
        } catch (error) {
            console.error('Erreur lors de la récupération des magasins:', error);
            throw error;
        }
    }

    // Récupérer un magasin par ID
    async getById(id) {
        try {
            const response = await api.get(API_ENDPOINTS.MAGASINS.BY_ID(id));
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération du magasin:', error);
            throw error;
        }
    }

    // Créer un nouveau magasin
    async create(magasinData) {
        try {
            const response = await api.post(API_ENDPOINTS.MAGASINS.CREATE, magasinData);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la création du magasin:', error);
            throw error;
        }
    }

    // Mettre à jour un magasin
    async update(id, magasinData) {
        try {
            const response = await api.put(API_ENDPOINTS.MAGASINS.UPDATE(id), magasinData);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du magasin:', error);
            throw error;
        }
    }

    // Supprimer un magasin
    async delete(id) {
        try {
            const response = await api.delete(API_ENDPOINTS.MAGASINS.DELETE(id));
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la suppression du magasin:', error);
            throw error;
        }
    }

    // Récupérer les statistiques d'un magasin
    async getStats(magasinId) {
        try {
            const response = await api.get(API_ENDPOINTS.MAGASINS.STATS(magasinId));
            return response.data || {};
        } catch (error) {
            console.error('Erreur lors de la récupération des stats du magasin:', error);
            throw error;
        }
    }
}

// Export de l'instance
export const magasinsApiService = new MagasinsApiService();
export default magasinsApiService;