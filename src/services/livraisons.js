// src/services/livraisons.js
import { MockApiService } from './mockApi';
import { generateId } from '../utils/helpers';

const mockAPI = new MockApiService();

class LivraisonsService {
    constructor() {
        this.livraisonsKey = 'its_livraisons';
        this.loadInitialData();
    }

    // Charger les données initiales si nécessaire
    loadInitialData() {
        if (!localStorage.getItem(this.livraisonsKey)) {
            localStorage.setItem(this.livraisonsKey, JSON.stringify([]));
        }
    }

    // Récupérer toutes les livraisons
    async getAllLivraisons() {
        try {
            const livraisons = JSON.parse(localStorage.getItem(this.livraisonsKey) || '[]');
            
            // Enrichir avec les données des commandes et clients
            const commandes = await mockAPI.getCommandes();
            const clients = await mockAPI.getClients();
            
            return livraisons.map(livraison => {
                const commande = commandes.find(c => c.id === livraison.commandeId);
                const client = clients.find(c => c.id === livraison.clientId);
                
                return {
                    ...livraison,
                    commande,
                    client,
                    clientNom: client?.nom || 'Client inconnu',
                    numeroCommande: commande?.numero || 'N/A'
                };
            }).sort((a, b) => new Date(b.dateLivraison) - new Date(a.dateLivraison));
        } catch (error) {
            console.error('Erreur récupération livraisons:', error);
            throw error;
        }
    }

    // Récupérer une livraison par ID
    async getLivraisonById(id) {
        const livraisons = await this.getAllLivraisons();
        const livraison = livraisons.find(l => l.id === parseInt(id));
        
        if (!livraison) {
            throw new Error('Livraison non trouvée');
        }
        
        return livraison;
    }

    // Créer une nouvelle livraison
    async createLivraison(livraisonData) {
        try {
            this.validateLivraison(livraisonData);
            
            // Vérifier que la commande existe et est prête
            const commandes = await mockAPI.getCommandes();
            const commande = commandes.find(c => c.id === parseInt(livraisonData.commandeId));
            
            if (!commande) {
                throw new Error('Commande non trouvée');
            }
            
            if (!['prete', 'confirmee'].includes(commande.statut)) {
                throw new Error('La commande doit être confirmée ou prête pour être livrée');
            }
            
            const nouvelleLivraison = {
                id: generateId(),
                numero: this.generateNumeroLivraison(),
                commandeId: parseInt(livraisonData.commandeId),
                clientId: commande.clientId,
                dateLivraison: livraisonData.dateLivraison || new Date().toISOString(),
                dateLivraisonPrevue: livraisonData.dateLivraisonPrevue,
                statut: 'programmee',
                transporteur: livraisonData.transporteur || '',
                numeroTracking: livraisonData.numeroTracking || '',
                adresseLivraison: livraisonData.adresseLivraison || commande.adresseLivraison || '',
                contactLivraison: livraisonData.contactLivraison || commande.contactLivraison || '',
                telephoneLivraison: livraisonData.telephoneLivraison || commande.telephoneLivraison || '',
                articles: commande.articles || commande.lignes || [],
                montantTotal: commande.montantTotal,
                fraisLivraison: livraisonData.fraisLivraison || 0,
                observation: livraisonData.observation || '',
                dateCreation: new Date().toISOString(),
                utilisateurCreation: livraisonData.utilisateur || 'Système'
            };
            
            // Sauvegarder la livraison
            const livraisons = JSON.parse(localStorage.getItem(this.livraisonsKey) || '[]');
            livraisons.push(nouvelleLivraison);
            localStorage.setItem(this.livraisonsKey, JSON.stringify(livraisons));
            
            // Mettre à jour le statut de la commande
            await mockAPI.modifierCommande(commande.id, { statut: 'en_livraison' });
            
            return nouvelleLivraison;
        } catch (error) {
            console.error('Erreur création livraison:', error);
            throw error;
        }
    }

    // Mettre à jour une livraison
    async updateLivraison(id, updates) {
        try {
            const livraisons = JSON.parse(localStorage.getItem(this.livraisonsKey) || '[]');
            const index = livraisons.findIndex(l => l.id === parseInt(id));
            
            if (index === -1) {
                throw new Error('Livraison non trouvée');
            }
            
            const livraisonActuelle = livraisons[index];
            
            // Valider le changement de statut
            if (updates.statut && updates.statut !== livraisonActuelle.statut) {
                this.validateStatutChange(livraisonActuelle.statut, updates.statut);
            }
            
            // Mettre à jour
            livraisons[index] = {
                ...livraisonActuelle,
                ...updates,
                dateModification: new Date().toISOString()
            };
            
            localStorage.setItem(this.livraisonsKey, JSON.stringify(livraisons));
            
            // Si livraison terminée, mettre à jour la commande et le stock
            if (updates.statut === 'livree' && livraisonActuelle.statut !== 'livree') {
                await this.finaliserLivraison(livraisons[index]);
            }
            
            return livraisons[index];
        } catch (error) {
            console.error('Erreur mise à jour livraison:', error);
            throw error;
        }
    }

    // Finaliser une livraison
    async finaliserLivraison(livraison) {
        try {
            // Mettre à jour le statut de la commande
            await mockAPI.modifierCommande(livraison.commandeId, { 
                statut: 'livree',
                dateLivraison: new Date().toISOString()
            });
            
            // Déduire du stock
            for (const article of livraison.articles) {
                await mockAPI.retirerStock(article.produitId, article.quantite);
            }
            
            // Enregistrer la transaction
            await mockAPI.ajouterTransaction({
                type: 'sortie',
                produitId: livraison.articles[0]?.produitId, // Pour simplifier
                quantite: livraison.articles.reduce((sum, a) => sum + a.quantite, 0),
                motif: `Livraison ${livraison.numero}`,
                reference: livraison.numero,
                details: {
                    livraisonId: livraison.id,
                    commandeId: livraison.commandeId,
                    clientId: livraison.clientId
                }
            });
        } catch (error) {
            console.error('Erreur finalisation livraison:', error);
            throw error;
        }
    }

    // Changer le statut d'une livraison
    async updateStatut(id, nouveauStatut, details = {}) {
        const updates = {
            statut: nouveauStatut,
            ...details
        };
        
        // Ajouter des champs spécifiques selon le statut
        switch (nouveauStatut) {
            case 'en_chargement':
                updates.dateChargement = new Date().toISOString();
                break;
            case 'en_route':
                updates.dateDepart = new Date().toISOString();
                break;
            case 'livree':
                updates.dateLivraisonEffective = new Date().toISOString();
                updates.signataireNom = details.signataireNom || '';
                updates.signatureBase64 = details.signatureBase64 || '';
                break;
            case 'retournee':
                updates.dateRetour = new Date().toISOString();
                updates.motifRetour = details.motifRetour || '';
                break;
            case 'incident':
                updates.dateIncident = new Date().toISOString();
                updates.typeIncident = details.typeIncident || '';
                updates.descriptionIncident = details.descriptionIncident || '';
                break;
        }
        
        return await this.updateLivraison(id, updates);
    }

    // Annuler une livraison
    async annulerLivraison(id, motif) {
        const livraison = await this.getLivraisonById(id);
        
        if (['livree', 'retournee'].includes(livraison.statut)) {
            throw new Error('Cette livraison ne peut pas être annulée');
        }
        
        return await this.updateLivraison(id, {
            statut: 'annulee',
            motifAnnulation: motif,
            dateAnnulation: new Date().toISOString()
        });
    }

    // Générer un bon de livraison
    async genererBonLivraison(livraisonId) {
        const livraison = await this.getLivraisonById(livraisonId);
        
        const bon = {
            numero: livraison.numero,
            date: new Date(livraison.dateLivraison).toLocaleDateString('fr-FR'),
            client: {
                nom: livraison.clientNom,
                adresse: livraison.adresseLivraison,
                contact: livraison.contactLivraison,
                telephone: livraison.telephoneLivraison
            },
            transporteur: livraison.transporteur,
            numeroTracking: livraison.numeroTracking,
            articles: livraison.articles.map(article => ({
                reference: article.reference || article.produitReference,
                designation: article.nom || article.produitNom,
                quantite: article.quantite,
                unite: article.unite || 'pcs'
            })),
            observation: livraison.observation,
            preparedBy: livraison.utilisateurCreation,
            receivedBy: livraison.signataireNom || '_________________',
            signature: livraison.signatureBase64 || null
        };
        
        return bon;
    }

    // Rechercher des livraisons
    async searchLivraisons(query) {
        const livraisons = await this.getAllLivraisons();
        const searchQuery = query.toLowerCase();
        
        return livraisons.filter(livraison =>
            livraison.numero.toLowerCase().includes(searchQuery) ||
            livraison.clientNom.toLowerCase().includes(searchQuery) ||
            livraison.numeroCommande.toLowerCase().includes(searchQuery) ||
            livraison.transporteur?.toLowerCase().includes(searchQuery) ||
            livraison.numeroTracking?.toLowerCase().includes(searchQuery)
        );
    }

    // Filtrer les livraisons
    async filterLivraisons(filters = {}) {
        let livraisons = await this.getAllLivraisons();
        
        if (filters.statut) {
            livraisons = livraisons.filter(l => l.statut === filters.statut);
        }
        
        if (filters.clientId) {
            livraisons = livraisons.filter(l => l.clientId === parseInt(filters.clientId));
        }
        
        if (filters.dateDebut) {
            livraisons = livraisons.filter(l => 
                new Date(l.dateLivraison) >= new Date(filters.dateDebut)
            );
        }
        
        if (filters.dateFin) {
            livraisons = livraisons.filter(l => 
                new Date(l.dateLivraison) <= new Date(filters.dateFin)
            );
        }
        
        if (filters.transporteur) {
            livraisons = livraisons.filter(l => 
                l.transporteur?.toLowerCase().includes(filters.transporteur.toLowerCase())
            );
        }
        
        return livraisons;
    }

    // Statistiques des livraisons
    async getStatistiques() {
        const livraisons = await this.getAllLivraisons();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const stats = {
            total: livraisons.length,
            parStatut: {},
            livraisonsAujourdhui: 0,
            livraisonsCetteSemaine: 0,
            tauxSucces: 0,
            delaiMoyenLivraison: 0,
            transporteurs: {}
        };
        
        let totalDelais = 0;
        let livraisonsAvecDelai = 0;
        
        livraisons.forEach(livraison => {
            // Par statut
            stats.parStatut[livraison.statut] = (stats.parStatut[livraison.statut] || 0) + 1;
            
            // Livraisons aujourd'hui
            const dateLivraison = new Date(livraison.dateLivraison);
            if (dateLivraison >= today) {
                stats.livraisonsAujourdhui++;
            }
            
            // Cette semaine
            const debutSemaine = new Date(today);
            debutSemaine.setDate(today.getDate() - today.getDay());
            if (dateLivraison >= debutSemaine) {
                stats.livraisonsCetteSemaine++;
            }
            
            // Transporteurs
            if (livraison.transporteur) {
                stats.transporteurs[livraison.transporteur] = 
                    (stats.transporteurs[livraison.transporteur] || 0) + 1;
            }
            
            // Délai moyen (pour les livraisons terminées)
            if (livraison.statut === 'livree' && livraison.dateLivraisonEffective) {
                const delai = new Date(livraison.dateLivraisonEffective) - new Date(livraison.dateLivraison);
                totalDelais += delai;
                livraisonsAvecDelai++;
            }
        });
        
        // Taux de succès
        const livraisonsTerminees = (stats.parStatut.livree || 0) + (stats.parStatut.retournee || 0) + 
                                   (stats.parStatut.incident || 0);
        if (livraisonsTerminees > 0) {
            stats.tauxSucces = ((stats.parStatut.livree || 0) / livraisonsTerminees) * 100;
        }
        
        // Délai moyen en jours
        if (livraisonsAvecDelai > 0) {
            stats.delaiMoyenLivraison = totalDelais / livraisonsAvecDelai / (1000 * 60 * 60 * 24);
        }
        
        return stats;
    }

    // Générer un numéro de livraison
    generateNumeroLivraison() {
        const counter = parseInt(localStorage.getItem('its_livraison_counter') || '0') + 1;
        localStorage.setItem('its_livraison_counter', counter.toString());
        
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        return `LIV-${year}${month}-${String(counter).padStart(4, '0')}`;
    }

    // Validation
    validateLivraison(livraisonData) {
        const errors = [];
        
        if (!livraisonData.commandeId) {
            errors.push('La commande est obligatoire');
        }
        
        if (!livraisonData.adresseLivraison) {
            errors.push('L\'adresse de livraison est obligatoire');
        }
        
        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
    }

    // Valider le changement de statut
    validateStatutChange(statutActuel, nouveauStatut) {
        const transitions = {
            'programmee': ['en_chargement', 'annulee'],
            'en_chargement': ['en_route', 'incident', 'annulee'],
            'en_route': ['livree', 'retournee', 'incident'],
            'livree': [],
            'retournee': [],
            'incident': ['en_route', 'retournee', 'annulee'],
            'annulee': []
        };
        
        if (!transitions[statutActuel]?.includes(nouveauStatut)) {
            throw new Error(`Transition de statut invalide: ${statutActuel} ’ ${nouveauStatut}`);
        }
    }
}

export default new LivraisonsService();