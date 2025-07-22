import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, Calendar, TrendingUp, TrendingDown, Eye, Truck } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatNumber, formatDate } from '../utils/format';

const DetailsMagasin = () => {
  const { magasinId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [magasin, setMagasin] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [mouvements, setMouvements] = useState([]);
  const [totaux, setTotaux] = useState({
    stock_total: 0,
    nombre_produits: 0,
    total_dispatch: 0,
    total_sorties: 0
  });

  useEffect(() => {
    loadMagasinData();
  }, [magasinId]);

  const loadMagasinData = async () => {
    try {
      setLoading(true);
      
      // Charger les informations du magasin
      const magasinRes = await api.get(`/magasins/${magasinId}`);
      console.log('Magasin data:', magasinRes);
      
      if (magasinRes.success && magasinRes.data) {
        setMagasin(magasinRes.data);
        
        // Utiliser les stats du magasin
        setTotaux(prev => ({
          ...prev,
          stock_total: parseFloat(magasinRes.data.stats?.stock_total || 0),
          nombre_produits: parseInt(magasinRes.data.stats?.nombre_produits || 0)
        }));
      }
      
      // Charger le stock détaillé du magasin
      const stockRes = await api.get(`/magasins/${magasinId}/stock`);
      console.log('Stock data:', stockRes);
      
      if (stockRes.success && stockRes.data) {
        setStocks(stockRes.data);
      }
      
      // Charger les mouvements récents du magasin
      const mouvementsRes = await api.get(`/mouvements?magasin_id=${magasinId}&limit=20`);
      console.log('Mouvements data:', mouvementsRes);
      
      if (mouvementsRes.success && mouvementsRes.data) {
        setMouvements(mouvementsRes.data);
        
        // Calculer les totaux des dispatch et sorties
        const dispatch = mouvementsRes.data
          .filter(m => m.type_mouvement === 'dispatch')
          .reduce((sum, m) => sum + parseFloat(m.quantite), 0);
          
        const sorties = mouvementsRes.data
          .filter(m => m.type_mouvement === 'sortie')
          .reduce((sum, m) => sum + parseFloat(m.quantite), 0);
          
        setTotaux(prev => ({
          ...prev,
          total_dispatch: dispatch,
          total_sorties: sorties
        }));
      }
      
    } catch (error) {
      console.error('Erreur chargement données magasin:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    toast.success('Export en cours...');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!magasin) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Magasin non trouvé</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Retour
        </Button>
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
                {magasin.nom}
              </h1>
              <p className="text-gray-600">
                {magasin.ville} - {magasin.zone}
              </p>
              {magasin.adresse && (
                <p className="text-sm text-gray-500">{magasin.adresse}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Capacité</p>
            <p className="text-xl font-semibold">{formatNumber(magasin.capacite)} T</p>
          </div>
        </div>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <p className="text-sm font-medium text-purple-900">Total Dispatch</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {formatNumber(totaux.total_dispatch)} T
                </p>
              </div>
              <Truck className="h-10 w-10 text-purple-600 opacity-20" />
            </div>
          </div>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-900">Total Sorties</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {formatNumber(totaux.total_sorties)} T
                </p>
              </div>
              <Truck className="h-10 w-10 text-red-600 opacity-20" />
            </div>
          </div>
        </Card>
      </div>

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
                      Quantité Disponible
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantité Réservée
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unité
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stocks.map((stock) => (
                    <tr key={stock.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-gray-900">
                          {stock.produit_nom}
                        </div>
                        <div className="text-xs text-gray-500">
                          {stock.produit_reference}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-lg font-bold text-blue-600">
                          {formatNumber(stock.quantite_disponible || 0)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-sm text-gray-600">
                          {formatNumber(stock.quantite_reservee || 0)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm text-gray-600">
                          {stock.unite || 'tonnes'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {stock.categorie_nom || 'N/A'}
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

      {/* Mouvements récents */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Mouvements Récents</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/mouvements?magasin=${magasinId}`)}
            >
              Voir tout
            </Button>
          </div>
          
          {mouvements.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun mouvement récent</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Référence
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mouvements.map((mouvement) => (
                    <tr key={mouvement.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4 text-sm text-gray-900">
                        {formatDate(mouvement.date_mouvement)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          mouvement.type_mouvement === 'entree' ? 'bg-green-100 text-green-800' :
                          mouvement.type_mouvement === 'sortie' ? 'bg-red-100 text-red-800' :
                          mouvement.type_mouvement === 'dispatch' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {mouvement.type_mouvement}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900">
                        {mouvement.produit}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={`text-sm font-medium ${
                          mouvement.type_mouvement === 'sortie' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {mouvement.type_mouvement === 'sortie' ? '-' : '+'}
                          {formatNumber(mouvement.quantite)} T
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        {mouvement.reference_document}
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

export default DetailsMagasin;