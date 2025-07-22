import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Truck, Package, Eye, CheckCircle, Clock, Filter, Download } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Alert, AlertDescription } from '../ui/Alert';

const DispatchList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtres
  const [filters, setFilters] = useState({
    statut: '',
    magasin_id: '',
    date_debut: '',
    date_fin: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [magasins, setMagasins] = useState([]);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les magasins pour les filtres
      if (magasins.length === 0) {
        const magasinsRes = await api.get('/magasins');
        setMagasins(magasinsRes.data);
      }
      
      // Charger les dispatches avec filtres
      const params = {};
      if (filters.statut) params.statut = filters.statut;
      if (filters.magasin_id) params.magasin_id = filters.magasin_id;
      if (filters.date_debut) params.date_debut = filters.date_debut;
      if (filters.date_fin) params.date_fin = filters.date_fin;
      
      const response = await api.get('/dispatching', { params });
      setDispatches(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des dispatches');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      statut: '',
      magasin_id: '',
      date_debut: '',
      date_fin: ''
    });
  };

  const getStatutBadge = (statut) => {
    switch (statut) {
      case 'complete':
        return 'bg-green-100 text-green-800';
      case 'en_cours':
        return 'bg-blue-100 text-blue-800';
      case 'planifie':
        return 'bg-gray-100 text-gray-800';
      case 'annule':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeDispatchBadge = (dispatch) => {
    if (dispatch.quantite_client > 0 && dispatch.quantite_stock > 0) {
      return { class: 'bg-purple-100 text-purple-800', text: 'Mixte' };
    } else if (dispatch.quantite_client > 0) {
      return { class: 'bg-blue-100 text-blue-800', text: 'Client Direct' };
    } else {
      return { class: 'bg-green-100 text-green-800', text: 'Stock Magasin' };
    }
  };

  const calculateProgress = (dispatch) => {
    if (!dispatch.livraisons || dispatch.livraisons.length === 0) return 0;
    
    const totalLivre = dispatch.livraisons
      .filter(l => l.statut !== 'annulee')
      .reduce((sum, l) => sum + parseFloat(l.quantite_livree), 0);
    
    return (totalLivre / dispatch.quantite_totale) * 100;
  };

  const canRecordDelivery = (dispatch) => {
    // Un magasinier peut enregistrer une livraison si le dispatch concerne son magasin destination
    return user.role === 'operator' && 
           user.magasin_id === dispatch.magasin_destination_id &&
           dispatch.statut !== 'complete' &&
           dispatch.statut !== 'annule';
  };

  const exportToExcel = async () => {
    try {
      const response = await api.get('/dispatching/export', {
        params: filters,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dispatches_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Erreur export:', err);
    }
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
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="w-6 h-6" />
            Gestion des Dispatches
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filtres
            </button>
            {user.role === 'manager' && (
              <>
                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  Exporter
                </button>
                <button
                  onClick={() => navigate('/dispatching/create')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau Dispatch
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filtres */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <select
                  name="statut"
                  value={filters.statut}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous</option>
                  <option value="planifie">Planifié</option>
                  <option value="en_cours">En cours</option>
                  <option value="complete">Complété</option>
                  <option value="annule">Annulé</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Magasin
                </label>
                <select
                  name="magasin_id"
                  value={filters.magasin_id}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous</option>
                  {magasins.map(magasin => (
                    <option key={magasin.id} value={magasin.id}>
                      {magasin.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date début
                </label>
                <input
                  type="date"
                  name="date_debut"
                  value={filters.date_debut}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date fin
                </label>
                <input
                  type="date"
                  name="date_fin"
                  value={filters.date_fin}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={resetFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Message d'erreur */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Liste des dispatches */}
      {dispatches.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucun dispatch trouvé</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numéro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantités
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progression
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dispatches.map((dispatch) => {
                  const progress = calculateProgress(dispatch);
                  const typeInfo = getTypeDispatchBadge(dispatch);
                  
                  return (
                    <tr key={dispatch.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {dispatch.numero_dispatch}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(dispatch.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {dispatch.client?.nom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {dispatch.produit?.nom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-1">
                          <div>Total: {dispatch.quantite_totale} T</div>
                          {dispatch.quantite_client > 0 && (
                            <div className="text-xs text-blue-600">
                              Client: {dispatch.quantite_client} T
                            </div>
                          )}
                          {dispatch.quantite_stock > 0 && (
                            <div className="text-xs text-green-600">
                              Stock: {dispatch.quantite_stock} T
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${typeInfo.class}`}>
                          {typeInfo.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 mt-1">
                          {progress.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatutBadge(dispatch.statut)}`}>
                          {dispatch.statut === 'complete' ? 'Complété' :
                           dispatch.statut === 'en_cours' ? 'En cours' :
                           dispatch.statut === 'planifie' ? 'Planifié' :
                           'Annulé'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/dispatching/${dispatch.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canRecordDelivery(dispatch) && (
                            <button
                              onClick={() => navigate(`/dispatching/${dispatch.id}/delivery`)}
                              className="text-green-600 hover:text-green-900"
                              title="Enregistrer une livraison"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DispatchList;