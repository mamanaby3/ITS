import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StockMagasinOperator from '../components/operator/StockMagasinOperator';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingState from '../components/ui/LoadingState';
import ErrorMessage from '../components/ui/ErrorMessage';
import { useAuth } from '../hooks/useAuth';
import { useMagasins } from '../hooks/useMagasins';
import stockService from '../services/stock';
import magasinsService from '../services/magasins';
import { 
  Package, 
  TruckIcon,
  AlertCircle,
  RefreshCw,
  Filter,
  Store,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';

const Stock = () => {
  const navigate = useNavigate();
  const { user, isManager, isAdmin, isOperator } = useAuth();
  const { magasins, loading: magasinsLoading } = useMagasins();
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedMagasin, setSelectedMagasin] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stocksByMagasin, setStocksByMagasin] = useState({});

  useEffect(() => {
    if (!magasinsLoading) {
      loadAllMagasinsStock();
    }
  }, [magasinsLoading]);

  useEffect(() => {
    filterStocks();
  }, [stocks, selectedProduct, selectedMagasin, searchTerm]);

  const loadAllMagasinsStock = async () => {
    try {
      setLoading(true);
      const stockData = {};
      const allStocks = [];

      // Charger le stock de tous les magasins
      for (const magasin of magasins) {
        try {
          const magasinStock = await stockService.getStockByMagasin(magasin.id);
          stockData[magasin.id] = magasinStock;
          
          // Ajouter le nom du magasin à chaque item de stock
          const enrichedStock = magasinStock.map(item => ({
            ...item,
            magasin_nom: magasin.nom,
            magasin_id: magasin.id
          }));
          
          allStocks.push(...enrichedStock);
        } catch (error) {
          console.error(`Erreur chargement stock magasin ${magasin.nom}:`, error);
        }
      }

      setStocksByMagasin(stockData);
      setStocks(allStocks);
    } catch (error) {
      toast.error('Erreur lors du chargement du stock');
    } finally {
      setLoading(false);
    }
  };

  const filterStocks = () => {
    let filtered = stocks;

    if (selectedProduct) {
      filtered = filtered.filter(s => s.produit_id === selectedProduct);
    }

    if (selectedMagasin && selectedMagasin !== 'all') {
      filtered = filtered.filter(s => s.magasin_id === selectedMagasin);
    }

    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.produit?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.origine?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredStocks(filtered);
  };

  const exportStock = () => {
    try {
      const dataToExport = filteredStocks.map(stock => ({
        'Produit': stock.produit?.nom || 'N/A',
        'Code': stock.produit?.code || 'N/A',
        'Origine': stock.origine || 'N/A',
        'Quantité (T)': stock.quantite_disponible || stock.quantite || 0,
        'Magasin': stock.magasin_nom || stock.magasin?.nom || 'Principal',
        'État': stock.quantite_disponible === 0 ? 'Épuisé' :
                stock.quantite_disponible < 50 ? 'Faible' : 'Disponible',
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
        : `stock_${magasins.find(m => m.id === selectedMagasin)?.nom || 'magasin'}_${new Date().toISOString().split('T')[0]}.csv`;
      
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

  // Si l'utilisateur est un opérateur, afficher sa vue spéciale
  if (isOperator()) {
    return <StockMagasinOperator />;
  }

  // Vue simplifiée pour les managers
  return (
    <div className="space-y-6">
      {/* En-tête simplifié */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Tonnages</h1>
            <p className="text-gray-600 mt-1">
              {new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <button
            onClick={loadAllMagasinsStock}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Résumé simple */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Stock Total</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {filteredStocks.reduce((sum, s) => sum + (s.quantite_disponible || 0), 0).toFixed(2)} T
              </p>
            </div>
            <Package className="h-12 w-12 text-blue-300" />
          </div>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900">Produits en Stock</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {new Set(filteredStocks.map(s => s.produit_id)).size}
              </p>
            </div>
            <Package className="h-12 w-12 text-green-300" />
          </div>
        </Card>

        <Card className={`${
          filteredStocks.some(s => s.quantite_disponible < 50) 
            ? 'bg-red-50 border-red-200' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                filteredStocks.some(s => s.quantite_disponible < 50) 
                  ? 'text-red-900' 
                  : 'text-gray-900'
              }`}>
                Alertes Stock
              </p>
              <p className={`text-3xl font-bold mt-2 ${
                filteredStocks.some(s => s.quantite_disponible < 50) 
                  ? 'text-red-600' 
                  : 'text-gray-600'
              }`}>
                {filteredStocks.filter(s => s.quantite_disponible < 50).length}
              </p>
            </div>
            <AlertCircle className={`h-12 w-12 ${
              filteredStocks.some(s => s.quantite_disponible < 50) 
                ? 'text-red-300' 
                : 'text-gray-300'
            }`} />
          </div>
        </Card>
      </div>

      {/* Barre de recherche et filtres */}
      <Card>
        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
            <Button
              variant="secondary"
              icon={<Download />}
              onClick={exportStock}
              title="Exporter le stock"
            >
              Exporter
            </Button>
            <Button
              variant="primary"
              icon={<TruckIcon />}
              onClick={() => navigate('/livraisons')}
            >
              Nouvelle Livraison
            </Button>
          </div>
          
          {/* Résumé par magasin si "Tous les magasins" est sélectionné */}
          {selectedMagasin === 'all' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              {magasins.map(magasin => {
                const magasinStock = stocksByMagasin[magasin.id] || [];
                const totalQuantite = magasinStock.reduce((sum, item) => sum + (item.quantite || 0), 0);
                const hasAlert = magasinStock.some(item => item.quantite < 50);
                
                return (
                  <div
                    key={magasin.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      hasAlert ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedMagasin(magasin.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{magasin.nom}</p>
                        <p className={`text-lg font-bold ${hasAlert ? 'text-red-600' : 'text-gray-900'}`}>
                          {totalQuantite.toFixed(2)} T
                        </p>
                      </div>
                      <Store className={`h-8 w-8 ${hasAlert ? 'text-red-400' : 'text-gray-400'}`} />
                    </div>
                    {hasAlert && (
                      <p className="text-xs text-red-600 mt-1">
                        {magasinStock.filter(item => item.quantite < 50).length} alertes
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Tableau simple des stocks */}
      <Card>
        <LoadingState loading={loading}>
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
                    Magasin
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    État
                  </th>
                  {selectedMagasin === 'all' && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Total
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStocks.map((stock) => (
                  <tr key={stock.id} className="hover:bg-gray-50">
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
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {stock.magasin_nom || stock.magasin?.nom || 'Principal'}
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
                    {selectedMagasin === 'all' && (
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-semibold text-gray-700">
                          {(() => {
                            const totalProduit = stocks
                              .filter(s => s.produit_id === stock.produit_id)
                              .reduce((sum, s) => sum + (s.quantite_disponible || s.quantite || 0), 0);
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
        </LoadingState>
      </Card>
    </div>
  );
};

export default Stock;