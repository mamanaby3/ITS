import React, { useState } from 'react';
import { 
  History, Calendar, Package, Truck, Building, 
  User, FileText, Eye, TrendingUp, TrendingDown 
} from 'lucide-react';
import { formatDate, formatNumber } from '../../utils/format';

const HistoriqueMouvements = ({ mouvements = [], produits = [], magasins = [], clients = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedMouvement, setSelectedMouvement] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Filtrer et trier les mouvements
  const filteredAndSortedMouvements = mouvements
    .filter(m => {
      // Filtre par recherche
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          m.reference_bon?.toLowerCase().includes(search) ||
          m.produit?.nom?.toLowerCase().includes(search) ||
          m.client?.nom?.toLowerCase().includes(search) ||
          m.magasin?.nom?.toLowerCase().includes(search) ||
          m.transporteur?.toLowerCase().includes(search) ||
          m.numero_camion?.toLowerCase().includes(search)
        );
      }
      return true;
    })
    .filter(m => {
      // Filtre par type
      if (filterType) {
        return m.type === filterType;
      }
      return true;
    })
    .sort((a, b) => {
      // Tri
      let compareValue = 0;
      switch (sortBy) {
        case 'date':
          compareValue = new Date(b.date) - new Date(a.date);
          break;
        case 'tonnage':
          const tonnageA = a.type === 'entree' ? a.tonnage : a.tonnage_livre;
          const tonnageB = b.type === 'entree' ? b.tonnage : b.tonnage_livre;
          compareValue = tonnageB - tonnageA;
          break;
        case 'produit':
          compareValue = (a.produit?.nom || '').localeCompare(b.produit?.nom || '');
          break;
        case 'magasin':
          compareValue = (a.magasin?.nom || '').localeCompare(b.magasin?.nom || '');
          break;
        default:
          compareValue = 0;
      }
      
      return sortOrder === 'desc' ? compareValue : -compareValue;
    });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleViewDetails = (mouvement) => {
    setSelectedMouvement(mouvement);
    setShowDetails(true);
  };

  const getTypeIcon = (type) => {
    return type === 'entree' ? 
      <TrendingUp className="w-4 h-4 text-green-600" /> : 
      <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getTypeBadge = (type) => {
    return type === 'entree' ? (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        Entrée
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
        Sortie
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <History className="w-5 h-5 text-gray-600" />
          Historique des Mouvements
        </h2>
        <span className="text-sm text-gray-500">
          {filteredAndSortedMouvements.length} mouvement(s)
        </span>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Rechercher par référence, produit, client, magasin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous les types</option>
          <option value="entree">Entrées seulement</option>
          <option value="sortie">Sorties seulement</option>
        </select>
      </div>

      {/* Tableau de l'historique */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Date
                  {sortBy === 'date' && (
                    <span className="text-blue-600">
                      {sortOrder === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('produit')}
              >
                <div className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  Produit
                  {sortBy === 'produit' && (
                    <span className="text-blue-600">
                      {sortOrder === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('tonnage')}
              >
                <div className="flex items-center justify-end gap-1">
                  <Truck className="w-4 h-4" />
                  Tonnage
                  {sortBy === 'tonnage' && (
                    <span className="text-blue-600">
                      {sortOrder === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('magasin')}
              >
                <div className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  Magasin
                  {sortBy === 'magasin' && (
                    <span className="text-blue-600">
                      {sortOrder === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Client
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  Référence
                </div>
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedMouvements.map((mouvement) => (
              <tr key={mouvement.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(mouvement.date || mouvement.date_entree || mouvement.date_sortie)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(mouvement.type)}
                    {getTypeBadge(mouvement.type)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {mouvement.produit?.nom || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                  {formatNumber(mouvement.type === 'entree' ? mouvement.tonnage : mouvement.tonnage_livre)} T
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {mouvement.magasin?.nom || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {mouvement.client?.nom || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {mouvement.reference_bon || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => handleViewDetails(mouvement)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Voir les détails"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedMouvements.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Aucun mouvement trouvé
        </div>
      )}

      {/* Modal de détails */}
      {showDetails && selectedMouvement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Détails du Mouvement #{selectedMouvement.id}
              </h3>
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedMouvement(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getTypeIcon(selectedMouvement.type)}
                    {getTypeBadge(selectedMouvement.type)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">
                    {formatDate(selectedMouvement.date || selectedMouvement.date_entree || selectedMouvement.date_sortie)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Produit</p>
                  <p className="font-medium">{selectedMouvement.produit?.nom || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tonnage</p>
                  <p className="font-medium">
                    {formatNumber(selectedMouvement.type === 'entree' ? selectedMouvement.tonnage : selectedMouvement.tonnage_livre)} T
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Magasin</p>
                  <p className="font-medium">{selectedMouvement.magasin?.nom || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Client</p>
                  <p className="font-medium">{selectedMouvement.client?.nom || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Référence Bon</p>
                  <p className="font-medium">{selectedMouvement.reference_bon || '-'}</p>
                </div>
                {selectedMouvement.type === 'sortie' && (
                  <div>
                    <p className="text-sm text-gray-600">Transporteur</p>
                    <p className="font-medium">{selectedMouvement.transporteur || '-'}</p>
                  </div>
                )}
              </div>

              {selectedMouvement.type === 'sortie' && selectedMouvement.numero_camion && (
                <div>
                  <p className="text-sm text-gray-600">Numéro Camion</p>
                  <p className="font-medium">{selectedMouvement.numero_camion}</p>
                </div>
              )}

              {selectedMouvement.observations && (
                <div>
                  <p className="text-sm text-gray-600">Observations</p>
                  <p className="font-medium">{selectedMouvement.observations}</p>
                </div>
              )}

              {selectedMouvement.type === 'sortie' && (
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-sm text-blue-900">
                    <strong>Stock avant sortie:</strong> {formatNumber(selectedMouvement.stock_avant || 0)} T
                  </p>
                  <p className="text-sm text-blue-900">
                    <strong>Stock après sortie:</strong> {formatNumber(selectedMouvement.stock_apres || 0)} T
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedMouvement(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoriqueMouvements;