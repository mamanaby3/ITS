import React, { useState, useEffect } from 'react';
import { Minus, Package, Calendar, Truck, Building, AlertTriangle } from 'lucide-react';
import { formatNumber } from '../../utils/format';

const SortieTonnage = ({ onSubmit, produits = [], clients = [], magasins = [], stockDisponible = {} }) => {
  const [formData, setFormData] = useState({
    produit_id: '',
    tonnage_livre: '',
    date_sortie: new Date().toISOString().split('T')[0],
    client_id: '',
    magasin_id: '',
    reference_bon: '',
    transporteur: '',
    numero_camion: '',
    observations: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [stockActuel, setStockActuel] = useState(null);

  // Vérifier le stock disponible quand produit et magasin sont sélectionnés
  useEffect(() => {
    if (formData.produit_id && formData.magasin_id) {
      const key = `${formData.produit_id}_${formData.magasin_id}`;
      const stock = stockDisponible[key] || 0;
      setStockActuel(stock);
    } else {
      setStockActuel(null);
    }
  }, [formData.produit_id, formData.magasin_id, stockDisponible]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.produit_id) {
      newErrors.produit_id = 'Le produit est requis';
    }

    if (!formData.tonnage_livre || parseFloat(formData.tonnage_livre) <= 0) {
      newErrors.tonnage_livre = 'Le tonnage doit être supérieur à 0';
    }

    // Vérification du stock disponible
    if (formData.tonnage_livre && stockActuel !== null) {
      const tonnageALivrer = parseFloat(formData.tonnage_livre);
      if (tonnageALivrer > stockActuel) {
        newErrors.tonnage_livre = `Stock insuffisant. Disponible: ${formatNumber(stockActuel)} T`;
      }
    }

    if (!formData.date_sortie) {
      newErrors.date_sortie = 'La date est requise';
    }

    if (!formData.client_id) {
      newErrors.client_id = 'Le client est requis';
    }

    if (!formData.magasin_id) {
      newErrors.magasin_id = 'Le magasin est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        tonnage_livre: parseFloat(formData.tonnage_livre),
        type: 'sortie',
        stock_avant: stockActuel,
        stock_apres: stockActuel - parseFloat(formData.tonnage_livre)
      });
      
      setSuccess('Sortie de tonnage enregistrée avec succès');
      
      // Réinitialiser le formulaire
      setFormData({
        produit_id: '',
        tonnage_livre: '',
        date_sortie: new Date().toISOString().split('T')[0],
        client_id: '',
        magasin_id: '',
        reference_bon: '',
        transporteur: '',
        numero_camion: '',
        observations: ''
      });
      setStockActuel(null);

      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setErrors({ general: error.message || 'Erreur lors de l\'enregistrement' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Minus className="w-5 h-5 text-red-600" />
          Nouvelle Sortie de Tonnage
        </h2>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-700">
          {success}
        </div>
      )}

      {errors.general && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {errors.general}
        </div>
      )}

      {/* Alerte stock */}
      {stockActuel !== null && (
        <div className={`mb-4 p-4 rounded-md flex items-start gap-2 ${
          stockActuel > 0 ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'
        }`}>
          <AlertTriangle className={`w-5 h-5 mt-0.5 ${
            stockActuel > 0 ? 'text-blue-600' : 'text-red-600'
          }`} />
          <div>
            <p className={`font-medium ${stockActuel > 0 ? 'text-blue-900' : 'text-red-900'}`}>
              Stock disponible: {formatNumber(stockActuel)} T
            </p>
            {stockActuel === 0 && (
              <p className="text-sm text-red-700 mt-1">
                Aucun stock disponible pour ce produit dans ce magasin
              </p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Magasin (en premier pour vérifier le stock) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="w-4 h-4 inline mr-1" />
              Magasin source *
            </label>
            <select
              name="magasin_id"
              value={formData.magasin_id}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.magasin_id ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Sélectionner un magasin</option>
              {magasins.map(magasin => (
                <option key={magasin.id} value={magasin.id}>
                  {magasin.nom} - {magasin.ville}
                </option>
              ))}
            </select>
            {errors.magasin_id && (
              <p className="mt-1 text-sm text-red-600">{errors.magasin_id}</p>
            )}
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.produit_id ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Sélectionner un produit</option>
              {produits.map(produit => (
                <option key={produit.id} value={produit.id}>
                  {produit.nom} - {produit.reference}
                </option>
              ))}
            </select>
            {errors.produit_id && (
              <p className="mt-1 text-sm text-red-600">{errors.produit_id}</p>
            )}
          </div>

          {/* Tonnage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Truck className="w-4 h-4 inline mr-1" />
              Tonnage livré (T) *
            </label>
            <input
              type="number"
              name="tonnage_livre"
              value={formData.tonnage_livre}
              onChange={handleChange}
              step="0.01"
              min="0"
              max={stockActuel || undefined}
              placeholder={stockActuel ? `Max: ${formatNumber(stockActuel)} T` : "Ex: 25.5"}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.tonnage_livre ? 'border-red-500' : 'border-gray-300'
              }`}
              required
              disabled={!formData.produit_id || !formData.magasin_id || stockActuel === 0}
            />
            {errors.tonnage_livre && (
              <p className="mt-1 text-sm text-red-600">{errors.tonnage_livre}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date de sortie *
            </label>
            <input
              type="date"
              name="date_sortie"
              value={formData.date_sortie}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.date_sortie ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.date_sortie && (
              <p className="mt-1 text-sm text-red-600">{errors.date_sortie}</p>
            )}
          </div>

          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client destinataire *
            </label>
            <select
              name="client_id"
              value={formData.client_id}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.client_id ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Sélectionner un client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.nom}
                </option>
              ))}
            </select>
            {errors.client_id && (
              <p className="mt-1 text-sm text-red-600">{errors.client_id}</p>
            )}
          </div>

          {/* Référence bon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Référence bon de sortie
            </label>
            <input
              type="text"
              name="reference_bon"
              value={formData.reference_bon}
              onChange={handleChange}
              placeholder="Ex: BS-2024-001"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Transporteur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transporteur
            </label>
            <input
              type="text"
              name="transporteur"
              value={formData.transporteur}
              onChange={handleChange}
              placeholder="Nom du transporteur"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Numéro camion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro camion
            </label>
            <input
              type="text"
              name="numero_camion"
              value={formData.numero_camion}
              onChange={handleChange}
              placeholder="Ex: DK-1234-AB"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Observations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observations
          </label>
          <textarea
            name="observations"
            value={formData.observations}
            onChange={handleChange}
            rows="3"
            placeholder="Notes ou remarques supplémentaires..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Boutons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              setFormData({
                produit_id: '',
                tonnage_livre: '',
                date_sortie: new Date().toISOString().split('T')[0],
                client_id: '',
                magasin_id: '',
                reference_bon: '',
                transporteur: '',
                numero_camion: '',
                observations: ''
              });
              setStockActuel(null);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Réinitialiser
          </button>
          <button
            type="submit"
            disabled={loading || stockActuel === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Minus className="w-4 h-4" />
            )}
            Enregistrer la sortie
          </button>
        </div>
      </form>
    </div>
  );
};

export default SortieTonnage;