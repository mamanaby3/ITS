// Service pour la gestion du stock via l'API réelle
import api from './api';

class StockApiService {
    // Récupérer le stock par magasin
    async getStockByMagasin(magasinId, params = {}) {
        try {
            const response = await api.get(`/api/stock/magasin/${magasinId}`, { params });
            return response.data || response;
        } catch (error) {
            console.error('Erreur lors de la récupération du stock:', error);
            throw error;
        }
    }

    // Récupérer les mouvements de stock
    async getMouvements(params = {}) {
        try {
            const response = await api.get('/api/stock/mouvements', { params });
            return response.data || response;
        } catch (error) {
            console.error('Erreur lors de la récupération des mouvements:', error);
            throw error;
        }
    }

    // Entrée de stock
    async addStock(data) {
        try {
            const response = await api.post('/api/stock/entree', data);
            return response.data || response;
        } catch (error) {
            console.error('Erreur lors de l\'entrée de stock:', error);
            throw error;
        }
    }

    // Sortie de stock
    async removeStock(data) {
        try {
            const response = await api.post('/api/stock/sortie', data);
            return response.data || response;
        } catch (error) {
            console.error('Erreur lors de la sortie de stock:', error);
            throw error;
        }
    }

    // Transfert de stock entre magasins
    async transferStock(data) {
        try {
            const response = await api.post('/api/stock/transfert', data);
            return response.data || response;
        } catch (error) {
            console.error('Erreur lors du transfert de stock:', error);
            throw error;
        }
    }

    // Ajustement de stock
    async adjustStock(data) {
        try {
            const response = await api.post('/api/stock/ajustement', data);
            return response.data || response;
        } catch (error) {
            console.error('Erreur lors de l\'ajustement de stock:', error);
            throw error;
        }
    }

    // Vérifier la disponibilité du stock
    async checkAvailability(produitId, magasinId, quantite) {
        try {
            const response = await api.post('/api/stock/check-availability', {
                produit_id: produitId,
                magasin_id: magasinId,
                quantite
            });
            return response.data || response;
        } catch (error) {
            console.error('Erreur lors de la vérification de disponibilité:', error);
            throw error;
        }
    }

    // Récupérer les statistiques de stock
    async getStats(magasinId) {
        try {
            const response = await api.get(`/api/stock/stats/${magasinId}`);
            return response.data || response;
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            throw error;
        }
    }

    // Récupérer les produits en rupture de stock
    async getLowStock(magasinId) {
        try {
            const response = await api.get(`/api/stock/low-stock/${magasinId}`);
            return response.data || response;
        } catch (error) {
            console.error('Erreur lors de la récupération des produits en rupture:', error);
            throw error;
        }
    }
}

export default new StockApiService();