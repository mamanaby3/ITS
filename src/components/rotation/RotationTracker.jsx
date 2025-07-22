import React, { useState, useEffect } from 'react';
import { Truck, Package, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import rotationService from '../../services/rotation';
import { formatNumber, formatDate } from '../../utils/format';

export default function RotationTracker({ dispatchId, onUpdate }) {
  const [rotations, setRotations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRotation, setSelectedRotation] = useState(null);

  useEffect(() => {
    fetchRotations();
    const interval = setInterval(fetchRotations, 30000); // Actualiser toutes les 30 secondes
    return () => clearInterval(interval);
  }, [dispatchId]);

  const fetchRotations = async () => {
    try {
      const response = await rotationService.getRotationsByDispatch(dispatchId);
      setRotations(response.rotations || []);
      setSummary(response.summary || null);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement rotations:', error);
      setLoading(false);
    }
  };

  const handleStartRotation = async (rotationId) => {
    try {
      await rotationService.startRotation(rotationId);
      fetchRotations();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Erreur démarrage rotation:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'planifie':
        return <Clock className="w-5 h-5 text-gray-500" />;
      case 'en_transit':
        return <Truck className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'livre':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'planifie': 'bg-gray-100 text-gray-700',
      'en_transit': 'bg-blue-100 text-blue-700',
      'livre': 'bg-green-100 text-green-700',
      'annule': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getProgressPercentage = () => {
    if (!summary || summary.total_rotations === 0) return 0;
    return (summary.rotations_livrees / summary.total_rotations) * 100;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Package className="w-5 h-5" />
          Suivi des rotations
        </h3>
        <button
          onClick={fetchRotations}
          className="p-2 hover:bg-gray-100 rounded-full"
          title="Actualiser"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Barre de progression globale */}
      {summary && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{summary.rotations_livrees} sur {summary.total_rotations} rotations livrées</span>
            <span>{formatNumber(summary.total_livre)} / {formatNumber(summary.total_prevu)} tonnes</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      )}

      {/* Liste des rotations */}
      <div className="space-y-4">
        {rotations.map((rotation) => (
          <div
            key={rotation.id}
            className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${
              selectedRotation?.id === rotation.id ? 'border-blue-500' : 'border-gray-200'
            }`}
            onClick={() => setSelectedRotation(rotation)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(rotation.statut)}
                <div>
                  <p className="font-medium">{rotation.numero_rotation}</p>
                  <p className="text-sm text-gray-600">
                    {rotation.chauffeur_nom} - {rotation.numero_camion}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatNumber(rotation.quantite_prevue)} tonnes</p>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rotation.statut)}`}>
                  {rotation.statut.replace('_', ' ')}
                </span>
              </div>
            </div>

            {rotation.statut === 'planifie' && (
              <div className="mt-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartRotation(rotation.id);
                  }}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Démarrer la rotation
                </button>
              </div>
            )}

            {rotation.statut === 'livre' && rotation.quantite_livree && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Quantité livrée:</span>
                  <span className={rotation.ecart > 0 ? 'text-orange-600 font-medium' : 'text-green-600 font-medium'}>
                    {formatNumber(rotation.quantite_livree)} tonnes
                    {rotation.ecart > 0 && ` (-${formatNumber(rotation.ecart)})`}
                  </span>
                </div>
                {rotation.date_arrivee && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">Date d'arrivée:</span>
                    <span>{formatDate(rotation.date_arrivee)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Détails de la rotation sélectionnée */}
      {selectedRotation && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-3">Détails de la rotation</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Chauffeur:</span>
              <p className="font-medium">{selectedRotation.chauffeur_nom}</p>
            </div>
            <div>
              <span className="text-gray-600">Camion:</span>
              <p className="font-medium">{selectedRotation.numero_camion}</p>
            </div>
            <div>
              <span className="text-gray-600">Capacité:</span>
              <p className="font-medium">{formatNumber(selectedRotation.capacite_camion)} tonnes</p>
            </div>
            <div>
              <span className="text-gray-600">Quantité prévue:</span>
              <p className="font-medium">{formatNumber(selectedRotation.quantite_prevue)} tonnes</p>
            </div>
            {selectedRotation.notes && (
              <div className="col-span-2">
                <span className="text-gray-600">Notes:</span>
                <p className="font-medium">{selectedRotation.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}