import React, { useState, useEffect } from 'react';
import { 
  Package, TrendingUp, TrendingDown, RotateCw,
  Calendar, Building, Filter, RefreshCw,
  FileText, Truck, AlertCircle
} from 'lucide-react';
import { formatNumber } from '../utils/format';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const GestionTonnageMagasin = () => {
  const { user } = useAuth();
  const [magasins, setMagasins] = useState([]);
  const [selectedMagasin, setSelectedMagasin] = useState('');
  const [stats, setStats] = useState({
    totalReceptionne: 0,
    totalLivre: 0,
    stockRestant: 0,
    tauxRotation: 0,
    nombreEntrees: 0,
    nombreSorties: 0
  });
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateDebut, setDateDebut] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [dateFin, setDateFin] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('entrees');

  useEffect(() => {
    loadMagasins();
  }, []);

  useEffect(() => {
    if (selectedMagasin) {
      loadMagasinData();
    }
  }, [selectedMagasin, dateDebut, dateFin]);

  const loadMagasins = async () => {
    try {
      const response = await api.get('/magasins');
      setMagasins(response.data);
      
      // Si l'utilisateur est un operator, sélectionner automatiquement son magasin
      if (user.role === 'operator' && user.magasin_id) {
        setSelectedMagasin(user.magasin_id);
      } else if (response.data.length > 0) {
        setSelectedMagasin(response.data[0].id);
      }
    } catch (error) {
      console.error('Erreur chargement magasins:', error);
      toast.error('Erreur lors du chargement des magasins');
    }
  };

  const loadMagasinData = async () => {
    if (!selectedMagasin) return;
    
    setLoading(true);
    try {
      // Charger les statistiques du magasin
      const [statsRes, mouvementsRes, stockRes] = await Promise.all([
        api.get(`/dashboard-tonnage/stats-magasin/${selectedMagasin}`, {
          params: { date_debut: dateDebut, date_fin: dateFin }
        }),
        api.get('/mouvements', {
          params: {
            magasin_id: selectedMagasin,
            date_debut: dateDebut,
            date_fin: dateFin
          }
        }),
        api.get('/stock', {
          params: { magasin_id: selectedMagasin }
        })
      ]);

      // Calculer les statistiques
      const mouvementsData = mouvementsRes.data || [];
      
      // Séparer entrées et sorties
      const entrees = mouvementsData.filter(m => 
        m.type === 'entree' || 
        (m.type === 'dispatching' && m.magasin_destination_id === selectedMagasin)
      );
      
      const sorties = mouvementsData.filter(m => 
        m.type === 'sortie' && m.magasin_id === selectedMagasin
      );

      const totalReceptionne = entrees.reduce((sum, m) => sum + parseFloat(m.quantite || 0), 0);
      const totalLivre = sorties.reduce((sum, m) => sum + parseFloat(m.quantite || 0), 0);
      const stockActuel = stockRes.data.reduce((sum, s) => sum + parseFloat(s.quantite || 0), 0);
      
      // Calculer le taux de rotation
      const tauxRotation = totalReceptionne > 0 ? (totalLivre / totalReceptionne) * 100 : 0;

      setStats({
        totalReceptionne,
        totalLivre,
        stockRestant: stockActuel,
        tauxRotation,
        nombreEntrees: entrees.length,
        nombreSorties: sorties.length
      });

      setMouvements(mouvementsData);

    } catch (error) {
      console.error('Erreur chargement données magasin:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const getMouvementsByType = (type) => {
    if (type === 'entrees') {
      return mouvements.filter(m => 
        m.type === 'entree' || 
        (m.type === 'dispatching' && m.magasin_destination_id === selectedMagasin)
      );
    } else {
      return mouvements.filter(m => 
        m.type === 'sortie' && m.magasin_id === selectedMagasin
      );
    }
  };

  const getTypeBadge = (mouvement) => {
    if (mouvement.type === 'dispatching' && mouvement.magasin_destination_id === selectedMagasin) {
      return { text: 'Dispatch Reçu', color: 'bg-blue-100 text-blue-800' };
    }
    switch (mouvement.type) {
      case 'entree':
        return { text: 'Entrée', color: 'bg-green-100 text-green-800' };
      case 'sortie':
        return { text: 'Livraison', color: 'bg-red-100 text-red-800' };
      default:
        return { text: mouvement.type, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const currentMagasin = magasins.find(m => m.id === selectedMagasin);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-6 h-6 text-blue-600" />
                Gestion du Tonnage par Magasin
              </h1>
              <p className="text-gray-600 mt-1">
                Suivi détaillé des entrées et sorties
              </p>
            </div>
            
            <button
              onClick={loadMagasinData}
              disabled={loading || !selectedMagasin}
              className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Filtres */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="w-4 h-4 inline mr-1" />
                Magasin
              </label>
              <select
                value={selectedMagasin}
                onChange={(e) => setSelectedMagasin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={user.role === 'operator'}
              >
                <option value="">Sélectionner un magasin</option>
                {magasins.map(magasin => (
                  <option key={magasin.id} value={magasin.id}>
                    {magasin.nom} - {magasin.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date début
              </label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date fin
              </label>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Statistiques */}
        {selectedMagasin && (
          <>
            {/* Info magasin */}
            {currentMagasin && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-blue-900">
                      {currentMagasin.nom}
                    </h2>
                    <p className="text-sm text-blue-700">
                      {currentMagasin.code} • {currentMagasin.localisation}
                    </p>
                  </div>
                  <Building className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            )}

            {/* Cartes de statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {/* Total Réceptionné */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                  <span className="text-xs text-gray-500">Entrées</span>
                </div>
                <p className="text-sm text-gray-600">Total Réceptionné</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {formatNumber(stats.totalReceptionne)}
                </p>
                <p className="text-sm text-gray-500 mt-1">Tonnes</p>
              </div>

              {/* Total Livré */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingDown className="w-8 h-8 text-red-600" />
                  <span className="text-xs text-gray-500">Sorties</span>
                </div>
                <p className="text-sm text-gray-600">Total Livré</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {formatNumber(stats.totalLivre)}
                </p>
                <p className="text-sm text-gray-500 mt-1">Tonnes</p>
              </div>

              {/* Stock Restant */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <Package className="w-8 h-8 text-blue-600" />
                  <span className="text-xs text-gray-500">Actuel</span>
                </div>
                <p className="text-sm text-gray-600">Stock Restant</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {formatNumber(stats.stockRestant)}
                </p>
                <p className="text-sm text-gray-500 mt-1">Tonnes</p>
              </div>

              {/* Taux de Rotation */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <RotateCw className="w-8 h-8 text-purple-600" />
                  <span className="text-xs text-gray-500">Performance</span>
                </div>
                <p className="text-sm text-gray-600">Taux Rotation</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.tauxRotation.toFixed(2)}%
                </p>
                <p className="text-sm text-gray-500 mt-1">Livré/Reçu</p>
              </div>

              {/* Nombre d'Entrées */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="w-8 h-8 text-green-600" />
                  <span className="text-xs text-gray-500">Mouvements</span>
                </div>
                <p className="text-sm text-gray-600">Entrées</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.nombreEntrees}
                </p>
                <p className="text-sm text-gray-500 mt-1">Opérations</p>
              </div>

              {/* Nombre de Sorties */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <Truck className="w-8 h-8 text-red-600" />
                  <span className="text-xs text-gray-500">Mouvements</span>
                </div>
                <p className="text-sm text-gray-600">Sorties</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.nombreSorties}
                </p>
                <p className="text-sm text-gray-500 mt-1">Opérations</p>
              </div>
            </div>

            {/* Détail des mouvements */}
            <div className="bg-white rounded-lg shadow-md">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('entrees')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'entrees'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Entrées ({stats.nombreEntrees})
                  </button>
                  <button
                    onClick={() => setActiveTab('sorties')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'sorties'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Sorties ({stats.nombreSorties})
                  </button>
                </div>
              </div>

              {/* Liste des mouvements */}
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Produit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Référence
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantité (T)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Responsable
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getMouvementsByType(activeTab).length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                              Aucun mouvement trouvé
                            </td>
                          </tr>
                        ) : (
                          getMouvementsByType(activeTab).map((mouvement) => {
                            const badge = getTypeBadge(mouvement);
                            return (
                              <tr key={mouvement.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {new Date(mouvement.date_mouvement).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs rounded-full ${badge.color}`}>
                                    {badge.text}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {mouvement.produit?.nom}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {mouvement.reference || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                  {formatNumber(mouvement.quantite)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {mouvement.createur?.nom} {mouvement.createur?.prenom}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Message si aucun magasin sélectionné */}
        {!selectedMagasin && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3" />
              <p>Veuillez sélectionner un magasin pour voir les données</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionTonnageMagasin;