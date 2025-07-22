import api from './api';

class DashboardMagasinierService {
    // Récupérer les données du dashboard magasinier
    async getDashboardData() {
        try {
            const response = await api.get('/api/dashboard/magasinier');
            return response;
        } catch (error) {
            console.error('Erreur lors de la récupération du dashboard:', error);
            throw error;
        }
    }

    // Récupérer les statistiques détaillées
    async getStats(periode = 7) {
        try {
            const response = await api.get('/api/dashboard/magasinier/stats', {
                params: { periode }
            });
            return response;
        } catch (error) {
            console.error('Erreur lors de la récupération des stats:', error);
            throw error;
        }
    }
}

export default new DashboardMagasinierService();