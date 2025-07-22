import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import dispatchService from '../../services/dispatch';
import { formatDate, formatNumber } from '../../utils/format';

export default function DispatchList() {
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDispatches();
  }, [filter]);

  const fetchDispatches = async () => {
    try {
      setLoading(true);
      const filters = filter !== 'all' ? { statut: filter } : {};
      const data = await dispatchService.getDispatches(filters);
      setDispatches(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'en_attente':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'en_cours':
        return <Truck className="w-4 h-4 text-blue-500" />;
      case 'termine':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'annule':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'en_attente': 'En attente',
      'en_cours': 'En cours',
      'termine': 'Terminé',
      'annule': 'Annulé'
    };
    return labels[status] || status;
  };

  const filteredDispatches = dispatches.filter(dispatch => 
    dispatch.numero_dispatch.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dispatch.client?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dispatch.produit?.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateProgress = (dispatch) => {
    if (!dispatch.rotations || dispatch.rotations.length === 0) return 0;
    const totalDelivered = dispatch.rotations
      .filter(r => r.statut !== 'en_transit')
      .reduce((sum, r) => sum + (r.quantite_livree || 0), 0);
    return (totalDelivered / dispatch.quantite_totale) * 100;
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Dispatches</h2>
        <Link
          to="/manager/dispatch/nouveau"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Package className="w-4 h-4" />
          Nouveau Dispatch
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminé</option>
            <option value="annule">Annulé</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Numéro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité (T)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destination
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
              {filteredDispatches.map((dispatch) => (
                <tr key={dispatch.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {dispatch.numero_dispatch}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dispatch.client?.nom}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dispatch.produit?.nom}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(dispatch.quantite_totale)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dispatch.magasin_destination?.nom || dispatch.client?.nom}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${calculateProgress(dispatch)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">
                      {calculateProgress(dispatch).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full">
                      {getStatusIcon(dispatch.statut)}
                      {getStatusLabel(dispatch.statut)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/manager/dispatch/${dispatch.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Détails
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDispatches.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun dispatch trouvé
          </div>
        )}
      </div>
    </div>
  );
}