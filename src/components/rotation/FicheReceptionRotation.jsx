import React, { useState, useEffect } from 'react';
import { Truck, Package, User, Clock, MapPin, FileText, CheckCircle } from 'lucide-react';
import rotationService from '../../services/rotation';
import { formatDate, formatNumber } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';

export default function FicheReceptionRotation() {
  const { user } = useAuth();
  const [rotationsEnAttente, setRotationsEnAttente] = useState([]);
  const [selectedRotation, setSelectedRotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFiche, setShowFiche] = useState(false);
  const [ficheData, setFicheData] = useState({
    numero_rotation: '',
    date_reception: new Date().toISOString().split('T')[0],
    heure_reception: new Date().toTimeString().slice(0, 5),
    chauffeur_nom: '',
    numero_camion: '',
    produit_nom: '',
    quantite_prevue: 0,
    quantite_livree: '',
    quantite_refusee: 0,
    etat_marchandise: 'bon',
    temperature: '',
    humidite: '',
    observations: '',
    documents_accompagnement: [],
    signature_chauffeur: false,
    signature_magasinier: false,
    photos: []
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRotationsEnAttente();
  }, []);

  const fetchRotationsEnAttente = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (user.role === 'operator' && user.magasin_id) {
        filters.magasin_id = user.magasin_id;
      }
      const data = await rotationService.getRotationsEnTransit(filters);
      setRotationsEnAttente(data);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement des rotations');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRotation = (rotation) => {
    setSelectedRotation(rotation);
    setFicheData({
      numero_rotation: rotation.numero_rotation,
      date_reception: new Date().toISOString().split('T')[0],
      heure_reception: new Date().toTimeString().slice(0, 5),
      chauffeur_nom: rotation.chauffeur?.nom || '',
      numero_camion: rotation.chauffeur?.numero_camion || '',
      produit_nom: rotation.dispatch?.produit?.nom || '',
      quantite_prevue: rotation.quantite_prevue || 0,
      quantite_livree: (rotation.quantite_prevue || 0).toString(),
      quantite_refusee: 0,
      etat_marchandise: 'bon',
      temperature: '',
      humidite: '',
      observations: '',
      documents_accompagnement: [],
      signature_chauffeur: false,
      signature_magasinier: false,
      photos: []
    });
    setShowFiche(true);
    setError('');
    setSuccess('');
  };

  const handleInputChange = (field, value) => {
    setFicheData(prev => ({
      ...prev,
      [field]: value
    }));

    // Calculer automatiquement la quantité refusée
    if (field === 'quantite_livree') {
      const livree = parseFloat(value) || 0;
      const prevue = parseFloat(ficheData.quantite_prevue) || 0;
      const refusee = Math.max(0, prevue - livree);
      setFicheData(prev => ({
        ...prev,
        quantite_refusee: refusee
      }));
    }
  };

  const handleDocumentChange = (e) => {
    const docs = Array.from(e.target.selectedOptions).map(option => option.value);
    setFicheData(prev => ({
      ...prev,
      documents_accompagnement: docs
    }));
  };

  const handleSubmitFiche = async (e) => {
    e.preventDefault();
    try {
      setError('');
      
      // Validation
      if (!ficheData.quantite_livree) {
        setError('La quantité livrée est obligatoire');
        return;
      }

      if (!ficheData.signature_magasinier) {
        setError('La signature du magasinier est obligatoire');
        return;
      }

      const receptionData = {
        quantite_livree: parseFloat(ficheData.quantite_livree),
        quantite_refusee: parseFloat(ficheData.quantite_refusee),
        etat_marchandise: ficheData.etat_marchandise,
        temperature: ficheData.temperature,
        humidite: ficheData.humidite,
        observations: ficheData.observations,
        documents_accompagnement: ficheData.documents_accompagnement,
        signature_chauffeur: ficheData.signature_chauffeur,
        signature_magasinier: ficheData.signature_magasinier,
        date_reception: ficheData.date_reception,
        heure_reception: ficheData.heure_reception
      };

      const response = await rotationService.receiveRotation(selectedRotation.id, receptionData);
      
      setSuccess('Fiche de réception enregistrée avec succès');
      setShowFiche(false);
      setSelectedRotation(null);
      fetchRotationsEnAttente();
      
      // Masquer le message après 3 secondes
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Erreur lors de l\'enregistrement');
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
          <FileText className="w-6 h-6" />
          Réception des Rotations
          {user?.magasin && <span className="text-lg font-normal text-gray-600"> - {user.magasin.nom}</span>}
        </h2>
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

      {!showFiche ? (
        <div>
          <h3 className="text-lg font-semibold mb-4">Rotations en attente de réception</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rotationsEnAttente.map((rotation) => (
              <div key={rotation.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-semibold text-lg">{rotation.numero_rotation}</h4>
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                    En transit
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>{rotation.chauffeur?.nom}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="w-4 h-4 text-gray-500" />
                    <span>{rotation.chauffeur?.numero_camion}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-gray-500" />
                    <span>{rotation.dispatch?.produit?.nom} - {formatNumber(rotation.quantite_prevue)} t</span>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectRotation(rotation)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Remplir la fiche de réception
                </button>
              </div>
            ))}
          </div>

          {rotationsEnAttente.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune rotation en attente de réception</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Fiche de Réception - {ficheData.numero_rotation}
              </h3>
              <button
                onClick={() => setShowFiche(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmitFiche} className="p-6 space-y-6">
            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de réception
                </label>
                <input
                  type="date"
                  value={ficheData.date_reception}
                  onChange={(e) => handleInputChange('date_reception', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heure de réception
                </label>
                <input
                  type="time"
                  value={ficheData.heure_reception}
                  onChange={(e) => handleInputChange('heure_reception', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Informations transport */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-3">Informations Transport</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chauffeur
                  </label>
                  <input
                    type="text"
                    value={ficheData.chauffeur_nom}
                    onChange={(e) => handleInputChange('chauffeur_nom', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-gray-100"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro camion
                  </label>
                  <input
                    type="text"
                    value={ficheData.numero_camion}
                    onChange={(e) => handleInputChange('numero_camion', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-gray-100"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Informations marchandise */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-3">Informations Marchandise</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Produit
                  </label>
                  <input
                    type="text"
                    value={ficheData.produit_nom}
                    className="w-full px-3 py-2 border rounded-md bg-gray-100"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantité prévue (tonnes)
                  </label>
                  <input
                    type="number"
                    value={ficheData.quantite_prevue}
                    className="w-full px-3 py-2 border rounded-md bg-gray-100"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantité livrée (tonnes) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={ficheData.quantite_livree}
                    onChange={(e) => handleInputChange('quantite_livree', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {ficheData.quantite_refusee > 0 && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <span className="text-red-700 text-sm">
                    Quantité refusée: {formatNumber(ficheData.quantite_refusee)} tonnes
                  </span>
                </div>
              )}
            </div>

            {/* État et conditions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  État de la marchandise
                </label>
                <select
                  value={ficheData.etat_marchandise}
                  onChange={(e) => handleInputChange('etat_marchandise', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bon">Bon état</option>
                  <option value="altere">Légèrement altéré</option>
                  <option value="endommage">Endommagé</option>
                  <option value="refuse">Refusé</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Température (°C)
                </label>
                <input
                  type="number"
                  value={ficheData.temperature}
                  onChange={(e) => handleInputChange('temperature', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 25"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Humidité (%)
                </label>
                <input
                  type="number"
                  value={ficheData.humidite}
                  onChange={(e) => handleInputChange('humidite', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 60"
                />
              </div>
            </div>

            {/* Documents d'accompagnement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Documents d'accompagnement
              </label>
              <select
                multiple
                value={ficheData.documents_accompagnement}
                onChange={handleDocumentChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                size="4"
              >
                <option value="bon_livraison">Bon de livraison</option>
                <option value="facture">Facture</option>
                <option value="certificat_qualite">Certificat de qualité</option>
                <option value="certificat_origine">Certificat d'origine</option>
                <option value="assurance">Certificat d'assurance</option>
                <option value="douane">Documents douaniers</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Maintenez Ctrl pour sélectionner plusieurs documents</p>
            </div>

            {/* Observations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observations et remarques
              </label>
              <textarea
                value={ficheData.observations}
                onChange={(e) => handleInputChange('observations', e.target.value)}
                rows="4"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Remarques sur l'état de la marchandise, conditions de livraison, problèmes rencontrés..."
              />
            </div>

            {/* Signatures */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-3">Validation et Signatures</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={ficheData.signature_chauffeur}
                    onChange={(e) => handleInputChange('signature_chauffeur', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">Le chauffeur a signé et accepté les quantités</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={ficheData.signature_magasinier}
                    onChange={(e) => handleInputChange('signature_magasinier', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-red-600">Je certifie avoir vérifié la livraison (signature magasinier) *</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Boutons */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => setShowFiche(false)}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Valider la réception
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}