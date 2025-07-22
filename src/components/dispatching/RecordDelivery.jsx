import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, Truck, Save, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { Alert, AlertDescription } from '../ui/Alert';

const RecordDelivery = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [dispatch, setDispatch] = useState(null);
  const [livraisons, setLivraisons] = useState([]);
  
  const [formData, setFormData] = useState({
    type_livraison: 'stock',
    quantite_livree: '',
    transporteur: '',
    numero_camion: '',
    chauffeur_nom: '',
    notes: ''
  });

  // Quantités restantes
  const [quantitesRestantes, setQuantitesRestantes] = useState({
    client: 0,
    stock: 0
  });

  useEffect(() => {
    loadDispatch();
  }, [id]);

  useEffect(() => {
    if (dispatch && livraisons) {
      calculateQuantitesRestantes();
    }
  }, [dispatch, livraisons]);

  const loadDispatch = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/dispatching/${id}`);
      setDispatch(response.data);
      setLivraisons(response.data.livraisons || []);
    } catch (err) {
      setError('Erreur lors du chargement du dispatch');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateQuantitesRestantes = () => {
    const totalLivreClient = livraisons
      .filter(l => l.type_livraison === 'client' && l.statut !== 'annulee')
      .reduce((sum, l) => sum + parseFloat(l.quantite_livree), 0);
    
    const totalLivreStock = livraisons
      .filter(l => l.type_livraison === 'stock' && l.statut !== 'annulee')
      .reduce((sum, l) => sum + parseFloat(l.quantite_livree), 0);

    setQuantitesRestantes({
      client: dispatch.quantite_client - totalLivreClient,
      stock: dispatch.quantite_stock - totalLivreStock
    });

    // Ajuster le type de livraison par défaut selon ce qui reste
    if (quantitesRestantes.client > 0 && quantitesRestantes.stock <= 0) {
      setFormData(prev => ({ ...prev, type_livraison: 'client' }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.quantite_livree || parseFloat(formData.quantite_livree) <= 0) {
      setError('La quantité livrée doit être supérieure à 0');
      return false;
    }

    const quantite = parseFloat(formData.quantite_livree);
    const maxQuantite = formData.type_livraison === 'client' 
      ? quantitesRestantes.client 
      : quantitesRestantes.stock;

    if (quantite > maxQuantite) {
      setError(`Quantité trop élevée. Maximum disponible: ${maxQuantite}T`);
      return false;
    }

    if (!formData.transporteur || !formData.numero_camion || !formData.chauffeur_nom) {
      setError('Veuillez remplir toutes les informations de transport');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);
    setError('');
    
    try {
      await api.post(`/dispatching/${id}/livraison`, formData);
      setSuccess('Livraison enregistrée avec succès');
      
      // Recharger les données
      await loadDispatch();
      
      // Réinitialiser le formulaire
      setFormData({
        type_livraison: 'stock',
        quantite_livree: '',
        transporteur: '',
        numero_camion: '',
        chauffeur_nom: '',
        notes: ''
      });
      
      // Si tout est livré, retourner à la liste
      if (quantitesRestantes.client <= 0 && quantitesRestantes.stock <= 0) {
        setTimeout(() => {
          navigate('/dispatching');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dispatch) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Dispatch non trouvé</AlertDescription>
      </Alert>
    );
  }

  const isComplete = dispatch.statut === 'complete';
  const canDeliverClient = quantitesRestantes.client > 0;
  const canDeliverStock = quantitesRestantes.stock > 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dispatching')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold">
              Enregistrer Livraison - {dispatch.numero_dispatch}
            </h2>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            dispatch.statut === 'complete' ? 'bg-green-100 text-green-800' :
            dispatch.statut === 'en_cours' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {dispatch.statut === 'complete' ? 'Complété' :
             dispatch.statut === 'en_cours' ? 'En cours' : 'Planifié'}
          </span>
        </div>

        {/* Informations du dispatch */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Client:</span>
            <p className="font-semibold">{dispatch.client?.nom}</p>
          </div>
          <div>
            <span className="text-gray-600">Produit:</span>
            <p className="font-semibold">{dispatch.produit?.nom}</p>
          </div>
          <div>
            <span className="text-gray-600">Quantité totale:</span>
            <p className="font-semibold">{dispatch.quantite_totale} tonnes</p>
          </div>
        </div>
      </div>

      {/* Statut des livraisons */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">État des livraisons</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Client */}
          <div className={`border rounded-lg p-4 ${
            quantitesRestantes.client <= 0 ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Livraison Client Direct
              </h4>
              {quantitesRestantes.client <= 0 && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Prévu:</span>
                <span className="font-semibold">{dispatch.quantite_client} T</span>
              </div>
              <div className="flex justify-between">
                <span>Livré:</span>
                <span className="font-semibold">
                  {dispatch.quantite_client - quantitesRestantes.client} T
                </span>
              </div>
              <div className="flex justify-between text-blue-600">
                <span>Restant:</span>
                <span className="font-semibold">{quantitesRestantes.client} T</span>
              </div>
            </div>
          </div>

          {/* Stock */}
          <div className={`border rounded-lg p-4 ${
            quantitesRestantes.stock <= 0 ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium flex items-center gap-2">
                <Package className="w-4 h-4" />
                Mise en Stock Magasin
              </h4>
              {quantitesRestantes.stock <= 0 && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Prévu:</span>
                <span className="font-semibold">{dispatch.quantite_stock} T</span>
              </div>
              <div className="flex justify-between">
                <span>Livré:</span>
                <span className="font-semibold">
                  {dispatch.quantite_stock - quantitesRestantes.stock} T
                </span>
              </div>
              <div className="flex justify-between text-orange-600">
                <span>Restant:</span>
                <span className="font-semibold">{quantitesRestantes.stock} T</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire de livraison */}
      {!isComplete && (canDeliverClient || canDeliverStock) && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Nouvelle livraison</h3>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type de livraison */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de livraison *
              </label>
              <div className="flex gap-4">
                {canDeliverClient && (
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type_livraison"
                      value="client"
                      checked={formData.type_livraison === 'client'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span>Client Direct ({quantitesRestantes.client} T disponibles)</span>
                  </label>
                )}
                {canDeliverStock && (
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type_livraison"
                      value="stock"
                      checked={formData.type_livraison === 'stock'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span>Stock Magasin ({quantitesRestantes.stock} T disponibles)</span>
                  </label>
                )}
              </div>
            </div>

            {/* Quantité */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité livrée (tonnes) *
                </label>
                <input
                  type="number"
                  name="quantite_livree"
                  value={formData.quantite_livree}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  max={formData.type_livraison === 'client' ? quantitesRestantes.client : quantitesRestantes.stock}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Informations transport */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transporteur *
                </label>
                <input
                  type="text"
                  name="transporteur"
                  value={formData.transporteur}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro Camion *
                </label>
                <input
                  type="text"
                  name="numero_camion"
                  value={formData.numero_camion}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du Chauffeur *
                </label>
                <input
                  type="text"
                  name="chauffeur_nom"
                  value={formData.chauffeur_nom}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
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
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Boutons */}
            <div className="flex gap-3 justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Enregistrement...' : 'Enregistrer la livraison'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Message si complété */}
      {isComplete && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Ce dispatch est complété. Toutes les quantités ont été livrées.
          </AlertDescription>
        </Alert>
      )}

      {/* Historique des livraisons */}
      {livraisons.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Historique des livraisons</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transport
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Magasinier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N° Bon
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {livraisons.map((livraison) => (
                  <tr key={livraison.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(livraison.date_livraison).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        livraison.type_livraison === 'client' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {livraison.type_livraison === 'client' ? 'Client' : 'Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {livraison.quantite_livree} T
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {livraison.transporteur} - {livraison.numero_camion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {livraison.magasinier?.nom} {livraison.magasinier?.prenom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {livraison.numero_bon}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordDelivery;