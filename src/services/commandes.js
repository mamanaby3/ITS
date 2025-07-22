import { MockApiService } from './mockApi';
import { generateId } from '../utils/helpers';

const mockAPI = new MockApiService();

const COMMANDES_KEY = 'its_commandes';
const COMMANDE_COUNTER_KEY = 'its_commande_counter';

// Charger les commandes depuis le localStorage
const loadCommandes = () => {
  try {
    const data = localStorage.getItem(COMMANDES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Erreur lors du chargement des commandes:', error);
    return [];
  }
};

// Sauvegarder les commandes dans le localStorage
const saveCommandes = (commandes) => {
  try {
    localStorage.setItem(COMMANDES_KEY, JSON.stringify(commandes));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des commandes:', error);
  }
};

// G�n�rer un num�ro de commande unique
const generateNumeroCommande = () => {
  let counter = parseInt(localStorage.getItem(COMMANDE_COUNTER_KEY) || '0');
  counter++;
  localStorage.setItem(COMMANDE_COUNTER_KEY, counter.toString());
  
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  return `CMD-${year}${month}-${String(counter).padStart(4, '0')}`;
};

// Calculer les totaux d'une commande
const calculerTotauxCommande = (lignes, tauxTva = 18) => {
  const sousTotal = lignes.reduce((sum, ligne) => {
    return sum + (ligne.quantite * ligne.prixUnitaire);
  }, 0);
  
  const montantTva = (sousTotal * tauxTva) / 100;
  const montantTotal = sousTotal + montantTva;
  
  return {
    sousTotal,
    montantTva,
    montantTotal
  };
};

const commandesService = {
  // R�cup�rer toutes les commandes
  async getAllCommandes() {
    return mockApi(async () => {
      const commandes = loadCommandes();
      return commandes.sort((a, b) => new Date(b.dateCommande) - new Date(a.dateCommande));
    });
  },

  // R�cup�rer une commande par ID
  async getCommandeById(id) {
    return mockApi(async () => {
      const commandes = loadCommandes();
      const commande = commandes.find(c => c.id === parseInt(id));
      
      if (!commande) {
        throw new Error('Commande non trouv�e');
      }
      
      return commande;
    });
  },

  // R�cup�rer les commandes d'un client
  async getCommandesByClient(clientId) {
    return mockApi(async () => {
      const commandes = loadCommandes();
      return commandes
        .filter(c => c.clientId === parseInt(clientId))
        .sort((a, b) => new Date(b.dateCommande) - new Date(a.dateCommande));
    });
  },

  // Cr�er une nouvelle commande
  async createCommande(commandeData) {
    return mockApi(async () => {
      const commandes = loadCommandes();
      
      // Valider les donn�es
      if (!commandeData.clientId) {
        throw new Error('Le client est obligatoire');
      }
      
      if (!commandeData.lignes || commandeData.lignes.length === 0) {
        throw new Error('La commande doit contenir au moins un article');
      }
      
      // Calculer les totaux
      const { sousTotal, montantTva, montantTotal } = calculerTotauxCommande(
        commandeData.lignes,
        commandeData.tauxTva
      );
      
      // Cr�er la nouvelle commande
      const nouvelleCommande = {
        id: generateId(),
        numero: generateNumeroCommande(),
        dateCommande: commandeData.dateCommande || new Date().toISOString(),
        clientId: parseInt(commandeData.clientId),
        lignes: commandeData.lignes.map(ligne => ({
          id: generateId(),
          produitId: parseInt(ligne.produitId),
          quantite: parseInt(ligne.quantite),
          prixUnitaire: parseFloat(ligne.prixUnitaire),
          total: parseInt(ligne.quantite) * parseFloat(ligne.prixUnitaire),
          observation: ligne.observation || ''
        })),
        sousTotal,
        tauxTva: commandeData.tauxTva || 18,
        montantTva,
        montantTotal,
        remise: commandeData.remise || 0,
        statut: 'brouillon',
        dateLivraisonPrevue: commandeData.dateLivraisonPrevue || null,
        adresseLivraison: commandeData.adresseLivraison || '',
        contactLivraison: commandeData.contactLivraison || '',
        telephoneLivraison: commandeData.telephoneLivraison || '',
        observation: commandeData.observation || '',
        utilisateurCreation: commandeData.utilisateur || 'Syst�me',
        dateCreation: new Date().toISOString(),
        dateModification: new Date().toISOString()
      };
      
      commandes.push(nouvelleCommande);
      saveCommandes(commandes);
      
      return nouvelleCommande;
    });
  },

  // Mettre � jour une commande
  async updateCommande(id, commandeData) {
    return mockApi(async () => {
      const commandes = loadCommandes();
      const index = commandes.findIndex(c => c.id === parseInt(id));
      
      if (index === -1) {
        throw new Error('Commande non trouv�e');
      }
      
      const commandeActuelle = commandes[index];
      
      // V�rifier que la commande est modifiable
      if (commandeActuelle.statut !== 'brouillon') {
        throw new Error('Seules les commandes en brouillon peuvent �tre modifi�es');
      }
      
      // Recalculer les totaux si les lignes ont chang�
      let totaux = {};
      if (commandeData.lignes) {
        totaux = calculerTotauxCommande(
          commandeData.lignes,
          commandeData.tauxTva || commandeActuelle.tauxTva
        );
      }
      
      // Mettre � jour la commande
      commandes[index] = {
        ...commandeActuelle,
        ...commandeData,
        ...totaux,
        lignes: commandeData.lignes ? commandeData.lignes.map(ligne => ({
          id: ligne.id || generateId(),
          produitId: parseInt(ligne.produitId),
          quantite: parseInt(ligne.quantite),
          prixUnitaire: parseFloat(ligne.prixUnitaire),
          total: parseInt(ligne.quantite) * parseFloat(ligne.prixUnitaire),
          observation: ligne.observation || ''
        })) : commandeActuelle.lignes,
        dateModification: new Date().toISOString()
      };
      
      saveCommandes(commandes);
      return commandes[index];
    });
  },

  // Valider une commande
  async validerCommande(id) {
    return mockApi(async () => {
      const commandes = loadCommandes();
      const index = commandes.findIndex(c => c.id === parseInt(id));
      
      if (index === -1) {
        throw new Error('Commande non trouv�e');
      }
      
      const commande = commandes[index];
      
      if (commande.statut !== 'brouillon') {
        throw new Error('Seules les commandes en brouillon peuvent �tre valid�es');
      }
      
      // TODO: V�rifier la disponibilit� du stock pour chaque ligne
      
      commandes[index] = {
        ...commande,
        statut: 'validee',
        dateValidation: new Date().toISOString(),
        dateModification: new Date().toISOString()
      };
      
      saveCommandes(commandes);
      return commandes[index];
    });
  },

  // Annuler une commande
  async annulerCommande(id, motif) {
    return mockApi(async () => {
      const commandes = loadCommandes();
      const index = commandes.findIndex(c => c.id === parseInt(id));
      
      if (index === -1) {
        throw new Error('Commande non trouv�e');
      }
      
      const commande = commandes[index];
      
      if (['livree', 'facturee', 'annulee'].includes(commande.statut)) {
        throw new Error('Cette commande ne peut pas �tre annul�e');
      }
      
      commandes[index] = {
        ...commande,
        statut: 'annulee',
        motifAnnulation: motif || 'Annulation par l\'utilisateur',
        dateAnnulation: new Date().toISOString(),
        dateModification: new Date().toISOString()
      };
      
      saveCommandes(commandes);
      return commandes[index];
    });
  },

  // Supprimer une commande
  async deleteCommande(id) {
    return mockApi(async () => {
      const commandes = loadCommandes();
      const index = commandes.findIndex(c => c.id === parseInt(id));
      
      if (index === -1) {
        throw new Error('Commande non trouv�e');
      }
      
      const commande = commandes[index];
      
      if (commande.statut !== 'brouillon') {
        throw new Error('Seules les commandes en brouillon peuvent �tre supprim�es');
      }
      
      commandes.splice(index, 1);
      saveCommandes(commandes);
      
      return { success: true };
    });
  },

  // R�cup�rer les statistiques des commandes
  async getCommandesStats() {
    return mockApi(async () => {
      const commandes = loadCommandes();
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      
      const stats = {
        total: commandes.length,
        brouillon: commandes.filter(c => c.statut === 'brouillon').length,
        validees: commandes.filter(c => c.statut === 'validee').length,
        enPreparation: commandes.filter(c => c.statut === 'en-preparation').length,
        livrees: commandes.filter(c => c.statut === 'livree').length,
        facturees: commandes.filter(c => c.statut === 'facturee').length,
        annulees: commandes.filter(c => c.statut === 'annulee').length,
        
        // Statistiques temporelles
        commandesAujourdhui: commandes.filter(c => {
          const dateCommande = new Date(c.dateCommande);
          return dateCommande.toDateString() === now.toDateString();
        }).length,
        
        commandesCetteSemaine: commandes.filter(c => {
          const dateCommande = new Date(c.dateCommande);
          return dateCommande >= startOfWeek;
        }).length,
        
        commandesCeMois: commandes.filter(c => {
          const dateCommande = new Date(c.dateCommande);
          return dateCommande >= startOfMonth;
        }).length,
        
        // Valeurs financi�res
        montantTotal: commandes
          .filter(c => c.statut !== 'annulee')
          .reduce((sum, c) => sum + c.montantTotal, 0),
        
        montantCeMois: commandes
          .filter(c => {
            const dateCommande = new Date(c.dateCommande);
            return dateCommande >= startOfMonth && c.statut !== 'annulee';
          })
          .reduce((sum, c) => sum + c.montantTotal, 0),
        
        // Top clients
        topClients: Object.entries(
          commandes
            .filter(c => c.statut !== 'annulee')
            .reduce((acc, c) => {
              acc[c.clientId] = (acc[c.clientId] || 0) + c.montantTotal;
              return acc;
            }, {})
        )
        .map(([clientId, montant]) => ({ clientId: parseInt(clientId), montant }))
        .sort((a, b) => b.montant - a.montant)
        .slice(0, 5)
      };
      
      return stats;
    });
  },

  // R�cup�rer les commandes r�centes
  async getCommandesRecentes(limit = 10) {
    return mockApi(async () => {
      const commandes = loadCommandes();
      return commandes
        .sort((a, b) => new Date(b.dateCommande) - new Date(a.dateCommande))
        .slice(0, limit);
    });
  },

  // Rechercher des commandes
  async searchCommandes(query) {
    return mockApi(async () => {
      const commandes = loadCommandes();
      const searchTerm = query.toLowerCase();
      
      return commandes.filter(c => 
        c.numero.toLowerCase().includes(searchTerm) ||
        c.observation.toLowerCase().includes(searchTerm) ||
        c.lignes.some(l => l.observation.toLowerCase().includes(searchTerm))
      );
    });
  },

  // Exporter les commandes
  async exportCommandes(format = 'csv', filters = {}) {
    return mockApi(async () => {
      let commandes = loadCommandes();
      
      // Appliquer les filtres
      if (filters.dateDebut) {
        commandes = commandes.filter(c => new Date(c.dateCommande) >= new Date(filters.dateDebut));
      }
      if (filters.dateFin) {
        commandes = commandes.filter(c => new Date(c.dateCommande) <= new Date(filters.dateFin));
      }
      if (filters.statut) {
        commandes = commandes.filter(c => c.statut === filters.statut);
      }
      if (filters.clientId) {
        commandes = commandes.filter(c => c.clientId === parseInt(filters.clientId));
      }
      
      if (format === 'csv') {
        // G�n�rer le CSV
        const headers = ['Num�ro', 'Date', 'Client', 'Montant HT', 'TVA', 'Montant TTC', 'Statut'];
        const rows = commandes.map(c => [
          c.numero,
          new Date(c.dateCommande).toLocaleDateString('fr-FR'),
          c.clientId, // TODO: R�cup�rer le nom du client
          c.sousTotal,
          c.montantTva,
          c.montantTotal,
          c.statut
        ]);
        
        return {
          data: [headers, ...rows],
          filename: `commandes_${new Date().toISOString().split('T')[0]}.csv`
        };
      }
      
      return commandes;
    });
  }
};

export { commandesService };
export default commandesService;