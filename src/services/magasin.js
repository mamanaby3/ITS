import api from './api';

const magasinService = {
  // Get all magasins
  getAll: async () => {
    const response = await api.get('/magasins');
    return response.data;
  },

  // Alias pour getAll pour compatibilité
  getMagasins: async () => {
    const response = await api.get('/magasins');
    return response.data;
  },

  // Get magasin by ID
  getById: async (id) => {
    const response = await api.get(`/magasins/${id}`);
    return response.data;
  },

  // Create new magasin
  create: async (magasinData) => {
    const response = await api.post('/magasins', magasinData);
    return response.data;
  },

  // Update magasin
  update: async (id, magasinData) => {
    const response = await api.put(`/magasins/${id}`, magasinData);
    return response.data;
  },

  // Delete magasin
  delete: async (id) => {
    const response = await api.delete(`/magasins/${id}`);
    return response.data;
  },

  // Get magasin stock
  getStock: async (magasinId) => {
    const response = await api.get(`/magasins/${magasinId}/stock`);
    return response.data;
  },

  // Get magasin statistics
  getStats: async (magasinId) => {
    const response = await api.get(`/magasins/${magasinId}/stats`);
    return response.data;
  }
};

export default magasinService;