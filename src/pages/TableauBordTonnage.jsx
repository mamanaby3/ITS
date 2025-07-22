import React, { useState, useEffect } from 'react';
import { 
  Package, Building, TrendingUp, TrendingDown, 
  AlertCircle, RefreshCw, Calendar, ArrowRight,
  Truck, History, BarChart3
} from 'lucide-react';
import { formatNumber } from '../utils/format';
import api from '../services/api';
import toast from 'react-hot-toast';

const TableauBordTonnage = () => {
  const [magasins, setMagasins] = useState([]);
  const [mouvements, setMouvements] = useState([]);
  const [stats, setStats] = useState({
    totalStock: 0,
    totalEntrees: 0,
    totalSorties: 0,
    totalDispatches: 0
  });
  const [loading, setLoading] = useState(false);
  const [selectedMagasin, setSelectedMagasin] = useState(null);
  const [dateDebut, setDateDebut] = useState(
    new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]
  );
  const [dateFin, setDateFin] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadDashboardData();
  }, [dateDebut, dateFin]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Charger les données des magasins avec leur stock actuel
      const [magasinsRes, mouvementsRes, statsRes] = await Promise.all([
        api.get('/dashboard-tonnage/stocks-magasins'),
        api.get('/mouvements', {
          params: {
            date_debut: dateDebut,
            date_fin: dateFin,
            type: 'all'
          }
        }),
        api.get('/dashboard-tonnage/stats-tonnage', {
          params: {
            date_debut: dateDebut,
            date_fin: dateFin
          }
        })
      ]);

      // Traiter les données des magasins
      const magasinsData = magasinsRes.data.map(mag => {
        // Calculer les mouvements pour ce magasin
        const mouvementsMagasin = mouvementsRes.data.filter(m => 
          m.magasin_id === mag.id || m.magasin_destination_id === mag.id
        );

        const entrees = mouvementsMagasin
          .filter(m => m.type === 'entree' || m.magasin_destination_id === mag.id)
          .reduce((sum, m) => sum + parseFloat(m.quantite || 0), 0);

        const sorties = mouvementsMagasin
          .filter(m => m.type === 'sortie' && m.magasin_id === mag.id)
          .reduce((sum, m) => sum + parseFloat(m.quantite || 0), 0);

        return {
          ...mag,
          entrees,
          sorties,
          stock_actuel: mag.stock_total || 0,
          nombre_mouvements: mouvementsMagasin.length
        };
      });

      setMagasins(magasinsData);
      setMouvements(mouvementsRes.data);
      setStats({
        totalStock: magasinsData.reduce((sum, m) => sum + m.stock_actuel, 0),
        totalEntrees: magasinsData.reduce((sum, m) => sum + m.entrees, 0),
        totalSorties: magasinsData.reduce((sum, m) => sum + m.sorties, 0),
        totalDispatches: statsRes.data.total_dispatches || 0
      });

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const getMouvementsMagasin = (magasinId) => {
    return mouvements
      .filter(m => m.magasin_id === magasinId || m.magasin_destination_id === magasinId)
      .sort((a, b) => new Date(b.date_mouvement) - new Date(a.date_mouvement))
      .slice(0, 5); // Derniers 5 mouvements
  };

  const getTypeMovementBadge = (mouvement) => {
    if (mouvement.type === 'dispatching' && mouvement.magasin_destination_id) {
      return { text: 'Réception Dispatch', color: 'bg-blue-100 text-blue-800' };
    }
    if (mouvement.type === 'entree') {
      return { text: 'Entrée', color: 'bg-green-100 text-green-800' };
    }
    if (mouvement.type === 'sortie') {
      return { text: 'Livraison', color: 'bg-red-100 text-red-800' };
    }
    return { text: mouvement.type, color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                Tableau de Bord - Gestion du Tonnage
              </h1>
              <p className="text-gray-600 mt-1">
                Traçabilité complète du stock par magasin après dispatching
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <span className="text-gray-500">à</span>
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              
              <button
                onClick={loadDashboardData}
                disabled={loading}
                className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stock Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats.totalStock)} T
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Entrées</p>
                <p className="text-2xl font-bold text-green-600">
                  +{formatNumber(stats.totalEntrees)} T
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sorties</p>
                <p className="text-2xl font-bold text-red-600">
                  -{formatNumber(stats.totalSorties)} T
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Dispatches</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.totalDispatches}
                </p>
              </div>
              <Truck className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Détail par magasin */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des magasins */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Stock par Magasin
                </h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : magasins.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    Aucune donnée disponible
                  </div>
                ) : (
                  magasins.map((magasin) => (
                    <div
                      key={magasin.id}
                      className={`p-6 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedMagasin?.id === magasin.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedMagasin(magasin)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Building className="w-10 h-10 text-gray-400" />
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {magasin.nom}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {magasin.code} • {magasin.nombre_mouvements} mouvements
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">
                            {formatNumber(magasin.stock_actuel)} T
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="text-green-600">
                              +{formatNumber(magasin.entrees)}
                            </span>
                            <span className="text-red-600">
                              -{formatNumber(magasin.sorties)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Barre de progression du stock */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Capacité utilisée</span>
                          <span>{Math.round((magasin.stock_actuel / 10000) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.min((magasin.stock_actuel / 10000) * 100, 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Détail du magasin sélectionné */}
          <div className="lg:col-span-1">
            {selectedMagasin ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Derniers mouvements
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {selectedMagasin.nom}
                </p>

                <div className="space-y-3">
                  {getMouvementsMagasin(selectedMagasin.id).map((mouvement) => {
                    const badge = getTypeMovementBadge(mouvement);
                    const isEntree = mouvement.type === 'entree' || 
                                   mouvement.magasin_destination_id === selectedMagasin.id;
                    
                    return (
                      <div key={mouvement.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${badge.color}`}>
                                {badge.text}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(mouvement.date_mouvement).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 mt-1">
                              {mouvement.produit?.nom}
                            </p>
                            {mouvement.reference && (
                              <p className="text-xs text-gray-500">
                                Réf: {mouvement.reference}
                              </p>
                            )}
                          </div>
                          <div className={`text-lg font-bold ${
                            isEntree ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {isEntree ? '+' : '-'}{formatNumber(mouvement.quantite)} T
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {getMouvementsMagasin(selectedMagasin.id).length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      Aucun mouvement récent
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3" />
                  <p>Sélectionnez un magasin pour voir ses mouvements</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Graphique d'évolution (placeholder) */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Évolution du Stock Global
          </h2>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-3" />
              <p>Graphique d'évolution à venir</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableauBordTonnage;