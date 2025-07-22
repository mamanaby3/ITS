import React, { useState, useEffect } from 'react';
import { 
  Package, TrendingUp, TrendingDown, BarChart3, Building, 
  Calendar, Users, Filter, Download, History, RefreshCw
} from 'lucide-react';
import { formatNumber, formatDate } from '../../utils/format';
import { StockExportButton } from '../ui/ExcelExportButton';
import { exportToPDF } from '../../utils/exportUtils';
import dashboardService from '../../services/dashboard';

const TableauBordTonnage = ({ 
  mouvements = [], 
  produits = [], 
  magasins = [], 
  clients = [],
  onRefresh 
}) => {
  // États pour les filtres
  const [filters, setFilters] = useState({
    magasin_id: '',
    produit_id: '',
    client_id: '',
    date_debut: '',
    date_fin: '',
    type_mouvement: '' // 'entree', 'sortie', ou ''
  });

  const [indicateurs, setIndicateurs] = useState({
    totalReceptionne: 0,
    totalLivre: 0,
    stockRestant: 0,
    nombreEntrees: 0,
    nombreSorties: 0,
    tauxRotation: 0
  });

  const [stockParProduit, setStockParProduit] = useState([]);
  const [stockParMagasin, setStockParMagasin] = useState([]);
  const [mouvementsFiltres, setMouvementsFiltres] = useState([]);
  const [loading, setLoading] = useState(false);

  // Calculer les indicateurs
  useEffect(() => {
    calculerIndicateurs();
    // Récupérer le total réceptionné depuis la base de données
    fetchTotalReceptionne();
  }, [mouvements, filters]);

  const calculerIndicateurs = () => {
    // Filtrer les mouvements selon les critères
    let mouvementsFiltres = [...mouvements];

    // Appliquer les filtres
    if (filters.magasin_id) {
      mouvementsFiltres = mouvementsFiltres.filter(m => m.magasin_id === filters.magasin_id);
    }
    if (filters.produit_id) {
      mouvementsFiltres = mouvementsFiltres.filter(m => m.produit_id === filters.produit_id);
    }
    if (filters.client_id) {
      mouvementsFiltres = mouvementsFiltres.filter(m => m.client_id === filters.client_id);
    }
    if (filters.date_debut) {
      mouvementsFiltres = mouvementsFiltres.filter(m => 
        new Date(m.date) >= new Date(filters.date_debut)
      );
    }
    if (filters.date_fin) {
      mouvementsFiltres = mouvementsFiltres.filter(m => 
        new Date(m.date) <= new Date(filters.date_fin)
      );
    }
    if (filters.type_mouvement) {
      mouvementsFiltres = mouvementsFiltres.filter(m => m.type === filters.type_mouvement);
    }

    setMouvementsFiltres(mouvementsFiltres);

    // Calculer les totaux pour livraisons et autres indicateurs locaux
    const totalLivre = mouvementsFiltres
      .filter(m => m.type === 'sortie')
      .reduce((sum, m) => sum + (m.tonnage_livre || 0), 0);

    const nombreEntrees = mouvementsFiltres.filter(m => m.type === 'entree').length;
    const nombreSorties = mouvementsFiltres.filter(m => m.type === 'sortie').length;

    // Le totalReceptionne sera mis à jour par fetchTotalReceptionne()
    setIndicateurs(prev => ({
      ...prev,
      totalLivre,
      nombreEntrees,
      nombreSorties
    }));

    // Calculer stock par produit
    const stockProduits = {};
    mouvementsFiltres.forEach(m => {
      const key = m.produit_id;
      if (!stockProduits[key]) {
        stockProduits[key] = {
          produit_id: m.produit_id,
          produit_nom: m.produit?.nom || 'Produit',
          entrees: 0,
          sorties: 0,
          stock: 0
        };
      }
      
      if (m.type === 'entree') {
        stockProduits[key].entrees += m.tonnage || 0;
      } else {
        stockProduits[key].sorties += m.tonnage_livre || 0;
      }
      stockProduits[key].stock = stockProduits[key].entrees - stockProduits[key].sorties;
    });
    setStockParProduit(Object.values(stockProduits));

    // Calculer stock par magasin
    const stockMagasins = {};
    mouvementsFiltres.forEach(m => {
      const key = m.magasin_id;
      if (!stockMagasins[key]) {
        stockMagasins[key] = {
          magasin_id: m.magasin_id,
          magasin_nom: m.magasin?.nom || 'Magasin',
          entrees: 0,
          sorties: 0,
          stock: 0
        };
      }
      
      if (m.type === 'entree') {
        stockMagasins[key].entrees += m.tonnage || 0;
      } else {
        stockMagasins[key].sorties += m.tonnage_livre || 0;
      }
      stockMagasins[key].stock = stockMagasins[key].entrees - stockMagasins[key].sorties;
    });
    setStockParMagasin(Object.values(stockMagasins));
  };

  // Récupérer le total réceptionné depuis la base de données
  const fetchTotalReceptionne = async () => {
    try {
      const params = {
        produit_id: filters.produit_id || undefined,
        date_debut: filters.date_debut || undefined,
        date_fin: filters.date_fin || undefined,
        detail_produit: 'true'
      };
      
      const response = await dashboardService.getTotalReceptionne(params);
      
      if (response && response.data) {
        const totalReceptionne = response.data.total_receptionne || 0;
        const totalLivre = indicateurs.totalLivre || 0;
        const stockRestant = totalReceptionne - totalLivre;
        const tauxRotation = totalReceptionne > 0 
          ? (totalLivre / totalReceptionne) * 100 
          : 0;
        
        setIndicateurs(prev => ({
          ...prev,
          totalReceptionne,
          stockRestant,
          tauxRotation
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du total réceptionné:', error);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await onRefresh?.();
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    const data = mouvementsFiltres.map(m => ({
      date: formatDate(m.date),
      type: m.type === 'entree' ? 'Entrée' : 'Sortie',
      produit: m.produit?.nom || '-',
      magasin: m.magasin?.nom || '-',
      client: m.client?.nom || '-',
      tonnage: formatNumber(m.type === 'entree' ? m.tonnage : m.tonnage_livre) + ' T',
      reference: m.reference_bon || '-'
    }));

    const columns = [
      { key: 'date', label: 'Date', type: 'text' },
      { key: 'type', label: 'Type', type: 'text' },
      { key: 'produit', label: 'Produit', type: 'text' },
      { key: 'magasin', label: 'Magasin', type: 'text' },
      { key: 'client', label: 'Client', type: 'text' },
      { key: 'tonnage', label: 'Tonnage', type: 'text' },
      { key: 'reference', label: 'Référence', type: 'text' }
    ];

    exportToPDF('Rapport de Tonnage', data, columns);
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec titre et actions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Tableau de Bord - Gestion du Tonnage
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-50"
              title="Actualiser"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <StockExportButton 
              data={mouvementsFiltres}
              filename="rapport_tonnage"
              size="sm"
            />
            <button
              onClick={exportPDF}
              className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>

        {/* Indicateurs clés */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Réceptionné</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatNumber(indicateurs.totalReceptionne)}
                </p>
                <p className="text-xs text-green-700">Tonnes</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Total Livré</p>
                <p className="text-2xl font-bold text-red-900">
                  {formatNumber(indicateurs.totalLivre)}
                </p>
                <p className="text-xs text-red-700">Tonnes</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Stock Restant</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatNumber(indicateurs.stockRestant)}
                </p>
                <p className="text-xs text-blue-700">Tonnes</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Taux Rotation</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatNumber(indicateurs.tauxRotation, 1)}%
                </p>
                <p className="text-xs text-purple-700">Livré/Reçu</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Entrées</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {indicateurs.nombreEntrees}
                </p>
                <p className="text-xs text-yellow-700">Opérations</p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Sorties</p>
                <p className="text-2xl font-bold text-orange-900">
                  {indicateurs.nombreSorties}
                </p>
                <p className="text-xs text-orange-700">Opérations</p>
              </div>
              <TrendingDown className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Filtres</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Building className="w-4 h-4 inline mr-1" />
              Magasin
            </label>
            <select
              value={filters.magasin_id}
              onChange={(e) => handleFilterChange('magasin_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les magasins</option>
              {magasins.map(magasin => (
                <option key={magasin.id} value={magasin.id}>
                  {magasin.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Package className="w-4 h-4 inline mr-1" />
              Produit
            </label>
            <select
              value={filters.produit_id}
              onChange={(e) => handleFilterChange('produit_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les produits</option>
              {produits.map(produit => (
                <option key={produit.id} value={produit.id}>
                  {produit.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users className="w-4 h-4 inline mr-1" />
              Client
            </label>
            <select
              value={filters.client_id}
              onChange={(e) => handleFilterChange('client_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date début
            </label>
            <input
              type="date"
              value={filters.date_debut}
              onChange={(e) => handleFilterChange('date_debut', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date fin
            </label>
            <input
              type="date"
              value={filters.date_fin}
              onChange={(e) => handleFilterChange('date_fin', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={filters.type_mouvement}
              onChange={(e) => handleFilterChange('type_mouvement', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous</option>
              <option value="entree">Entrées</option>
              <option value="sortie">Sorties</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tableau stock par produit */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Stock par Produit</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Entrées (T)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sorties (T)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock (T)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stockParProduit.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.produit_nom}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                    {formatNumber(item.entrees)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                    {formatNumber(item.sorties)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold">
                    {formatNumber(item.stock)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tableau stock par magasin */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Stock par Magasin</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Magasin</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Entrées (T)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sorties (T)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock (T)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stockParMagasin.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.magasin_nom}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                    {formatNumber(item.entrees)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                    {formatNumber(item.sorties)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold">
                    {formatNumber(item.stock)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TableauBordTonnage;