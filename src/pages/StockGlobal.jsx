import React, { useState, useEffect } from 'react';
import { 
  Package, 
  RefreshCw, 
  Filter,
  Download,
  Search,
  Building2,
  AlertCircle,
  TrendingUp,
  Clock
} from 'lucide-react';
import Card from '../components/ui/Card';
import LoadingState from '../components/ui/LoadingState';
import ErrorMessage from '../components/ui/ErrorMessage';
import stockService from '../services/stock';
import magasinService from '../services/magasin';
import toast from 'react-hot-toast';
import { formatNumber } from '../utils/format';

const StockGlobal = () => {
  const [stocks, setStocks] = useState([]);
  const [magasins, setMagasins] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMagasin, setSelectedMagasin] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 secondes
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  useEffect(() => {
    filterStocks();
  }, [stocks, selectedMagasin, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stocksData, magasinsData] = await Promise.all([
        stockService.getInventaire(),
        magasinService.getAll()
      ]);
      
      // Grouper les stocks par magasin et produit
      const groupedStocks = groupStocksByMagasin(stocksData);
      setStocks(groupedStocks);
      setMagasins(magasinsData);
      setLastUpdate(new Date());
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const groupStocksByMagasin = (stocksData) => {
    const grouped = {};
    
    stocksData.forEach(stock => {
      const magasinId = stock.magasin_id || 'principal';
      const magasinNom = stock.magasin?.nom || 'Magasin Principal';
      
      if (!grouped[magasinId]) {
        grouped[magasinId] = {
          magasin_id: magasinId,
          magasin_nom: magasinNom,
          produits: [],
          total_stock: 0,
          total_produits: 0,
          alertes: 0
        };
      }
      
      grouped[magasinId].produits.push(stock);
      grouped[magasinId].total_stock += stock.quantite_disponible || 0;
      grouped[magasinId].total_produits += 1;
      if (stock.quantite_disponible < 50) {
        grouped[magasinId].alertes += 1;
      }
    });
    
    return Object.values(grouped);
  };

  const filterStocks = () => {
    let filtered = stocks;

    if (selectedMagasin !== 'all') {
      filtered = filtered.filter(s => s.magasin_id === selectedMagasin);
    }

    if (searchTerm) {
      filtered = filtered.map(magasin => ({
        ...magasin,
        produits: magasin.produits.filter(p => 
          p.produit?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.origine?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(m => m.produits.length > 0);
    }

    setFilteredStocks(filtered);
  };

  const exportToCSV = () => {
    const headers = ['Magasin', 'Produit', 'Code', 'Origine', 'Quantité', 'État'];
    const rows = [];

    filteredStocks.forEach(magasin => {
      magasin.produits.forEach(produit => {
        rows.push([
          magasin.magasin_nom,
          produit.produit?.nom || 'N/A',
          produit.produit?.code || 'N/A',
          produit.origine || 'N/A',
          produit.quantite_disponible?.toFixed(2) || '0.00',
          produit.quantite_disponible === 0 ? 'Épuisé' :
          produit.quantite_disponible < 50 ? 'Faible' : 'Disponible'
        ]);
      });
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `stock_global_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Stock exporté avec succès');
  };

  const getTotalStats = () => {
    const stats = {
      total_stock: 0,
      total_produits: 0,
      total_alertes: 0,
      total_magasins: filteredStocks.length
    };

    filteredStocks.forEach(magasin => {
      stats.total_stock += magasin.total_stock;
      stats.total_produits += magasin.produits.length;
      stats.total_alertes += magasin.alertes;
    });

    return stats;
  };

  const stats = getTotalStats();

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Global - Tous les Magasins</h1>
            <p className="text-gray-600 mt-1">
              Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value={10000}>10 sec</option>
              <option value={30000}>30 sec</option>
              <option value={60000}>1 min</option>
              <option value={300000}>5 min</option>
            </select>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Exporter CSV
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Stock Total</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {formatNumber(stats.total_stock)} T
              </p>
            </div>
            <Package className="h-12 w-12 text-blue-300" />
          </div>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900">Magasins Actifs</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.total_magasins}
              </p>
            </div>
            <Building2 className="h-12 w-12 text-green-300" />
          </div>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-900">Total Produits</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {stats.total_produits}
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-purple-300" />
          </div>
        </Card>

        <Card className={`${
          stats.total_alertes > 0 
            ? 'bg-red-50 border-red-200' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                stats.total_alertes > 0 
                  ? 'text-red-900' 
                  : 'text-gray-900'
              }`}>
                Alertes Stock
              </p>
              <p className={`text-3xl font-bold mt-2 ${
                stats.total_alertes > 0 
                  ? 'text-red-600' 
                  : 'text-gray-600'
              }`}>
                {stats.total_alertes}
              </p>
            </div>
            <AlertCircle className={`h-12 w-12 ${
              stats.total_alertes > 0 
                ? 'text-red-300' 
                : 'text-gray-300'
            }`} />
          </div>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              value={selectedMagasin}
              onChange={(e) => setSelectedMagasin(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les magasins</option>
              {magasins.map(magasin => (
                <option key={magasin.id} value={magasin.id}>
                  {magasin.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Vue par magasin */}
      <LoadingState loading={loading}>
        <div className="space-y-6">
          {filteredStocks.map((magasinStock) => (
            <Card key={magasinStock.magasin_id}>
              <div className="p-6">
                {/* En-tête du magasin */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {magasinStock.magasin_nom}
                    </h3>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-gray-600">
                      Stock total: <span className="font-bold text-gray-900">
                        {formatNumber(magasinStock.total_stock)} T
                      </span>
                    </span>
                    <span className="text-gray-600">
                      Produits: <span className="font-bold text-gray-900">
                        {magasinStock.produits.length}
                      </span>
                    </span>
                    {magasinStock.alertes > 0 && (
                      <span className="text-red-600 font-medium flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {magasinStock.alertes} alertes
                      </span>
                    )}
                  </div>
                </div>

                {/* Tableau des produits */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Produit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Origine
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantité (T)
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          État
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {magasinStock.produits.map((stock, index) => (
                        <tr key={`${stock.id}-${index}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {stock.produit?.nom || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              Code: {stock.produit?.code || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {stock.origine || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`text-lg font-bold ${
                              stock.quantite_disponible < 50 ? 'text-red-600' :
                              stock.quantite_disponible < 100 ? 'text-orange-600' :
                              'text-green-600'
                            }`}>
                              {stock.quantite_disponible?.toFixed(2) || '0.00'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              stock.quantite_disponible === 0 ? 'bg-red-100 text-red-800' :
                              stock.quantite_disponible < 50 ? 'bg-orange-100 text-orange-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {stock.quantite_disponible === 0 ? 'Épuisé' :
                               stock.quantite_disponible < 50 ? 'Faible' :
                               'Disponible'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          ))}

          {filteredStocks.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun stock trouvé</p>
            </div>
          )}
        </div>
      </LoadingState>
    </div>
  );
};

export default StockGlobal;