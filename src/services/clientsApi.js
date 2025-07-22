// src/services/clientsApi.js
import api from './api';

class ClientsApiService {
    async getAllClients() {
        const response = await api.get('/clients');
        return response.data || [];
    }

    async getClientById(id) {
        const response = await api.get(`/clients/${id}`);
        return response.data;
    }

    async createClient(clientData) {
        const response = await api.post('/clients', clientData);
        return response.data;
    }

    async updateClient(id, clientData) {
        const response = await api.put(`/clients/${id}`, clientData);
        return response.data;
    }

    async deleteClient(id) {
        return await api.delete(`/clients/${id}`);
    }

    async searchClients(searchTerm) {
        return await api.get(`/clients/search?q=${searchTerm}`);
    }

    async getClientStats() {
        const response = await api.get('/clients/stats');
        return response.data;
    }

    async getClientCredit(id) {
        return await api.get(`/clients/${id}/credit`);
    }

    async updateClientCredit(id, creditData) {
        return await api.put(`/clients/${id}/credit`, creditData);
    }

    async getClientsStats() {
        const response = await api.get('/clients/stats');
        return response.data;
    }
}

export default new ClientsApiService();