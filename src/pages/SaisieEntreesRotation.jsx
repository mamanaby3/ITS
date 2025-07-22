import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Truck, Package, User, Calendar, CheckCircle, AlertCircle, Minus, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const SaisieEntreesRotation = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    produit_id: '',
    numero_bl: '',
    client_nom: '',
    client_id: '',
    chauffeur_id: '',
    chauffeur_nom: '',
    chauffeur_telephone: '',
    numero_camion: '',
    quantite_livree: '',
    date_livraison: new Date().toISOString().split('T')[0],
    heure_livraison: new Date().toTimeString().slice(0, 5),
    observations: '',
    est_chauffeur_externe: false,
    magasin_id: user?.magasin_id || ''
  });

  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [produits, setProduits] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [clients, setClients] = useState([]);
  const [clientSuggestions, setClientSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [stockDisponible, setStockDisponible] = useState({});
  const [sortiesJour, setSortiesJour] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.produit_id && formData.magasin_id) {
      checkStockDisponible();
    }
  }, [formData.produit_id, formData.magasin_id]);

  const loadData = async () => {
    try {
      // Charger les produits
      const produitsRes = await api.get('/produits');
      console.log('Produits reçus:', produitsRes.data);
      setProduits(Array.isArray(produitsRes.data) ? produitsRes.data : produitsRes.data?.data || []);

      // Charger les chauffeurs
      const chauffeursRes = await api.get('/chauffeurs');
      console.log('Chauffeurs reçus:', chauffeursRes.data);
      setChauffeurs(chauffeursRes.data?.data || chauffeursRes.data || []);

      // Charger les clients
      const clientsRes = await api.get('/clients');
      setClients(Array.isArray(clientsRes.data) ? clientsRes.data : clientsRes.data?.data || []);

      // Charger les sorties du jour
      loadSortiesJour();
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setMessage({
        type: 'error',
        text: 'Erreur lors du chargement des données'
      });
    }
  };

  const checkStockDisponible = async () => {
    try {
      const response = await api.get(`/stocks/disponible?produit_id=${formData.produit_id}&magasin_id=${formData.magasin_id}`);
      const stock = response.data?.quantite || 0;
      setStockDisponible({
        [`${formData.produit_id}_${formData.magasin_id}`]: stock
      });
    } catch (error) {
      console.error('Erreur vérification stock:', error);
    }
  };

  const loadSortiesJour = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/livraisons?date_livraison=${today}&magasin_id=${user.magasin_id}`);
      setSortiesJour(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Erreur chargement sorties:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Si on tape dans le champ client, chercher les suggestions
    if (name === 'client_nom' && value.length > 0) {
      const suggestions = clients.filter(client => 
        client.nom.toLowerCase().includes(value.toLowerCase())
      );
      setClientSuggestions(suggestions);
      setShowSuggestions(true);
      
      // Si un client correspond exactement, le sélectionner
      const exactMatch = clients.find(client => 
        client.nom.toLowerCase() === value.toLowerCase()
      );
      if (exactMatch) {
        setFormData(prev => ({
          ...prev,
          client_id: exactMatch.id
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          client_id: ''
        }));
      }
    } else if (name === 'client_nom' && value === '') {
      setShowSuggestions(false);
      setFormData(prev => ({
        ...prev,
        client_id: ''
      }));
    }
  };

  const handleChauffeurChange = (e) => {
    const chauffeurId = e.target.value;
    const chauffeur = chauffeurs.find(c => c.id.toString() === chauffeurId);
    
    setFormData(prev => ({
      ...prev,
      chauffeur_id: chauffeurId,
      numero_camion: chauffeur ? chauffeur.numero_camion : ''
    }));
  };

  const selectClient = (client) => {
    setFormData(prev => ({
      ...prev,
      client_nom: client.nom,
      client_id: client.id
    }));
    setShowSuggestions(false);
  };

  const resetForm = () => {
    setFormData({
      produit_id: '',
      numero_bl: '',
      client_nom: '',
      client_id: '',
      chauffeur_id: '',
      chauffeur_nom: '',
      chauffeur_telephone: '',
      numero_camion: '',
      quantite_livree: '',
      date_livraison: new Date().toISOString().split('T')[0],
      heure_livraison: new Date().toTimeString().slice(0, 5),
      observations: '',
      est_chauffeur_externe: false,
      magasin_id: user?.magasin_id || ''
    });
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.produit_id || !formData.client_nom || !formData.quantite_livree || !formData.numero_bl) {
      setMessage({
        type: 'error',
        text: 'Veuillez remplir tous les champs obligatoires'
      });
      return;
    }

    // Vérifier le stock disponible
    const stockKey = `${formData.produit_id}_${formData.magasin_id}`;
    const stock = stockDisponible[stockKey] || 0;
    
    if (parseFloat(formData.quantite_livree) > stock) {
      setMessage({
        type: 'error',
        text: `Stock insuffisant. Disponible: ${stock.toFixed(2)} tonnes`
      });
      return;
    }

    if (formData.est_chauffeur_externe) {
      if (!formData.chauffeur_nom || !formData.chauffeur_telephone || !formData.numero_camion) {
        setMessage({
          type: 'error',
          text: 'Veuillez remplir tous les champs du chauffeur externe'
        });
        return;
      }
    } else if (!formData.chauffeur_id) {
      setMessage({
        type: 'error',
        text: 'Veuillez sélectionner un chauffeur'
      });
      return;
    }

    setLoading(true);
    try {
      let clientId = formData.client_id;
      let chauffeurId = formData.chauffeur_id;
      
      // Si pas de client_id, créer un nouveau client
      if (!clientId) {
        try {
          const nouveauClient = {
            nom: formData.client_nom,
            type: 'particulier',
            telephone: '',
            email: '',
            adresse: ''
          };
          
          const clientResponse = await api.post('/clients', nouveauClient);
          clientId = clientResponse.data?.data?.id || clientResponse.data?.id;
          
          // Recharger la liste des clients
          const clientsRes = await api.get('/clients');
          setClients(Array.isArray(clientsRes.data) ? clientsRes.data : clientsRes.data?.data || []);
        } catch (error) {
          console.error('Erreur création client:', error);
          setMessage({
            type: 'error',
            text: 'Erreur lors de la création du client'
          });
          setLoading(false);
          return;
        }
      }

      // Si c'est un chauffeur externe, le créer d'abord
      if (formData.est_chauffeur_externe) {
        const nouveauChauffeur = {
          nom: formData.chauffeur_nom,
          telephone: formData.chauffeur_telephone,
          numero_camion: formData.numero_camion,
          numero_permis: `EXT-${Date.now()}`
        };

        const chauffeurResponse = await api.post('/chauffeurs', nouveauChauffeur);
        chauffeurId = chauffeurResponse.data?.data?.id || chauffeurResponse.data?.insertId;
      }

      // Créer la livraison (sortie)
      const livraisonData = {
        produit_id: parseInt(formData.produit_id),
        client_id: parseInt(clientId),
        magasin_id: formData.magasin_id,
        quantite: parseFloat(formData.quantite_livree),
        date_livraison: formData.date_livraison,
        heure_livraison: formData.heure_livraison,
        transporteur: formData.est_chauffeur_externe ? formData.chauffeur_nom : chauffeurs.find(c => c.id == chauffeurId)?.nom || '',
        numero_camion: formData.numero_camion,
        reference_bon: formData.numero_bl,
        observations: formData.observations,
        statut: 'confirmee', // Confirmer directement pour que le stock diminue
        created_by: user.id
      };

      await api.post('/livraisons', livraisonData);

      setMessage({
        type: 'success',
        text: `Sortie enregistrée avec succès. Le stock a été mis à jour.`
      });

      resetForm();
      loadSortiesJour();
      checkStockDisponible(); // Recharger le stock disponible

      // Masquer le message après 3 secondes
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Erreur lors de l\'enregistrement'
      });
    } finally {
      setLoading(false);
    }
  };

  const produitSelectionne = produits.find(p => p.id.toString() === formData.produit_id);
  const chauffeurSelectionne = chauffeurs.find(c => c.id.toString() === formData.chauffeur_id);
  const getStockDisponible = () => {
    if (!formData.produit_id || !formData.magasin_id) return null;
    const key = `${formData.produit_id}_${formData.magasin_id}`;
    return stockDisponible[key] || 0;
  };
  const stockActuel = getStockDisponible();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Minus className="w-6 h-6 text-red-600" />
          Saisie des Sorties
        </h1>
        <div className="text-sm text-gray-600">
          Magasin: {user?.magasin?.nom || user?.magasin_id}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-md flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? 
            <CheckCircle className="w-5 h-5" /> : 
            <AlertCircle className="w-5 h-5" />
          }
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire de saisie */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Nouvelle Sortie
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Section Informations de livraison */}
              <div className="border-b pb-4">
                <h3 className="font-medium mb-3 text-gray-800">Informations de sortie</h3>
                
                {/* BL et Type de livraison */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      N° Bon de Livraison (BL) *
                    </label>
                    <Input
                      type="text"
                      name="numero_bl"
                      value={formData.numero_bl}
                      onChange={handleInputChange}
                      placeholder="BL-2024-001"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de sortie *
                    </label>
                    <Input
                      type="date"
                      name="date_livraison"
                      value={formData.date_livraison}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Heure de sortie *
                    </label>
                    <Input
                      type="time"
                      name="heure_livraison"
                      value={formData.heure_livraison}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>


              </div>

              {/* Produit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produit *
                </label>
                <select
                  name="produit_id"
                  value={formData.produit_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionner un produit</option>
                  {produits.map(produit => (
                    <option key={produit.id} value={produit.id}>
                      {produit.nom} ({produit.reference})
                    </option>
                  ))}
                </select>
                {produitSelectionne && (
                  <p className="text-xs text-gray-500 mt-1">
                    Catégorie: {produitSelectionne.categorie} | Unité: {produitSelectionne.unite}
                  </p>
                )}
              </div>

              {/* Stock disponible */}
              {stockActuel !== null && formData.produit_id && (
                <div className={`p-3 rounded-md ${
                  stockActuel > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm font-medium ${
                    stockActuel > 0 ? 'text-green-800' : 'text-red-800'
                  }`}>
                    Stock disponible: {stockActuel.toFixed(2)} tonnes
                  </p>
                  {stockActuel === 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      Aucun stock disponible pour ce produit
                    </p>
                  )}
                </div>
              )}

              {/* Client avec autocomplétion */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client destinataire *
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    name="client_nom"
                    value={formData.client_nom}
                    onChange={handleInputChange}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Tapez le nom du client"
                    className="pr-10"
                    required
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                
                {/* Suggestions de clients */}
                {showSuggestions && clientSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {clientSuggestions.map(client => (
                      <div
                        key={client.id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => selectClient(client)}
                      >
                        {client.nom}
                        {client.telephone && <span className="text-gray-500 ml-2">({client.telephone})</span>}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Indicateur si nouveau client */}
                {formData.client_nom && !formData.client_id && (
                  <p className="text-xs text-blue-600 mt-1">
                    <span className="font-medium">Nouveau client</span> - sera créé automatiquement
                  </p>
                )}
                {formData.client_nom && formData.client_id && (
                  <p className="text-xs text-green-600 mt-1">
                    Client existant sélectionné
                  </p>
                )}
              </div>

              {/* Type de chauffeur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de chauffeur
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="est_chauffeur_externe"
                      checked={!formData.est_chauffeur_externe}
                      onChange={() => setFormData(prev => ({ ...prev, est_chauffeur_externe: false }))}
                      className="mr-2"
                    />
                    Chauffeur de la société
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="est_chauffeur_externe"
                      checked={formData.est_chauffeur_externe}
                      onChange={() => setFormData(prev => ({ ...prev, est_chauffeur_externe: true, chauffeur_id: '' }))}
                      className="mr-2"
                    />
                    Chauffeur externe
                  </label>
                </div>
              </div>

              {/* Chauffeur - selon le type */}
              {!formData.est_chauffeur_externe ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chauffeur *
                  </label>
                  <select
                    name="chauffeur_id"
                    value={formData.chauffeur_id}
                    onChange={handleChauffeurChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner un chauffeur</option>
                    {chauffeurs.map(chauffeur => (
                      <option key={chauffeur.id} value={chauffeur.id}>
                        {chauffeur.nom} - {chauffeur.numero_camion}
                      </option>
                    ))}
                  </select>
                  {chauffeurSelectionne && (
                    <p className="text-xs text-gray-500 mt-1">
                      Téléphone: {chauffeurSelectionne.telephone}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {/* Nom du chauffeur externe */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du chauffeur *
                    </label>
                    <Input
                      type="text"
                      name="chauffeur_nom"
                      value={formData.chauffeur_nom}
                      onChange={handleInputChange}
                      placeholder="Nom complet du chauffeur"
                      required={formData.est_chauffeur_externe}
                    />
                  </div>

                  {/* Téléphone du chauffeur externe */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone du chauffeur *
                    </label>
                    <Input
                      type="tel"
                      name="chauffeur_telephone"
                      value={formData.chauffeur_telephone}
                      onChange={handleInputChange}
                      placeholder="Ex: 77 123 45 67"
                      required={formData.est_chauffeur_externe}
                    />
                  </div>
                </>
              )}

              {/* Numéro camion */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro du camion {formData.est_chauffeur_externe && '*'}
                </label>
                <Input
                  type="text"
                  name="numero_camion"
                  value={formData.numero_camion}
                  onChange={handleInputChange}
                  placeholder={formData.est_chauffeur_externe ? "Ex: DK 1234 A" : "Sera rempli automatiquement"}
                  className={!formData.est_chauffeur_externe ? "bg-gray-50" : ""}
                  readOnly={!formData.est_chauffeur_externe}
                  required={formData.est_chauffeur_externe}
                />
              </div>

              {/* Quantité */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantité (tonnes) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  name="quantite_livree"
                  value={formData.quantite_livree}
                  onChange={handleInputChange}
                  max={stockActuel || undefined}
                  placeholder={stockActuel ? `Max: ${stockActuel.toFixed(2)}` : "Ex: 15.5"}
                  required
                  disabled={!stockActuel || stockActuel === 0}
                />
              </div>


              {/* Observations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observations
                </label>
                <textarea
                  name="observations"
                  value={formData.observations}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Remarques sur la livraison, conditions particulières..."
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !stockActuel || stockActuel === 0}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Minus className="w-4 h-4" />
                    Enregistrer la sortie
                  </>
                )}
              </Button>
            </form>
          </Card>
        </div>

        {/* Sorties du jour */}
        <div className="space-y-4">

          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Sorties du jour
            </h3>
            <div className="space-y-2">
              {sortiesJour.length > 0 ? (
                sortiesJour.map((sortie, index) => (
                  <div key={sortie.id || index} className="p-3 bg-gray-50 rounded-lg text-sm">
                    <div className="font-medium">{sortie.produit_nom}</div>
                    <div className="text-gray-600">
                      {sortie.client_nom} - {sortie.quantite}t
                    </div>
                    <div className="text-gray-500 text-xs">
                      {sortie.reference_bon} | {sortie.heure_livraison || 'N/A'}
                    </div>
                    <div className={`text-xs mt-1 ${
                      sortie.statut === 'confirmee' ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {sortie.statut === 'confirmee' ? 'Confirmée' : 'En attente'}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">Aucune sortie aujourd'hui</p>
              )}
            </div>
          </Card>

          {/* Statistiques rapides */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3">Statistiques du jour</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Nombre de sorties:</span>
                <span className="font-medium">{sortiesJour.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Tonnage total sorti:</span>
                <span className="font-medium">
                  {sortiesJour.reduce((sum, s) => sum + (parseFloat(s.quantite) || 0), 0).toFixed(1)}t
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sorties confirmées:</span>
                <span className="font-medium text-green-600">
                  {sortiesJour.filter(s => s.statut === 'confirmee').length}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SaisieEntreesRotation;