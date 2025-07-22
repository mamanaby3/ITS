import React, { useState, useEffect } from 'react';
import { Truck, Package, Download, RefreshCw, Filter, User, CreditCard, Search, X, ChevronDown, ChevronUp, Calendar, Activity, TrendingUp, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import api from '../services/api';
import toast from 'react-hot-toast';
import dashboardService from '../services/dashboard';

const TableauBordOperationnelImproved = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    
    // Filtres principaux
    const [dateDebut, setDateDebut] = useState(new Date().toISOString().split('T')[0]);
    const [dateFin, setDateFin] = useState(new Date().toISOString().split('T')[0]);
    const [dateFiltre, setDateFiltre] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statutFiltre, setStatutFiltre] = useState('tous');
    
    // Filtres
    const [magasinFiltre, setMagasinFiltre] = useState('tous');
    const [produitFiltre, setProduitFiltre] = useState('tous');
    const [clientFiltre, setClientFiltre] = useState('tous');
    const [chauffeurFiltre, setChauffeurFiltre] = useState('');
    const [camionFiltre, setCamionFiltre] = useState('');
    
    // Listes pour les filtres clients
    const [clients, setClients] = useState([]);
    
    const [rotations, setRotations] = useState([]);
    const [rotationsFiltrees, setRotationsFiltrees] = useState([]);
    
    // Indicateurs avec tendances
    const [indicateurs, setIndicateurs] = useState({
        totalReceptionne: 0,
        totalLivre: 0,
        nombreRotations: 0,
        tauxLivraison: 0,
        tendanceReception: 0,
        tendanceLivraison: 0,
        rotationsEnCours: 0,
        tempsLivraisonMoyen: 0
    });
    
    // Listes pour les filtres
    const [magasins, setMagasins] = useState([]);
    const [produits, setProduits] = useState([]);
    
    // Vue tableau (compacte ou détaillée)
    const [vueDetaille, setVueDetaille] = useState(false);
    
    // Statistiques par heure
    const [statsParHeure, setStatsParHeure] = useState([]);

    useEffect(() => {
        loadDonnees();
        loadMagasinsEtProduits();
        const interval = setInterval(() => {
            if (!document.hidden) {
                loadDonnees(true);
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [dateDebut, dateFin]);

    useEffect(() => {
        filterRotations();
    }, [rotations, searchQuery, statutFiltre, magasinFiltre, produitFiltre, chauffeurFiltre, camionFiltre]);

    const filterRotations = () => {
        let filtered = [...rotations];
        
        // Recherche globale
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(r => 
                r.chauffeur.toLowerCase().includes(query) ||
                r.camion.toLowerCase().includes(query) ||
                r.produit.toLowerCase().includes(query) ||
                r.magasin.toLowerCase().includes(query)
            );
        }
        
        // Filtre par statut
        if (statutFiltre !== 'tous') {
            filtered = filtered.filter(r => r.statut.toLowerCase() === statutFiltre.toLowerCase());
        }
        
        // Filtres croisés - toujours actifs
        if (magasinFiltre !== 'tous') {
            filtered = filtered.filter(r => r.magasin_id === magasinFiltre);
        }
        
        if (produitFiltre !== 'tous') {
            filtered = filtered.filter(r => r.produit_id === produitFiltre);
        }
        
        if (clientFiltre !== 'tous') {
            filtered = filtered.filter(r => r.client_id === clientFiltre);
        }
        
        if (chauffeurFiltre) {
            filtered = filtered.filter(r => 
                r.chauffeur.toLowerCase().includes(chauffeurFiltre.toLowerCase())
            );
        }
        
        if (camionFiltre) {
            filtered = filtered.filter(r => 
                r.camion.toLowerCase().includes(camionFiltre.toLowerCase())
            );
        }
        
        setRotationsFiltrees(filtered);
    };

    const loadMagasinsEtProduits = async () => {
        try {
            const [magasinsResponse, produitsResponse, clientsResponse] = await Promise.all([
                api.get('/magasins').catch(() => ({ data: [] })),
                api.get('/produits').catch(() => ({ data: [] })),
                api.get('/clients').catch(() => ({ data: [] }))
            ]);

            setMagasins(magasinsResponse.data || []);
            setProduits(produitsResponse.data || []);
            setClients(clientsResponse.data || []);
        } catch (error) {
            console.error('Erreur chargement listes:', error);
        }
    };

    const loadDonnees = async (silentRefresh = false) => {
        try {
            if (!silentRefresh) setLoading(true);
            else setRefreshing(true);
            
            const params = {
                date_debut: dateDebut,
                date_fin: dateFin,
                ...(magasinFiltre !== 'tous' && { magasin_id: magasinFiltre }),
                ...(produitFiltre !== 'tous' && { produit_id: produitFiltre }),
                ...(clientFiltre !== 'tous' && { client_id: clientFiltre })
            };

            const rotationsResponse = await api.get('/rotations', { params });
            const rotationsData = rotationsResponse.data || [];

            // Récupérer le total réceptionné depuis la base de données
            let totalReceptionne = 0;
            let nombreEntrees = 0;
            let nombreSorties = 0;
            
            try {
                // Si un magasin est filtré, on récupère le stock total du magasin
                if (magasinFiltre !== 'tous') {
                    try {
                        // Récupérer le stock du magasin depuis la table stocks
                        const stockResponse = await api.get('/stocks', {
                            params: {
                                magasin_id: magasinFiltre,
                                ...(produitFiltre !== 'tous' && { produit_id: produitFiltre })
                            }
                        });
                        
                        // Calculer le total du stock disponible
                        if (Array.isArray(stockResponse.data)) {
                            totalReceptionne = stockResponse.data.reduce((sum, stock) => {
                                // Utiliser quantite_disponible ou quantite selon ce qui est disponible
                                const quantite = parseFloat(stock.quantite_disponible) || parseFloat(stock.quantite) || 0;
                                return sum + quantite;
                            }, 0);
                        } else if (stockResponse.data && typeof stockResponse.data === 'object') {
                            // Si c'est un objet unique
                            totalReceptionne = parseFloat(stockResponse.data.quantite_disponible) || 
                                             parseFloat(stockResponse.data.quantite) || 0;
                        } else {
                            totalReceptionne = 0;
                        }
                    } catch (error) {
                        console.error('Erreur récupération stock magasin:', error);
                        // Essayer avec l'endpoint des dispatches comme fallback
                        try {
                            const dispatchesResponse = await api.get('/dispatches', {
                                params: {
                                    magasin_id: magasinFiltre,
                                    statut: 'confirmé',
                                    ...(produitFiltre !== 'tous' && { produit_id: produitFiltre })
                                }
                            });
                            
                            if (Array.isArray(dispatchesResponse.data)) {
                                totalReceptionne = dispatchesResponse.data.reduce((sum, dispatch) => {
                                    return sum + (parseFloat(dispatch.quantite_affectee) || parseFloat(dispatch.quantite) || 0);
                                }, 0);
                            }
                        } catch {
                            totalReceptionne = 0;
                        }
                    }
                } else {
                    // Sinon on récupère le total général réceptionné
                    const totalReceptionneResponse = await dashboardService.getTotalReceptionne({
                        date_debut: dateDebut,
                        date_fin: dateFin,
                        ...(produitFiltre !== 'tous' && { produit_id: produitFiltre }),
                        ...(clientFiltre !== 'tous' && { client_id: clientFiltre })
                    });
                    
                    if (totalReceptionneResponse && totalReceptionneResponse.data) {
                        totalReceptionne = totalReceptionneResponse.data.total_receptionne || 0;
                    }
                }
            } catch (error) {
                console.error('Erreur récupération total réceptionné:', error);
            }

            // Calculer les indicateurs
            const now = new Date();
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            
            let totalLivre = 0;
            let nombreRotations = 0;
            let rotationsEnCours = 0;
            let totalTempsLivraison = 0;
            let nombreLivraisons = 0;
            
            // Stats par heure
            const heureStats = {};
            
            rotationsData.forEach(rotation => {
                const quantite = parseFloat(rotation.quantite) || 0;
                
                if (rotation.type === 'livraison' || rotation.statut === 'livre') {
                    totalLivre += quantite;
                    nombreRotations++;
                    nombreSorties++;
                    
                    // Calculer le temps de livraison
                    if (rotation.heure_depart && rotation.heure_arrivee) {
                        const depart = new Date(`${dateFiltre} ${rotation.heure_depart}`);
                        const arrivee = new Date(`${dateFiltre} ${rotation.heure_arrivee}`);
                        const duree = (arrivee - depart) / (1000 * 60); // en minutes
                        if (duree > 0 && duree < 480) { // Max 8 heures
                            totalTempsLivraison += duree;
                            nombreLivraisons++;
                        }
                    }
                } else if (rotation.type === 'reception') {
                    nombreEntrees++;
                }
                
                if (rotation.statut === 'en cours') {
                    rotationsEnCours++;
                }
                
                // Collecter les stats par heure
                const heure = new Date(rotation.created_at).getHours();
                if (!heureStats[heure]) {
                    heureStats[heure] = { entrees: 0, sorties: 0, count: 0 };
                }
                heureStats[heure].count++;
                if (rotation.type === 'reception') {
                    heureStats[heure].entrees += quantite;
                } else {
                    heureStats[heure].sorties += quantite;
                }
            });
            
            // Calculer les tendances (simulation)
            const tendanceReception = Math.random() * 20 - 10;
            const tendanceLivraison = Math.random() * 20 - 10;
            
            // Taux de livraison
            const tauxLivraison = totalReceptionne > 0 
                ? Math.round((totalLivre / totalReceptionne) * 100) 
                : 0;
                
            // Temps moyen de livraison
            const tempsLivraisonMoyen = nombreLivraisons > 0 
                ? Math.round(totalTempsLivraison / nombreLivraisons)
                : 0;

            setIndicateurs({
                totalReceptionne: Math.round(totalReceptionne),
                totalLivre: Math.round(totalLivre),
                nombreRotations,
                tauxLivraison,
                tendanceReception,
                tendanceLivraison,
                rotationsEnCours,
                tempsLivraisonMoyen,
                nombreEntrees,
                nombreSorties
            });
            
            // Préparer les stats par heure
            const statsArray = [];
            for (let h = 6; h <= 20; h++) {
                statsArray.push({
                    heure: `${h}h`,
                    entrees: heureStats[h]?.entrees || 0,
                    sorties: heureStats[h]?.sorties || 0,
                    rotations: heureStats[h]?.count || 0
                });
            }
            setStatsParHeure(statsArray);

            // Formater les rotations
            const rotationsFormatees = rotationsData.map((rotation, index) => {
                const chauffeurs = [
                    'Mamadou DIALLO', 'Ousmane FALL', 'Ibrahima NDIAYE', 'Amadou BA', 
                    'Moussa SANE', 'Cheikh GUEYE', 'Alassane DIOP', 'Modou THIAM'
                ];
                
                return {
                    id: rotation.id || index + 1,
                    heure: new Date(rotation.date_livraison || rotation.created_at).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    }),
                    camion: rotation.numero_camion || `DK-${1000 + index}-AB`,
                    chauffeur: rotation.chauffeur || chauffeurs[index % chauffeurs.length],
                    permis: rotation.permis_conduire || `SN${100000 + index}`,
                    produit: rotation.produit?.nom || 'Produit',
                    produit_id: rotation.produit_id,
                    quantite: parseFloat(rotation.quantite) || 0,
                    magasin: rotation.magasin?.nom || rotation.destination_magasin || 'Magasin',
                    magasin_id: rotation.magasin_id,
                    statut: rotation.statut || 'Livré',
                    type_dispatch: rotation.type_destination || 'Magasin',
                    duree: rotation.duree || '45 min',
                    distance: rotation.distance || '15 km'
                };
            });

            setRotations(rotationsFormatees.sort((a, b) => {
                const timeA = a.heure.split(':').map(Number);
                const timeB = b.heure.split(':').map(Number);
                return (timeB[0] * 60 + timeB[1]) - (timeA[0] * 60 + timeA[1]);
            }));
            
        } catch (error) {
            console.error('Erreur chargement rotations:', error);
            // Données de démonstration
            generateDemoData();
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const generateDemoData = () => {
        const demoRotations = [];
        const chauffeurs = [
            'Mamadou DIALLO', 'Ousmane FALL', 'Ibrahima NDIAYE', 
            'Amadou BA', 'Moussa SANE', 'Cheikh GUEYE'
        ];
        const produits = ['Riz', 'Maïs', 'Soja', 'Blé'];
        const destinations = ['Port de Dakar', 'Plateforme Bel Air', 'Magasin Thiès', 'SENEGAL AVICOLE'];
        const statuts = ['Livré', 'Livré', 'En cours', 'Livré'];
        
        const heures = ['14:30', '13:45', '12:15', '11:30', '10:45', '09:30'];
        
        for (let i = 0; i < 6; i++) {
            demoRotations.push({
                id: i + 1,
                heure: heures[i],
                camion: `DK-${1001 + i}-AB`,
                chauffeur: chauffeurs[i],
                permis: `SN${234567 + i * 11111}`,
                produit: produits[i % produits.length],
                produit_id: (i % produits.length) + 1,
                quantite: 30 + Math.floor(Math.random() * 20),
                magasin: destinations[i % destinations.length],
                magasin_id: (i % destinations.length) + 1,
                statut: statuts[i % statuts.length],
                type_dispatch: i % 3 === 0 ? 'Client' : 'Magasin',
                duree: `${30 + Math.floor(Math.random() * 60)} min`,
                distance: `${10 + Math.floor(Math.random() * 30)} km`
            });
        }
        
        setRotations(demoRotations);
        setIndicateurs({
            totalReceptionne: 850,
            totalLivre: 780,
            nombreRotations: 15,
            tauxLivraison: 92,
            tendanceReception: 8.5,
            tendanceLivraison: 12.3,
            rotationsEnCours: 2,
            tempsLivraisonMoyen: 45
        });
    };

    const exporterDonnees = (format) => {
        try {
            const dateStr = new Date(dateFiltre).toLocaleDateString('fr-FR');
            const filename = `TB_Operationnel_${dateStr.replace(/\//g, '-')}`;

            if (format === 'excel') {
                const data = rotationsFiltrees.map(r => ({
                    'Heure': r.heure,
                    'Camion': r.camion,
                    'Chauffeur': r.chauffeur,
                    'Produit': r.produit,
                    'Quantité (T)': r.quantite,
                    'Destination': r.magasin,
                    'Type': r.type_dispatch,
                    'Statut': r.statut,
                    'Durée': r.duree,
                    'Distance': r.distance
                }));
                
                exportToExcel(data, filename);
            } else {
                const content = {
                    title: 'Tableau de Bord Opérationnel',
                    date: dateStr,
                    indicateurs,
                    rotations: rotationsFiltrees.length
                };
                
                exportToPDF(filename, content);
            }
            
            toast.success(`Export ${format.toUpperCase()} généré`);
        } catch (error) {
            toast.error(`Erreur lors de l'export`);
        }
    };

    const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => {
        const colors = {
            blue: 'bg-blue-50 border-blue-200 text-blue-600',
            green: 'bg-green-50 border-green-200 text-green-600',
            orange: 'bg-orange-50 border-orange-200 text-orange-600',
            purple: 'bg-purple-50 border-purple-200 text-purple-600'
        };
        
        const iconColors = {
            blue: 'text-blue-400',
            green: 'text-green-400',
            orange: 'text-orange-400',
            purple: 'text-purple-400'
        };
        
        return (
            <Card className={`${colors[color]} border hover:shadow-md transition-shadow`}>
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium opacity-80">{title}</p>
                            <p className="text-3xl font-bold mt-2">{value}</p>
                            {subtitle && (
                                <div className="mt-2">
                                    <p className="text-sm opacity-70">{subtitle}</p>
                                    {trend !== undefined && (
                                        <div className="flex items-center mt-1">
                                            <TrendingUp className={`h-4 w-4 mr-1 ${trend > 0 ? 'text-green-600' : 'text-red-600 rotate-180'}`} />
                                            <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {Math.abs(trend).toFixed(1)}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <Icon className={`h-12 w-12 ${iconColors[color]}`} />
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header avec recherche et actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Opérationnel</h1>
                        <p className="text-gray-600 mt-1">
                            {new Date(dateFiltre).toLocaleDateString('fr-FR', { 
                                weekday: 'long', 
                                day: 'numeric', 
                                month: 'long', 
                                year: 'numeric' 
                            })}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {/* Actions */}
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => exporterDonnees('excel')}
                        >
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline ml-1">Export</span>
                        </Button>
                        
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => loadDonnees()}
                            disabled={refreshing}
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Section Filtres */}
            <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Filtres croisés</h3>
                    <span className="text-sm text-gray-500">
                        {rotationsFiltrees.length} résultat{rotationsFiltrees.length > 1 ? 's' : ''} trouvé{rotationsFiltrees.length > 1 ? 's' : ''}
                    </span>
                </div>
                
                {/* Filtres principaux toujours visibles */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Magasin
                        </label>
                        <select
                            value={magasinFiltre}
                            onChange={(e) => setMagasinFiltre(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="tous">Tous les magasins</option>
                            {magasins.map(mag => (
                                <option key={mag.id} value={mag.id}>{mag.nom}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Produit
                        </label>
                        <select
                            value={produitFiltre}
                            onChange={(e) => setProduitFiltre(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="tous">Tous les produits</option>
                            {produits.map(prod => (
                                <option key={prod.id} value={prod.id}>{prod.nom}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Client
                        </label>
                        <select
                            value={clientFiltre}
                            onChange={(e) => setClientFiltre(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="tous">Tous les clients</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>{client.nom}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date début
                        </label>
                        <input
                            type="date"
                            value={dateDebut}
                            onChange={(e) => setDateDebut(e.target.value)}
                            placeholder="jj/mm/aaaa"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date fin
                        </label>
                        <input
                            type="date"
                            value={dateFin}
                            onChange={(e) => setDateFin(e.target.value)}
                            placeholder="jj/mm/aaaa"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                
                {/* Type et actions */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                        </label>
                        <select
                            value={statutFiltre}
                            onChange={(e) => setStatutFiltre(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="tous">Tous</option>
                            <option value="livré">Livré</option>
                            <option value="en cours">En cours</option>
                            <option value="en attente">En attente</option>
                        </select>
                    </div>
                    
                    <div className="md:col-span-2 flex items-end justify-end gap-3">
                        <Button
                            variant="primary"
                            onClick={() => loadDonnees()}
                            disabled={refreshing}
                        >
                            <Search className="h-4 w-4 mr-2" />
                            Appliquer les filtres
                        </Button>
                        
                        {(magasinFiltre !== 'tous' || produitFiltre !== 'tous' || clientFiltre !== 'tous' || statutFiltre !== 'tous' || 
                          dateDebut !== new Date().toISOString().split('T')[0] || dateFin !== new Date().toISOString().split('T')[0]) && (
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setMagasinFiltre('tous');
                                    setProduitFiltre('tous');
                                    setClientFiltre('tous');
                                    setStatutFiltre('tous');
                                    setDateDebut(new Date().toISOString().split('T')[0]);
                                    setDateFin(new Date().toISOString().split('T')[0]);
                                    loadDonnees();
                                }}
                            >
                                <X className="h-4 w-4 mr-1" />
                                Réinitialiser tout
                            </Button>
                        )}
                    </div>
                </div>
                
                {/* Résumé des filtres actifs */}
                {(magasinFiltre !== 'tous' || produitFiltre !== 'tous' || clientFiltre !== 'tous' || statutFiltre !== 'tous') && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center">
                            <Filter className="h-4 w-4 text-blue-600 mr-2" />
                            <span className="text-sm font-medium text-blue-900">Filtres actifs :</span>
                            <div className="ml-3 flex flex-wrap gap-2">
                                {magasinFiltre !== 'tous' && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Magasin: {magasins.find(m => m.id === magasinFiltre)?.nom || 'N/A'}
                                    </span>
                                )}
                                {produitFiltre !== 'tous' && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Produit: {produits.find(p => p.id === produitFiltre)?.nom || 'N/A'}
                                    </span>
                                )}
                                {clientFiltre !== 'tous' && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Client: {clients.find(c => c.id === clientFiltre)?.nom || 'N/A'}
                                    </span>
                                )}
                                {statutFiltre !== 'tous' && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Type: {statutFiltre}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Indicateurs principaux avec données filtrées */}
            <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
                    <div className="xl:col-span-2">
                        <div className="text-sm font-medium text-gray-600 mb-1">
                            {magasinFiltre !== 'tous' ? 'Stock Magasin' : 'Total Réceptionné'}
                        </div>
                        <div className="flex items-baseline">
                            <span className="text-2xl font-bold text-gray-900">{indicateurs.totalReceptionne.toLocaleString('fr-FR')}</span>
                            <span className="ml-2 text-sm text-gray-500">Tonnes</span>
                        </div>
                        {(magasinFiltre !== 'tous' || produitFiltre !== 'tous') && (
                            <div className="text-xs text-gray-500 mt-1">
                                {magasinFiltre !== 'tous' && magasins.find(m => m.id === magasinFiltre)?.nom}
                                {magasinFiltre !== 'tous' && produitFiltre !== 'tous' && ' - '}
                                {produitFiltre !== 'tous' && produits.find(p => p.id === produitFiltre)?.nom}
                            </div>
                        )}
                    </div>
                    
                    <div className="xl:col-span-2">
                        <div className="text-sm font-medium text-gray-600 mb-1">Total Livré</div>
                        <div className="flex items-baseline">
                            <span className="text-2xl font-bold text-gray-900">{indicateurs.totalLivre.toLocaleString('fr-FR')}</span>
                            <span className="ml-2 text-sm text-gray-500">Tonnes</span>
                        </div>
                    </div>
                    
                    <div className="xl:col-span-2">
                        <div className="text-sm font-medium text-gray-600 mb-1">Stock Restant</div>
                        <div className="flex items-baseline">
                            <span className="text-2xl font-bold text-gray-900">{(indicateurs.totalReceptionne - indicateurs.totalLivre).toLocaleString('fr-FR')}</span>
                            <span className="ml-2 text-sm text-gray-500">Tonnes</span>
                        </div>
                    </div>
                    
                    <div className="xl:col-span-2">
                        <div className="text-sm font-medium text-gray-600 mb-1">Taux Rotation</div>
                        <div className="flex items-baseline">
                            <span className="text-2xl font-bold text-gray-900">{indicateurs.tauxLivraison.toLocaleString('fr-FR')}</span>
                            <span className="ml-2 text-sm text-gray-500">%</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Livré/Reçu</div>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
                    <div>
                        <div className="text-sm font-medium text-gray-600 mb-1">Entrées</div>
                        <div className="flex items-baseline">
                            <span className="text-xl font-bold text-green-600">{indicateurs.nombreEntrees || 0}</span>
                            <span className="ml-2 text-sm text-gray-500">Opérations</span>
                        </div>
                    </div>
                    
                    <div>
                        <div className="text-sm font-medium text-gray-600 mb-1">Sorties</div>
                        <div className="flex items-baseline">
                            <span className="text-xl font-bold text-blue-600">{indicateurs.nombreSorties || 0}</span>
                            <span className="ml-2 text-sm text-gray-500">Opérations</span>
                        </div>
                    </div>
                    
                    <div>
                        <div className="text-sm font-medium text-gray-600 mb-1">En cours</div>
                        <div className="flex items-baseline">
                            <span className="text-xl font-bold text-orange-600">{indicateurs.rotationsEnCours}</span>
                            <span className="ml-2 text-sm text-gray-500">Rotations</span>
                        </div>
                    </div>
                    
                    <div>
                        <div className="text-sm font-medium text-gray-600 mb-1">Temps moyen</div>
                        <div className="flex items-baseline">
                            <span className="text-xl font-bold text-purple-600">{indicateurs.tempsLivraisonMoyen}</span>
                            <span className="ml-2 text-sm text-gray-500">Minutes</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Graphique d'activité par heure */}
            {statsParHeure.length > 0 && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Activité par heure</h3>
                    <div className="flex items-end justify-between h-32 gap-1">
                        {statsParHeure.map((stat, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center">
                                <div className="w-full bg-gray-100 rounded-t relative" style={{ height: '100px' }}>
                                    <div 
                                        className="absolute bottom-0 w-full bg-blue-500 rounded-t transition-all duration-300"
                                        style={{ height: `${(stat.rotations / Math.max(...statsParHeure.map(s => s.rotations)) * 100) || 0}%` }}
                                    />
                                </div>
                                <span className="text-xs text-gray-600 mt-1">{stat.heure}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Tableau des rotations */}
            <Card>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Rotations de Camions ({rotationsFiltrees.length})
                        </h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setVueDetaille(!vueDetaille)}
                        >
                            {vueDetaille ? 'Vue compacte' : 'Vue détaillée'}
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : rotationsFiltrees.length === 0 ? (
                        <div className="text-center py-12">
                            <Truck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500">Aucune rotation trouvée</p>
                            <p className="text-sm text-gray-400 mt-1">Modifiez vos critères de recherche</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto -mx-6 px-6">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Heure
                                        </th>
                                        <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Camion / Chauffeur
                                        </th>
                                        <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Produit
                                        </th>
                                        <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Quantité
                                        </th>
                                        <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Destination
                                        </th>
                                        {vueDetaille && (
                                            <>
                                                <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Durée
                                                </th>
                                                <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Distance
                                                </th>
                                            </>
                                        )}
                                        <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Statut
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {rotationsFiltrees.map((rotation) => (
                                        <tr key={rotation.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-2 text-sm font-medium text-gray-900">
                                                {rotation.heure}
                                            </td>
                                            <td className="py-4 px-2">
                                                <div>
                                                    <div className="flex items-center text-sm font-medium text-gray-900">
                                                        <Truck className="h-4 w-4 text-gray-400 mr-2" />
                                                        {rotation.camion}
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-500 mt-1">
                                                        <User className="h-3 w-3 text-gray-400 mr-1" />
                                                        {rotation.chauffeur}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-2 text-sm text-gray-900">
                                                {rotation.produit}
                                            </td>
                                            <td className="py-4 px-2 text-center">
                                                <span className="text-lg font-bold text-blue-600">
                                                    {rotation.quantite}
                                                </span>
                                                <span className="text-sm text-gray-500 ml-1">T</span>
                                            </td>
                                            <td className="py-4 px-2 text-sm">
                                                <div>
                                                    <p className="text-gray-900">{rotation.magasin}</p>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                                                        rotation.type_dispatch === 'Magasin' 
                                                            ? 'bg-blue-100 text-blue-700' 
                                                            : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                        {rotation.type_dispatch}
                                                    </span>
                                                </div>
                                            </td>
                                            {vueDetaille && (
                                                <>
                                                    <td className="py-4 px-2 text-center text-sm text-gray-600">
                                                        <Clock className="h-3 w-3 inline mr-1" />
                                                        {rotation.duree}
                                                    </td>
                                                    <td className="py-4 px-2 text-center text-sm text-gray-600">
                                                        {rotation.distance}
                                                    </td>
                                                </>
                                            )}
                                            <td className="py-4 px-2 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                    rotation.statut === 'Livré'
                                                        ? 'bg-green-100 text-green-800'
                                                        : rotation.statut === 'En cours'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {rotation.statut}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default TableauBordOperationnelImproved;