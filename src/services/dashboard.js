import api from './api';
import { API_ENDPOINTS } from '../config/api';

const dashboardService = {
  // Récupérer les statistiques du dashboard
  getStats: async (params = {}) => {
    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.STATS, params);
      return response;
    } catch (error) {
      console.error('Erreur récupération stats:', error);
      throw error;
    }
  },

  // Récupérer le total réceptionné depuis la table navires
  getTotalReceptionne: async (params = {}) => {
    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.TOTAL_RECEPTIONNE, params);
      return response;
    } catch (error) {
      console.error('Erreur récupération total réceptionné:', error);
      throw error;
    }
  },

  // Récupérer les activités récentes
  getActivities: async (params = {}) => {
    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.ACTIVITIES, params);
      return response;
    } catch (error) {
      console.error('Erreur récupération activités:', error);
      throw error;
    }
  }
};

export default dashboardService;