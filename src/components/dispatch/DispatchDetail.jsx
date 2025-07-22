import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, Truck, User, Calendar, MapPin, AlertTriangle, Plus, X, TruckIcon } from 'lucide-react';
import dispatchService from '../../services/dispatch';
import chauffeurService from '../../services/chauffeur';
import rotationService from '../../services/rotation';
import { formatDate, formatNumber } from '../../utils/format';
import MultiRotationModal from './MultiRotationModal';

export default function DispatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dispatch, setDispatch] = useState(null);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddRotation, setShowAddRotation] = useState(false);
  const [showMultiRotation, setShowMultiRotation] = useState(false);
  const [rotations, setRotations] = useState([]);
  const [rotationsSummary, setRotationsSummary] = useState(null);
  const [newRotation, setNewRotation] = useState({
    chauffeur_id: '',
    quantite_prevue: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDispatchDetails();
    fetchChauffeurs();
    fetchRotations();
  }, [id]);

  const fetchDispatchDetails = async () => {
    try {
      setLoading(true);
      const data = await dispatchService.getDispatch(id);
      setDispatch(data);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement du dispatch');
    } finally {
      setLoading(false);
    }
  };

  const fetchChauffeurs = async () => {
    try {
      const data = await chauffeurService.getChauffeurs({ statut: 'actif' });
      setChauffeurs(data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchRotations = async () => {
    try {
      const response = await rotationService.getRotationsByDispatch(id);
      setRotations(response.rotations || []);
      setRotationsSummary(response.summary || null);
    } catch (error) {
      console.error('Erreur chargement rotations:', error);
    }
  };

  const handleAddRotation = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await dispatchService.addRotation(id, {
        chauffeur_id: parseInt(newRotation.chauffeur_id),
        quantite_prevue: parseFloat(newRotation.quantite_prevue)
      });
      setShowAddRotation(false);
      setNewRotation({ chauffeur_id: '', quantite_prevue: '' });
      fetchDispatchDetails();
      fetchRotations();
    } catch (error) {
      setError(error.message || 'Erreur lors de l\'ajout de la rotation');
    }
  };

  const handleCancelDispatch = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler ce dispatch ?')) {
      try {
        await dispatchService.cancelDispatch(id);
        fetchDispatchDetails();
      } catch (error) {
        setError(error.message || 'Erreur lors de l\'annulation');
      }
    }
  };

  const calculateRemainingQuantity = () => {
    if (!dispatch || !rotationsSummary) return dispatch?.quantite_totale || 0;
    return dispatch.quantite_totale - (rotationsSummary.total_prevu || 0);
  };

  const handleMultiRotationSuccess = () => {
    setShowMultiRotation(false);
    fetchDispatchDetails();
    fetchRotations();
  };

  const getStatusColor = (status) => {
    const colors = {
      'en_attente': 'bg-yellow-100 text-yellow-800',
      'en_cours': 'bg-blue-100 text-blue-800',
      'termine': 'bg-green-100 text-green-800',
      'annule': 'bg-red-100 text-red-800',
      'en_transit': 'bg-orange-100 text-orange-800',
      'livre': 'bg-green-100 text-green-800',
      'manquant': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dispatch) {
    return <div className="text-center py-8">Dispatch non trouvé</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6" />
          Dispatch {dispatch.numero_dispatch}
        </h2>
        <div className="flex gap-2">
          {dispatch.statut === 'en_attente' && (
            <button
              onClick={handleCancelDispatch}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Annuler
            </button>
          )}
          <button
            onClick={() => navigate('/manager/dispatches')}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Retour
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Informations générales */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Informations générales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Statut</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(dispatch.statut)}`}>
              {dispatch.statut.replace('_', ' ').charAt(0).toUpperCase() + dispatch.statut.slice(1).replace('_', ' ')}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-600">Manager</p>
            <p className="font-medium flex items-center gap-1">
              <User className="w-4 h-4" />
              {dispatch.manager?.nom}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Client</p>
            <p className="font-medium">{dispatch.client?.nom}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Produit</p>
            <p className="font-medium">{dispatch.produit?.nom}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Quantité totale</p>
            <p className="font-medium">{formatNumber(dispatch.quantite_totale)} tonnes</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Date de création</p>
            <p className="font-medium flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(dispatch.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Trajet */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Trajet
        </h3>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-sm text-gray-600">Magasin source</p>
            <p className="font-medium text-lg">{dispatch.magasin_source?.nom}</p>
          </div>
          <div className="flex-1 mx-8">
            <div className="h-2 bg-gray-200 rounded-full relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Magasin destination</p>
            <p className="font-medium text-lg">{dispatch.magasin_destination?.nom}</p>
          </div>
        </div>
      </div>

      {/* Rotations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Rotations {rotationsSummary && `(${rotationsSummary.total_rotations})`}
          </h3>
          {dispatch.statut === 'en_attente' || dispatch.statut === 'en_cours' ? (
            <div className="flex gap-2">
              <button
                onClick={() => setShowMultiRotation(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
              >
                <TruckIcon className="w-4 h-4" />
                Planifier rotations multiples
              </button>
              <button
                onClick={() => setShowAddRotation(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter une rotation
              </button>
            </div>
          ) : null}
        </div>

        {rotations && rotations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Numéro
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Chauffeur
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Camion
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Quantité prévue
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Quantité livrée
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Écart
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rotations.map((rotation) => (
                  <tr key={rotation.id}>
                    <td className="px-4 py-3 text-sm">{rotation.numero_rotation}</td>
                    <td className="px-4 py-3 text-sm">{rotation.chauffeur?.nom}</td>
                    <td className="px-4 py-3 text-sm">{rotation.chauffeur?.numero_camion}</td>
                    <td className="px-4 py-3 text-sm">{formatNumber(rotation.quantite_prevue)} t</td>
                    <td className="px-4 py-3 text-sm">
                      {rotation.quantite_livree ? formatNumber(rotation.quantite_livree) + ' t' : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {rotation.quantite_livree && rotation.ecart > 0 ? (
                        <span className="text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          {formatNumber(rotation.ecart)} t
                        </span>
                      ) : rotation.quantite_livree && rotation.ecart === 0 ? (
                        <span className="text-green-600">0 t</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rotation.statut)}`}>
                        {rotation.statut.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">Aucune rotation pour ce dispatch</p>
        )}

        {rotationsSummary && (
          <div className="mt-4 space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Planifiées</p>
                <p className="text-lg font-semibold text-blue-600">
                  {rotationsSummary.rotations_planifiees}
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">En transit</p>
                <p className="text-lg font-semibold text-orange-600">
                  {rotationsSummary.rotations_en_transit}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Livrées</p>
                <p className="text-lg font-semibold text-green-600">
                  {rotationsSummary.rotations_livrees}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Quantité livrée</p>
                <p className="text-lg font-semibold text-purple-600">
                  {formatNumber(rotationsSummary.total_livre)} t
                </p>
              </div>
            </div>
            {calculateRemainingQuantity() > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800">
                  Quantité restante à dispatcher: <strong>{formatNumber(calculateRemainingQuantity())} tonnes</strong>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal d'ajout de rotation */}
      {showAddRotation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Ajouter une rotation</h3>
            <form onSubmit={handleAddRotation}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chauffeur
                  </label>
                  <select
                    value={newRotation.chauffeur_id}
                    onChange={(e) => setNewRotation({ ...newRotation, chauffeur_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner un chauffeur</option>
                    {chauffeurs.map(chauffeur => (
                      <option key={chauffeur.id} value={chauffeur.id}>
                        {chauffeur.nom} - {chauffeur.numero_camion} ({chauffeur.capacite_camion}t)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantité (tonnes)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newRotation.quantite_prevue}
                    onChange={(e) => setNewRotation({ ...newRotation, quantite_prevue: e.target.value })}
                    max={calculateRemainingQuantity()}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Maximum: {formatNumber(calculateRemainingQuantity())} tonnes
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddRotation(false);
                    setNewRotation({ chauffeur_id: '', quantite_prevue: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de rotations multiples */}
      {showMultiRotation && (
        <MultiRotationModal
          dispatch={dispatch}
          onClose={() => setShowMultiRotation(false)}
          onSuccess={handleMultiRotationSuccess}
        />
      )}
    </div>
  );
}