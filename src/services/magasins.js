import api from './api';
import { USE_MOCK_API } from '../utils/constants';
import MockApiService from './mockApi';

const magasinsService = {
  // Récupérer tous les magasins
  getAll: async () => {
    try {
      if (USE_MOCK_API) {
        return await MockApiService.magasins.getAll();
      }
      const response = await api.get('/api/magasins');
      return response.data || response || [];
    } catch (error) {
      console.error('Erreur récupération magasins:', error);
      throw error;
    }
  },

  // Récupérer un magasin par ID
  getById: async (id) => {
    try {
      if (USE_MOCK_API) {
        return await MockApiService.magasins.getById(id);
      }
      const response = await api.get(`/api/magasins/${id}`);
      return response.data || response;
    } catch (error) {
      console.error('Erreur récupération magasin:', error);
      throw error;
    }
  },

  // Récupérer le stock d'un magasin
  getStock: async (id) => {
    try {
      if (USE_MOCK_API) {
        return await MockApiService.magasins.getStock(id);
      }
      const response = await api.get(`/api/magasins/${id}/stock`);
      return response.data || response || [];
    } catch (error) {
      console.error('Erreur récupération stock magasin:', error);
      throw error;
    }
  },

  // Créer un magasin
  create: async (data) => {
    try {
      if (USE_MOCK_API) {
        return await MockApiService.magasins.create(data);
      }
      const response = await api.post('/magasins', data);
      return response;
    } catch (error) {
      console.error('Erreur création magasin:', error);
      throw error;
    }
  },

  // Mettre à jour un magasin
  update: async (id, data) => {
    try {
      if (USE_MOCK_API) {
        return await MockApiService.magasins.update(id, data);
      }
      const response = await api.put(`/magasins/${id}`, data);
      return response;
    } catch (error) {
      console.error('Erreur mise à jour magasin:', error);
      throw error;
    }
  },

  // Supprimer un magasin
  delete: async (id) => {
    try {
      if (USE_MOCK_API) {
        return await MockApiService.magasins.delete(id);
      }
      const response = await api.delete(`/magasins/${id}`);
      return response;
    } catch (error) {
      console.error('Erreur suppression magasin:', error);
      throw error;
    }
  },

  // Récupérer les statistiques d'un magasin
  getStats: async (magasinId) => {
    try {
      if (USE_MOCK_API) {
        return await MockApiService.magasins.getStats(magasinId);
      }
      const response = await api.get(`/magasins/${magasinId}/stats`);
      return response.data || response;
    } catch (error) {
      console.error('Erreur récupération stats magasin:', error);
      throw error;
    }
  }
};

export default magasinsService;