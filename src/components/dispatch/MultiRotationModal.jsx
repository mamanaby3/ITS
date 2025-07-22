import React, { useState, useEffect } from 'react';
import { X, Truck, Calculator, AlertCircle, Check } from 'lucide-react';
import rotationService from '../../services/rotation';
import chauffeurService from '../../services/chauffeur';
import { formatNumber } from '../../utils/format';

export default function MultiRotationModal({ dispatch, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: calculer, 2: réviser, 3: créer
  const [chauffeurs, setChauffeurs] = useState([]);
  const [selectedChauffeurs, setSelectedChauffeurs] = useState([]);
  const [rotations, setRotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchChauffeurs();
  }, []);

  const fetchChauffeurs = async () => {
    try {
      const data = await chauffeurService.getChauffeurs({ statut: 'actif' });
      setChauffeurs(data);
    } catch (error) {
      setError('Erreur lors du chargement des chauffeurs');
    }
  };

  const handleCalculateRotations = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await rotationService.calculateRotations({
        dispatch_id: dispatch.id,
        quantite_totale: dispatch.quantite_totale,
        chauffeurs_disponibles: selectedChauffeurs.length > 0 ? selectedChauffeurs : undefined
      });
      
      setRotations(response.data.rotations);
      setStep(2);
    } catch (error) {
      setError(error.message || 'Erreur lors du calcul des rotations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRotations = async () => {
    try {
      setLoading(true);
      setError('');
      
      const rotationsData = rotations.map(r => ({
        chauffeur_id: r.chauffeur_id,
        quantite_prevue: r.quantite_prevue,
        observations: `Rotation ${r.numero_rotation} pour dispatch ${dispatch.numero_dispatch}`
      }));
      
      await rotationService.createMultipleRotations({
        dispatch_id: dispatch.id,
        rotations: rotationsData
      });
      
      setStep(3);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      setError(error.message || 'Erreur lors de la création des rotations');
    } finally {
      setLoading(false);
    }
  };

  const handleRotationChange = (index, field, value) => {
    const updatedRotations = [...rotations];
    updatedRotations[index][field] = value;
    
    // Recalculer les quantités si nécessaire
    if (field === 'quantite_prevue') {
      const totalAssigned = updatedRotations.reduce((sum, r) => sum + parseFloat(r.quantite_prevue || 0), 0);
      if (totalAssigned > dispatch.quantite_totale) {
        setError(`La quantité totale (${totalAssigned}t) dépasse la quantité du dispatch (${dispatch.quantite_totale}t)`);
        return;
      }
    }
    
    setRotations(updatedRotations);
    setError('');
  };

  const toggleChauffeurSelection = (chauffeurId) => {
    setSelectedChauffeurs(prev => 
      prev.includes(chauffeurId) 
        ? prev.filter(id => id !== chauffeurId)
        : [...prev, chauffeurId]
    );
  };

  const getTotalQuantite = () => {
    return rotations.reduce((sum, r) => sum + (r.quantite_prevue || 0), 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Truck className="w-6 h-6" />
            Gestion des rotations multiples
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Step 1: Sélection des chauffeurs et calcul */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Informations du dispatch</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><span className="font-medium">Numéro:</span> {dispatch.numero_dispatch}</p>
                  <p><span className="font-medium">Produit:</span> {dispatch.produit?.nom}</p>
                  <p><span className="font-medium">Quantité totale:</span> {formatNumber(dispatch.quantite_totale)} tonnes</p>
                  <p><span className="font-medium">Destination:</span> {dispatch.magasin_destination?.nom}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Sélectionner les chauffeurs disponibles</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Sélectionnez les chauffeurs disponibles pour cette livraison. 
                  Le système calculera automatiquement le nombre de rotations nécessaires.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {chauffeurs.map(chauffeur => (
                    <label
                      key={chauffeur.id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        selectedChauffeurs.includes(chauffeur.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedChauffeurs.includes(chauffeur.id)}
                        onChange={() => toggleChauffeurSelection(chauffeur.id)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{chauffeur.nom}</p>
                        <p className="text-sm text-gray-600">
                          Camion: {chauffeur.numero_camion} - Capacité: {chauffeur.capacite_camion}t
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                
                {selectedChauffeurs.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Si aucun chauffeur n'est sélectionné, tous les chauffeurs actifs seront considérés.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Révision des rotations calculées */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Rotations calculées</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {rotations.length} rotation(s) nécessaire(s) pour transporter {formatNumber(dispatch.quantite_totale)} tonnes
                </p>
              </div>

              <div className="space-y-4">
                {rotations.map((rotation, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Rotation {index + 1}</h4>
                      <span className="text-sm text-gray-600">
                        Capacité max: {rotation.capacite_camion}t
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Chauffeur
                        </label>
                        <select
                          value={rotation.chauffeur_id}
                          onChange={(e) => handleRotationChange(index, 'chauffeur_id', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          {chauffeurs.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.nom} - {c.numero_camion}
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
                          value={rotation.quantite_prevue}
                          onChange={(e) => handleRotationChange(index, 'quantite_prevue', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border rounded-md"
                          max={rotation.capacite_camion}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Camion
                        </label>
                        <p className="px-3 py-2 bg-gray-100 rounded-md">
                          {rotation.numero_camion}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Quantité totale assignée:</span>
                  <span className={`font-bold ${
                    getTotalQuantite() === dispatch.quantite_totale ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {formatNumber(getTotalQuantite())} / {formatNumber(dispatch.quantite_totale)} tonnes
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="text-center py-12">
              <div className="mb-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Rotations créées avec succès!</h3>
              <p className="text-gray-600">
                {rotations.length} rotation(s) ont été créées pour le dispatch {dispatch.numero_dispatch}
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          {step === 1 && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleCalculateRotations}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                <Calculator className="w-4 h-4" />
                {loading ? 'Calcul...' : 'Calculer les rotations'}
              </button>
            </>
          )}
          
          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Retour
              </button>
              <button
                onClick={handleCreateRotations}
                disabled={loading || getTotalQuantite() !== dispatch.quantite_totale}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Création...' : 'Créer les rotations'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}