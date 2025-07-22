import React, { useState, useEffect } from 'react';
import { Package, RefreshCw, Download, Search, Filter, X, TrendingUp, TrendingDown, Activity, Eye, BarChart3 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import api from '../services/api';
import toast from 'react-hot-toast';
import { exportToExcel } from '../utils/exportUtils';
import GestionTonnageStock from './GestionTonnageStock';

const GestionTonnage = () => {
  const [activeView, setActiveView] = useState('stock'); // 'stock' ou 'mouvements'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtres
  const [magasinFiltre, setMagasinFiltre] = useState('tous');
  const [produitFiltre, setProduitFiltre] = useState('tous');
  const [clientFiltre, setClientFiltre] = useState('tous');
  const [dateDebut, setDateDebut] = useState(new Date().toISOString().split('T')[0]);
  const [dateFin, setDateFin] = useState(new Date().toISOString().split('T')[0]);
  
  // Listes pour les filtres
  const [magasins, setMagasins] = useState([]);
  const [produits, setProduits] = useState([]);
  const [clients, setClients] = useState([]);
  
  // Données
  const [stocksData, setStocksData] = useState([]);
  const [stocksFiltres, setStocksFiltres] = useState([]);
  const [totaux, setTotaux] = useState({
    totalStock: 0,
    totalEntrees: 0,
    totalDispatches: 0,
    totalSorties: 0,
    totalLivraisons: 0,
    tauxRotation: 0,
    nombreMagasins: 0,
    nombreProduits: 0
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [stocksData, magasinFiltre, produitFiltre, clientFiltre]);

  useEffect(() => {
    if ((dateDebut || dateFin) && magasins.length > 0) {
      loadStocksData();
    }
  }, [dateDebut, dateFin, magasins.length]);

  const loadInitialData = async () => {
    try {
      const [magasinsRes, produitsRes, clientsRes] = await Promise.all([
        api.get('/magasins').catch(() => ({ data: [] })),
        api.get('/produits').catch(() => ({ data: [] })),
        api.get('/clients').catch(() => ({ data: [] }))
      ]);

      setMagasins(magasinsRes.data || []);
      setProduits(produitsRes.data || []);
      setClients(clientsRes.data || []);
      
      // Charger les stocks après avoir chargé les données de base
      await loadStocksData();
    } catch (error) {
      console.error('Erreur chargement données initiales:', error);
      toast.error('Erreur lors du chargement des données');
    }
  };

  const loadStocksData = async (silentRefresh = false) => {
    try {
      if (!silentRefresh) setLoading(true);
      else setRefreshing(true);

      // Récupérer les mouvements (entrées et sorties) avec les dates sélectionnées
      const [stockResponse, mouvementsResponse, stockDetailleResponse] = await Promise.all([
        api.get('/navire-dispatching/stock-total-global'),
        api.get(`/navire-dispatching/mouvements-magasins?date_debut=${dateDebut}&date_fin=${dateFin}`),
        api.get('/navire-dispatching/stock-detaille-produits')
      ]);
      
      console.log('Stock Response:', stockResponse);
      console.log('Mouvements Response:', mouvementsResponse);
      console.log('Stock Detaille Response:', stockDetailleResponse);
      
      if (!stockResponse) {
        console.log('Aucune donnée de stock disponible');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      const { stock_total_global, stock_par_magasin } = stockResponse;
      
      // Vérifier que stock_par_magasin existe et est un tableau
      if (!stock_par_magasin || !Array.isArray(stock_par_magasin)) {
        console.log('stock_par_magasin est invalide:', stock_par_magasin);
        setStocksData([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Créer une map des mouvements par magasin si disponible
      const mouvementsParMagasin = {};
      if (mouvementsResponse && mouvementsResponse.mouvements) {
        mouvementsResponse.mouvements.forEach(mouvement => {
          const key = `${mouvement.magasin_id}_${mouvement.produit_id || 'total'}`;
          mouvementsParMagasin[key] = mouvement;
        });
      }
      
      const allStocksData = [];
      
      // Si on a le détail des stocks par produit, l'utiliser
      if (stockDetailleResponse && stockDetailleResponse.success && stockDetailleResponse.data) {
        const stocksDetails = stockDetailleResponse.data || [];
        
        // Grouper par magasin et produit
        stocksDetails.forEach(stock => {
          const magasin = magasins.find(m => String(m.id) === String(stock.magasin_id)) || {
            id: stock.magasin_id,
            nom: stock.magasin_nom
          };
          
          const produit = produits.find(p => p.id === stock.produit_id) || {
            id: stock.produit_id,
            nom: stock.produit_nom,
            reference: stock.produit_reference,
            categorie: stock.categorie,
            unite: stock.unite
          };
          
          // Récupérer les mouvements pour ce produit/magasin si disponible
          const keyMouvement = `${stock.magasin_id}_${stock.produit_id}`;
          const mouvements = mouvementsParMagasin[keyMouvement] || {};
          
          allStocksData.push({
            magasin_id: stock.magasin_id,
            magasin: magasin,
            produit_id: stock.produit_id,
            produit: produit,
            quantite_stock: parseFloat(stock.stock_actuel || 0),
            stock_total: parseFloat(stock.stock_actuel || 0),
            quantite_entree: parseFloat(mouvements.total_entrees || 0),
            quantite_dispatch: parseFloat(mouvements.total_dispatches || 0),
            quantite_sortie: parseFloat(mouvements.total_sorties || 0),
            quantite_livraison: parseFloat(mouvements.total_livraisons || 0),
            derniere_entree: mouvements.derniere_entree || null,
            derniere_sortie: mouvements.derniere_sortie || null
          });
        });
      } else {
        // Fallback: utiliser les totaux par magasin
        for (const magasinStock of stock_par_magasin) {
          const magasin = magasins.find(m => String(m.id) === String(magasinStock.magasin_id)) || { 
            id: magasinStock.magasin_id, 
            nom: magasinStock.magasin_nom 
          };
          
          // Récupérer les mouvements pour ce magasin
          const key = `${magasin.id}_total`;
          const mouvements = mouvementsParMagasin[key] || {};
          
          allStocksData.push({
            magasin_id: magasin.id,
            magasin: magasin,
            produit_id: 'total',
            produit: {
              id: 'total',
              nom: 'Tous Produits',
              reference: 'TOTAL',
              categorie: 'Global'
            },
            quantite_stock: parseFloat(magasinStock.stock_magasin || 0),
            stock_total: parseFloat(magasinStock.stock_magasin || 0),
            quantite_entree: parseFloat(mouvements.total_entrees || 0),
            quantite_dispatch: parseFloat(mouvements.total_dispatches || 0),
            quantite_sortie: parseFloat(mouvements.total_sorties || 0),
            quantite_livraison: parseFloat(mouvements.total_livraisons || 0),
            derniere_entree: mouvements.derniere_entree || null,
            derniere_sortie: mouvements.derniere_sortie || null,
            nombre_entrees: mouvements.nombre_entrees || 0,
            nombre_sorties: mouvements.nombre_sorties || 0
          });
        }
      }
      
      // Trier par magasin puis par produit
      allStocksData.sort((a, b) => {
        const nomMagasinA = a.magasin?.nom || '';
        const nomMagasinB = b.magasin?.nom || '';
        if (nomMagasinA !== nomMagasinB) {
          return nomMagasinA.localeCompare(nomMagasinB);
        }
        const nomProduitA = a.produit?.nom || '';
        const nomProduitB = b.produit?.nom || '';
        return nomProduitA.localeCompare(nomProduitB);
      });

      console.log('Données de mouvements:', allStocksData);
      setStocksData(allStocksData);
      
    } catch (error) {
      console.error('Erreur chargement mouvements:', error);
      // Si l'endpoint mouvements n'existe pas encore, utiliser l'ancien comportement
      if (error.status === 404) {
        loadStocksDataFallback(silentRefresh);
      } else {
        toast.error('Erreur lors du chargement des mouvements');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Fonction de fallback si l'API mouvements n'existe pas encore
  const loadStocksDataFallback = async (silentRefresh = false) => {
    try {
      if (!silentRefresh) setLoading(true);
      
      // Récupérer les dispatches et livraisons séparément
      const [stockResponse, dispatchesRes, livraisonsRes] = await Promise.all([
        api.get('/navire-dispatching/stock-total-global'),
        api.get(`/navire-dispatching/historique-dispatches?date_debut=${dateDebut}&date_fin=${dateFin}`).catch(() => ({ data: [] })),
        api.get(`/livraisons?date_debut=${dateDebut}&date_fin=${dateFin}`).catch(() => ({ data: [] }))
      ]);
      
      const { stock_par_magasin } = stockResponse;
      const dispatches = Array.isArray(dispatchesRes) ? dispatchesRes : dispatchesRes.data || [];
      const livraisons = Array.isArray(livraisonsRes) ? livraisonsRes : livraisonsRes.data || [];
      
      const allStocksData = [];
      
      // Calculer les mouvements pour chaque magasin
      for (const magasinStock of stock_par_magasin) {
        const magasin = magasins.find(m => String(m.id) === String(magasinStock.magasin_id)) || { 
          id: magasinStock.magasin_id, 
          nom: magasinStock.magasin_nom 
        };
        
        // Filtrer les dispatches pour ce magasin
        const dispatchesMagasin = dispatches.filter(d => 
          String(d.magasin_id) === String(magasin.id)
        );
        
        // Filtrer les livraisons pour ce magasin
        const livraisonsMagasin = livraisons.filter(l => 
          String(l.magasin_id) === String(magasin.id)
        );
        
        // Calculer les totaux
        const totalEntrees = dispatchesMagasin.reduce((sum, d) => 
          sum + parseFloat(d.quantite || 0), 0
        );
        const totalSorties = livraisonsMagasin.reduce((sum, l) => 
          sum + parseFloat(l.quantite || 0), 0
        );
        
        // Trouver les dernières dates
        const derniereEntree = dispatchesMagasin.length > 0 
          ? dispatchesMagasin.sort((a, b) => 
              new Date(b.date_dispatching) - new Date(a.date_dispatching)
            )[0].date_dispatching
          : null;
          
        const derniereSortie = livraisonsMagasin.length > 0
          ? livraisonsMagasin.sort((a, b) => 
              new Date(b.date_livraison) - new Date(a.date_livraison)
            )[0].date_livraison
          : null;
        
        allStocksData.push({
          magasin_id: magasin.id,
          magasin: magasin,
          produit_id: 'total',
          produit: {
            id: 'total',
            nom: 'Tous Produits',
            reference: 'TOTAL',
            categorie: 'Global'
          },
          quantite_stock: parseFloat(magasinStock.stock_magasin || 0),
          stock_total: parseFloat(magasinStock.stock_magasin || 0),
          quantite_entree: totalEntrees,
          quantite_sortie: totalSorties,
          derniere_entree: derniereEntree,
          derniere_sortie: derniereSortie,
          nombre_entrees: dispatchesMagasin.length,
          nombre_sorties: livraisonsMagasin.length
        });
      }
      
      setStocksData(allStocksData);
      
    } catch (error) {
      console.error('Erreur fallback:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...stocksData];
    
    // Filtrer par magasin
    if (magasinFiltre !== 'tous') {
      filtered = filtered.filter(s => s.magasin_id === parseInt(magasinFiltre));
    }
    
    // Filtrer par produit
    if (produitFiltre !== 'tous') {
      filtered = filtered.filter(s => s.produit_id === parseInt(produitFiltre));
    }
    
    // Filtrer par client
    if (clientFiltre !== 'tous') {
      filtered = filtered.filter(s => {
        // Vérifier si ce stock a été livré à ce client
        return s.clients && s.clients.has(parseInt(clientFiltre));
      });
    }
    
    // Calculer les totaux
    const totalStock = filtered.reduce((sum, s) => sum + s.quantite_stock, 0);
    const totalEntrees = filtered.reduce((sum, s) => sum + (s.quantite_entree || 0), 0);
    const totalDispatches = filtered.reduce((sum, s) => sum + (s.quantite_dispatch || 0), 0);
    const totalSorties = filtered.reduce((sum, s) => sum + (s.quantite_sortie || 0), 0);
    const totalLivraisons = filtered.reduce((sum, s) => sum + (s.quantite_livraison || 0), 0);
    const totalMouvementsSortie = totalSorties + totalLivraisons;
    const tauxRotation = totalEntrees > 0 ? Math.round((totalMouvementsSortie / totalEntrees) * 100) : 0;
    
    // Compter les magasins et produits uniques (exclure 'total' du compte des produits)
    const magasinsUniques = new Set(filtered.map(s => s.magasin_id));
    const produitsUniques = new Set(filtered.filter(s => s.produit_id !== 'total').map(s => s.produit_id));
    
    setTotaux({
      totalStock,
      totalEntrees,
      totalDispatches,
      totalSorties,
      totalLivraisons,
      tauxRotation,
      nombreMagasins: magasinsUniques.size,
      nombreProduits: produitsUniques.size
    });
    
    setStocksFiltres(filtered);
  };

  const exportData = () => {
    try {
      const data = stocksFiltres.map(s => ({
        'Magasin': s.magasin?.nom || 'N/A',
        'Produit': s.produit?.nom || 'N/A',
        'Stock Actuel (T)': s.quantite_stock.toFixed(2),
        'Entrées (T)': (s.quantite_entree || 0).toFixed(2),
        'Dispatches (T)': (s.quantite_dispatch || 0).toFixed(2),
        'Sorties (T)': (s.quantite_sortie || 0).toFixed(2),
        'Livraisons (T)': (s.quantite_livraison || 0).toFixed(2),
        'Dernière Entrée': s.derniere_entree ? new Date(s.derniere_entree).toLocaleDateString('fr-FR') : '-',
        'Dernière Sortie': s.derniere_sortie ? new Date(s.derniere_sortie).toLocaleDateString('fr-FR') : '-'
      }));
      
      const filename = `Stock_Magasins_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}`;
      exportToExcel(data, filename);
      toast.success('Export Excel généré');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      orange: 'bg-orange-50 text-orange-600',
      purple: 'bg-purple-50 text-purple-600',
      red: 'bg-red-50 text-red-600'
    };
    
    return (
      <Card className={`${colors[color]} border-0`}>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">{title}</p>
              <p className="text-3xl font-bold mt-2">{value}</p>
              {subtitle && (
                <p className="text-sm opacity-70 mt-1">{subtitle}</p>
              )}
            </div>
            <Icon className="h-10 w-10 opacity-20" />
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header avec sélecteur de vue */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-600" />
              Gestion du Tonnage
            </h1>
            <p className="text-gray-600 mt-1">
              Suivi et traçabilité des stocks
            </p>
          </div>
          
          <div className="flex gap-2">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                onClick={() => setActiveView('stock')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'stock' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Eye className="h-4 w-4 inline mr-2" />
                Vue Stock Actuel
              </button>
              <button
                onClick={() => setActiveView('mouvements')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'mouvements' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="h-4 w-4 inline mr-2" />
                Vue Mouvements
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Affichage conditionnel selon la vue active */}
      {activeView === 'stock' ? (
        <GestionTonnageStock />
      ) : (
        <>
          {/* Vue originale des mouvements */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={exportData}
              disabled={stocksFiltres.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button
              variant="primary"
              onClick={() => loadStocksData()}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

      {/* Filtres croisés */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Filtres croisés</h3>
          <span className="text-sm text-gray-500">
            {stocksFiltres.length} ligne{stocksFiltres.length > 1 ? 's' : ''} trouvée{stocksFiltres.length > 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            {(magasinFiltre !== 'tous' || produitFiltre !== 'tous' || clientFiltre !== 'tous') && (
              <Button
                variant="ghost"
                onClick={() => {
                  setMagasinFiltre('tous');
                  setProduitFiltre('tous');
                  setClientFiltre('tous');
                }}
                className="w-full"
              >
                <X className="h-4 w-4 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>
        </div>
        
        {/* Résumé des filtres actifs */}
        {(magasinFiltre !== 'tous' || produitFiltre !== 'tous' || clientFiltre !== 'tous') && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <Filter className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">Filtres actifs :</span>
              <div className="ml-3 flex flex-wrap gap-2">
                {magasinFiltre !== 'tous' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {magasins.find(m => m.id === parseInt(magasinFiltre))?.nom || 'N/A'}
                  </span>
                )}
                {produitFiltre !== 'tous' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {produits.find(p => p.id === parseInt(produitFiltre))?.nom || 'N/A'}
                  </span>
                )}
                {clientFiltre !== 'tous' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {clients.find(c => c.id === parseInt(clientFiltre))?.nom || 'N/A'}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Indicateurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          title={magasinFiltre !== 'tous' ? "Total Réceptionné" : "Stock Total"}
          value={`${totaux.totalStock.toLocaleString('fr-FR')} T`}
          subtitle={
            (() => {
              let subtitle = [];
              if (magasinFiltre !== 'tous') {
                subtitle.push(magasins.find(m => m.id === parseInt(magasinFiltre))?.nom);
              }
              if (produitFiltre !== 'tous') {
                subtitle.push(produits.find(p => p.id === parseInt(produitFiltre))?.nom);
              }
              return subtitle.length > 0 ? subtitle.join(' - ') : "Dans tous les magasins";
            })()
          }
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Total Entrées"
          value={`${totaux.totalEntrees.toLocaleString('fr-FR')} T`}
          subtitle="Période sélectionnée"
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Total Sorties"
          value={`${totaux.totalSorties.toLocaleString('fr-FR')} T`}
          subtitle="Livraisons effectuées"
          icon={TrendingDown}
          color="orange"
        />
        <StatCard
          title="Taux Rotation"
          value={`${totaux.tauxRotation}%`}
          subtitle="Sorties/Entrées"
          icon={Activity}
          color="purple"
        />
        <StatCard
          title="Magasins"
          value={totaux.nombreMagasins}
          subtitle="Actifs"
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Produits"
          value={totaux.nombreProduits}
          subtitle="En stock"
          icon={Package}
          color="green"
        />
      </div>

      {/* Tableau des stocks */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Mouvements détaillés par magasin</h2>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : stocksFiltres.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Aucun stock trouvé</p>
              <p className="text-sm text-gray-400 mt-1">Modifiez vos critères de recherche</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Magasin
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Actuel
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entrées Réelles
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dispatches
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sorties
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Livraisons
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dernière Entrée
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dernière Sortie
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stocksFiltres.map((stock, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-gray-900">
                          {stock.magasin?.nom || '-'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-900">
                          {stock.produit?.nom || '-'}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-lg font-bold text-blue-600">
                          {(stock.stock_total || stock.quantite_stock || 0).toLocaleString('fr-FR')}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">T</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-sm font-medium text-green-600">
                          +{(stock.quantite_entree || 0).toLocaleString('fr-FR')} T
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-sm font-medium text-blue-600">
                          {(stock.quantite_dispatch || 0).toLocaleString('fr-FR')} T
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-sm font-medium text-orange-600">
                          -{(stock.quantite_sortie || 0).toLocaleString('fr-FR')} T
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-sm font-medium text-purple-600">
                          -{(stock.quantite_livraison || 0).toLocaleString('fr-FR')} T
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm text-gray-600">
                          {stock.derniere_entree 
                            ? new Date(stock.derniere_entree).toLocaleDateString('fr-FR')
                            : '-'
                          }
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm text-gray-600">
                          {stock.derniere_sortie 
                            ? new Date(stock.derniere_sortie).toLocaleDateString('fr-FR')
                            : '-'
                          }
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="2" className="py-4 px-4 text-sm font-semibold text-gray-900">
                      Total
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-lg font-bold text-blue-600">
                        {totaux.totalStock.toLocaleString('fr-FR')}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">T</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm font-bold text-green-600">
                        +{totaux.totalEntrees.toLocaleString('fr-FR')} T
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm font-bold text-blue-600">
                        {totaux.totalDispatches.toLocaleString('fr-FR')} T
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm font-bold text-orange-600">
                        -{totaux.totalSorties.toLocaleString('fr-FR')} T
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm font-bold text-purple-600">
                        -{totaux.totalLivraisons.toLocaleString('fr-FR')} T
                      </span>
                    </td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </Card>
        </>
      )}
    </div>
  );
};

export default GestionTonnage;