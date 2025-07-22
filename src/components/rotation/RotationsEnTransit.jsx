import React, { useState, useEffect } from 'react';
import { Truck, Package, User, Clock, MapPin } from 'lucide-react';
import rotationService from '../../services/rotation';
import { formatDate, formatNumber } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { RotationsExportButton } from '../ui/ExcelExportButton';
import { VerticalTableExportButton, CardExportButton } from '../ui/VerticalExcelExportButton';

export default function RotationsEnTransit() {
  const { user } = useAuth();
  const [rotations, setRotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRotation, setSelectedRotation] = useState(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receptionData, setReceptionData] = useState({
    quantite_livree: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRotations();
  }, []);

  const fetchRotations = async () => {
    try {
      setLoading(true);
      // Récupérer toutes les rotations, pas seulement celles en transit
      const filters = {};
      if (user.role === 'operator' && user.magasin_id) {
        filters.magasin_id = user.magasin_id;
      }
      // Utiliser getRotations au lieu de getRotationsEnTransit pour avoir toutes les rotations
      const response = await rotationService.getRotations(filters);
      console.log('Réponse API rotations:', response);
      // Vérifier si la réponse a une structure imbriquée
      const rotationsData = response.data || response || [];
      console.log('Données rotations extraites:', rotationsData);
      setRotations(Array.isArray(rotationsData) ? rotationsData : []);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement des rotations');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceiveModal = (rotation) => {
    setSelectedRotation(rotation);
    setReceptionData({
      quantite_livree: (rotation.quantite_prevue || 0).toString(),
      notes: ''
    });
    setShowReceiveModal(true);
    setError('');
    setSuccess('');
  };

  const handleReceiveRotation = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const response = await rotationService.receiveRotation(selectedRotation.id, {
        quantite_livree: parseFloat(receptionData.quantite_livree),
        notes: receptionData.notes
      });
      
      setSuccess(response.message);
      setShowReceiveModal(false);
      setSelectedRotation(null);
      setReceptionData({ quantite_livree: '', notes: '' });
      fetchRotations();
      
      // Masquer le message de succès après 3 secondes
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Erreur lors de la réception');
    }
  };

  const calculateTimeSinceDispatch = (departureTime) => {
    const hours = Math.floor((new Date() - new Date(departureTime)) / (1000 * 60 * 60));
    if (hours < 1) return 'moins d\'une heure';
    if (hours === 1) return '1 heure';
    return `${hours} heures`;
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
          <Truck className="w-6 h-6" />
          Toutes les Rotations
          {user?.magasin && <span className="text-lg font-normal text-gray-600"> - {user.magasin.nom}</span>}
        </h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            {loading ? (
              <span className="animate-pulse">Chargement...</span>
            ) : (
              <span>{rotations.length} rotation{rotations.length !== 1 ? 's' : ''} trouvée{rotations.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          {!loading && rotations.length > 0 && (
            <div className="flex gap-2">
              <RotationsExportButton 
                data={rotations} 
                filename="rotations_transit"
                size="sm"
              />
              <VerticalTableExportButton 
                data={rotations} 
                columns={[
                  { key: 'numero_rotation', header: 'N° Rotation', type: 'text' },
                  { key: 'chauffeur.nom', header: 'Chauffeur', type: 'text' },
                  { key: 'chauffeur.numero_camion', header: 'N° Camion', type: 'text' },
                  { key: 'dispatch.produit.nom', header: 'Produit', type: 'text' },
                  { key: 'quantite_prevue', header: 'Quantité Prévue (T)', type: 'number' },
                  { key: 'quantite_livree', header: 'Quantité Livrée (T)', type: 'number' },
                  { key: 'statut', header: 'Statut', type: 'text' },
                  { key: 'dispatch.client.nom', header: 'Client', type: 'text' }
                ]}
                filename="rotations_vertical"
                size="sm"
              />
              <CardExportButton 
                data={rotations} 
                columns={[
                  { key: 'numero_rotation', header: 'N° Rotation', type: 'text' },
                  { key: 'chauffeur.nom', header: 'Chauffeur', type: 'text' },
                  { key: 'chauffeur.numero_camion', header: 'N° Camion', type: 'text' },
                  { key: 'dispatch.produit.nom', header: 'Produit', type: 'text' },
                  { key: 'quantite_prevue', header: 'Quantité Prévue (T)', type: 'number' },
                  { key: 'quantite_livree', header: 'Quantité Livrée (T)', type: 'number' },
                  { key: 'statut', header: 'Statut', type: 'text' },
                  { key: 'date_arrivee', header: 'Date Arrivée', type: 'date' },
                  { key: 'dispatch.client.nom', header: 'Client', type: 'text' }
                ]}
                filename="rotations_cartes"
                size="sm"
              />
            </div>
          )}
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
        {rotations.map((rotation) => (
          <div key={rotation.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-lg">{rotation.numero_rotation}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                rotation.statut === 'en_transit' ? 'bg-orange-100 text-orange-800' :
                rotation.statut === 'livre' ? 'bg-green-100 text-green-800' :
                rotation.statut === 'manquant' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {rotation.statut === 'en_transit' ? 'En transit' :
                 rotation.statut === 'livre' ? 'Livré' :
                 rotation.statut === 'manquant' ? 'Manquant' :
                 rotation.statut}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{rotation.chauffeur?.nom}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Truck className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{rotation.chauffeur?.numero_camion}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  {rotation.produit_nom || rotation.dispatch?.produit?.nom} - Prévu: {formatNumber(rotation.quantite_prevue || 0)} t
                  {rotation.quantite_livree && (
                    <span className="block text-xs mt-1">
                      Livré: {formatNumber(rotation.quantite_livree || 0)} t
                      {(rotation.ecart !== undefined && rotation.ecart !== 0) && (
                        <span className={rotation.ecart > 0 ? 'text-red-600' : 'text-green-600'}>
                          {' '}(Écart: {formatNumber(Math.abs(rotation.ecart || 0))} t)
                        </span>
                      )}
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  {rotation.magasin_source_nom || rotation.dispatch?.magasin_source?.nom} → {rotation.magasin_destination_nom || rotation.dispatch?.magasin_destination?.nom}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  {rotation.date_arrivee ? `Arrivée: ${formatDate(rotation.date_arrivee)} ${rotation.heure_arrivee || ''}` : 
                   rotation.heure_depart ? `Parti depuis ${calculateTimeSinceDispatch(rotation.heure_depart)}` : 
                   'En attente'}
                </span>
              </div>

              <div className="pt-2 border-t">
                <p className="text-sm text-gray-600 mb-1">Client</p>
                <p className="font-medium">{rotation.dispatch?.client?.nom}</p>
              </div>
            </div>

            {rotation.statut === 'en_transit' && (
              <button
                onClick={() => handleOpenReceiveModal(rotation)}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Réceptionner
              </button>
            )}
            {rotation.statut === 'livre' && rotation.reception_par && (
              <div className="mt-4 p-2 bg-gray-50 rounded text-sm text-gray-600">
                Réceptionné par: {rotation.receptionnaire_nom || 'Opérateur'}
              </div>
            )}
          </div>
        ))}
      </div>

      {!loading && rotations.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucune rotation trouvée</p>
          <p className="text-sm text-gray-400 mt-2">
            {user?.magasin ? `Pour le magasin: ${user.magasin.nom}` : 'Vérifiez que des rotations ont été créées'}
          </p>
        </div>
      )}

      {/* Modal de réception */}
      {showReceiveModal && selectedRotation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              Réceptionner la rotation {selectedRotation.numero_rotation}
            </h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">Chauffeur: <span className="font-medium">{selectedRotation.chauffeur?.nom || 'Non défini'}</span></p>
              <p className="text-sm text-gray-600">Produit: <span className="font-medium">{selectedRotation.dispatch?.produit?.nom || 'Non défini'}</span></p>
              <p className="text-sm text-gray-600">Quantité prévue: <span className="font-medium">{formatNumber(selectedRotation.quantite_prevue || 0)} tonnes</span></p>
            </div>

            <form onSubmit={handleReceiveRotation}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantité réellement livrée (tonnes)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={receptionData.quantite_livree}
                    onChange={(e) => setReceptionData({ ...receptionData, quantite_livree: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {parseFloat(receptionData.quantite_livree || 0) < (selectedRotation.quantite_prevue || 0) && (
                    <p className="text-sm text-red-600 mt-1">
                      Écart détecté: {formatNumber((selectedRotation.quantite_prevue || 0) - parseFloat(receptionData.quantite_livree || 0))} tonnes
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={receptionData.notes}
                    onChange={(e) => setReceptionData({ ...receptionData, notes: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Remarques sur la livraison, explications des écarts..."
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
                    setSelectedRotation(null);
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