import React, { createContext, useContext, useState, useCallback } from 'react';
import stockService from '../services/stock';
import produitsService from '../services/produits';

const StockContext = createContext();

export const useStock = () => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStock doit être utilisé dans un StockProvider');
  }
  return context;
};

export const StockProvider = ({ children }) => {
  const [stock, setStock] = useState([]);
  const [produits, setProduits] = useState([]);
  const [mouvements, setMouvements] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger le stock
  const loadStock = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await stockService.getAllStock();
      setStock(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les produits
  const loadProduits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await produitsService.getAllProduits();
      setProduits(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les mouvements
  const loadMouvements = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await stockService.getMouvements(filters);
      setMouvements(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les alertes
  const loadAlertes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await stockService.getAlertes();
      setAlertes(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Entrée de stock
  const entreeStock = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await stockService.entreeStock(data);
      await loadStock();
      await loadMouvements();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadStock, loadMouvements]);

  // Sortie de stock
  const sortieStock = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await stockService.sortieStock(data);
      await loadStock();
      await loadMouvements();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadStock, loadMouvements]);

  // Transfert de stock
  const transfertStock = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await stockService.transfertStock(data);
      await loadStock();
      await loadMouvements();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadStock, loadMouvements]);

  // Obtenir le stock par produit
  const getStockByProduit = useCallback((produitId) => {
    return stock.filter(item => item.produitId === parseInt(produitId));
  }, [stock]);

  // Obtenir la quantité disponible d'un produit
  const getQuantiteDisponible = useCallback((produitId) => {
    const stockProduit = getStockByProduit(produitId);
    return stockProduit.reduce((total, item) => total + item.quantite, 0);
  }, [getStockByProduit]);

  // Rechercher dans le stock
  const searchStock = useCallback((query) => {
    const searchTerm = query.toLowerCase();
    return stock.filter(item => 
      item.produit?.nom?.toLowerCase().includes(searchTerm) ||
      item.produit?.reference?.toLowerCase().includes(searchTerm) ||
      item.emplacement?.toLowerCase().includes(searchTerm) ||
      item.lot?.toLowerCase().includes(searchTerm)
    );
  }, [stock]);

  // Obtenir les statistiques
  const getStats = useCallback(() => {
    const totalProduits = produits.length;
    const valeurTotale = stock.reduce((sum, item) => 
      sum + (item.quantite * (item.prixUnitaire || item.produit?.prix || 0)), 0
    );
    const produitsEnAlerte = alertes.filter(a => 
      a.type === 'stock_bas' || a.type === 'rupture'
    ).length;
    const mouvementsJour = mouvements.filter(m => {
      const today = new Date().toISOString().split('T')[0];
      return m.date.startsWith(today);
    }).length;

    return {
      totalProduits,
      valeurTotale,
      produitsEnAlerte,
      mouvementsJour
    };
  }, [produits, stock, alertes, mouvements]);

  const value = {
    // État
    stock,
    produits,
    mouvements,
    alertes,
    loading,
    error,

    // Actions
    loadStock,
    loadProduits,
    loadMouvements,
    loadAlertes,
    entreeStock,
    sortieStock,
    transfertStock,

    // Helpers
    getStockByProduit,
    getQuantiteDisponible,
    searchStock,
    getStats
  };

  return (
    <StockContext.Provider value={value}>
      {children}
    </StockContext.Provider>
  );
};

export default StockContext;