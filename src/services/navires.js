import api from './api';
import { API_ENDPOINTS } from '../config/api';

const naviresService = {
  // Récupérer tous les navires
  getAll: async (filters = {}) => {
    try {
      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (filters.magasin_id) params.append('magasin_id', filters.magasin_id);
      if (filters.produit_id) params.append('produit_id', filters.produit_id);
      if (filters.client_id) params.append('client_id', filters.client_id);
      
      const url = params.toString() 
        ? `${API_ENDPOINTS.NAVIRES.LIST}?${params.toString()}`
        : API_ENDPOINTS.NAVIRES.LIST;
        
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error('Erreur récupération navires:', error);
      throw error;
    }
  },

  // Créer une nouvelle réception de navire
  createReception: async (data) => {
    try {
      console.log('📤 Envoi réception navire - Données d\'origine:', data);
      
      // Formatter les données pour l'API
      const formattedData = {
        nomNavire: data.nomNavire,
        numeroIMO: data.numeroIMO,
        dateArrivee: data.dateArrivee,
        port: data.port,
        numeroConnaissement: data.numeroConnaissement || '',
        agentMaritime: data.agentMaritime || '',
        cargaison: data.cargaison.map(c => ({
          produit: c.produit,
          quantite: parseFloat(c.quantite),
          unite: c.unite || 'tonnes',
          origine: c.origine
        })),
        documentsVerifies: data.documentsVerifies,
        qualiteVerifiee: data.qualiteVerifiee,
        quantiteConfirmee: data.quantiteConfirmee,
        observations: data.observations || ''
      };

      console.log('📋 Données formatées pour l\'API:', formattedData);

      const response = await api.post(API_ENDPOINTS.NAVIRES.RECEPTION, formattedData);
      console.log('✅ Réponse reçue:', response);
      return response;
    } catch (error) {
      console.error('❌ Erreur création réception:', error);
      throw error;
    }
  },

  // Dispatcher la cargaison
  dispatchCargaison: async (navireId, distributions) => {
    try {
      const response = await api.post(API_ENDPOINTS.NAVIRES.DISPATCH(navireId), {
        distributions
      });
      return response;
    } catch (error) {
      console.error('Erreur dispatching:', error);
      throw error;
    }
  },

  // Récupérer les navires selon des critères
  getNavires: async (params = {}) => {
    try {
      const response = await api.get(API_ENDPOINTS.NAVIRES.LIST, params);
      return response;
    } catch (error) {
      console.error('Erreur récupération navires:', error);
      throw error;
    }
  },

  // Récupérer les dispatches en attente
  getDispatchesEnAttente: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.NAVIRES.DISPATCHES_EN_ATTENTE);
      return response;
    } catch (error) {
      console.error('Erreur récupération dispatches en attente:', error);
      throw error;
    }
  },

  // Récupérer les dispatches récents pour un magasin
  getDispatchesRecents: async (params = {}) => {
    try {
      const response = await api.get(API_ENDPOINTS.NAVIRES.DISPATCHES_RECENTS, params);
      return response;
    } catch (error) {
      console.error('Erreur récupération dispatches récents:', error);
      throw error;
    }
  },

  // Récupérer les rotations en transit
  getRotationsEnTransit: async (params = {}) => {
    try {
      const response = await api.get(API_ENDPOINTS.NAVIRES.ROTATIONS_EN_TRANSIT, params);
      return response;
    } catch (error) {
      console.error('Erreur récupération rotations:', error);
      throw error;
    }
  },

  // Récupérer les notifications
  getNotifications: async (params = {}) => {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.LIST, params);
      return response;
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      throw error;
    }
  },

  // Marquer une notification comme lue
  markNotificationAsRead: async (notificationId) => {
    try {
      const response = await api.put(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId));
      return response;
    } catch (error) {
      console.error('Erreur marquage notification:', error);
      throw error;
    }
  }
};

export default naviresService;