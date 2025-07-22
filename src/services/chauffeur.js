import api from './api';

class ChauffeurService {
  // Créer un nouveau chauffeur
  async createChauffeur(data) {
    try {
      const response = await api.post('/chauffeurs', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Récupérer tous les chauffeurs
  async getChauffeurs(filters = {}) {
    try {
      const response = await api.get('/chauffeurs', { params: filters });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Récupérer les chauffeurs disponibles
  async getChauffeursDisponibles() {
    try {
      const response = await api.get('/chauffeurs/disponibles');
      return response.data.data || [];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Récupérer un chauffeur spécifique
  async getChauffeur(id) {
    try {
      const response = await api.get(`/chauffeurs/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Mettre à jour un chauffeur
  async updateChauffeur(id, data) {
    try {
      const response = await api.put(`/chauffeurs/${id}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Supprimer (désactiver) un chauffeur
  async deleteChauffeur(id) {
    try {
      const response = await api.delete(`/chauffeurs/${id}`);
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

export default new ChauffeurService();