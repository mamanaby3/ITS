import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Truck, Users, AlertCircle, Calculator } from 'lucide-react';
import api from '../../services/api';
import { Alert, AlertDescription } from '../ui/Alert';

const CreateDispatch = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Listes pour les selects
  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);
  const [magasins, setMagasins] = useState([]);
  const [stocks, setStocks] = useState([]);
  
  // Données du formulaire
  const [formData, setFormData] = useState({
    client_id: '',
    produit_id: '',
    magasin_source_id: '',
    magasin_destination_id: '',
    quantite_totale: '',
    quantite_client: 0,
    quantite_stock: 0,
    notes: ''
  });

  // Stock disponible
  const [stockDisponible, setStockDisponible] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  // Charger stock disponible quand produit et magasin source changent
  useEffect(() => {
    if (formData.produit_id && formData.magasin_source_id) {
      loadStockDisponible();
    }
  }, [formData.produit_id, formData.magasin_source_id]);

  const loadData = async () => {
    try {
      const [clientsRes, produitsRes, magasinsRes] = await Promise.all([
        api.get('/clients'),
        api.get('/produits'),
        api.get('/magasins')
      ]);
      
      setClients(clientsRes.data);
      setProduits(produitsRes.data);
      setMagasins(magasinsRes.data);
    } catch (err) {
      setError('Erreur lors du chargement des données');
    }
  };

  const loadStockDisponible = async () => {
    try {
      const response = await api.get('/stock', {
        params: {
          produit_id: formData.produit_id,
          magasin_id: formData.magasin_source_id
        }
      });
      
      if (response.data && response.data.length > 0) {
        setStockDisponible(response.data[0].quantite);
      } else {
        setStockDisponible(0);
      }
    } catch (err) {
      console.error('Erreur chargement stock:', err);
      setStockDisponible(0);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'quantite_totale') {
      // Répartir automatiquement entre client et stock
      const total = parseFloat(value) || 0;
      const client = parseFloat(formData.quantite_client) || 0;
      const stock = total - client;
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        quantite_stock: stock >= 0 ? stock : 0
      }));
    } else if (name === 'quantite_client') {
      // Ajuster la quantité stock
      const client = parseFloat(value) || 0;
      const total = parseFloat(formData.quantite_totale) || 0;
      const stock = total - client;
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        quantite_stock: stock >= 0 ? stock : 0
      }));
    } else if (name === 'quantite_stock') {
      // Ajuster la quantité client
      const stock = parseFloat(value) || 0;
      const total = parseFloat(formData.quantite_totale) || 0;
      const client = total - stock;
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        quantite_client: client >= 0 ? client : 0
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    if (!formData.client_id || !formData.produit_id || 
        !formData.magasin_source_id || !formData.magasin_destination_id) {
      setError('Veuillez remplir tous les champs obligatoires');
      return false;
    }

    const total = parseFloat(formData.quantite_totale) || 0;
    const client = parseFloat(formData.quantite_client) || 0;
    const stock = parseFloat(formData.quantite_stock) || 0;

    if (total <= 0) {
      setError('La quantité totale doit être supérieure à 0');
      return false;
    }

    if (Math.abs((client + stock) - total) > 0.01) {
      setError('La somme des quantités client et stock doit égaler la quantité totale');
      return false;
    }

    if (stockDisponible !== null && total > stockDisponible) {
      setError(`Stock insuffisant. Disponible: ${stockDisponible}T`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      await api.post('/dispatching/create', formData);
      setSuccess('Dispatch créé avec succès');
      setTimeout(() => {
        navigate('/dispatching');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const getTypeDispatch = () => {
    const client = parseFloat(formData.quantite_client) || 0;
    const stock = parseFloat(formData.quantite_stock) || 0;
    
    if (client > 0 && stock > 0) return 'Mixte (Client + Stock)';
    if (client > 0) return 'Direct Client';
    if (stock > 0) return 'Stock Magasin';
    return 'Non défini';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="w-6 h-6" />
            Créer un Dispatch
          </h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            getTypeDispatch() === 'Mixte (Client + Stock)' ? 'bg-purple-100 text-purple-800' :
            getTypeDispatch() === 'Direct Client' ? 'bg-blue-100 text-blue-800' :
            getTypeDispatch() === 'Stock Magasin' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {getTypeDispatch()}
          </span>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Client *
              </label>
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner un client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.nom} - {client.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Produit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Package className="w-4 h-4 inline mr-1" />
                Produit *
              </label>
              <select
                name="produit_id"
                value={formData.produit_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner un produit</option>
                {produits.map(produit => (
                  <option key={produit.id} value={produit.id}>
                    {produit.nom} - {produit.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Magasin Source */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Magasin Source *
              </label>
              <select
                name="magasin_source_id"
                value={formData.magasin_source_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner le magasin source</option>
                {magasins.map(magasin => (
                  <option key={magasin.id} value={magasin.id}>
                    {magasin.nom} - {magasin.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Magasin Destination */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Magasin Destination *
              </label>
              <select
                name="magasin_destination_id"
                value={formData.magasin_destination_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner le magasin destination</option>
                {magasins.filter(m => m.id !== formData.magasin_source_id).map(magasin => (
                  <option key={magasin.id} value={magasin.id}>
                    {magasin.nom} - {magasin.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stock disponible */}
          {stockDisponible !== null && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                Stock disponible: <span className="font-bold">{stockDisponible} tonnes</span>
              </p>
            </div>
          )}

          {/* Quantités */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Répartition des quantités
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantité Totale (tonnes) *
              </label>
              <input
                type="number"
                name="quantite_totale"
                value={formData.quantite_totale}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité Client Direct (tonnes)
                </label>
                <input
                  type="number"
                  name="quantite_client"
                  value={formData.quantite_client}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  max={formData.quantite_totale}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité Stock Magasin (tonnes)
                </label>
                <input
                  type="number"
                  name="quantite_stock"
                  value={formData.quantite_stock}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  max={formData.quantite_totale}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Résumé */}
            <div className="bg-white rounded-md p-3 border border-gray-200">
              <div className="flex justify-between text-sm">
                <span>Total:</span>
                <span className="font-semibold">{formData.quantite_totale || 0} T</span>
              </div>
              <div className="flex justify-between text-sm text-blue-600">
                <span>Client direct:</span>
                <span>{formData.quantite_client || 0} T</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>Stock magasin:</span>
                <span>{formData.quantite_stock || 0} T</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Instructions ou remarques..."
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => navigate('/dispatching')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer le Dispatch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDispatch;