// src/services/rapports.js
import { MockApiService } from './mockApi';
import stockService from './stock';
import produitsService from './produits';
import clientsService from './clients';
import commandesService from './commandes';
import livraisonsService from './livraisons';
import { formatCurrency, formatDate, calculatePercentage } from '../utils/formatters';

const mockAPI = new MockApiService();

class RapportsService {
    // Rapport d'inventaire
    async genererRapportInventaire(options = {}) {
        try {
            const { 
                entrepotId, 
                categorieId, 
                includeValeur = true,
                includeAlertes = true,
                dateRapport = new Date()
            } = options;

            // R�cup�rer les donn�es
            const stock = await stockService.getAllStock();
            const produits = await produitsService.getAllProduits();
            const alertes = await stockService.getAlertes();

            // Filtrer selon les options
            let stockFiltre = stock;
            if (entrepotId) {
                stockFiltre = stock.filter(s => s.entrepotId === entrepotId);
            }

            // Grouper par produit
            const inventaire = {};
            stockFiltre.forEach(item => {
                if (!inventaire[item.produitId]) {
                    const produit = produits.find(p => p.id === item.produitId);
                    inventaire[item.produitId] = {
                        produit,
                        quantiteTotal: 0,
                        valeurTotal: 0,
                        emplacements: [],
                        lots: new Set(),
                        alertes: []
                    };
                }

                inventaire[item.produitId].quantiteTotal += item.quantite;
                if (includeValeur) {
                    inventaire[item.produitId].valeurTotal += item.quantite * (item.prixUnitaire || 0);
                }
                inventaire[item.produitId].emplacements.push({
                    emplacement: item.emplacement,
                    quantite: item.quantite,
                    lot: item.lot
                });
                if (item.lot) {
                    inventaire[item.produitId].lots.add(item.lot);
                }
            });

            // Ajouter les alertes
            if (includeAlertes) {
                alertes.forEach(alerte => {
                    if (inventaire[alerte.produit?.id]) {
                        inventaire[alerte.produit.id].alertes.push(alerte);
                    }
                });
            }

            // Calculer les totaux
            const totaux = {
                nombreProduits: Object.keys(inventaire).length,
                quantiteTotal: 0,
                valeurTotal: 0,
                produitsEnAlerte: 0,
                produitsEnRupture: 0
            };

            Object.values(inventaire).forEach(item => {
                totaux.quantiteTotal += item.quantiteTotal;
                totaux.valeurTotal += item.valeurTotal;
                if (item.alertes.length > 0) {
                    totaux.produitsEnAlerte++;
                    if (item.quantiteTotal === 0) {
                        totaux.produitsEnRupture++;
                    }
                }
            });

            return {
                type: 'inventaire',
                dateGeneration: new Date().toISOString(),
                dateRapport: dateRapport.toISOString(),
                options,
                inventaire: Object.values(inventaire).map(item => ({
                    ...item,
                    lots: Array.from(item.lots)
                })),
                totaux,
                metadata: {
                    generePar: 'Syst�me',
                    version: '1.0'
                }
            };
        } catch (error) {
            console.error('Erreur g�n�ration rapport inventaire:', error);
            throw error;
        }
    }

    // Rapport des mouvements de stock
    async genererRapportMouvements(options = {}) {
        try {
            const {
                dateDebut,
                dateFin,
                type,
                produitId,
                entrepotId,
                groupBy = 'jour' // jour, semaine, mois
            } = options;

            // R�cup�rer les mouvements
            const mouvements = await stockService.getMouvements({
                dateDebut,
                dateFin,
                type,
                produitId
            });

            // Grouper selon l'option
            const mouvementsGroupes = this.grouperParPeriode(mouvements, groupBy);

            // Calculer les statistiques
            const stats = {
                totalMouvements: mouvements.length,
                totalEntrees: 0,
                totalSorties: 0,
                totalTransferts: 0,
                valeurEntrees: 0,
                valeurSorties: 0,
                produitsImpactes: new Set(),
                utilisateurs: new Set()
            };

            mouvements.forEach(mouvement => {
                switch (mouvement.type) {
                    case 'entree':
                        stats.totalEntrees += mouvement.quantite;
                        stats.valeurEntrees += mouvement.quantite * (mouvement.prixUnitaire || 0);
                        break;
                    case 'sortie':
                        stats.totalSorties += mouvement.quantite;
                        stats.valeurSorties += mouvement.quantite * (mouvement.prixUnitaire || 0);
                        break;
                    case 'transfert':
                        stats.totalTransferts += mouvement.quantite;
                        break;
                }
                stats.produitsImpactes.add(mouvement.produitId);
                stats.utilisateurs.add(mouvement.utilisateur);
            });

            return {
                type: 'mouvements',
                dateGeneration: new Date().toISOString(),
                periode: {
                    debut: dateDebut || 'Non sp�cifi�',
                    fin: dateFin || 'Non sp�cifi�'
                },
                options,
                mouvements: mouvementsGroupes,
                statistiques: {
                    ...stats,
                    produitsImpactes: stats.produitsImpactes.size,
                    utilisateurs: stats.utilisateurs.size,
                    tauxRotation: stats.totalEntrees > 0 ? 
                        (stats.totalSorties / stats.totalEntrees * 100).toFixed(2) : 0
                },
                graphiques: {
                    evolutionParType: this.genererDonneesGraphique(mouvementsGroupes, 'type'),
                    evolutionParProduit: this.genererDonneesGraphique(mouvementsGroupes, 'produit')
                }
            };
        } catch (error) {
            console.error('Erreur g�n�ration rapport mouvements:', error);
            throw error;
        }
    }

    // Rapport des sorties
    async genererRapportSorties(options = {}) {
        try {
            const {
                dateDebut,
                dateFin,
                clientId,
                produitId,
                statut = 'livree'
            } = options;

            // R�cup�rer les commandes
            const commandes = await commandesService.filterCommandes({
                dateDebut,
                dateFin,
                clientId,
                statut
            });

            // R�cup�rer les livraisons correspondantes
            const livraisons = await livraisonsService.filterLivraisons({
                dateDebut,
                dateFin,
                clientId,
                statut: 'livree'
            });

            // Analyser les sorties
            const sortiesParProduit = {};
            const sortiesParClient = {};
            const sortiesParPeriode = {};

            let totalSorties = 0;
            let totalQuantites = 0;

            commandes.forEach(commande => {
                if (commande.articles) {
                    commande.articles.forEach(article => {
                        // Par produit
                        if (!sortiesParProduit[article.produitId]) {
                            sortiesParProduit[article.produitId] = {
                                produitId: article.produitId,
                                produitNom: article.produitNom || 'Produit ' + article.produitId,
                                quantiteTotal: 0,
                                montantTotal: 0,
                                nombreCommandes: 0
                            };
                        }
                        sortiesParProduit[article.produitId].quantiteTotal += article.quantite;
                        sortiesParProduit[article.produitId].montantTotal += article.quantite * article.prixUnitaire;
                        sortiesParProduit[article.produitId].nombreCommandes++;

                        totalQuantites += article.quantite;
                    });
                }

                // Par client
                if (!sortiesParClient[commande.clientId]) {
                    sortiesParClient[commande.clientId] = {
                        clientId: commande.clientId,
                        clientNom: commande.clientNom || 'Client ' + commande.clientId,
                        nombreCommandes: 0,
                        montantTotal: 0
                    };
                }
                sortiesParClient[commande.clientId].nombreCommandes++;
                sortiesParClient[commande.clientId].montantTotal += commande.montantTotal || 0;

                totalSorties += commande.montantTotal || 0;

                // Par p�riode (mois)
                const mois = new Date(commande.date).toISOString().substring(0, 7);
                if (!sortiesParPeriode[mois]) {
                    sortiesParPeriode[mois] = {
                        periode: mois,
                        nombreCommandes: 0,
                        montantTotal: 0
                    };
                }
                sortiesParPeriode[mois].nombreCommandes++;
                sortiesParPeriode[mois].montantTotal += commande.montantTotal || 0;
            });

            // Top 10 produits
            const top10Produits = Object.values(sortiesParProduit)
                .sort((a, b) => b.montantTotal - a.montantTotal)
                .slice(0, 10);

            // Top 10 clients
            const top10Clients = Object.values(sortiesParClient)
                .sort((a, b) => b.montantTotal - a.montantTotal)
                .slice(0, 10);

            return {
                type: 'sorties',
                dateGeneration: new Date().toISOString(),
                periode: {
                    debut: dateDebut || 'Non sp�cifi�',
                    fin: dateFin || 'Non sp�cifi�'
                },
                options,
                resume: {
                    totalCommandes: commandes.length,
                    totalLivraisons: livraisons.length,
                    montantTotal: totalSorties,
                    quantiteTotal: totalQuantites,
                    ticketMoyen: commandes.length > 0 ? totalSorties / commandes.length : 0,
                    nombreClients: Object.keys(sortiesParClient).length,
                    nombreProduits: Object.keys(sortiesParProduit).length
                },
                top10Produits,
                top10Clients,
                evolutionSorties: Object.values(sortiesParPeriode).sort((a, b) => 
                    a.periode.localeCompare(b.periode)
                ),
                tauxConversion: {
                    commandesLivrees: livraisons.length,
                    commandesTotal: commandes.length,
                    taux: commandes.length > 0 ? 
                        (livraisons.length / commandes.length * 100).toFixed(2) : 0
                }
            };
        } catch (error) {
            console.error('Erreur g�n�ration rapport sorties:', error);
            throw error;
        }
    }

    // Rapport des alertes stock
    async genererRapportAlertes() {
        try {
            const alertes = await stockService.getAlertes();
            const produits = await produitsService.getAllProduits();
            const stock = await stockService.getAllStock();

            // Grouper les alertes par type
            const alertesParType = {
                rupture: [],
                stock_bas: [],
                expiration: []
            };

            alertes.forEach(alerte => {
                if (alertesParType[alerte.type]) {
                    alertesParType[alerte.type].push(alerte);
                }
            });

            // Calculer les impacts
            const impacts = {
                valeursARisque: 0,
                commandesImpactees: 0,
                delaiReapprovisionnement: []
            };

            alertes.forEach(alerte => {
                if (alerte.produit) {
                    impacts.valeursARisque += 
                        (alerte.quantiteActuelle || 0) * (alerte.produit.prixUnitaire || 0);
                }
            });

            return {
                type: 'alertes',
                dateGeneration: new Date().toISOString(),
                resume: {
                    totalAlertes: alertes.length,
                    produitsEnRupture: alertesParType.rupture.length,
                    produitsStockBas: alertesParType.stock_bas.length,
                    produitsExpirant: alertesParType.expiration.length,
                    valeurARisque: impacts.valeursARisque
                },
                alertesParType,
                recommandations: this.genererRecommandations(alertes),
                priorisations: this.prioriserAlertes(alertes)
            };
        } catch (error) {
            console.error('Erreur g�n�ration rapport alertes:', error);
            throw error;
        }
    }

    // Rapport financier
    async genererRapportFinancier(options = {}) {
        try {
            const { dateDebut, dateFin } = options;

            // R�cup�rer toutes les donn�es n�cessaires
            const stock = await stockService.getAllStock();
            const mouvements = await stockService.getMouvements({ dateDebut, dateFin });
            const commandes = await commandesService.filterCommandes({ dateDebut, dateFin });
            const livraisons = await livraisonsService.filterLivraisons({ dateDebut, dateFin });

            // Calculer la valeur du stock
            let valeurStock = 0;
            stock.forEach(item => {
                valeurStock += item.quantite * (item.prixUnitaire || 0);
            });

            // Calculer les entr�es et sorties
            let valeurEntrees = 0;
            let valeurSorties = 0;
            mouvements.forEach(mouvement => {
                const valeur = mouvement.quantite * (mouvement.prixUnitaire || 0);
                if (mouvement.type === 'entree') {
                    valeurEntrees += valeur;
                } else if (mouvement.type === 'sortie') {
                    valeurSorties += valeur;
                }
            });

            // Calculer le chiffre d'affaires
            let chiffreAffaires = 0;
            let coutVentes = 0;
            commandes.filter(c => c.statut === 'livree').forEach(commande => {
                chiffreAffaires += commande.montantTotal || 0;
                // Estimation du co�t des ventes (70% du CA pour l'exemple)
                coutVentes += (commande.montantTotal || 0) * 0.7;
            });

            const margebrute = chiffreAffaires - coutVentes;
            const tauxMarge = chiffreAffaires > 0 ? (margebrute / chiffreAffaires * 100) : 0;

            return {
                type: 'financier',
                dateGeneration: new Date().toISOString(),
                periode: {
                    debut: dateDebut || 'Non sp�cifi�',
                    fin: dateFin || 'Non sp�cifi�'
                },
                bilanStock: {
                    valeurStock,
                    valeurEntrees,
                    valeurSorties,
                    variation: valeurEntrees - valeurSorties
                },
                performance: {
                    chiffreAffaires,
                    coutVentes,
                    margebrute,
                    tauxMarge: tauxMarge.toFixed(2)
                },
                indicateurs: {
                    rotationStock: valeurStock > 0 ? 
                        (coutVentes / valeurStock).toFixed(2) : 0,
                    couvertureStock: coutVentes > 0 ? 
                        (valeurStock / (coutVentes / 30)).toFixed(0) : 0, // jours
                    tauxService: commandes.length > 0 ?
                        (livraisons.filter(l => l.statut === 'livree').length / commandes.length * 100).toFixed(2) : 0
                },
                tendances: {
                    evolutionCA: this.calculerTendance(commandes, 'montantTotal'),
                    evolutionStock: this.calculerTendance(mouvements, 'valeur')
                }
            };
        } catch (error) {
            console.error('Erreur g�n�ration rapport financier:', error);
            throw error;
        }
    }

    // M�thodes utilitaires
    grouperParPeriode(data, groupBy) {
        const grouped = {};
        
        data.forEach(item => {
            let key;
            const date = new Date(item.date);
            
            switch (groupBy) {
                case 'jour':
                    key = date.toISOString().split('T')[0];
                    break;
                case 'semaine':
                    const weekNumber = this.getWeekNumber(date);
                    key = `${date.getFullYear()}-S${weekNumber}`;
                    break;
                case 'mois':
                    key = date.toISOString().substring(0, 7);
                    break;
                default:
                    key = date.toISOString().split('T')[0];
            }
            
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(item);
        });
        
        return grouped;
    }

    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    genererDonneesGraphique(data, type) {
        // G�n�rer des donn�es format�es pour les graphiques
        const series = [];
        Object.entries(data).forEach(([key, values]) => {
            series.push({
                name: key,
                data: values.length
            });
        });
        return series;
    }

    genererRecommandations(alertes) {
        const recommandations = [];
        
        // Analyser les alertes et g�n�rer des recommandations
        const produitsEnRupture = alertes.filter(a => a.type === 'rupture');
        if (produitsEnRupture.length > 0) {
            recommandations.push({
                priorite: 'haute',
                type: 'reapprovisionnement',
                message: `${produitsEnRupture.length} produits en rupture n�cessitent un r�approvisionnement urgent`,
                produits: produitsEnRupture.map(a => a.produit?.nom).filter(Boolean)
            });
        }
        
        const produitsExpirant = alertes.filter(a => a.type === 'expiration');
        if (produitsExpirant.length > 0) {
            recommandations.push({
                priorite: 'moyenne',
                type: 'rotation',
                message: `${produitsExpirant.length} produits approchent de leur date d'expiration`,
                action: 'Prioriser ces produits pour les prochaines livraisons'
            });
        }
        
        return recommandations;
    }

    prioriserAlertes(alertes) {
        // Calculer un score de priorit� pour chaque alerte
        return alertes.map(alerte => {
            let score = 0;
            
            // Type d'alerte
            if (alerte.type === 'rupture') score += 100;
            else if (alerte.type === 'stock_bas') score += 50;
            else if (alerte.type === 'expiration') score += 75;
            
            // Valeur du produit
            if (alerte.produit?.prixUnitaire) {
                score += Math.min(alerte.produit.prixUnitaire / 1000, 50);
            }
            
            // Quantit� impact�e
            const quantiteManquante = (alerte.seuil || 0) - (alerte.quantiteActuelle || 0);
            score += Math.min(quantiteManquante / 10, 25);
            
            return {
                ...alerte,
                scorePriorite: Math.round(score),
                priorite: score >= 100 ? 'critique' : score >= 50 ? 'haute' : 'normale'
            };
        }).sort((a, b) => b.scorePriorite - a.scorePriorite);
    }

    calculerTendance(data, field) {
        if (data.length < 2) return 'stable';
        
        // Calculer la tendance simple (� am�liorer avec r�gression lin�aire)
        const moitie = Math.floor(data.length / 2);
        const premiere = data.slice(0, moitie);
        const deuxieme = data.slice(moitie);
        
        const moyennePremiere = premiere.reduce((sum, item) => sum + (item[field] || 0), 0) / premiere.length;
        const moyenneDeuxieme = deuxieme.reduce((sum, item) => sum + (item[field] || 0), 0) / deuxieme.length;
        
        const variation = ((moyenneDeuxieme - moyennePremiere) / moyennePremiere) * 100;
        
        return {
            direction: variation > 5 ? 'hausse' : variation < -5 ? 'baisse' : 'stable',
            pourcentage: variation.toFixed(2)
        };
    }

    // Exporter un rapport
    async exporterRapport(rapport, format = 'pdf') {
        try {
            switch (format) {
                case 'pdf':
                    return this.genererPDF(rapport);
                case 'excel':
                    return this.genererExcel(rapport);
                case 'csv':
                    return this.genererCSV(rapport);
                default:
                    throw new Error(`Format ${format} non support�`);
            }
        } catch (error) {
            console.error('Erreur export rapport:', error);
            throw error;
        }
    }

    genererPDF(rapport) {
        // Impl�mentation simplifi�e - dans un cas r�el, utiliser une lib comme jsPDF
        console.log('G�n�ration PDF du rapport', rapport.type);
        return {
            format: 'pdf',
            filename: `rapport_${rapport.type}_${new Date().toISOString().split('T')[0]}.pdf`,
            content: 'Contenu PDF simul�'
        };
    }

    genererExcel(rapport) {
        // Impl�mentation simplifi�e - dans un cas r�el, utiliser une lib comme SheetJS
        console.log('G�n�ration Excel du rapport', rapport.type);
        return {
            format: 'excel',
            filename: `rapport_${rapport.type}_${new Date().toISOString().split('T')[0]}.xlsx`,
            content: 'Contenu Excel simul�'
        };
    }

    genererCSV(rapport) {
        // G�n�ration CSV basique
        let csv = '';
        
        switch (rapport.type) {
            case 'inventaire':
                csv = 'Produit,Quantit�,Valeur,Alertes\n';
                rapport.inventaire.forEach(item => {
                    csv += `"${item.produit?.nom}",${item.quantiteTotal},${item.valeurTotal},${item.alertes.length}\n`;
                });
                break;
            case 'sorties':
                csv = 'Produit,Quantit�,Montant,Commandes\n';
                rapport.top10Produits.forEach(item => {
                    csv += `"${item.produitNom}",${item.quantiteTotal},${item.montantTotal},${item.nombreCommandes}\n`;
                });
                break;
            default:
                csv = 'Type,Date,Donn�es\n';
                csv += `${rapport.type},${rapport.dateGeneration},"Donn�es non structur�es"\n`;
        }
        
        return {
            format: 'csv',
            filename: `rapport_${rapport.type}_${new Date().toISOString().split('T')[0]}.csv`,
            content: csv
        };
    }
}

export default new RapportsService();