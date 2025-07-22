import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, Clock, Building2, Truck, BarChart3 } from 'lucide-react';
import navireDispatchingService from '../../services/navireDispatching';
import GestionTonnage from './GestionTonnage';
import { formatNumber } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';

export default function StockMagasinOperator() {
  const { user } = useAuth();
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' ou 'tonnage'

  useEffect(() => {
    fetchStockMagasin();
  }, []);

  const fetchStockMagasin = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching stock for operator:', user);
      const data = await navireDispatchingService.getStockMagasin();
      console.log('Stock data received:', data);
      setStockData(data);
    } catch (error) {
      console.error('Erreur complète:', error);
      console.error('Response:', error.response);
      setError('Erreur lors du chargement du stock');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (!stockData) {
    return (
      <div className="text-center py-8">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Aucune donnée de stock disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec onglets */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Stock du Magasin: {stockData.magasin_nom}
          </h2>
        </div>

        {/* Onglets de navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('stock')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'stock'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Vue Stock
            </button>
            <button
              onClick={() => setActiveTab('tonnage')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tonnage'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Truck className="w-4 h-4 inline mr-2" />
              Gestion Tonnage
            </button>
          </nav>
        </div>
      </div>

      {/* Contenu selon l'onglet actif */}
      {activeTab === 'tonnage' ? (
        <GestionTonnage />
      ) : (
        <div className="space-y-6">

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <Package className="w-8 h-8 text-blue-500" />
            <span className="text-2xl font-bold text-blue-600">
              {stockData.totaux.nombre_produits}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">Produits</h3>
          <p className="text-sm text-gray-600">Types de produits</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <span className="text-2xl font-bold text-green-600">
              {formatNumber(stockData.totaux.total_dispatche)}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">Total Dispatché</h3>
          <p className="text-sm text-gray-600">Tonnes dispatchées</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <Package className="w-8 h-8 text-purple-500" />
            <span className="text-2xl font-bold text-purple-600">
              {formatNumber(stockData.totaux.total_receptionne)}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">Total Réceptionné</h3>
          <p className="text-sm text-gray-600">Tonnes réceptionnées</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-orange-500" />
            <span className="text-2xl font-bold text-orange-600">
              {formatNumber(stockData.totaux.total_en_attente)}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">En Attente</h3>
          <p className="text-sm text-gray-600">Tonnes à réceptionner</p>
        </div>
      </div>

      {/* Tableau détaillé du stock */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold">Détail du Stock par Produit</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Référence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité Dispatchée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité Réceptionnée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  En Attente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Navires
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stockData.stock.map((item) => (
                <tr key={item.produit_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.produit_nom}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {item.categorie}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(item.quantite_totale_dispatche)} {item.unite}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="text-green-600 font-medium">
                      {formatNumber(item.quantite_receptionnee)} {item.unite}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {parseFloat(item.quantite_en_attente) > 0 ? (
                      <span className="text-orange-600 font-medium">
                        {formatNumber(item.quantite_en_attente)} {item.unite}
                      </span>
                    ) : (
                      <span className="text-gray-400">0 {item.unite}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.nombre_navires} navire{item.nombre_navires > 1 ? 's' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {stockData.stock.length === 0 && (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun stock disponible pour ce magasin</p>
          </div>
        )}
      </div>
        </div>
      )}
    </div>
  );
}