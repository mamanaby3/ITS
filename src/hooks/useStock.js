import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import stockService from '../services/stock';
import { useAuth } from './useAuth';

export const useStock = (produitId = null) => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    sortBy: 'dateModification',
    sortOrder: 'desc'
  });

  // Récupérer tout le stock ou le stock d'un produit spécifique
  const {
    data: stock,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['stock', produitId, filters],
    queryFn: async () => {
      if (produitId) {
        return await stockService.getStockByProduit(produitId);
      }
      
      const allStock = await stockService.getAllStock();
      
      // Appliquer les filtres
      let filteredStock = allStock;
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredStock = filteredStock.filter(item =>
          item.produit?.nom?.toLowerCase().includes(searchLower) ||
          item.produit?.reference?.toLowerCase().includes(searchLower) ||
          item.lot?.toLowerCase().includes(searchLower)
        );
      }
      
      if (filters.category) {
        filteredStock = filteredStock.filter(item =>
          item.produit?.categorie === filters.category
        );
      }
      
      if (filters.status) {
        filteredStock = filteredStock.filter(item => {
          const quantite = item.quantite || 0;
          const seuil = item.produit?.seuil || 0;
          
          switch (filters.status) {
            case 'rupture':
              return quantite === 0;
            case 'bas':
              return quantite > 0 && quantite <= seuil;
            case 'normal':
              return quantite > seuil;
            default:
              return true;
          }
        });
      }
      
      // Trier
      filteredStock.sort((a, b) => {
        let aVal = a[filters.sortBy];
        let bVal = b[filters.sortBy];
        
        if (filters.sortBy === 'produit') {
          aVal = a.produit?.nom || '';
          bVal = b.produit?.nom || '';
        }
        
        if (filters.sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
      
      return filteredStock;
    },
    staleTime: 5 * 60 * 1000, // Considérer les données fraîches pendant 5 minutes
    cacheTime: 10 * 60 * 1000, // Garder en cache pendant 10 minutes
  });

  // Récupérer les statistiques du stock
  const { data: stats } = useQuery({
    queryKey: ['stock-stats'],
    queryFn: stockService.getStockStats,
    staleTime: 5 * 60 * 1000,
  });

  // Mutation pour créer une entrée de stock
  const createEntreeMutation = useMutation({
    mutationFn: stockService.createEntreeStock,
    onSuccess: () => {
      queryClient.invalidateQueries(['stock']);
      queryClient.invalidateQueries(['stock-stats']);
    },
  });

  // Mutation pour créer une sortie de stock
  const createSortieMutation = useMutation({
    mutationFn: stockService.createSortieStock,
    onSuccess: () => {
      queryClient.invalidateQueries(['stock']);
      queryClient.invalidateQueries(['stock-stats']);
    },
  });

  // Mutation pour mettre à jour le stock
  const updateStockMutation = useMutation({
    mutationFn: ({ id, data }) => stockService.updateStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['stock']);
      queryClient.invalidateQueries(['stock-stats']);
    },
  });

  // Mutation pour supprimer un stock
  const deleteStockMutation = useMutation({
    mutationFn: stockService.deleteStock,
    onSuccess: () => {
      queryClient.invalidateQueries(['stock']);
      queryClient.invalidateQueries(['stock-stats']);
    },
  });

  // Fonction pour créer une entrée de stock
  const createEntreeStock = useCallback(async (data) => {
    if (!hasPermission('manage_stock')) {
      throw new Error('Permission refusée');
    }
    return createEntreeMutation.mutateAsync(data);
  }, [createEntreeMutation, hasPermission]);

  // Fonction pour créer une sortie de stock
  const createSortieStock = useCallback(async (data) => {
    if (!hasPermission('manage_stock')) {
      throw new Error('Permission refusée');
    }
    return createSortieMutation.mutateAsync(data);
  }, [createSortieMutation, hasPermission]);

  // Fonction pour mettre à jour le stock
  const updateStock = useCallback(async (id, data) => {
    if (!hasPermission('manage_stock')) {
      throw new Error('Permission refusée');
    }
    return updateStockMutation.mutateAsync({ id, data });
  }, [updateStockMutation, hasPermission]);

  // Fonction pour supprimer un stock
  const deleteStock = useCallback(async (id) => {
    if (!hasPermission('delete')) {
      throw new Error('Permission refusée');
    }
    return deleteStockMutation.mutateAsync(id);
  }, [deleteStockMutation, hasPermission]);

  // Fonction pour vérifier la disponibilité du stock
  const checkStockAvailability = useCallback(async (produitId, quantiteRequise) => {
    const quantiteDisponible = await stockService.getQuantiteDisponible(produitId);
    return {
      available: quantiteDisponible >= quantiteRequise,
      quantiteDisponible,
      quantiteRequise,
      shortage: Math.max(0, quantiteRequise - quantiteDisponible)
    };
  }, []);

  // Fonction pour obtenir les mouvements récents
  const getRecentMovements = useCallback(async (limit = 10) => {
    const mouvements = await stockService.getMouvementsRecents(limit);
    return mouvements;
  }, []);

  // Fonction pour obtenir les alertes de stock
  const getStockAlerts = useCallback(() => {
    if (!stock) return [];
    
    return stock
      .filter(item => {
        const quantite = item.quantite || 0;
        const seuil = item.produit?.seuil || 0;
        return quantite <= seuil;
      })
      .map(item => ({
        id: item.id,
        produit: item.produit,
        quantite: item.quantite,
        seuil: item.produit?.seuil || 0,
        type: item.quantite === 0 ? 'rupture' : 'bas',
        message: item.quantite === 0 
          ? `Rupture de stock: ${item.produit?.nom}`
          : `Stock bas: ${item.produit?.nom} (${item.quantite} restants)`
      }));
  }, [stock]);

  // Fonction pour exporter les données de stock
  const exportStock = useCallback(async (format = 'csv') => {
    const data = stock || [];
    
    if (format === 'csv') {
      const headers = ['Produit', 'Référence', 'Quantité', 'Unité', 'Lot', 'Date péremption', 'Emplacement'];
      const rows = data.map(item => [
        item.produit?.nom || '',
        item.produit?.reference || '',
        item.quantite || 0,
        item.unite || '',
        item.lot || '',
        item.datePeremption || '',
        item.emplacement || ''
      ]);
      
      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stock_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [stock]);

  // Fonction pour importer des données de stock
  const importStock = useCallback(async (file) => {
    if (!hasPermission('manage_stock')) {
      throw new Error('Permission refusée');
    }
    
    // Implémenter l'import CSV ici
    // Pour l'instant, retourner une promesse résolue
    return Promise.resolve({ success: true, message: 'Import non implémenté' });
  }, [hasPermission]);

  return {
    // Données
    stock,
    stats,
    filters,
    
    // États
    isLoading,
    isError,
    error,
    
    // Mutations états
    isCreatingEntree: createEntreeMutation.isLoading,
    isCreatingSortie: createSortieMutation.isLoading,
    isUpdating: updateStockMutation.isLoading,
    isDeleting: deleteStockMutation.isLoading,
    
    // Actions
    setFilters,
    refetch,
    createEntreeStock,
    createSortieStock,
    updateStock,
    deleteStock,
    checkStockAvailability,
    getRecentMovements,
    getStockAlerts,
    exportStock,
    importStock,
  };
};