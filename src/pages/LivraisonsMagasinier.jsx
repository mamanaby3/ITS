import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { 
  Truck, Package, User, Calendar, AlertCircle, CheckCircle, 
  Plus, Loader, Phone, Hash, MapPin, FileText, Clock, Users
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import dispatchService from '../services/dispatch';
import chauffeurService from '../services/chauffeur';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const LivraisonsMagasinier = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [showLivraisonForm, setShowLivraisonForm] = useState(false);
  const [showRotationsModal, setShowRotationsModal] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [formData, setFormData] = useState({
    dispatch_id: '',
    type_livraison: 'client',
    quantite_livree: '',
    numero_camion: '',
    chauffeur_nom: '',
    chauffeur_telephone: '',
    transporteur: '',
    notes: ''
  });

  const [rotations, setRotations] = useState([]);

  // Charger les dispatches actifs
  const { data: dispatches = [], isLoading: loadingDispatches } = useQuery({
    queryKey: ['dispatches-actifs', user?.magasin_id],
    queryFn: () => dispatchService.getDispatchesActifs(user?.magasin_id),
    enabled: !!user?.magasin_id
  });

  // Charger les chauffeurs disponibles
  const { data: chauffeurs = [] } = useQuery({
    queryKey: ['chauffeurs-disponibles'],
    queryFn: () => chauffeurService.getChauffeursDisponibles(),
  });

  // Charger les livraisons du jour
  const { data: livraisonsJour = [] } = useQuery({
    queryKey: ['livraisons-jour', user?.magasin_id],
    queryFn: () => dispatchService.getLivraisonsJour(user?.magasin_id),
    enabled: !!user?.magasin_id
  });

  // Mutation pour créer une livraison
  const createLivraison = useMutation({
    mutationFn: (data) => dispatchService.createLivraison(data),
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Livraison enregistrée avec succès!' });
      setShowLivraisonForm(false);
      resetForm();
      queryClient.invalidateQueries(['dispatches-actifs']);
      queryClient.invalidateQueries(['livraisons-jour']);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message || 'Erreur lors de l\'enregistrement' });
    }
  });

  const resetForm = () => {
    setFormData({
      dispatch_id: '',
      type_livraison: 'client',
      quantite_livree: '',
      numero_camion: '',
      chauffeur_nom: '',
      chauffeur_telephone: '',
      transporteur: '',
      notes: ''
    });
    setRotations([]);
    setSelectedDispatch(null);
  };

  const handleStartLivraison = (dispatch) => {
    setSelectedDispatch(dispatch);
    setFormData({ ...formData, dispatch_id: dispatch.id });
    
    // Calculer le nombre de rotations nécessaires
    const quantiteRestante = dispatch.quantite_client - (dispatch.quantite_livree || 0);
    if (quantiteRestante > 100) { // Plus de 100 tonnes nécessitent des rotations
      setShowRotationsModal(true);
    } else {
      setShowLivraisonForm(true);
    }
  };

  const calculateRotations = () => {
    if (!selectedDispatch) return;
    
    const quantiteRestante = selectedDispatch.quantite_client - (selectedDispatch.quantite_livree || 0);
    const capaciteCamion = 30; // Capacité moyenne d'un camion en tonnes
    const nombreRotations = Math.ceil(quantiteRestante / capaciteCamion);
    
    const newRotations = [];
    let quantiteDistribuee = 0;
    
    for (let i = 0; i < nombreRotations; i++) {
      const quantiteRotation = Math.min(capaciteCamion, quantiteRestante - quantiteDistribuee);
      newRotations.push({
        numero: i + 1,
        quantite: quantiteRotation,
        chauffeur_id: '',
        chauffeur_nom: '',
        numero_camion: '',
        statut: 'planifie'
      });
      quantiteDistribuee += quantiteRotation;
    }
    
    setRotations(newRotations);
  };

  const handleSubmitLivraison = (e) => {
    e.preventDefault();
    
    if (rotations.length > 0) {
      // Soumettre avec rotations multiples
      createLivraison.mutate({
        ...formData,
        rotations: rotations,
        magasinier_id: user.id
      });
    } else {
      // Livraison simple
      createLivraison.mutate({
        ...formData,
        magasinier_id: user.id
      });
    }
  };

  const updateRotation = (index, field, value) => {
    const updatedRotations = [...rotations];
    updatedRotations[index] = { ...updatedRotations[index], [field]: value };
    
    // Si on sélectionne un chauffeur, mettre à jour automatiquement le nom et le camion
    if (field === 'chauffeur_id' && value) {
      const chauffeur = chauffeurs.find(c => c.id === parseInt(value));
      if (chauffeur) {
        updatedRotations[index].chauffeur_nom = chauffeur.nom;
        updatedRotations[index].numero_camion = chauffeur.numero_camion;
      }
    }
    
    setRotations(updatedRotations);
  };

  const getDispatchProgress = (dispatch) => {
    const progress = ((dispatch.quantite_livree || 0) / dispatch.quantite_client) * 100;
    return Math.round(progress);
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'planifie': return 'bg-gray-100 text-gray-800';
      case 'en_cours': return 'bg-blue-100 text-blue-800';
      case 'complete': return 'bg-green-100 text-green-800';
      case 'annule': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Truck size={28} />
          Gestion des Livraisons - {user?.magasin?.nom || 'Mon Magasin'}
        </h1>
        <p className="text-gray-600 mt-1">Gérez les livraisons suite aux dispatches du manager</p>
      </div>

      {/* Message de feedback */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      {/* Statistiques du jour */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Livraisons du jour</p>
              <p className="text-2xl font-bold">{livraisonsJour.length}</p>
            </div>
            <Truck className="text-blue-500" size={32} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tonnage livré</p>
              <p className="text-2xl font-bold">
                {livraisonsJour.reduce((sum, l) => sum + l.quantite_livree, 0).toFixed(1)} T
              </p>
            </div>
            <Package className="text-green-500" size={32} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Rotations</p>
              <p className="text-2xl font-bold">
                {livraisonsJour.reduce((sum, l) => sum + (l.rotations?.length || 1), 0)}
              </p>
            </div>
            <Clock className="text-orange-500" size={32} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Chauffeurs actifs</p>
              <p className="text-2xl font-bold">
                {new Set(livraisonsJour.map(l => l.chauffeur_nom)).size}
              </p>
            </div>
            <Users className="text-purple-500" size={32} />
          </div>
        </Card>
      </div>

      {/* Dispatches en attente */}
      <Card className="mb-6">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Dispatches à livrer</h2>
        </div>
        <div className="p-6">
          {loadingDispatches ? (
            <div className="flex justify-center p-8">
              <Loader className="animate-spin" size={32} />
            </div>
          ) : dispatches.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucun dispatch en attente de livraison</p>
          ) : (
            <div className="space-y-4">
              {dispatches.map(dispatch => (
                <div key={dispatch.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="font-medium">{dispatch.numero_dispatch}</span>
                        <Badge className={getStatusColor(dispatch.statut)}>
                          {dispatch.statut}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {format(new Date(dispatch.date_creation), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Client</p>
                          <p className="font-medium flex items-center gap-1">
                            <User size={16} />
                            {dispatch.client?.nom}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Produit</p>
                          <p className="font-medium flex items-center gap-1">
                            <Package size={16} />
                            {dispatch.produit?.nom}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Quantité à livrer</p>
                          <p className="font-medium">
                            {dispatch.quantite_client - (dispatch.quantite_livree || 0)} T
                            <span className="text-sm text-gray-500"> / {dispatch.quantite_client} T</span>
                          </p>
                        </div>
                      </div>

                      {/* Barre de progression */}
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progression</span>
                          <span>{getDispatchProgress(dispatch)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${getDispatchProgress(dispatch)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="ml-4">
                      <Button
                        onClick={() => handleStartLivraison(dispatch)}
                        disabled={dispatch.statut === 'complete'}
                      >
                        <Truck size={16} className="mr-2" />
                        Démarrer livraison
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Modal de formulaire de livraison simple */}
      {showLivraisonForm && selectedDispatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Enregistrer une livraison</h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Dispatch: {selectedDispatch.numero_dispatch}</p>
              <p className="text-sm text-gray-600">Client: {selectedDispatch.client?.nom}</p>
              <p className="text-sm text-gray-600">Produit: {selectedDispatch.produit?.nom}</p>
              <p className="text-sm font-medium">
                Quantité restante: {selectedDispatch.quantite_client - (selectedDispatch.quantite_livree || 0)} T
              </p>
            </div>

            <form onSubmit={handleSubmitLivraison} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-medium">Type de livraison</label>
                  <select
                    value={formData.type_livraison}
                    onChange={(e) => setFormData({...formData, type_livraison: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    required
                  >
                    <option value="client">Livraison client</option>
                    <option value="stock">Mise en stock</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-medium">Quantité livrée (T)</label>
                  <Input
                    type="number"
                    value={formData.quantite_livree}
                    onChange={(e) => setFormData({...formData, quantite_livree: e.target.value})}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    max={selectedDispatch.quantite_client - (selectedDispatch.quantite_livree || 0)}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium">Transporteur</label>
                  <Input
                    type="text"
                    value={formData.transporteur}
                    onChange={(e) => setFormData({...formData, transporteur: e.target.value})}
                    placeholder="Nom de la société de transport"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium">N° Camion</label>
                  <Input
                    type="text"
                    value={formData.numero_camion}
                    onChange={(e) => setFormData({...formData, numero_camion: e.target.value})}
                    placeholder="DK-1234-AA"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium">Nom du chauffeur</label>
                  <Input
                    type="text"
                    value={formData.chauffeur_nom}
                    onChange={(e) => setFormData({...formData, chauffeur_nom: e.target.value})}
                    placeholder="Nom complet"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium">Téléphone chauffeur</label>
                  <Input
                    type="tel"
                    value={formData.chauffeur_telephone}
                    onChange={(e) => setFormData({...formData, chauffeur_telephone: e.target.value})}
                    placeholder="+221 XX XXX XX XX"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-medium">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  rows="3"
                  placeholder="Observations sur la livraison..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowLivraisonForm(false);
                    resetForm();
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={createLivraison.isLoading}>
                  {createLivraison.isLoading ? 'Enregistrement...' : 'Enregistrer la livraison'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de gestion des rotations */}
      {showRotationsModal && selectedDispatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Planifier les rotations de livraison</h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Dispatch: {selectedDispatch.numero_dispatch}</p>
              <p className="text-sm text-gray-600">Client: {selectedDispatch.client?.nom}</p>
              <p className="text-sm font-medium">
                Quantité à livrer: {selectedDispatch.quantite_client - (selectedDispatch.quantite_livree || 0)} T
              </p>
            </div>

            <div className="mb-4">
              <Button onClick={calculateRotations} variant="outline">
                <Plus size={16} className="mr-2" />
                Calculer les rotations
              </Button>
            </div>

            {rotations.length > 0 && (
              <form onSubmit={handleSubmitLivraison}>
                <div className="space-y-4">
                  <h4 className="font-medium">Rotations planifiées</h4>
                  
                  {rotations.map((rotation, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium">Rotation #{rotation.numero}</h5>
                        <Badge>
                          {rotation.quantite} tonnes
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block mb-1 text-sm font-medium">Chauffeur</label>
                          <select
                            value={rotation.chauffeur_id}
                            onChange={(e) => updateRotation(index, 'chauffeur_id', e.target.value)}
                            className="w-full p-2 border rounded-lg text-sm"
                            required
                          >
                            <option value="">Sélectionner un chauffeur</option>
                            {chauffeurs.map(chauffeur => (
                              <option key={chauffeur.id} value={chauffeur.id}>
                                {chauffeur.nom} - {chauffeur.numero_camion}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block mb-1 text-sm font-medium">N° Camion</label>
                          <Input
                            type="text"
                            value={rotation.numero_camion}
                            readOnly
                            className="bg-gray-50"
                          />
                        </div>

                        <div>
                          <label className="block mb-1 text-sm font-medium">Nom du chauffeur</label>
                          <Input
                            type="text"
                            value={rotation.chauffeur_nom}
                            readOnly
                            className="bg-gray-50"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      Total: {rotations.reduce((sum, r) => sum + r.quantite, 0)} tonnes 
                      en {rotations.length} rotation(s)
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowRotationsModal(false);
                      resetForm();
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={createLivraison.isLoading}>
                    {createLivraison.isLoading ? 'Enregistrement...' : 'Démarrer les livraisons'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Livraisons récentes */}
      <Card>
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Livraisons récentes</h2>
        </div>
        <div className="p-6">
          {livraisonsJour.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucune livraison aujourd'hui</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">N° Bon</th>
                    <th className="text-left p-2">Client</th>
                    <th className="text-left p-2">Produit</th>
                    <th className="text-left p-2">Chauffeur</th>
                    <th className="text-left p-2">Camion</th>
                    <th className="text-right p-2">Quantité</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Heure</th>
                  </tr>
                </thead>
                <tbody>
                  {livraisonsJour.map((livraison) => (
                    <tr key={livraison.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{livraison.numero_bon}</td>
                      <td className="p-2">{livraison.dispatch?.client?.nom}</td>
                      <td className="p-2">{livraison.dispatch?.produit?.nom}</td>
                      <td className="p-2">{livraison.chauffeur_nom}</td>
                      <td className="p-2">{livraison.numero_camion}</td>
                      <td className="p-2 text-right font-medium">{livraison.quantite_livree} T</td>
                      <td className="p-2">
                        <Badge className={livraison.type_livraison === 'client' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                          {livraison.type_livraison === 'client' ? 'Client' : 'Stock'}
                        </Badge>
                      </td>
                      <td className="p-2">
                        {format(new Date(livraison.date_livraison), 'HH:mm', { locale: fr })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default LivraisonsMagasinier;