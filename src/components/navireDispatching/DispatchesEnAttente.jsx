import React, { useState, useEffect } from 'react';
import { Ship, Package, Calendar, MapPin, AlertCircle } from 'lucide-react';
import navireDispatchingService from '../../services/navireDispatching';
import { formatDate, formatNumber } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';

export default function DispatchesEnAttente() {
  const { user } = useAuth();
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receptionData, setReceptionData] = useState({
    quantite_recue: '',
    observations: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDispatches();
  }, []);

  const fetchDispatches = async () => {
    try {
      setLoading(true);
      const data = await navireDispatchingService.getDispatchesEnAttente();
      setDispatches(data);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement des dispatches');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceiveModal = (dispatch) => {
    setSelectedDispatch(dispatch);
    setReceptionData({
      quantite_recue: dispatch.quantite.toString(),
      observations: ''
    });
    setShowReceiveModal(true);
    setError('');
    setSuccess('');
  };

  const handleReceiveDispatch = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const response = await navireDispatchingService.receptionnerDispatch(selectedDispatch.id, {
        quantite_recue: parseFloat(receptionData.quantite_recue),
        observations: receptionData.observations
      });
      
      setSuccess(response.message);
      setShowReceiveModal(false);
      setSelectedDispatch(null);
      setReceptionData({ quantite_recue: '', observations: '' });
      fetchDispatches();
      
      // Masquer le message de succès après 3 secondes
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Erreur lors de la réception');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Ship className="w-6 h-6" />
          Dispatches en Attente
          {user?.magasin && <span className="text-lg font-normal text-gray-600"> - {user.magasin.nom}</span>}
        </h2>
        <div className="text-sm text-gray-600">
          {dispatches.length} dispatch{dispatches.length > 1 ? 'es' : ''} en attente
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 text-green-700">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dispatches.map((dispatch) => (
          <div key={dispatch.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-lg">{dispatch.nom_navire}</h3>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                En attente
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Ship className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">IMO: {dispatch.numero_imo}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  Arrivée: {formatDate(dispatch.date_arrivee)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  {dispatch.produit_nom} - {formatNumber(dispatch.quantite)} {dispatch.unite || 'tonnes'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  Origine: {dispatch.origine}
                </span>
              </div>

              <div className="pt-2 border-t">
                <p className="text-sm text-gray-600 mb-1">Dispatché par</p>
                <p className="font-medium">{dispatch.dispatch_par_nom}</p>
                <p className="text-xs text-gray-500">{formatDate(dispatch.date_dispatch)}</p>
              </div>

              {dispatch.observations && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600 mb-1">Observations</p>
                  <p className="text-sm">{dispatch.observations}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => handleOpenReceiveModal(dispatch)}
              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Réceptionner
            </button>
          </div>
        ))}
      </div>

      {dispatches.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Ship className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucun dispatch en attente</p>
        </div>
      )}

      {/* Modal de réception */}
      {showReceiveModal && selectedDispatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              Réceptionner le dispatch du {selectedDispatch.nom_navire}
            </h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">Navire: <span className="font-medium">{selectedDispatch.nom_navire} (IMO: {selectedDispatch.numero_imo})</span></p>
              <p className="text-sm text-gray-600">Produit: <span className="font-medium">{selectedDispatch.produit_nom}</span></p>
              <p className="text-sm text-gray-600">Quantité dispatchée: <span className="font-medium">{formatNumber(selectedDispatch.quantite)} {selectedDispatch.unite || 'tonnes'}</span></p>
              <p className="text-sm text-gray-600">Magasin: <span className="font-medium">{selectedDispatch.magasin_nom}</span></p>
            </div>

            <form onSubmit={handleReceiveDispatch}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantité réellement reçue ({selectedDispatch.unite || 'tonnes'})
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={receptionData.quantite_recue}
                    onChange={(e) => setReceptionData({ ...receptionData, quantite_recue: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {parseFloat(receptionData.quantite_recue) < selectedDispatch.quantite && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span>
                        Écart détecté: {formatNumber(selectedDispatch.quantite - parseFloat(receptionData.quantite_recue))} {selectedDispatch.unite || 'tonnes'}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observations (optionnel)
                  </label>
                  <textarea
                    value={receptionData.observations}
                    onChange={(e) => setReceptionData({ ...receptionData, observations: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Remarques sur la réception, état de la cargaison..."
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowReceiveModal(false);
                    setSelectedDispatch(null);
                    setError('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Confirmer la réception
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}