import api from './api';

class RotationService {
  // Récupérer toutes les rotations
  async getRotations(filters = {}) {
    try {
      const response = await api.get('/rotations', { params: filters });
      // Si la réponse a une structure { success: true, data: [...] }
      if (response.data && response.data.success && response.data.data) {
        return response.data;
      }
      // Sinon retourner la réponse telle quelle
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Réceptionner une rotation
  async receiveRotation(rotationId, data) {
    try {
      const response = await api.post(`/rotations/${rotationId}/receive`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Récupérer les rotations en transit
  async getRotationsEnTransit(filters = {}) {
    try {
      const response = await api.get('/rotations/en-transit', { params: filters });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Récupérer l'historique des rotations
  async getRotationsHistory(filters = {}) {
    try {
      const response = await api.get('/rotations/history', { params: filters });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Récupérer le rapport des écarts
  async getEcartsReport(filters = {}) {
    try {
      const response = await api.get('/rotations/ecarts', { params: filters });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Calculer le nombre de rotations nécessaires
  async calculateRotations(data) {
    try {
      const response = await api.post('/rotations/calculate', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Créer plusieurs rotations en une fois
  async createMultipleRotations(data) {
    try {
      const response = await api.post('/rotations/multiple', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Créer une rotation
  async createRotation(data) {
    try {
      const response = await api.post('/rotations', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Démarrer une rotation (passer en transit)
  async startRotation(rotationId) {
    try {
      const response = await api.post(`/rotations/${rotationId}/start`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Récupérer les rotations d'un dispatch
  async getRotationsByDispatch(dispatchId) {
    try {
      const response = await api.get(`/rotations/dispatch/${dispatchId}`);
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

export default new RotationService();