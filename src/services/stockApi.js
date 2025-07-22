// src/services/stockApi.js
import api from './api';
import { API_ENDPOINTS } from '../config/api';

class StockApiService {
    // Récupérer tous les stocks
    async getAllStock(filters = {}) {
        try {
            const response = await api.get(API_ENDPOINTS.STOCK.LIST, filters);
            return response.data || [];
        } catch (error) {
            console.error('Erreur lors de la récupération du stock:', error);
            throw error;
        }
    }

    // Récupérer les statistiques du stock
    async getStockStats() {
        try {
            const response = await api.get(API_ENDPOINTS.STOCK.STATS);
            return response.data || {};
        } catch (error) {
            console.error('Erreur lors de la récupération des stats:', error);
            throw error;
        }
    }

    // Récupérer tous les mouvements
    async getAllMouvements(filters = {}) {
        try {
            const response = await api.get(API_ENDPOINTS.STOCK.MOUVEMENTS, filters);
            return response.data || [];
        } catch (error) {
            console.error('Erreur lors de la récupération des mouvements:', error);
            throw error;
        }
    }

    // Créer une entrée de stock
    async entreeStock(entreeData) {
        try {
            const response = await api.post(API_ENDPOINTS.STOCK.ENTREE, entreeData);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de l\'entrée stock:', error);
            throw error;
        }
    }

    // Créer une sortie de stock
    async sortieStock(sortieData) {
        try {
            const response = await api.post(API_ENDPOINTS.STOCK.SORTIE, sortieData);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la sortie stock:', error);
            throw error;
        }
    }

    // Réception navire avec dispatch
    async receptionNavire(receptionData) {
        try {
            const response = await api.post(API_ENDPOINTS.STOCK.RECEPTION_NAVIRE, receptionData);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la réception navire:', error);
            throw error;
        }
    }

    // Récupérer les alertes de stock
    async getAlertes() {
        try {
            const response = await api.get(API_ENDPOINTS.STOCK.ALERTES);
            return response.data || [];
        } catch (error) {
            console.error('Erreur lors de la récupération des alertes:', error);
            throw error;
        }
    }

    // Récupérer l'inventaire (alias pour getAllStock)
    async getInventaire(filters = {}) {
        return this.getAllStock(filters);
    }

    // Récupérer les mouvements avec filtres
    async getMouvements(filters = {}) {
        return this.getAllMouvements(filters);
    }
}

// Export de l'instance
export const stockApiService = new StockApiService();
export default stockApiService;