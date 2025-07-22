import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, Calendar, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatNumber, formatDate } from '../utils/format';

const DetailsMagasinTonnage = () => {
  const { magasinId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [magasin, setMagasin] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [totaux, setTotaux] = useState({
    stock_total: 0,
    nombre_produits: 0,
    nombre_dispatches: 0
  });
  
  // Filtres - Ajustons pour inclure les dates futures
  const [dateDebut, setDateDebut] = useState('2025-06-01');
  const [dateFin, setDateFin] = useState('2025-12-31');

  useEffect(() => {
    loadMagasinData();
  }, [magasinId, dateDebut, dateFin]);

  const loadMagasinData = async () => {
    try {
      setLoading(true);
      
      // Charger les informations du magasin
      try {
        const magasinRes = await api.get(`/magasins/${magasinId}`);
        setMagasin(magasinRes);
      } catch (err) {
        console.log('Erreur chargement magasin:', err);
      }
      
      // Charger le stock du magasin
      const stockData = await api.get(`/navire-dispatching/stock-magasin?magasin_id=${magasinId}`);
      console.log('Stock Response:', stockData);
      console.log('Stock array:', stockData.stock);
      console.log('Totaux:', stockData.totaux);
      
      // L'intercepteur retourne déjà response.data, donc stockData contient directement l'objet
      if (stockData && stockData.stock) {
        setStocks(stockData.stock);
        setTotaux(stockData.totaux || {
          stock_total: 0,
          nombre_produits: 0,
          nombre_dispatches: 0
        });
        console.log('Stock state updated with', stockData.stock.length, 'items');
      }
      
      // Charger l'historique des dispatches
      const dispatchesRes = await api.get(`/navire-dispatching/historique-dispatches?magasin_id=${magasinId}&date_debut=${dateDebut}&date_fin=${dateFin}`);
      console.log('Dispatches Response:', dispatchesRes);
      
      // L'API retourne un tableau vide ou un tableau de dispatches
      setDispatches(Array.isArray(dispatchesRes) ? dispatchesRes : []);
      
    } catch (error) {
      console.error('Erreur chargement données magasin:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    // Logique d'export Excel
    toast.success('Export en cours...');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Package className="h-6 w-6" />
                Détails - {magasin?.nom || 'Magasin'}
              </h1>
              <p className="text-gray-600">Stock détaillé et historique des mouvements</p>
            </div>
          </div>
          <Button onClick={exportData}>
            Exporter
          </Button>
        </div>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Stock Total</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {formatNumber(totaux.stock_total)} T
                </p>
              </div>
              <Package className="h-10 w-10 text-blue-600 opacity-20" />
            </div>
          </div>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900">Produits</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {totaux.nombre_produits}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-600 opacity-20" />
            </div>
          </div>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-900">Dispatches</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {totaux.nombre_dispatches || dispatches.length}
                </p>
              </div>
              <TrendingDown className="h-10 w-10 text-purple-600 opacity-20" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filtres de date */}
      <Card className="p-6">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date début
            </label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button
            variant="primary"
            onClick={loadMagasinData}
          >
            Filtrer
          </Button>
        </div>
      </Card>

      {/* Stock par produit */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Stock par Produit</h2>
          
          {stocks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun stock disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Actuel
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Dispatché
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre Navires
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stocks.map((stock, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-gray-900">
                          {stock.produit_nom}
                        </div>
                        <div className="text-xs text-gray-500">
                          {stock.reference}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-lg font-bold text-blue-600">
                          {formatNumber(stock.stock_total || stock.quantite_en_attente || 0)}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">T</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {formatNumber(stock.quantite_totale_dispatche || 0)} T
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-sm text-gray-600">
                          {stock.nombre_navires || 0}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {stock.categorie || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="py-4 px-4 text-sm font-semibold text-gray-900">
                      Total
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-lg font-bold text-blue-600">
                        {formatNumber(totaux.stock_total)}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">T</span>
                    </td>
                    <td colSpan="3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Historique des dispatches */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Historique des Dispatches</h2>
          
          {dispatches.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun dispatch sur cette période</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Navire
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clients
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dispatches.map((dispatch) => (
                    <tr key={dispatch.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4 text-sm text-gray-900">
                        {formatDate(dispatch.date_dispatching)}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900">
                        {dispatch.nom_navire}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900">
                        {dispatch.produit_nom}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-sm font-medium">
                          {formatNumber(dispatch.quantite)} T
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900">
                        {dispatch.clients || dispatch.client_nom || '-'}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
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

export default DetailsMagasinTonnage;