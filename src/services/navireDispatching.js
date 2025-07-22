import api from './api';

const navireDispatchingService = {
  // Récupérer les dispatches en attente
  async getDispatchesEnAttente() {
    const response = await api.get('/navire-dispatching/en-attente');
    return response.data;
  },

  // Réceptionner un dispatch
  async receptionnerDispatch(dispatchId, data) {
    const response = await api.post(`/navire-dispatching/${dispatchId}/receptionner`, data);
    return response.data;
  },

  // Récupérer l'historique des réceptions
  async getHistoriqueReceptions(filters = {}) {
    const params = new URLSearchParams();
    if (filters.date_debut) params.append('date_debut', filters.date_debut);
    if (filters.date_fin) params.append('date_fin', filters.date_fin);
    
    const response = await api.get(`/navire-dispatching/historique?${params}`);
    return response.data;
  },

  // Récupérer le rapport des écarts (managers seulement)
  async getRapportEcarts(filters = {}) {
    const params = new URLSearchParams();
    if (filters.date_debut) params.append('date_debut', filters.date_debut);
    if (filters.date_fin) params.append('date_fin', filters.date_fin);
    if (filters.magasin_id) params.append('magasin_id', filters.magasin_id);
    
    const response = await api.get(`/navire-dispatching/ecarts?${params}`);
    return response.data;
  },

  // Récupérer le stock du magasin depuis navire_dispatching
  async getStockMagasin(magasinId = null) {
    const params = magasinId ? `?magasin_id=${magasinId}` : '';
    const response = await api.get(`/navire-dispatching/stock-magasin${params}`);
    return response.data;
  }
};

export default navireDispatchingService;