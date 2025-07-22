import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Package, ArrowRight, AlertCircle } from 'lucide-react';
import dispatchService from '../../services/dispatch';
import clientService from '../../services/clients';
import produitService from '../../services/produits';
import magasinService from '../../services/magasins';
import stockService from '../../services/stock';

export default function CreateDispatch() {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  
  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);
  const [magasins, setMagasins] = useState([]);
  const [stockDisponible, setStockDisponible] = useState(null);
  const [error, setError] = useState('');

  const selectedProduit = watch('produit_id');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProduit) {
      checkStock();
    }
  }, [selectedProduit]);

  const fetchData = async () => {
    try {
      const [clientsData, produitsData, magasinsData] = await Promise.all([
        clientService.getClients(),
        produitService.getProduits(),
        magasinService.getMagasins()
      ]);
      setClients(clientsData);
      setProduits(produitsData);
      setMagasins(magasinsData);
    } catch (error) {
      setError('Erreur lors du chargement des données');
      console.error(error);
    }
  };

  const checkStock = async () => {
    try {
      const response = await dispatchService.checkStock(selectedProduit);
      setStockDisponible(response.disponible);
    } catch (error) {
      console.error('Erreur vérification stock:', error);
    }
  };

  const onSubmit = async (data) => {
    try {
      setError('');
      const formData = {
        ...data,
        quantite_totale: parseFloat(data.quantite_totale)
      };
      
      const response = await dispatchService.createDispatch(formData);
      navigate(`/manager/dispatch/${response.dispatch.id}`);
    } catch (error) {
      setError(error.message || 'Erreur lors de la création du dispatch');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Package className="w-6 h-6" />
          Nouveau Dispatch
        </h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client
              </label>
              <select
                {...register('client_id', { required: 'Client requis' })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.nom}
                  </option>
                ))}
              </select>
              {errors.client_id && (
                <p className="text-red-500 text-sm mt-1">{errors.client_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Produit
              </label>
              <select
                {...register('produit_id', { required: 'Produit requis' })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un produit</option>
                {produits.map(produit => (
                  <option key={produit.id} value={produit.id}>
                    {produit.nom}
                  </option>
                ))}
              </select>
              {errors.produit_id && (
                <p className="text-red-500 text-sm mt-1">{errors.produit_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Magasin destination
              </label>
              <select
                {...register('magasin_destination_id', { 
                  required: 'Magasin destination requis',
                  validate: value => value !== watch('magasin_source_id') || 'Doit être différent du magasin source'
                })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un magasin</option>
                {magasins.map(magasin => (
                  <option key={magasin.id} value={magasin.id}>
                    {magasin.nom}
                  </option>
                ))}
              </select>
              {errors.magasin_destination_id && (
                <p className="text-red-500 text-sm mt-1">{errors.magasin_destination_id.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantité (tonnes)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('quantite_totale', { 
                required: 'Quantité requise',
                min: { value: 0.01, message: 'Quantité minimum: 0.01' },
                max: stockDisponible ? { value: stockDisponible, message: `Stock disponible: ${stockDisponible}t` } : undefined
              })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {stockDisponible !== null && (
              <p className="text-sm text-gray-600 mt-1">
                Stock disponible: {stockDisponible} tonnes
              </p>
            )}
            {errors.quantite_totale && (
              <p className="text-red-500 text-sm mt-1">{errors.quantite_totale.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optionnel)
            </label>
            <textarea
              {...register('notes')}
              rows="3"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Instructions spéciales, remarques..."
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/manager/dispatches')}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Création...
                </>
              ) : (
                <>
                  Créer le dispatch
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}