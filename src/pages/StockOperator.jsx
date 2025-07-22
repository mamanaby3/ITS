import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { Search, Package, AlertTriangle, TrendingDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const StockOperator = () => {
  const { user } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, low, out

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les produits
      const produitsRes = await api.get('/produits');
      setProduits(produitsRes.data?.data || []);
      
      // Charger le stock du magasin de l'opérateur
      const stockRes = await api.get(`/stock/magasin/${user.magasin_id}`);
      // Filtrer uniquement les stocks avec quantité > 0 (dispatching effectué)
      const stocksWithQuantity = (stockRes.data?.data || []).filter(stock => stock.quantite > 0);
      setStocks(stocksWithQuantity);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les stocks
  const filteredStocks = stocks.filter(stock => {
    const produit = produits.find(p => p.id === stock.produit_id);
    if (!produit) return false;
    
    // Recherche par nom
    if (searchTerm && !produit.nom.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filtre par état
    if (filter === 'low' && stock.quantite > (produit.seuil_alerte || 10)) {
      return false;
    }
    if (filter === 'out' && stock.quantite > 0) {
      return false;
    }
    
    return true;
  });

  // Calculer les statistiques
  const stats = {
    total: stocks.length,
    low: stocks.filter(s => {
      const p = produits.find(pr => pr.id === s.produit_id);
      return s.quantite <= (p?.seuil_alerte || 10);
    }).length,
    out: stocks.filter(s => s.quantite === 0).length,
    value: stocks.reduce((sum, s) => {
      const p = produits.find(pr => pr.id === s.produit_id);
      return sum + (s.quantite * (p?.prix_unitaire || 0));
    }, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p>Chargement du stock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mon Stock - {user.magasin?.nom || `Magasin ${user.magasin_id}`}</h1>
        <p className="text-gray-600">Gérez le stock de votre magasin</p>
      </div>

      {/* Message si pas de stock dispatché */}
      {stocks.length === 0 ? (
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-4">
            <AlertTriangle className="text-yellow-600" size={32} />
            <div>
              <h3 className="font-semibold text-yellow-800">Aucun stock disponible</h3>
              <p className="text-yellow-700">
                Votre magasin n'a pas encore reçu de stock. Contactez votre manager pour le dispatching.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        /* Statistiques */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Total Produits</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="text-blue-600" size={32} />
            </div>
          </Card>
        
        <Card className="bg-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Stock Faible</p>
              <p className="text-2xl font-bold">{stats.low}</p>
            </div>
            <AlertTriangle className="text-yellow-600" size={32} />
          </div>
        </Card>
        
        <Card className="bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Rupture Stock</p>
              <p className="text-2xl font-bold">{stats.out}</p>
            </div>
            <TrendingDown className="text-red-600" size={32} />
          </div>
        </Card>
        
        <Card className="bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Valeur Stock</p>
              <p className="text-2xl font-bold">{stats.value.toFixed(2)}€</p>
            </div>
            <Package className="text-green-600" size={32} />
          </div>
        </Card>
      </div>
      )}

      {/* Filtres */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous ({stats.total})
            </button>
            <button
              onClick={() => setFilter('low')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'low' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Stock Faible ({stats.low})
            </button>
            <button
              onClick={() => setFilter('out')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'out' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rupture ({stats.out})
            </button>
          </div>
        </div>
      </Card>

      {/* Liste des stocks */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-4">Produit</th>
                <th className="text-left p-4">Référence</th>
                <th className="text-center p-4">Stock</th>
                <th className="text-center p-4">Seuil Alerte</th>
                <th className="text-center p-4">Statut</th>
                <th className="text-right p-4">Valeur</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map(stock => {
                const produit = produits.find(p => p.id === stock.produit_id);
                if (!produit) return null;
                
                const isLow = stock.quantite <= (produit.seuil_alerte || 10);
                const isOut = stock.quantite === 0;
                const value = stock.quantite * produit.prix_unitaire;
                
                return (
                  <tr key={stock.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{produit.nom}</p>
                        <p className="text-sm text-gray-500">{produit.categorie}</p>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{produit.reference}</td>
                    <td className="p-4 text-center">
                      <span className={`font-bold ${
                        isOut ? 'text-red-600' : 
                        isLow ? 'text-yellow-600' : 
                        'text-green-600'
                      }`}>
                        {stock.quantite} {produit.unite}
                      </span>
                    </td>
                    <td className="p-4 text-center text-gray-600">
                      {produit.seuil_alerte || 10} {produit.unite}
                    </td>
                    <td className="p-4 text-center">
                      {isOut ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                          Rupture
                        </span>
                      ) : isLow ? (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                          Stock Faible
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right font-medium">
                      {value.toFixed(2)}€
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredStocks.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-lg font-medium text-gray-700 mb-2">
                {stocks.length === 0 
                  ? "Aucun stock dispatché pour votre magasin" 
                  : "Aucun produit trouvé avec les critères de recherche"}
              </p>
              <p className="text-gray-500">
                {stocks.length === 0 
                  ? "Le manager doit d'abord effectuer un dispatching vers votre magasin." 
                  : "Essayez de modifier vos filtres de recherche."}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default StockOperator;