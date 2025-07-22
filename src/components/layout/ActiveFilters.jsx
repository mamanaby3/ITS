import React, { useState, useEffect } from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';
import { useFilters } from '../../hooks/useFilters';
import magasinsService from '../../services/magasins';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';

export default function ActiveFilters() {
  const { filters, updateFilter, clearFilters } = useFilters();
  const [filterLabels, setFilterLabels] = useState({
    magasin: '',
    produit: '',
    client: ''
  });
  const [loading, setLoading] = useState(false);

  // Charger les labels des filtres actifs
  useEffect(() => {
    const loadFilterLabels = async () => {
      setLoading(true);
      const labels = { magasin: '', produit: '', client: '' };

      try {
        // Charger le nom du magasin
        if (filters.magasin_id) {
          const magasins = await magasinsService.getAll();
          const magasin = magasins.find(m => m.id === parseInt(filters.magasin_id));
          labels.magasin = magasin?.nom || 'Magasin inconnu';
        }

        // Charger le nom du produit
        if (filters.produit_id) {
          const response = await api.get(API_ENDPOINTS.PRODUITS.LIST);
          const produit = response.data.find(p => p.id === parseInt(filters.produit_id));
          labels.produit = produit?.nom || 'Produit inconnu';
        }

        // Charger le nom du client
        if (filters.client_id) {
          const response = await api.get(API_ENDPOINTS.CLIENTS.LIST);
          const client = response.data.find(c => c.id === parseInt(filters.client_id));
          labels.client = client?.nom || 'Client inconnu';
        }

        setFilterLabels(labels);
      } catch (error) {
        console.error('Erreur chargement labels filtres:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFilterLabels();
  }, [filters]);

  // Compter les filtres actifs
  const activeFilterCount = Object.values(filters).filter(value => value !== null && value !== '').length;

  // Supprimer un filtre spécifique
  const removeFilter = (filterKey) => {
    updateFilter(filterKey, null);
  };

  if (activeFilterCount === 0) {
    return null;
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Filtres actifs ({activeFilterCount})
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {filters.magasin_id && !loading && (
              <div className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                <span>Magasin: {filterLabels.magasin}</span>
                <button
                  onClick={() => removeFilter('magasin_id')}
                  className="ml-1 hover:text-blue-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {filters.produit_id && !loading && (
              <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                <span>Produit: {filterLabels.produit}</span>
                <button
                  onClick={() => removeFilter('produit_id')}
                  className="ml-1 hover:text-green-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {filters.client_id && !loading && (
              <div className="flex items-center space-x-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                <span>Client: {filterLabels.client}</span>
                <button
                  onClick={() => removeFilter('client_id')}
                  className="ml-1 hover:text-purple-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={clearFilters}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Réinitialiser</span>
        </button>
      </div>

      {/* Message explicatif */}
      <div className="mt-2 text-xs text-gray-500">
        Les résultats affichés correspondent à tous les critères sélectionnés (filtrage croisé)
      </div>
    </div>
  );
}