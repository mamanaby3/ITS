import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, Calendar, Download } from 'lucide-react';
import rotationService from '../../services/rotation';
import { formatDate, formatNumber } from '../../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

export default function EcartsReport() {
  const [rotations, setRotations] = useState([]);
  const [statistiques, setStatistiques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date_debut: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    date_fin: new Date().toISOString().split('T')[0],
    chauffeur_id: ''
  });

  useEffect(() => {
    fetchEcartsData();
  }, [filters]);

  const fetchEcartsData = async () => {
    try {
      setLoading(true);
      const data = await rotationService.getEcartsReport(filters);
      setRotations(data.rotations || []);
      setStatistiques(data.statistiques || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(rotations.map(r => ({
      'Numéro Rotation': r.numero_rotation,
      'Date': formatDate(r.heure_arrivee),
      'Chauffeur': r.chauffeur?.nom,
      'Produit': r.dispatch?.produit?.nom,
      'Client': r.dispatch?.client?.nom,
      'Quantité Prévue (T)': r.quantite_prevue || 0,
      'Quantité Livrée (T)': r.quantite_livree || 0,
      'Écart (T)': r.ecart || 0,
      'Notes': r.notes || ''
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Écarts');
    XLSX.writeFile(wb, `ecarts_${filters.date_debut}_${filters.date_fin}.xlsx`);
  };

  const chartData = statistiques.map(stat => ({
    name: stat.chauffeur?.nom || 'Inconnu',
    ecarts: stat.nombre_ecarts,
    total: parseFloat(stat.total_ecart),
    moyenne: parseFloat(stat.ecart_moyen)
  }));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalEcarts = rotations.reduce((sum, r) => sum + r.ecart, 0);
  const nombreEcarts = rotations.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-yellow-600" />
          Rapport des Écarts
        </h2>
        <button
          onClick={exportToExcel}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Exporter Excel
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Filtres</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date début
            </label>
            <input
              type="date"
              name="date_debut"
              value={filters.date_debut}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chauffeur
            </label>
            <select
              name="chauffeur_id"
              value={filters.chauffeur_id}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les chauffeurs</option>
              {statistiques.map(stat => (
                <option key={stat.chauffeur_id} value={stat.chauffeur_id}>
                  {stat.chauffeur?.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total des écarts</p>
              <p className="text-2xl font-bold text-red-600">{formatNumber(totalEcarts)} T</p>
            </div>
            <TrendingDown className="w-10 h-10 text-red-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Nombre de rotations avec écart</p>
              <p className="text-2xl font-bold">{nombreEcarts}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-yellow-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Écart moyen</p>
              <p className="text-2xl font-bold">{nombreEcarts > 0 ? formatNumber(totalEcarts / nombreEcarts) : 0} T</p>
            </div>
            <Calendar className="w-10 h-10 text-blue-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Graphique par chauffeur */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Écarts par chauffeur</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="ecarts" fill="#EF4444" name="Nombre d'écarts" />
              <Bar dataKey="total" fill="#F59E0B" name="Total écarts (T)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tableau détaillé */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Détail des rotations avec écart</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rotation</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chauffeur</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prévu</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Livré</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Écart</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rotations.map((rotation) => (
                <tr key={rotation.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{formatDate(rotation.heure_arrivee)}</td>
                  <td className="px-4 py-3 text-sm font-medium">{rotation.numero_rotation}</td>
                  <td className="px-4 py-3 text-sm">{rotation.chauffeur?.nom}</td>
                  <td className="px-4 py-3 text-sm">{rotation.dispatch?.client?.nom}</td>
                  <td className="px-4 py-3 text-sm">{rotation.dispatch?.produit?.nom}</td>
                  <td className="px-4 py-3 text-sm">{formatNumber(rotation.quantite_prevue || 0)} T</td>
                  <td className="px-4 py-3 text-sm">{formatNumber(rotation.quantite_livree || 0)} T</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-red-600 font-medium">
                      -{formatNumber(Math.abs(rotation.ecart || 0))} T
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{rotation.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rotations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun écart trouvé pour la période sélectionnée
          </div>
        )}
      </div>
    </div>
  );
}