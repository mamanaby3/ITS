import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, Users, Building2, Ship } from 'lucide-react';
import { useFilters } from '../../hooks/useFilters';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';

export default function FilteredStats() {
  const { filters } = useFilters();
  const [stats, setStats] = useState({
    totalNavires: 0,
    totalTonnage: 0,
    totalClients: 0,
    totalMagasins: 0,
    loading: true
  });

  useEffect(() => {
    fetchFilteredStats();
  }, [filters]);

  const fetchFilteredStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));

      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (filters.magasin_id) params.append('magasin_id', filters.magasin_id);
      if (filters.produit_id) params.append('produit_id', filters.produit_id);
      if (filters.client_id) params.append('client_id', filters.client_id);

      // Récupérer les navires filtrés
      const naviresUrl = params.toString() 
        ? `${API_ENDPOINTS.NAVIRES.LIST}?${params.toString()}`
        : API_ENDPOINTS.NAVIRES.LIST;
      
      const naviresResponse = await api.get(naviresUrl);
      const navires = naviresResponse.data || [];

      // Calculer les statistiques
      let totalTonnage = 0;
      const uniqueClients = new Set();
      const uniqueMagasins = new Set();

      navires.forEach(navire => {
        // Calculer le tonnage total
        if (navire.cargaison) {
          navire.cargaison.forEach(cargo => {
            totalTonnage += cargo.quantite || 0;
          });
        }

        // Compter les clients et magasins uniques
        if (navire.dispatching) {
          navire.dispatching.forEach(dispatch => {
            if (dispatch.client_id) uniqueClients.add(dispatch.client_id);
            if (dispatch.magasin_id) uniqueMagasins.add(dispatch.magasin_id);
          });
        }
      });

      setStats({
        totalNavires: navires.length,
        totalTonnage: totalTonnage,
        totalClients: uniqueClients.size,
        totalMagasins: uniqueMagasins.size,
        loading: false
      });

    } catch (error) {
      console.error('Erreur chargement stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  if (stats.loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      label: 'Navires',
      value: stats.totalNavires,
      icon: Ship,
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600'
    },
    {
      label: 'Tonnage total',
      value: `${formatNumber(stats.totalTonnage)} T`,
      icon: Package,
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600'
    },
    {
      label: 'Clients impactés',
      value: stats.totalClients,
      icon: Users,
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600'
    },
    {
      label: 'Magasins concernés',
      value: stats.totalMagasins,
      icon: Building2,
      color: 'orange',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <Icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}