import React, { useState, useEffect } from 'react';
import { AlertTriangle, Download, Calendar, Building2, TrendingDown } from 'lucide-react';
import navireDispatchingService from '../../services/navireDispatching';
import magasinService from '../../services/magasin';
import { formatDate, formatNumber } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';

export default function RapportEcarts() {
  const { user } = useAuth();
  const [ecarts, setEcarts] = useState([]);
  const [statistiques, setStatistiques] = useState([]);
  const [magasins, setMagasins] = useState([]);
  const [filters, setFilters] = useState({
    date_debut: '',
    date_fin: '',
    magasin_id: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMagasins();
    fetchEcarts();
  }, []);

  const fetchMagasins = async () => {
    try {
      const data = await magasinService.getMagasins();
      setMagasins(data);
    } catch (error) {
      console.error('Erreur chargement magasins:', error);
    }
  };

  const fetchEcarts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await navireDispatchingService.getRapportEcarts(filters);
      setEcarts(data.ecarts || []);
      setStatistiques(data.statistiques || []);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement du rapport');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleApplyFilters = () => {
    fetchEcarts();
  };

  const calculateTotalEcart = () => {
    return ecarts.reduce((total, ecart) => total + parseFloat(ecart.ecart || 0), 0);
  };

  const exportToExcel = () => {
    // Créer un CSV avec les données
    const headers = ['Date', 'Navire', 'Produit', 'Magasin', 'Opérateur', 'Quantité dispatchée', 'Quantité reçue', 'Écart', 'Observations'];
    const rows = ecarts.map(ecart => [
      formatDate(ecart.date_mouvement),
      ecart.nom_navire,
      ecart.produit_nom,
      ecart.magasin_nom,
      ecart.operateur_nom,
      formatNumber(ecart.quantite_dispatche),
      formatNumber(ecart.quantite_recue),
      formatNumber(ecart.ecart),
      ecart.observations.replace(/ÉCART DÉTECTÉ:.*/, '').trim()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_ecarts_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (user?.role !== 'manager') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
        Accès réservé aux managers
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          Rapport des Écarts de Réception
        </h2>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          disabled={ecarts.length === 0}
        >
          <Download className="w-4 h-4" />
          Exporter
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Filtres</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date début
            </label>
            <input
              type="date"
              name="date_debut"
              value={filters.date_debut}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
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
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Magasin
            </label>
            <select
              name="magasin_id"
              value={filters.magasin_id}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Tous les magasins</option>
              {magasins.map(magasin => (
                <option key={magasin.id} value={magasin.id}>
                  {magasin.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleApplyFilters}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Appliquer
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      {statistiques.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statistiques.map((stat) => (
            <div key={stat.magasin_nom} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <Building2 className="w-8 h-8 text-red-500" />
                <span className="text-2xl font-bold text-red-600">{stat.nombre_ecarts}</span>
              </div>
              <h3 className="font-semibold text-gray-900">{stat.magasin_nom}</h3>
              <p className="text-sm text-gray-600 mt-2">
                Total écart: <span className="font-medium text-red-600">{formatNumber(stat.total_ecart)} tonnes</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Résumé */}
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <span className="font-medium">Total des écarts détectés:</span>
          </div>
          <span className="text-xl font-bold text-red-700">
            {formatNumber(calculateTotalEcart())} tonnes
          </span>
        </div>
        <p className="text-sm text-red-600 mt-2">
          {ecarts.length} réception{ecarts.length > 1 ? 's' : ''} avec écart{ecarts.length > 1 ? 's' : ''}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Liste des écarts */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Navire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Magasin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opérateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité dispatchée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité reçue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Écart
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Observations
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ecarts.map((ecart) => (
                <tr key={ecart.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(ecart.date_mouvement)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ecart.nom_navire}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ecart.produit_nom}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ecart.magasin_nom}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ecart.operateur_nom}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(ecart.quantite_dispatche)} t
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(ecart.quantite_recue)} t
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                      -{formatNumber(ecart.ecart)} t
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {ecart.observations.replace(/ÉCART DÉTECTÉ:.*/, '').trim() || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {ecarts.length === 0 && (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun écart détecté pour cette période</p>
          </div>
        )}
      </div>
    </div>
  );
}