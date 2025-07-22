import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Truck, Package, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import axios from '../utils/axiosConfig';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../hooks/useAuth';

const ReceptionLivraison = () => {
  const { user } = useAuth();
  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLivraison, setSelectedLivraison] = useState(null);
  const [formData, setFormData] = useState({
    quantite_recue: '',
    motif_ecart: '',
    observations: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLivraisonsEnCours();
  }, []);

  const fetchLivraisonsEnCours = async () => {
    try {
      setLoading(true);
      console.log('User info:', user);
      console.log('User role:', user?.role);
      console.log('User magasin_id:', user?.magasin_id);
      
      const params = {
        statut: 'en_cours',
        per_page: 100
      };
      
      // Si l'utilisateur est un opérateur, filtrer par son magasin
      if (user?.role === 'operator' && user?.magasin_id) {
        // Mapper les IDs de magasin texte vers les IDs numériques
        const magasinMapping = {
          'plateforme-belair': 1, // Magasin Dakar Port
          'MAG-001': 1,
          'MAG-002': 2,
          'MAG-003': 3,
          'MAG-004': 4,
          'MAG-005': 5,
          'MAG-006': 6,
          'MAG-007': 7
        };
        
        const magasinId = magasinMapping[user.magasin_id] || user.magasin_id;
        params.magasin_id = magasinId;
        console.log('Mapped magasin_id:', user.magasin_id, '->', magasinId);
      }
      
      console.log('Request params:', params);
      
      const response = await axios.get('/livraisons', { params });
      console.log('Response:', response.data);
      setLivraisons(response.data.data || []);
    } catch (error) {
      console.error('Erreur chargement livraisons:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des livraisons' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLivraison = (livraison) => {
    setSelectedLivraison(livraison);
    setFormData({
      quantite_recue: livraison.quantite.toString(),
      motif_ecart: '',
      observations: ''
    });
  };

  const calculateEcart = () => {
    if (!selectedLivraison || !formData.quantite_recue) return 0;
    return parseFloat(formData.quantite_recue) - parseFloat(selectedLivraison.quantite);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedLivraison) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une livraison' });
      return;
    }

    try {
      setLoading(true);
      // Enregistrer la réception
      await axios.post(`/livraisons/${selectedLivraison.id}/reception`, {
        quantite_recue: parseFloat(formData.quantite_recue),
        motif_ecart: formData.motif_ecart || null
      });

      // Créer le mouvement d'entrée
      await axios.post('/mouvements', {
        type_mouvement: 'entree',
        produit_id: selectedLivraison.produit_id,
        magasin_destination_id: selectedLivraison.magasin_id,
        quantite: parseFloat(formData.quantite_recue),
        reference_document: selectedLivraison.numero_bon_livraison,
        description: `Réception livraison ${selectedLivraison.numero_bon_livraison} - ${selectedLivraison.transporteur}`
      });

      setMessage({ 
        type: 'success', 
        text: 'Réception enregistrée avec succès' 
      });
      
      // Réinitialiser le formulaire
      setSelectedLivraison(null);
      setFormData({ quantite_recue: '', motif_ecart: '', observations: '' });
      
      // Recharger les livraisons
      fetchLivraisonsEnCours();
      
    } catch (error) {
      console.error('Erreur enregistrement réception:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Erreur lors de l\'enregistrement' 
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLivraisons = livraisons.filter(livraison => 
    livraison.numero_bon_livraison?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    livraison.numero_camion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    livraison.transporteur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    livraison.nom_chauffeur?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ecart = calculateEcart();
  const hasEcart = Math.abs(ecart) > 0.01;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Réception des Livraisons</h1>
      
      {user && (
        <div className="mb-4 text-sm text-gray-600">
          Connecté en tant que: {user.nom} {user.prenom} 
          {user.magasin_id && ` - Magasin ID: ${user.magasin_id}`}
        </div>
      )}

      {message.text && (
        <Alert className={`mb-6 ${message.type === 'error' ? 'bg-red-50' : 'bg-green-50'}`}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liste des livraisons en cours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Livraisons en transit
            </CardTitle>
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher par N° bon, camion, transporteur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {loading && <p>Chargement...</p>}
              {!loading && filteredLivraisons.length === 0 && (
                <div className="text-gray-500 text-center py-4">
                  <p>Aucune livraison en cours</p>
                  {user?.role === 'operator' && user?.magasin_id && (
                    <p className="text-xs mt-2">
                      Filtrage actif pour le magasin ID: {user.magasin_id}
                    </p>
                  )}
                </div>
              )}
              {filteredLivraisons.map((livraison) => (
                <div
                  key={livraison.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedLivraison?.id === livraison.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelectLivraison(livraison)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">
                        {livraison.numero_bon_livraison || `LIV-${livraison.id}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {livraison.produit?.nom} - {livraison.quantite} T
                      </p>
                      <p className="text-sm text-gray-600">
                        {livraison.transporteur} - {livraison.numero_camion}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Départ: {format(new Date(livraison.date_livraison), 'dd MMM yyyy', { locale: fr })}
                        {livraison.heure_depart && ` à ${livraison.heure_depart}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-600">
                        {livraison.destination_nom}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Formulaire de réception */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Enregistrer la réception
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedLivraison ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <h3 className="font-semibold">Détails de la livraison</h3>
                  <p className="text-sm">
                    <span className="font-medium">N° Bon:</span> {selectedLivraison.numero_bon_livraison}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Produit:</span> {selectedLivraison.produit?.nom}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Quantité prévue:</span> {selectedLivraison.quantite} T
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Transporteur:</span> {selectedLivraison.transporteur}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Camion:</span> {selectedLivraison.numero_camion}
                  </p>
                </div>

                <div>
                  <Label htmlFor="quantite_recue">Quantité reçue (Tonnes)</Label>
                  <Input
                    id="quantite_recue"
                    type="number"
                    step="0.001"
                    value={formData.quantite_recue}
                    onChange={(e) => setFormData({ ...formData, quantite_recue: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>

                {hasEcart && (
                  <Alert className={ecart > 0 ? 'bg-green-50' : 'bg-yellow-50'}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Écart détecté: {ecart > 0 ? '+' : ''}{ecart.toFixed(3)} T
                      {ecart > 0 ? ' (Excédent)' : ' (Manquant)'}
                    </AlertDescription>
                  </Alert>
                )}

                {hasEcart && (
                  <div>
                    <Label htmlFor="motif_ecart">Motif de l'écart *</Label>
                    <Textarea
                      id="motif_ecart"
                      value={formData.motif_ecart}
                      onChange={(e) => setFormData({ ...formData, motif_ecart: e.target.value })}
                      required={hasEcart}
                      placeholder="Expliquez la raison de l'écart..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="observations">Observations (optionnel)</Label>
                  <Textarea
                    id="observations"
                    value={formData.observations}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    placeholder="Remarques additionnelles..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirmer la réception
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedLivraison(null);
                      setFormData({ quantite_recue: '', motif_ecart: '', observations: '' });
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Sélectionnez une livraison pour enregistrer sa réception</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReceptionLivraison;