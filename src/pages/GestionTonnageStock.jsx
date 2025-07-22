import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, RefreshCw, Download, Search, Filter, X, Store, AlertTriangle, Eye } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingState from '../components/ui/LoadingState';
import { useMagasins } from '../hooks/useMagasins';
import api from '../services/api';
import toast from 'react-hot-toast';

const GestionTonnageStock = () => {
  const navigate = useNavigate();
  const { magasins, loading: magasinsLoading } = useMagasins();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // États pour les données
  const [stocksByMagasin, setStocksByMagasin] = useState({});
  const [allStocks, setAllStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [produits, setProduits] = useState([]);
  
  // Filtres
  const [selectedMagasin, setSelectedMagasin] = useState('all');
  const [selectedProduit, setSelectedProduit] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [selectedMagasinDetails, setSelectedMagasinDetails] = useState(null);
  
  // Statistiques
  const [stats, setStats] = useState({
    totalStock: 0,
    totalMagasins: 0,
    totalProduits: 0,
    alertesCount: 0,
    stockParMagasin: {}
  });

  useEffect(() => {
    loadProduits();
  }, []);

  useEffect(() => {
    if (!magasinsLoading && magasins.length > 0) {
      loadAllMagasinsStock();
    }
  }, [magasinsLoading, magasins.length]);

  useEffect(() => {
    applyFilters();
  }, [allStocks, selectedMagasin, selectedProduit, searchTerm, showLowStock]);

  const loadProduits = async () => {
    try {
      const response = await api.get('/produits');
      setProduits(response.data || []);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    }
  };

  const loadAllMagasinsStock = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const stockData = {};
      const allStocksData = [];
      let totalStock = 0;
      let alertesCount = 0;
      const stockParMagasin = {};

      // Récupérer le stock total depuis navire-dispatching
      let stockTotalRes;
      try {
        stockTotalRes = await api.get('/navire-dispatching/stock-total-global');
        console.log('Stock API response:', stockTotalRes);
      } catch (error) {
        console.error('Erreur API stock:', error);
        stockTotalRes = { 
          stock_total_global: 0, 
          stock_par_magasin: [] 
        };
      }
      
      const { stock_total_global = 0, stock_par_magasin = [] } = stockTotalRes || {};

      // Si pas de données, afficher au moins les magasins avec stock 0
      if (!stock_par_magasin || stock_par_magasin.length === 0) {
        console.log('Aucune donnée de stock, création de stocks vides pour chaque magasin');
        for (const magasin of magasins) {
          const stockItem = {
            id: `${magasin.id}-total`,
            produit_id: 'total',
            produit: {
              id: 'total',
              nom: 'Stock Total du Magasin',
              reference: 'TOTAL',
              categorie: 'Tous produits'
            },
            magasin_id: magasin.id,
            magasin_nom: magasin.nom,
            quantite_dispatchee: 0,
            quantite_livree: 0,
            quantite_disponible: 0,
            stock_total: 0,
            isLowStock: false,
            isCritical: false,
            isOutOfStock: true
          };
          
          allStocksData.push(stockItem);
          stockData[magasin.id] = [stockItem];
          
          stockParMagasin[magasin.id] = {
            nom: magasin.nom,
            total: 0,
            alertes: 0,
            produits: 0
          };
        }
      } else {
        // Utiliser directement les données de stock_par_magasin
        for (const magasinData of stock_par_magasin) {
        const magasin = magasins.find(m => String(m.id) === String(magasinData.magasin_id)) || {
          id: magasinData.magasin_id,
          nom: magasinData.magasin_nom
        };
        
        // Créer un stock simple pour ce magasin sans chercher les détails
        const magasinStocks = [];
        const magasinTotal = parseFloat(magasinData.stock_magasin || 0);
        
        // Créer une entrée de stock globale
        const stockItem = {
          id: `${magasin.id}-total`,
          produit_id: 'total',
          produit: {
            id: 'total',
            nom: 'Stock Total du Magasin',
            reference: 'TOTAL',
            categorie: 'Tous produits'
          },
          magasin_id: magasin.id,
          magasin_nom: magasin.nom,
          quantite_dispatchee: magasinTotal,
          quantite_livree: 0,
          quantite_disponible: magasinTotal,
          stock_total: magasinTotal,
          isLowStock: magasinTotal < 50 && magasinTotal > 0,
          isCritical: magasinTotal < 20 && magasinTotal > 0,
          isOutOfStock: magasinTotal <= 0
        };
        
        if (magasinTotal > 0) {
          magasinStocks.push(stockItem);
          allStocksData.push(stockItem);
        }
        
        stockData[magasin.id] = magasinStocks;
        
        // Stats du magasin
        stockParMagasin[magasin.id] = {
          nom: magasin.nom,
          total: magasinTotal,
          alertes: stockItem.isLowStock ? 1 : 0,
          produits: magasinData.nombre_produits || 1
        };
        
          if (stockItem.isLowStock) alertesCount++;
        }
      }
      
      // Le total est déjà calculé par l'API
      totalStock = stock_total_global;

      setStocksByMagasin(stockData);
      setAllStocks(allStocksData);
      
      // Mettre à jour les statistiques
      setStats({
        totalStock,
        totalMagasins: magasins.length,
        totalProduits: new Set(allStocksData.map(s => s.produit_id)).size,
        alertesCount,
        stockParMagasin
      });

    } catch (error) {
      console.error('Erreur chargement stocks:', error);
      toast.error('Erreur lors du chargement des stocks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allStocks];

    // Filtre par magasin
    if (selectedMagasin !== 'all') {
      filtered = filtered.filter(s => s.magasin_id === selectedMagasin);
    }

    // Filtre par produit
    if (selectedProduit !== 'all') {
      filtered = filtered.filter(s => 
        parseInt(s.produit_id) === parseInt(selectedProduit)
      );
    }

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.produit?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.produit?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.magasin_nom?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre stock faible
    if (showLowStock) {
      filtered = filtered.filter(s => s.isLowStock);
    }

    setFilteredStocks(filtered);
  };

  const exportData = () => {
    try {
      const dataToExport = filteredStocks.map(stock => ({
        'Magasin': stock.magasin_nom || 'N/A',
        'Produit': stock.produit?.nom || 'N/A',
        'Code': stock.produit?.code || 'N/A',
        'Dispatché (T)': stock.quantite_dispatchee?.toFixed(2) || '0.00',
        'Livré (T)': stock.quantite_livree?.toFixed(2) || '0.00',
        'Disponible (T)': stock.quantite_disponible.toFixed(2),
        'État': stock.quantite_disponible <= 0 ? 'Épuisé' :
                stock.isLowStock ? 'Faible' : 'Normal',
        'Date': new Date().toLocaleDateString('fr-FR')
      }));

      // Créer un CSV
      const headers = Object.keys(dataToExport[0] || {});
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(row => 
          headers.map(header => `"${row[header]}"`).join(',')
        )
      ].join('\n');

      // Télécharger le fichier
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const fileName = selectedMagasin === 'all' 
        ? `stock_tous_magasins_${new Date().toISOString().split('T')[0]}.csv`
        : `stock_${stats.stockParMagasin[selectedMagasin]?.nom || 'magasin'}_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Stock exporté avec succès');
    } catch (error) {
      console.error('Erreur export:', error);
      toast.error('Erreur lors de l\'export du stock');
    }
  };

  const MagasinCard = ({ magasinId, data }) => {
    const hasAlerts = data.alertes > 0;
    
    return (
      <div
        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
          selectedMagasin === magasinId 
            ? 'border-blue-500 bg-blue-50' 
            : hasAlerts 
              ? 'border-red-200 bg-red-50 hover:border-red-300' 
              : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => setSelectedMagasin(magasinId === selectedMagasin ? 'all' : magasinId)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Store className={`h-5 w-5 ${hasAlerts ? 'text-red-500' : 'text-gray-500'}`} />
            <h3 className="font-semibold text-sm">{data.nom}</h3>
          </div>
          {hasAlerts && (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Stock total</span>
            <span className={`text-lg font-bold ${hasAlerts ? 'text-red-600' : 'text-gray-900'}`}>
              {data.total.toFixed(2)} T
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Produits</span>
            <span className="text-sm font-medium">{data.produits}</span>
          </div>
          
          {hasAlerts && (
            <div className="flex justify-between items-center pt-1 border-t border-red-200">
              <span className="text-xs text-red-600">Alertes</span>
              <span className="text-sm font-bold text-red-600">{data.alertes}</span>
            </div>
          )}
        </div>

        <button
          className="mt-3 w-full py-1 text-xs bg-white border rounded hover:bg-gray-50 flex items-center justify-center gap-1"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/details-magasin/${magasinId}`);
          }}
        >
          <Eye className="h-3 w-3" />
          Détails
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-600" />
              Vue d'ensemble des Stocks - Tous les Magasins
            </h1>
            <p className="text-gray-600 mt-1">
              Suivi en temps réel du stock de tous les magasins
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={exportData}
              disabled={filteredStocks.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button
              variant="primary"
              onClick={() => loadAllMagasinsStock(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? '' : 'Actualiser'}
            </Button>
          </div>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <div className="p-4">
            <p className="text-sm font-medium text-blue-900">Stock Total</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {stats.totalStock.toFixed(2)} T
            </p>
            <p className="text-xs text-blue-700 mt-1">
              {stats.totalMagasins} magasins
            </p>
          </div>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <div className="p-4">
            <p className="text-sm font-medium text-green-900">Produits</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {stats.totalProduits}
            </p>
            <p className="text-xs text-green-700 mt-1">
              Types différents
            </p>
          </div>
        </Card>

        <Card className={`${stats.alertesCount > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
          <div className="p-4">
            <p className={`text-sm font-medium ${stats.alertesCount > 0 ? 'text-red-900' : 'text-gray-900'}`}>
              Alertes Stock
            </p>
            <p className={`text-2xl font-bold mt-1 ${stats.alertesCount > 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {stats.alertesCount}
            </p>
            <p className={`text-xs mt-1 ${stats.alertesCount > 0 ? 'text-red-700' : 'text-gray-700'}`}>
              Stock en attente &lt; 50T
            </p>
          </div>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <div className="p-4">
            <p className="text-sm font-medium text-purple-900">Stock Moyen</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {stats.totalMagasins > 0 ? (stats.totalStock / stats.totalMagasins).toFixed(2) : '0.00'} T
            </p>
            <p className="text-xs text-purple-700 mt-1">
              Par magasin
            </p>
          </div>
        </Card>
      </div>

      {/* Vue des magasins */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Stock par Magasin</h2>
          
          <LoadingState loading={loading || magasinsLoading}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Object.entries(stats.stockParMagasin).map(([magasinId, data]) => (
                <MagasinCard 
                  key={magasinId} 
                  magasinId={magasinId} 
                  data={data} 
                />
              ))}
            </div>
          </LoadingState>
        </div>
      </Card>

      {/* Filtres et tableau détaillé */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Détail des Stocks
              {selectedMagasin !== 'all' && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  - {stats.stockParMagasin[selectedMagasin]?.nom}
                </span>
              )}
            </h2>
            <span className="text-sm text-gray-500">
              {filteredStocks.length} article{filteredStocks.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Barre de filtres */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedProduit}
              onChange={(e) => setSelectedProduit(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les produits</option>
              {produits.map(produit => (
                <option key={produit.id} value={produit.id}>
                  {produit.nom}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span className="text-sm">Stock faible uniquement</span>
            </label>

            {(selectedMagasin !== 'all' || selectedProduit !== 'all' || searchTerm || showLowStock) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedMagasin('all');
                  setSelectedProduit('all');
                  setSearchTerm('');
                  setShowLowStock(false);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Magasin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dispatché (T)
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Livré (T)
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Disponible (T)
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    État
                  </th>
                  {selectedMagasin === 'all' && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Total Produit
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStocks.map((stock, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stock.magasin_nom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {stock.produit?.nom || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Code: {stock.produit?.code || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-medium text-blue-600">
                        {stock.quantite_dispatchee?.toFixed(2) || '0.00'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-medium text-orange-600">
                        {stock.quantite_livree?.toFixed(2) || '0.00'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`text-lg font-bold ${
                        stock.isOutOfStock ? 'text-red-600' :
                        stock.isCritical ? 'text-orange-600' :
                        stock.isLowStock ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {stock.quantite_disponible.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        stock.isOutOfStock ? 'bg-red-100 text-red-800' :
                        stock.isCritical ? 'bg-orange-100 text-orange-800' :
                        stock.isLowStock ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {stock.isOutOfStock ? 'Rupture' :
                         stock.isCritical ? 'Critique' :
                         stock.isLowStock ? 'Faible' :
                         'Normal'}
                      </span>
                    </td>
                    {selectedMagasin === 'all' && (
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-semibold text-gray-700">
                          {(() => {
                            const totalProduit = allStocks
                              .filter(s => parseInt(s.produit_id) === parseInt(stock.produit_id))
                              .reduce((sum, s) => sum + s.quantite_disponible, 0);
                            return totalProduit.toFixed(2) + ' T';
                          })()}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredStocks.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun stock trouvé</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GestionTonnageStock;