import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Ship, Package, Users, Store, AlertCircle, Check, X } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatNumber } from '../utils/format';

const DispatchNavire = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const navire = location.state?.navire;
  
  const [loading, setLoading] = useState(false);
  const [destinationType, setDestinationType] = useState(''); // 'client' ou 'magasin'
  const [clients, setClients] = useState([]);
  const [magasins, setMagasins] = useState([]);
  const [selectedCargaison, setSelectedCargaison] = useState(null);
  
  // Formulaire de dispatch
  const [dispatchForm, setDispatchForm] = useState({
    destination_id: '',
    quantite: '',
    numero_camion: '',
    transporteur: '',
    chauffeur_nom: '',
    observations: ''
  });

  useEffect(() => {
    if (!navire) {
      navigate('/reception-navires');
      return;
    }
    loadDestinations();
  }, [navire]);

  const loadDestinations = async () => {
    try {
      const [clientsRes, magasinsRes] = await Promise.all([
        api.get('/clients'),
        api.get('/magasins')
      ]);
      setClients(clientsRes.data || []);
      setMagasins(magasinsRes.data || []);
    } catch (error) {
      console.error('Erreur chargement destinations:', error);
      toast.error('Erreur lors du chargement des destinations');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCargaison || !destinationType || !dispatchForm.destination_id) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        navire_id: navire.id,
        cargaison_id: selectedCargaison.id,
        quantite: parseFloat(dispatchForm.quantite),
        numero_camion: dispatchForm.numero_camion,
        transporteur: dispatchForm.transporteur,
        chauffeur_nom: dispatchForm.chauffeur_nom,
        observations: dispatchForm.observations
      };

      if (destinationType === 'magasin') {
        // Dispatch vers magasin
        payload.magasin_id = parseInt(dispatchForm.destination_id);
        await api.post('/navire-dispatching/dispatcher', payload);
        toast.success('Dispatch vers magasin effectué avec succès');
      } else {
        // Dispatch vers client
        payload.client_id = parseInt(dispatchForm.destination_id);
        payload.destination = clients.find(c => c.id === parseInt(dispatchForm.destination_id))?.adresse || '';
        await api.post('/navire-dispatching/dispatcher-client', payload);
        toast.success('Dispatch vers client effectué avec succès');
      }

      // Retourner à la page de réception
      navigate('/reception-navires');
    } catch (error) {
      console.error('Erreur dispatch:', error);
      toast.error(error.response?.data?.error || 'Erreur lors du dispatch');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/reception-navires');
  };

  if (!navire) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Ship className="w-6 h-6" />
              Dispatcher le navire {navire.nom}
            </h1>
            <p className="text-gray-600 mt-1">
              IMO: {navire.imo} - Arrivée: {new Date(navire.dateArrivee).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={handleCancel}
          >
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
        </div>
      </Card>

      {/* Sélection de la cargaison */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Sélectionner la cargaison à dispatcher
        </h2>
        
        <div className="space-y-3">
          {navire.cargaison?.map((cargo, index) => (
            <div
              key={index}
              onClick={() => setSelectedCargaison(cargo)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedCargaison?.id === cargo.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{cargo.produit}</p>
                  <p className="text-sm text-gray-600">
                    Quantité: {formatNumber(cargo.quantite)} {cargo.unite}
                  </p>
                  <p className="text-sm text-gray-500">Origine: {cargo.origine}</p>
                </div>
                {selectedCargaison?.id === cargo.id && (
                  <Check className="w-5 h-5 text-blue-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {selectedCargaison && (
        <>
          {/* Type de destination */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Type de destination</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setDestinationType('magasin')}
                className={`p-6 border-2 rounded-lg transition-all ${
                  destinationType === 'magasin'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Store className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="font-medium">Vers Magasin</p>
                <p className="text-sm text-gray-600 mt-1">
                  Stocker dans un magasin
                </p>
              </button>

              <button
                onClick={() => setDestinationType('client')}
                className={`p-6 border-2 rounded-lg transition-all ${
                  destinationType === 'client'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Users className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="font-medium">Vers Client</p>
                <p className="text-sm text-gray-600 mt-1">
                  Livraison directe client
                </p>
              </button>
            </div>
          </Card>

          {/* Formulaire de dispatch */}
          {destinationType && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                Informations de dispatch
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Destination */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {destinationType === 'magasin' ? 'Magasin' : 'Client'} *
                    </label>
                    <select
                      value={dispatchForm.destination_id}
                      onChange={(e) => setDispatchForm({...dispatchForm, destination_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Sélectionner...</option>
                      {(destinationType === 'magasin' ? magasins : clients).map(dest => (
                        <option key={dest.id} value={dest.id}>
                          {dest.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantité */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantité ({selectedCargaison.unite}) *
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      max={selectedCargaison.quantite}
                      value={dispatchForm.quantite}
                      onChange={(e) => setDispatchForm({...dispatchForm, quantite: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Max: {formatNumber(selectedCargaison.quantite)} {selectedCargaison.unite}
                    </p>
                  </div>

                  {/* Numéro camion */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numéro du camion *
                    </label>
                    <input
                      type="text"
                      value={dispatchForm.numero_camion}
                      onChange={(e) => setDispatchForm({...dispatchForm, numero_camion: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="DK-1234-A"
                      required
                    />
                  </div>

                  {/* Transporteur */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transporteur *
                    </label>
                    <input
                      type="text"
                      value={dispatchForm.transporteur}
                      onChange={(e) => setDispatchForm({...dispatchForm, transporteur: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Chauffeur */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du chauffeur
                    </label>
                    <input
                      type="text"
                      value={dispatchForm.chauffeur_nom}
                      onChange={(e) => setDispatchForm({...dispatchForm, chauffeur_nom: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Observations */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observations
                  </label>
                  <textarea
                    value={dispatchForm.observations}
                    onChange={(e) => setDispatchForm({...dispatchForm, observations: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                  >
                    {loading ? 'Dispatch en cours...' : 'Confirmer le dispatch'}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default DispatchNavire;