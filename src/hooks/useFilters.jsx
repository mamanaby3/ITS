import { useState, useEffect, useContext, createContext } from 'react';

const FiltersContext = createContext();

export function FiltersProvider({ children }) {
  const [filters, setFilters] = useState({
    magasin_id: localStorage.getItem('selectedMagasin') || null,
    produit_id: null,
    client_id: null
  });

  // Sauvegarder le magasin dans localStorage
  useEffect(() => {
    if (filters.magasin_id) {
      localStorage.setItem('selectedMagasin', filters.magasin_id);
    } else {
      localStorage.removeItem('selectedMagasin');
    }
  }, [filters.magasin_id]);

  const updateFilter = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const updateFilters = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const clearFilters = () => {
    setFilters({
      magasin_id: null,
      produit_id: null,
      client_id: null
    });
    localStorage.removeItem('selectedMagasin');
  };

  const getActiveFilters = () => {
    return Object.entries(filters).reduce((acc, [key, value]) => {
      if (value) {
        acc[key] = value;
      }
      return acc;
    }, {});
  };

  return (
    <FiltersContext.Provider value={{
      filters,
      updateFilter,
      updateFilters,
      clearFilters,
      getActiveFilters
    }}>
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FiltersContext);
  if (!context) {
    throw new Error('useFilters must be used within a FiltersProvider');
  }
  return context;
}