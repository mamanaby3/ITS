import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Calendar, AlertTriangle, CheckCircle, 
  TrendingUp, TrendingDown, Package, Building2,
  Filter, Download, RefreshCw
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatDate, formatNumber } from '../utils/format';
import * as XLSX from 'xlsx';

const RapportEcarts = () => {
  const [loading, setLoading] = useState(false);
  const [ecarts, setEcarts] = useState([]);
  const [stats, setStats] = useState({});
  const [magasins, setMagasins] = useState([]);
  const [produits, setProduits] = useState([]);
  const [filtres, setFiltres] = useState({
    dateDebut: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateFin: new Date().toISOString().split('T')[0],
    magasin: 'tous',
    produit: 'tous',
    typeEcart: 'tous' // tous, positif, negatif, nul
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadData();
  }, [filtres]);

  const loadInitialData = async () => {
    try {
      const [magasinsRes, produitsRes] = await Promise.all([
        api.get('/api/magasins'),
        api.get('/api/produits')
      ]);
      setMagasins(magasinsRes.data || []);
      setProduits(produitsRes.data || []);
    } catch (error) {
      console.error('Erreur chargement données initiales:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        date_debut: filtres.dateDebut,
        date_fin: filtres.dateFin,
        magasin_id: filtres.magasin,
        produit_id: filtres.produit,
        type_ecart: filtres.typeEcart
      };

      console.log('Sending params:', params);
      const response = await api.get('/api/rapport-ecarts/ecarts', { params });
      setEcarts(response.ecarts || []);
      setStats(response.stats || {});
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut) => {
    switch (statut) {
      case 'conforme':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Conforme
          </span>
        );
      case 'manquant':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <TrendingDown className="w-3 h-3 mr-1" />
            Manquant
          </span>
        );
      case 'excedent':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <TrendingUp className="w-3 h-3 mr-1" />
            Excédent
          </span>
        );
      default:
        return null;
    }
  };


  const exportToExcel = () => {
    const dataToExport = ecarts.map(e => ({
      Date: formatDate(e.date_mouvement),
      Magasin: e.magasin_nom,
      Produit: e.produit_nom,
      'Quantité Dispatchée': e.quantite_dispatchee,
      'Quantité Entrée': e.quantite_entree,
      'Quantité Sortie': e.quantite_sortie,
      'Écart D/E': e.ecart_dispatch_entree,
      'Écart %': e.ecart_pourcentage + '%',
      'Ratio E/S': e.rapport_entree_sortie || '-',
      Statut: e.statut
    }));
    const filename = `rapport_ecarts_${filtres.dateDebut}_${filtres.dateFin}.xlsx`;

    // Créer le fichier Excel
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rapport');
    XLSX.writeFile(wb, filename);
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
                Rapport des Écarts
              </h1>
              <p className="text-gray-600 mt-1">
                Comparaison des quantités dispatchées vs entrées et analyse du rapport entrée/sortie par magasin
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={loadData}
                disabled={loading}
                className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                title="Actualiser"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
            </div>
          </div>


          {/* Filtres */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date début
              </label>
              <input
                type="date"
                value={filtres.dateDebut}
                onChange={(e) => setFiltres(prev => ({ ...prev, dateDebut: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date fin
              </label>
              <input
                type="date"
                value={filtres.dateFin}
                onChange={(e) => setFiltres(prev => ({ ...prev, dateFin: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Magasin
              </label>
              <select
                value={filtres.magasin}
                onChange={(e) => setFiltres(prev => ({ ...prev, magasin: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="tous">Tous les magasins</option>
                {magasins.map(magasin => (
                  <option key={magasin.id} value={magasin.id}>
                    {magasin.nom}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Produit
              </label>
              <select
                value={filtres.produit}
                onChange={(e) => setFiltres(prev => ({ ...prev, produit: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="tous">Tous les produits</option>
                {produits.map(produit => (
                  <option key={produit.id} value={produit.id}>
                    {produit.nom}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type d'écart
              </label>
              <select
                value={filtres.typeEcart}
                onChange={(e) => setFiltres(prev => ({ ...prev, typeEcart: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="tous">Tous</option>
                <option value="positif">Manquants</option>
                <option value="negatif">Excédents</option>
                <option value="nul">Conformes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistiques Écarts */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600">Total lignes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_lignes || 0}</p>
            </div>
            
            <div className="bg-blue-50 rounded-lg shadow-md p-4 border border-blue-200">
              <p className="text-sm text-blue-700">Total dispatché</p>
              <p className="text-2xl font-bold text-blue-600">{formatNumber(stats.total_dispatche || 0)} T</p>
            </div>
            
            <div className="bg-green-50 rounded-lg shadow-md p-4 border border-green-200">
              <p className="text-sm text-green-700">Total entrées</p>
              <p className="text-2xl font-bold text-green-600">{formatNumber(stats.total_entree || 0)} T</p>
            </div>
            
            <div className="bg-red-50 rounded-lg shadow-md p-4 border border-red-200">
              <p className="text-sm text-red-700">Total sorties</p>
              <p className="text-2xl font-bold text-red-600">{formatNumber(stats.total_sortie || 0)} T</p>
            </div>
            
            <div className="bg-orange-50 rounded-lg shadow-md p-4 border border-orange-200">
              <p className="text-sm text-orange-700">Écart total</p>
              <p className="text-2xl font-bold text-orange-600">{formatNumber(stats.total_ecart || 0)} T</p>
            </div>
            
            <div className="bg-purple-50 rounded-lg shadow-md p-4 border border-purple-200">
              <p className="text-sm text-purple-700">Taux conformité</p>
              <p className="text-2xl font-bold text-purple-600">{stats.taux_conformite || 0}%</p>
            </div>
            
            <div className="bg-indigo-50 rounded-lg shadow-md p-4 border border-indigo-200">
              <p className="text-sm text-indigo-700">Ratio E/S global</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.rapport_global_entree_sortie || '-'}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg shadow-md p-4 border border-gray-200">
              <div className="flex flex-col gap-1 text-xs">
                <span className="text-green-600">✓ Conformes: {stats.conformes || 0}</span>
                <span className="text-orange-600">↓ Manquants: {stats.manquants || 0}</span>
                <span className="text-blue-600">↑ Excédents: {stats.excedents || 0}</span>
              </div>
            </div>
          </div>
        )}


        {/* Tableau des écarts */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Magasin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Dispatché (T)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Entrée (T)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sortie (T)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Écart D/E</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ratio E/S</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : ecarts.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                        Aucun écart trouvé pour les filtres sélectionnés
                      </td>
                    </tr>
                  ) : (
                    ecarts.map((ecart, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(ecart.date_mouvement)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{ecart.magasin_nom}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div>
                            <div className="font-medium">{ecart.produit_nom}</div>
                            <div className="text-xs text-gray-500">{ecart.produit_reference}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                          {formatNumber(ecart.quantite_dispatchee)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                          {formatNumber(ecart.quantite_entree)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                          {formatNumber(ecart.quantite_sortie)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${
                          ecart.ecart_dispatch_entree > 0 ? 'text-orange-600' :
                          ecart.ecart_dispatch_entree < 0 ? 'text-blue-600' :
                          'text-green-600'
                        }`}>
                          {ecart.ecart_dispatch_entree > 0 ? '+' : ''}{formatNumber(ecart.ecart_dispatch_entree)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                          {ecart.rapport_entree_sortie ? 
                            <span className={`${
                              ecart.rapport_entree_sortie === 1 ? 'text-green-600' :
                              ecart.rapport_entree_sortie > 1 ? 'text-blue-600' :
                              'text-orange-600'
                            }`}>
                              {parseFloat(ecart.rapport_entree_sortie).toFixed(2)}
                            </span>
                            : <span className="text-gray-400">-</span>
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatutBadge(ecart.statut)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
      </div>
    </div>
  );
};

export default RapportEcarts;