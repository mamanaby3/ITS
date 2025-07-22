// Mock API service pour le développement
// À remplacer par les vraies API en production

import { 
  ROLES, 
  PERMISSIONS, 
  PRODUIT_CATEGORIES, 
  TRANSACTION_TYPES,
  COMMANDE_STATUTS,
  LIVRAISON_STATUTS 
} from '../utils/constants';

// Données de magasins pour le mode mock
const mockMagasins = [
  { id: 'port', nom: 'Port de Dakar', ville: 'Dakar', zone: 'Port' },
  { id: 'menimur', nom: 'Ménimur', ville: 'Dakar', zone: 'Zone Industrielle' },
  { id: 'tobago', nom: 'Tobago', ville: 'Dakar', zone: 'Tobago' }
];

// Données de test pour ITS Sénégal
const mockUsers = [
  {
    id: 1,
    email: 'admin@its-senegal.com',
    password: 'admin123',
    nom: 'Administrateur',
    prenom: 'ITS',
    role: 'admin',
    permissions: ['all'],
    magasin_id: null,
    magasins: ['dkr-port', 'dkr-ind', 'thies', 'stl', 'kaol', 'zigui', 'tamb'],
    actif: true
  },
  {
    id: 99,
    email: 'test@test.com',
    password: 'test123',
    nom: 'Test',
    prenom: 'User',
    role: 'admin',
    permissions: ['all'],
    magasin_id: null,
    magasins: ['dkr-port'],
    actif: true
  },
  {
    id: 2,
    email: 'manager.dakar@its-senegal.com',
    password: 'manager123',
    nom: 'Diallo',
    prenom: 'Amadou',
    role: 'manager',
    permissions: ['stock.read', 'stock.update', 'stock.create', 'produits.read', 'produits.create', 'produits.update', 'clients.read', 'clients.create', 'clients.update', 'commandes.read', 'commandes.create', 'commandes.update'],
    magasin_id: null, // Responsable contrôle interne - voit tous les magasins
    magasins: ['dkr-port', 'dkr-ind', 'thies', 'stl', 'kaol', 'zigui', 'tamb'],
    actif: true
  },
  {
    id: 3,
    email: 'operator.port@its-senegal.com',
    password: 'operator123',
    nom: 'Ndiaye',
    prenom: 'Fatou',
    role: 'operator',
    permissions: ['stock.create', 'stock.read', 'stock.update', 'produits.read', 'clients.read', 'commandes.create', 'commandes.read', 'commandes.update'],
    magasin_id: 'dkr-port',
    magasins: ['dkr-port'],
    actif: true
  },
  {
    id: 4,
    email: 'delivery@its-senegal.com',
    password: 'delivery123',
    nom: 'Mbaye',
    prenom: 'Ousmane',
    role: 'delivery_manager',
    permissions: ['livraisons.create', 'livraisons.read', 'livraisons.update', 'camions.read'],
    magasin_id: null,
    magasins: ['dkr-port', 'dkr-ind', 'thies', 'stl', 'kaol', 'zigui', 'tamb'],
    actif: true
  },
  {
    id: 5,
    email: 'operator.thies@its-senegal.com',
    password: 'operator123',
    nom: 'Sarr',
    prenom: 'Ibrahima',
    role: 'operator',
    permissions: ['stock.create', 'stock.read', 'stock.update'],
    magasin_id: 'thies',
    magasins: ['thies'],
    actif: true
  }
];

const mockProduits = [
  {
    id: 1,
    reference: 'MAIS-001',
    nom: 'Maïs jaune',
    categorie: 'Céréales',
    unite: 'Tonne',
    prixUnitaire: 180000,
    seuilAlerte: 50,
    description: 'Maïs jaune importé de qualité supérieure',
    actif: true
  },
  {
    id: 2,
    reference: 'SOJA-001',
    nom: 'Soja',
    categorie: 'Légumineuses',
    unite: 'Tonne',
    prixUnitaire: 250000,
    seuilAlerte: 30,
    description: 'Soja pour alimentation animale',
    actif: true
  },
  {
    id: 3,
    reference: 'BLE-001',
    nom: 'Blé tendre',
    categorie: 'Céréales',
    unite: 'Tonne',
    prixUnitaire: 200000,
    seuilAlerte: 100,
    description: 'Blé tendre pour meunerie',
    actif: true
  },
  {
    id: 4,
    reference: 'SON-001',
    nom: 'Son de blé',
    categorie: 'Aliments pour bétail',
    unite: 'Tonne',
    prixUnitaire: 120000,
    seuilAlerte: 40,
    description: 'Son de blé pour alimentation animale',
    actif: true
  }
];

const mockStock = [
  {
    id: 1,
    produitId: 1,
    magasin_id: 'dkr-port',
    entrepotId: 'dkr-port', // Alias pour compatibilité
    quantite: 250,
    lotNumber: 'LOT-2024-001',
    dateEntree: '2024-01-15',
    dateExpiration: '2025-01-15',
    emplacement: 'A1-01'
  },
  {
    id: 2,
    produitId: 2,
    magasin_id: 'dkr-port',
    entrepotId: 'dkr-port',
    quantite: 150,
    lotNumber: 'LOT-2024-002',
    dateEntree: '2024-01-20',
    dateExpiration: '2025-01-20',
    emplacement: 'B2-05'
  },
  {
    id: 3,
    produitId: 3,
    magasin_id: 'dkr-ind',
    entrepotId: 'dkr-ind',
    quantite: 500,
    lotNumber: 'LOT-2024-003',
    dateEntree: '2024-02-01',
    dateExpiration: '2025-02-01',
    emplacement: 'C1-03'
  },
  {
    id: 4,
    produitId: 4,
    magasin_id: 'thies',
    entrepotId: 'thies',
    quantite: 80,
    lotNumber: 'LOT-2024-004',
    dateEntree: '2024-02-10',
    dateExpiration: '2024-08-10',
    emplacement: 'D3-02'
  },
  {
    id: 5,
    produitId: 1,
    magasin_id: 'stl',
    entrepotId: 'stl',
    quantite: 180,
    lotNumber: 'LOT-2024-005',
    dateEntree: '2024-02-15',
    dateExpiration: '2025-02-15',
    emplacement: 'A2-01'
  },
  {
    id: 6,
    produitId: 2,
    magasin_id: 'kaol',
    entrepotId: 'kaol',
    quantite: 120,
    lotNumber: 'LOT-2024-006',
    dateEntree: '2024-02-20',
    dateExpiration: '2025-02-20',
    emplacement: 'B1-03'
  }
];

const mockClients = [
  {
    id: 1,
    code: 'CLI-001',
    nom: 'SENEGAL AVICOLE',
    email: 'contact@senegal-avicole.sn',
    telephone: '+221 33 123 45 67',
    adresse: 'Zone Industrielle, Dakar',
    ville: 'Dakar',
    pays: 'Sénégal',
    creditLimit: 50000000,
    creditUtilise: 15000000,
    actif: true
  },
  {
    id: 2,
    code: 'CLI-002',
    nom: 'FERME MODERNE SARL',
    email: 'info@ferme-moderne.sn',
    telephone: '+221 33 234 56 78',
    adresse: 'Route de Rufisque, Km 15',
    ville: 'Rufisque',
    pays: 'Sénégal',
    creditLimit: 30000000,
    creditUtilise: 8000000,
    actif: true
  },
  {
    id: 3,
    code: 'CLI-003',
    nom: 'ELEVAGE DU SAHEL',
    email: 'contact@elevage-sahel.sn',
    telephone: '+221 33 345 67 89',
    adresse: 'Route de Saint-Louis',
    ville: 'Louga',
    pays: 'Sénégal',
    creditLimit: 25000000,
    creditUtilise: 5000000,
    actif: true
  }
];

const mockTransactions = [
  {
    id: 1,
    type: TRANSACTION_TYPES.ENTREE,
    produitId: 1,
    quantite: 250,
    entrepotId: 'dkr-port',
    magasin_id: 'dkr-port',
    date: '2024-01-15',
    reference: 'REC-2024-001',
    fournisseur: 'Import Global Trading',
    numeroLot: 'LOT-2024-001',
    userId: 3,
    notes: 'Réception navire AFRICAN EAGLE'
  },
  {
    id: 2,
    type: TRANSACTION_TYPES.SORTIE,
    produitId: 1,
    quantite: 50,
    entrepotId: 'dkr-port',
    magasin_id: 'dkr-port',
    date: '2024-01-20',
    reference: 'OUT-2024-001',
    clientId: 1,
    numeroCommande: 'CMD-2024-001',
    userId: 3,
    notes: 'Livraison partielle'
  },
  {
    id: 3,
    type: TRANSACTION_TYPES.TRANSFERT,
    produitId: 3,
    quantite: 100,
    entrepotSource: 'dkr-ind',
    entrepotDestination: 'dkr-port',
    magasin_source_id: 'dkr-ind',
    magasin_destination_id: 'dkr-port',
    date: '2024-02-05',
    reference: 'TRF-2024-001',
    userId: 2,
    notes: 'Transfert pour commande urgente'
  }
];

// Service Mock API
class MockApiService {
  // Helper methods for localStorage collections
  static getCollection(collectionName) {
    try {
      const data = localStorage.getItem(collectionName);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Erreur lors de la lecture de ${collectionName}:`, error);
      return null;
    }
  }

  static setCollection(collectionName, data) {
    try {
      localStorage.setItem(collectionName, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Erreur lors de l'écriture de ${collectionName}:`, error);
      return false;
    }
  }

  // Authentification
  static async login(credentials) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = mockUsers.find(
          u => u.email === credentials.email && u.password === credentials.password
        );
        
        if (user) {
          const { password, ...userWithoutPassword } = user;
          const token = btoa(JSON.stringify({ userId: user.id, role: user.role }));
          resolve({
            user: userWithoutPassword,
            token
          });
        } else {
          reject(new Error('Email ou mot de passe incorrect'));
        }
      }, 500);
    });
  }

  static async validateToken(token) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const payload = JSON.parse(atob(token));
          const user = mockUsers.find(u => u.id === payload.userId);
          if (user) {
            const { password, ...userWithoutPassword } = user;
            resolve(userWithoutPassword);
          } else {
            reject(new Error('Token invalide'));
          }
        } catch (error) {
          reject(new Error('Token invalide'));
        }
      }, 200);
    });
  }

  // Produits
  static async getProduits() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockProduits);
      }, 300);
    });
  }

  static async createProduit(produit) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newProduit = {
          ...produit,
          id: mockProduits.length + 1,
          actif: true
        };
        mockProduits.push(newProduit);
        resolve(newProduit);
      }, 300);
    });
  }

  static async updateProduit(id, updates) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockProduits.findIndex(p => p.id === id);
        if (index !== -1) {
          mockProduits[index] = { ...mockProduits[index], ...updates };
          resolve(mockProduits[index]);
        } else {
          reject(new Error('Produit non trouvé'));
        }
      }, 300);
    });
  }

  // Stock
  static async getStock(filters = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let result = [...mockStock];
        
        if (filters.entrepotId) {
          result = result.filter(s => s.entrepotId === filters.entrepotId);
        }
        
        if (filters.magasin_id) {
          result = result.filter(s => s.magasin_id === filters.magasin_id);
        }
        
        if (filters.produitId) {
          result = result.filter(s => s.produitId === filters.produitId);
        }

        // Enrichir avec les données produits et magasins
        result = result.map(stock => ({
          ...stock,
          produit: mockProduits.find(p => p.id === stock.produitId),
          entrepot: mockMagasins.find(m => m.id === stock.magasin_id),
          magasin: mockMagasins.find(m => m.id === stock.magasin_id)
        }));

        resolve(result);
      }, 300);
    });
  }

  static async addStock(stockData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newStock = {
          ...stockData,
          id: mockStock.length + 1,
          entrepotId: stockData.magasin_id || stockData.entrepotId, // Compatibilité
          dateEntree: new Date().toISOString().split('T')[0]
        };
        mockStock.push(newStock);

        // Ajouter la transaction
        const transaction = {
          id: mockTransactions.length + 1,
          type: TRANSACTION_TYPES.ENTREE,
          produitId: stockData.produitId,
          quantite: stockData.quantite,
          entrepotId: stockData.magasin_id || stockData.entrepotId,
          magasin_id: stockData.magasin_id || stockData.entrepotId,
          date: newStock.dateEntree,
          reference: `REC-${new Date().getFullYear()}-${String(mockTransactions.length + 1).padStart(3, '0')}`,
          numeroLot: stockData.lotNumber,
          userId: 1, // Mock user ID
          notes: stockData.notes || ''
        };
        mockTransactions.push(transaction);

        resolve(newStock);
      }, 300);
    });
  }

  static async removeStock(stockId, quantite, raison) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const stock = mockStock.find(s => s.id === stockId);
        if (!stock) {
          reject(new Error('Stock non trouvé'));
          return;
        }

        if (stock.quantite < quantite) {
          reject(new Error('Quantité insuffisante'));
          return;
        }

        stock.quantite -= quantite;

        // Ajouter la transaction
        const transaction = {
          id: mockTransactions.length + 1,
          type: TRANSACTION_TYPES.SORTIE,
          produitId: stock.produitId,
          quantite: quantite,
          entrepotId: stock.entrepotId,
          date: new Date().toISOString().split('T')[0],
          reference: `OUT-${new Date().getFullYear()}-${String(mockTransactions.length + 1).padStart(3, '0')}`,
          userId: 1, // Mock user ID
          notes: raison
        };
        mockTransactions.push(transaction);

        resolve({ stock, transaction });
      }, 300);
    });
  }

  // Clients
  static async getClients() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockClients);
      }, 300);
    });
  }

  static async createClient(client) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newClient = {
          ...client,
          id: mockClients.length + 1,
          code: `CLI-${String(mockClients.length + 1).padStart(3, '0')}`,
          creditUtilise: 0,
          actif: true
        };
        mockClients.push(newClient);
        resolve(newClient);
      }, 300);
    });
  }

  // Mouvements/Transactions
  static async getTransactions(filters = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let result = [...mockTransactions];

        if (filters.type) {
          result = result.filter(t => t.type === filters.type);
        }

        if (filters.magasin_id) {
          result = result.filter(t => t.magasin_id === filters.magasin_id);
        }

        if (filters.dateDebut) {
          result = result.filter(t => new Date(t.date) >= new Date(filters.dateDebut));
        }

        if (filters.dateFin) {
          result = result.filter(t => new Date(t.date) <= new Date(filters.dateFin));
        }

        // Enrichir avec les données
        result = result.map(transaction => ({
          ...transaction,
          produit: mockProduits.find(p => p.id === transaction.produitId),
          entrepot: mockMagasins.find(m => m.id === transaction.magasin_id),
          magasin: mockMagasins.find(m => m.id === transaction.magasin_id),
          client: transaction.clientId ? mockClients.find(c => c.id === transaction.clientId) : null,
          user: mockUsers.find(u => u.id === transaction.userId)
        }));

        resolve(result.sort((a, b) => new Date(b.date) - new Date(a.date)));
      }, 300);
    });
  }

  // Dashboard Stats
  static async getDashboardStats() {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Calculer les statistiques
        const totalProduits = mockProduits.filter(p => p.actif).length;
        const totalClients = mockClients.filter(c => c.actif).length;
        
        // Stock total par produit
        const stockParProduit = mockProduits.map(produit => {
          const stocks = mockStock.filter(s => s.produitId === produit.id);
          const quantiteTotale = stocks.reduce((sum, s) => sum + s.quantite, 0);
          return {
            produit,
            quantiteTotale,
            valeur: quantiteTotale * produit.prixUnitaire,
            alerte: quantiteTotale <= produit.seuilAlerte
          };
        });

        const valeurTotaleStock = stockParProduit.reduce((sum, s) => sum + s.valeur, 0);
        const produitsEnAlerte = stockParProduit.filter(s => s.alerte).length;

        // Transactions récentes
        const transactionsRecentes = mockTransactions
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 10);

        // Mouvements par jour (30 derniers jours)
        const mouvementsParJour = [];
        for (let i = 0; i < 30; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const entrees = mockTransactions.filter(
            t => t.type === TRANSACTION_TYPES.ENTREE && t.date === dateStr
          ).reduce((sum, t) => sum + t.quantite, 0);
          
          const sorties = mockTransactions.filter(
            t => t.type === TRANSACTION_TYPES.SORTIE && t.date === dateStr
          ).reduce((sum, t) => sum + t.quantite, 0);

          mouvementsParJour.push({
            date: dateStr,
            entrees,
            sorties
          });
        }

        resolve({
          totalProduits,
          totalClients,
          valeurTotaleStock,
          produitsEnAlerte,
          stockParProduit,
          transactionsRecentes,
          mouvementsParJour: mouvementsParJour.reverse()
        });
      }, 500);
    });
  }

  // Gestion des navires
  static navires = {
    getAll: () => {
      return new Promise((resolve) => {
        const navires = localStorage.getItem('mockNavires') || '[]';
        setTimeout(() => {
          resolve({
            success: true,
            data: JSON.parse(navires)
          });
        }, 300);
      });
    },

    createReception: (data) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            // Récupérer les navires existants
            const navires = JSON.parse(localStorage.getItem('mockNavires') || '[]');
            
            // Créer le nouveau navire
            const newNavire = {
              id: navires.length + 1,
              nom_navire: data.nomNavire,
              numero_imo: data.numeroIMO,
              date_arrivee: data.dateArrivee,
              port: data.port,
              statut: 'receptionne',
              numero_connaissement: data.numeroConnaissement,
              agent_maritime: data.agentMaritime,
              date_reception: new Date().toISOString(),
              reception_nom: 'Test',
              reception_prenom: 'User',
              observations: data.observations,
              cargaison: data.cargaison.map((c, index) => ({
                id: index + 1,
                produit_id: index + 1,
                produit_nom: c.produit,
                quantite: parseFloat(c.quantite),
                unite: c.unite,
                origine: c.origine
              })),
              dispatching: []
            };
            
            // Ajouter à la liste
            navires.push(newNavire);
            localStorage.setItem('mockNavires', JSON.stringify(navires));
            
            resolve({
              success: true,
              data: newNavire,
              message: 'Navire réceptionné avec succès'
            });
          } catch (error) {
            reject({
              response: {
                data: {
                  error: 'Erreur lors de la réception du navire'
                }
              }
            });
          }
        }, 500);
      });
    },

    dispatchCargaison: (navireId, distributions) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            const navires = JSON.parse(localStorage.getItem('mockNavires') || '[]');
            const navireIndex = navires.findIndex(n => n.id === parseInt(navireId));
            
            if (navireIndex === -1) {
              reject({
                response: {
                  data: {
                    error: 'Navire non trouvé'
                  }
                }
              });
              return;
            }
            
            // Mettre à jour le statut et ajouter le dispatching
            navires[navireIndex].statut = 'dispatche';
            navires[navireIndex].dispatching = distributions.flatMap(dist => 
              dist.dispatches.map(d => ({
                magasin: mockMagasins.find(m => m.id === d.magasinId)?.nom || d.magasinId,
                quantite: d.quantite,
                produit: dist.produitId
              }))
            );
            
            localStorage.setItem('mockNavires', JSON.stringify(navires));
            
            resolve({
              success: true,
              data: navires[navireIndex],
              message: 'Cargaison dispatchée avec succès'
            });
          } catch (error) {
            reject({
              response: {
                data: {
                  error: 'Erreur lors du dispatching'
                }
              }
            });
          }
        }, 500);
      });
    }
  }

  // Magasins
  static magasins = {
    getAll: async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            data: mockMagasins
          });
        }, 300);
      });
    },

    getById: async (id) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const magasin = mockMagasins.find(m => m.id === id);
          if (magasin) {
            resolve({
              success: true,
              data: magasin
            });
          } else {
            reject({
              response: {
                data: {
                  error: 'Magasin non trouvé'
                }
              }
            });
          }
        }, 300);
      });
    },

    getStock: async (id) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const stock = mockStock.filter(s => s.magasin_id === id);
          resolve({
            success: true,
            data: stock
          });
        }, 300);
      });
    },

    create: async (data) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const newMagasin = {
            ...data,
            id: data.id || `mag-${Date.now()}`
          };
          mockMagasins.push(newMagasin);
          resolve({
            success: true,
            data: newMagasin
          });
        }, 300);
      });
    },

    update: async (id, data) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const index = mockMagasins.findIndex(m => m.id === id);
          if (index !== -1) {
            mockMagasins[index] = { ...mockMagasins[index], ...data };
            resolve({
              success: true,
              data: mockMagasins[index]
            });
          } else {
            reject({
              response: {
                data: {
                  error: 'Magasin non trouvé'
                }
              }
            });
          }
        }, 300);
      });
    },

    delete: async (id) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const index = mockMagasins.findIndex(m => m.id === id);
          if (index !== -1) {
            mockMagasins.splice(index, 1);
            resolve({
              success: true,
              message: 'Magasin supprimé avec succès'
            });
          } else {
            reject({
              response: {
                data: {
                  error: 'Magasin non trouvé'
                }
              }
            });
          }
        }, 300);
      });
    },

    getStats: async (magasinId) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const stockMagasin = mockStock.filter(s => s.magasin_id === magasinId);
          const stats = {
            totalProduits: stockMagasin.length,
            totalQuantite: stockMagasin.reduce((sum, s) => sum + s.quantite, 0),
            valeurTotale: stockMagasin.reduce((sum, s) => sum + (s.quantite * (s.prixUnitaire || 0)), 0)
          };
          resolve({
            success: true,
            data: stats
          });
        }, 300);
      });
    }
  }
}

export { MockApiService };
export default MockApiService;