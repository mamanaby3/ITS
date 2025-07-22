import api from './api';

class DispatchService {
  // Créer un nouveau dispatch
  async createDispatch(data) {
    try {
      const response = await api.post('/dispatches', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Récupérer tous les dispatches
  async getDispatches(filters = {}) {
    try {
      const response = await api.get('/dispatches', { params: filters });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Récupérer un dispatch spécifique
  async getDispatch(id) {
    try {
      const response = await api.get(`/dispatches/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Ajouter une rotation à un dispatch
  async addRotation(dispatchId, data) {
    try {
      const response = await api.post(`/dispatches/${dispatchId}/rotations`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Annuler un dispatch
  async cancelDispatch(id) {
    try {
      const response = await api.post(`/dispatches/${id}/cancel`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Vérifier le stock disponible
  async checkStock(produitId, magasinId) {
    try {
      const response = await api.get(`/dispatches/stock/${produitId}/${magasinId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Récupérer les dispatches actifs pour un magasin
  async getDispatchesActifs(magasinId) {
    try {
      const response = await api.get('/dispatches', { 
        params: { 
          magasin_id: magasinId,
          statut: ['planifie', 'en_cours']
        } 
      });
      return response.data.data || [];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Créer une livraison pour un dispatch
  async createLivraison(data) {
    try {
      const response = await api.post('/dispatch-livraisons', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Récupérer les livraisons du jour
  async getLivraisonsJour(magasinId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get('/dispatch-livraisons', {
        params: {
          magasin_id: magasinId,
          date_debut: today,
          date_fin: today
        }
      });
      return response.data.data || [];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Créer plusieurs rotations pour un dispatch
  async createMultipleRotations(dispatchId, rotations) {
    try {
      const response = await api.post(`/dispatches/${dispatchId}/rotations/multiple`, {
        rotations
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Gestion des erreurs
  handleError(error) {
    if (error.response) {
      const message = error.response.data.message || 'Une erreur est survenue';
      return new Error(message);
    }
    return error;
  }
}

export default new DispatchService();