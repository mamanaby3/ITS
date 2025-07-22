// src/services/clients.js
import { MockApiService } from './mockApi';

const mockAPI = new MockApiService();

class ClientsService {
    constructor() {
        this.collection = 'its_clients';
    }

    // Récupérer tous les clients
    async getAllClients() {
        return await mockAPI.getClients();
    }

    // Récupérer un client par ID
    async getClientById(id) {
        const clients = await mockAPI.getClients();
        const client = clients.find(c => c.id === parseInt(id));
        if (!client) {
            throw new Error('Client non trouvé');
        }
        return client;
    }

    // Créer un nouveau client
    async createClient(clientData) {
        // Validation des données
        this.validateClient(clientData);

        // Vérifier l'unicité de l'email
        const existingClients = await this.getAllClients();
        const emailExists = existingClients.some(c =>
            c.email && clientData.email &&
            c.email.toLowerCase() === clientData.email.toLowerCase()
        );

        if (emailExists) {
            throw new Error('Cette adresse email existe déjà');
        }

        // Générer un code client unique
        const codeClient = await this.generateCodeClient();

        return await mockAPI.ajouterClient({
            ...clientData,
            codeClient,
            dateCreation: new Date().toISOString(),
            status: 'actif',
            totalCommandes: 0,
            totalAchats: 0,
            derniereCommande: null
        });
    }

    // Mettre à jour un client
    async updateClient(id, clientData) {
        this.validateClient(clientData);

        // Vérifier l'unicité de l'email (exclure le client actuel)
        const existingClients = await this.getAllClients();
        const emailExists = existingClients.some(c =>
            c.id !== parseInt(id) &&
            c.email && clientData.email &&
            c.email.toLowerCase() === clientData.email.toLowerCase()
        );

        if (emailExists) {
            throw new Error('Cette adresse email existe déjà');
        }

        return await mockAPI.modifierClient(id, clientData);
    }

    // Supprimer un client
    async deleteClient(id) {
        // Vérifier si le client a des commandes
        // (Cette vérification sera implémentée quand le module commandes sera créé)
        // Au lieu de supprimer, on désactive le client
        return await mockAPI.modifierClient(id, { status: 'inactif' });
    }

    // Rechercher des clients
    async searchClients(query) {
        const clients = await this.getAllClients();
        const searchTerm = query.toLowerCase();

        return clients.filter(client =>
            client.nom.toLowerCase().includes(searchTerm) ||
            client.contact.toLowerCase().includes(searchTerm) ||
            client.telephone.toLowerCase().includes(searchTerm) ||
            (client.email && client.email.toLowerCase().includes(searchTerm)) ||
            (client.codeClient && client.codeClient.toLowerCase().includes(searchTerm)) ||
            (client.adresse && client.adresse.toLowerCase().includes(searchTerm))
        );
    }

    // Filtrer par type
    async filterByType(type) {
        const clients = await this.getAllClients();
        return clients.filter(client => client.type === type);
    }

    // Filtrer par statut
    async filterByStatus(status) {
        const clients = await this.getAllClients();
        return clients.filter(client => client.status === status);
    }

    // Générer un code client unique
    async generateCodeClient() {
        const clients = await this.getAllClients();
        const year = new Date().getFullYear().toString().slice(-2);
        let numero = 1;

        // Trouver le prochain numéro disponible
        const existingCodes = clients
            .map(c => c.codeClient)
            .filter(code => code && code.startsWith(`CLI${year}`))
            .map(code => parseInt(code.slice(-4)))
            .filter(num => !isNaN(num));

        if (existingCodes.length > 0) {
            numero = Math.max(...existingCodes) + 1;
        }

        return `CLI${year}${numero.toString().padStart(4, '0')}`;
    }

    // Validation des données client
    validateClient(client) {
        const errors = [];

        if (!client.nom || client.nom.trim().length < 2) {
            errors.push('Le nom doit contenir au moins 2 caractères');
        }

        if (!client.contact || client.contact.trim().length < 2) {
            errors.push('Le nom du contact doit contenir au moins 2 caractères');
        }

        if (!client.telephone || client.telephone.trim().length < 8) {
            errors.push('Le numéro de téléphone doit contenir au moins 8 caractères');
        }

        if (client.email && !this.isValidEmail(client.email)) {
            errors.push('L\'adresse email n\'est pas valide');
        }

        if (!client.type || !['particulier', 'entreprise', 'administration'].includes(client.type)) {
            errors.push('Le type de client doit être spécifié');
        }

        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
    }

    // Validation email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Statistiques des clients
    async getClientsStats() {
        const clients = await this.getAllClients();

        const stats = {
            total: clients.length,
            actifs: clients.filter(c => c.status === 'actif').length,
            inactifs: clients.filter(c => c.status === 'inactif').length,
            particuliers: clients.filter(c => c.type === 'particulier').length,
            entreprises: clients.filter(c => c.type === 'entreprise').length,
            administrations: clients.filter(c => c.type === 'administration').length,
            nouveauxCeMois: 0,
            topClients: []
        };

        // Calculer les nouveaux clients ce mois
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);

        stats.nouveauxCeMois = clients.filter(c =>
            new Date(c.dateCreation) >= thisMonth
        ).length;

        // Top clients par montant d'achats (sera implémenté avec le module commandes)
        stats.topClients = clients
            .sort((a, b) => (b.totalAchats || 0) - (a.totalAchats || 0))
            .slice(0, 5);

        return stats;
    }

    // Mettre à jour les statistiques d'un client (appelé depuis le module commandes)
    async updateClientStats(clientId, commande) {
        const client = await this.getClientById(clientId);
        if (client) {
            await this.updateClient(clientId, {
                totalCommandes: (client.totalCommandes || 0) + 1,
                totalAchats: (client.totalAchats || 0) + (commande.montant || 0),
                derniereCommande: commande.date || new Date().toISOString()
            });
        }
    }

    // Obtenir l'historique d'un client (sera enrichi avec le module commandes)
    async getClientHistory(clientId) {
        const client = await this.getClientById(clientId);
        if (!client) {
            throw new Error('Client non trouvé');
        }

        // Pour l'instant, on retourne les données de base
        // Sera enrichi avec les commandes, factures, etc.
        return {
            client,
            commandes: [], // À implémenter
            factures: [], // À implémenter
            paiements: [] // À implémenter
        };
    }

    // Exporter les clients en CSV
    async exportClients(filters = {}) {
        let clients = await this.getAllClients();

        // Appliquer les filtres si nécessaire
        if (filters.type) {
            clients = clients.filter(c => c.type === filters.type);
        }
        if (filters.status) {
            clients = clients.filter(c => c.status === filters.status);
        }

        // Préparer les données CSV
        const csvData = clients.map(client => ({
            'Code Client': client.codeClient,
            'Nom': client.nom,
            'Contact': client.contact,
            'Type': client.type,
            'Téléphone': client.telephone,
            'Email': client.email || '',
            'Adresse': client.adresse || '',
            'Statut': client.status,
            'Date de création': new Date(client.dateCreation).toLocaleDateString('fr-FR'),
            'Total Commandes': client.totalCommandes || 0,
            'Total Achats': client.totalAchats || 0
        }));

        return csvData;
    }
}

const clientsService = new ClientsService();
export { clientsService };
export default clientsService;