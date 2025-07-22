import apiClient from './api';

class MouvementsService {
    // Ajouter une entrée de stock
    async ajouterEntree(data) {
        try {
            const response = await apiClient.post('/mouvements/entree', data);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de l\'ajout d\'une entrée:', error);
            throw error;
        }
    }

    // Ajouter une sortie de stock
    async ajouterSortie(data) {
        try {
            const response = await apiClient.post('/mouvements/sortie', data);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de l\'ajout d\'une sortie:', error);
            throw error;
        }
    }

    // Récupérer tous les mouvements
    async getAll(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const url = queryParams ? `/mouvements?${queryParams}` : '/mouvements';
            const response = await apiClient.get(url);
            return response.data.data || [];
        } catch (error) {
            console.error('Erreur lors du chargement des mouvements:', error);
            throw error;
        }
    }

    // Récupérer les mouvements par magasin
    async getByMagasin(magasinId) {
        try {
            const response = await apiClient.get(`/mouvements/magasin/${magasinId}`);
            return response.data.data || [];
        } catch (error) {
            console.error('Erreur lors du chargement des mouvements du magasin:', error);
            throw error;
        }
    }

    // Récupérer les mouvements du jour
    async getMouvementsJour(magasinId) {
        try {
            const url = magasinId 
                ? `/mouvements/jour?magasin_id=${magasinId}`
                : '/mouvements/jour';
            const response = await apiClient.get(url);
            return response.data.data || [];
        } catch (error) {
            console.error('Erreur lors du chargement des mouvements du jour:', error);
            throw error;
        }
    }

    // Récupérer un mouvement par ID
    async getById(id) {
        try {
            const response = await apiClient.get(`/mouvements/${id}`);
            return response.data.data;
        } catch (error) {
            console.error('Erreur lors du chargement du mouvement:', error);
            throw error;
        }
    }

    // Annuler un mouvement
    async annuler(id, motif) {
        try {
            const response = await apiClient.post(`/mouvements/${id}/annuler`, { motif });
            return response.data;
        } catch (error) {
            console.error('Erreur lors de l\'annulation du mouvement:', error);
            throw error;
        }
    }

    // Récupérer les statistiques des mouvements
    async getStats(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const url = queryParams ? `/mouvements/stats?${queryParams}` : '/mouvements/stats';
            const response = await apiClient.get(url);
            return response.data.data;
        } catch (error) {
            console.error('Erreur lors du chargement des statistiques:', error);
            throw error;
        }
    }

    // Créer un dispatch (Manager uniquement)
    async creerDispatch(data) {
        try {
            const response = await apiClient.post('/mouvements/dispatch', data);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la création du dispatch:', error);
            throw error;
        }
    }

    // Confirmer un dispatch par une entrée (Operator uniquement)
    async confirmerDispatch(dispatchId, data) {
        try {
            const response = await apiClient.post(`/mouvements/dispatch/${dispatchId}/confirmer`, data);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la confirmation du dispatch:', error);
            throw error;
        }
    }

    // Récupérer les dispatches en attente
    async getDispatchesEnAttente(magasinId) {
        try {
            const url = magasinId 
                ? `/mouvements/dispatches/attente?magasin_id=${magasinId}`
                : '/mouvements/dispatches/attente';
            const response = await apiClient.get(url);
            return response.data.data || [];
        } catch (error) {
            console.error('Erreur lors du chargement des dispatches en attente:', error);
            throw error;
        }
    }
}

export default new MouvementsService();