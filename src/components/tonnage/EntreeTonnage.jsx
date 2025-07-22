import React, { useState, useEffect } from 'react';
import { Plus, Package, Calendar, Truck, Building, Ship, Anchor } from 'lucide-react';
import { formatDate, formatNumber } from '../../utils/format';

const EntreeTonnage = ({ onSubmit, produits = [], clients = [], magasins = [] }) => {
  const [formData, setFormData] = useState({
    produit_id: '',
    tonnage: '',
    date_entree: new Date().toISOString().split('T')[0],
    client_id: '',
    magasin_id: '',
    reference_bon: '',
    nom_navire: '',
    numero_connaissement: '',
    port_origine: '',
    date_arrivee_navire: '',
    observations: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const validateForm = () => {
    const newErrors = {};

    if (!formData.produit_id) {
      newErrors.produit_id = 'Le produit est requis';
    }

    if (!formData.tonnage || parseFloat(formData.tonnage) <= 0) {
      newErrors.tonnage = 'Le tonnage doit être supérieur à 0';
    }

    if (!formData.date_entree) {
      newErrors.date_entree = 'La date est requise';
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
        tonnage: parseFloat(formData.tonnage),
        type: 'entree'
      });
      
      setSuccess('Entrée de tonnage enregistrée avec succès');
      
      // Réinitialiser le formulaire
      setFormData({
        produit_id: '',
        tonnage: '',
        date_entree: new Date().toISOString().split('T')[0],
        client_id: '',
        magasin_id: '',
        reference_bon: '',
        nom_navire: '',
        numero_connaissement: '',
        port_origine: '',
        date_arrivee_navire: '',
        observations: ''
      });

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
          <Ship className="w-5 h-5 text-blue-600" />
          Réception depuis Navire
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              Tonnage (T) *
            </label>
            <input
              type="number"
              name="tonnage"
              value={formData.tonnage}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="Ex: 25.5"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.tonnage ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.tonnage && (
              <p className="mt-1 text-sm text-red-600">{errors.tonnage}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date d'entrée *
            </label>
            <input
              type="date"
              name="date_entree"
              value={formData.date_entree}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.date_entree ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.date_entree && (
              <p className="mt-1 text-sm text-red-600">{errors.date_entree}</p>
            )}
          </div>

          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client *
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

          {/* Magasin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="w-4 h-4 inline mr-1" />
              Magasin de destination *
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

          {/* Référence bon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Référence bon d'entrée
            </label>
            <input
              type="text"
              name="reference_bon"
              value={formData.reference_bon}
              onChange={handleChange}
              placeholder="Ex: BE-2024-001"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Informations du navire */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Anchor className="w-4 h-4 text-gray-600" />
            Informations du navire
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Ship className="w-4 h-4 inline mr-1" />
                Nom du navire
              </label>
              <input
                type="text"
                name="nom_navire"
                value={formData.nom_navire}
                onChange={handleChange}
                placeholder="Ex: MV Atlantic Star"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de connaissement
              </label>
              <input
                type="text"
                name="numero_connaissement"
                value={formData.numero_connaissement}
                onChange={handleChange}
                placeholder="Ex: BL-2024-12345"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Port d'origine
              </label>
              <input
                type="text"
                name="port_origine"
                value={formData.port_origine}
                onChange={handleChange}
                placeholder="Ex: Port de Rotterdam"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'arrivée du navire
              </label>
              <input
                type="date"
                name="date_arrivee_navire"
                value={formData.date_arrivee_navire}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
            onClick={() => setFormData({
              produit_id: '',
              tonnage: '',
              date_entree: new Date().toISOString().split('T')[0],
              client_id: '',
              magasin_id: '',
              reference_bon: '',
              nom_navire: '',
              numero_connaissement: '',
              port_origine: '',
              date_arrivee_navire: '',
              observations: ''
            })}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Réinitialiser
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Enregistrer la réception
          </button>
        </div>
      </form>
    </div>
  );
};

export default EntreeTonnage;