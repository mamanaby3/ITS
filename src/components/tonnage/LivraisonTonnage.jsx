import React, { useState, useEffect } from 'react';
import { 
  Truck, Package, User, Calendar, MapPin, 
  AlertCircle, CheckCircle, Building, Hash,
  Phone, CreditCard, Plus
} from 'lucide-react';
import { formatDate, formatNumber } from '../../utils/format';
import api from '../../services/api';
import toast from 'react-hot-toast';

const LivraisonTonnage = ({ 
  onSubmit, 
  produits = [], 
  clients = [], 
  magasins = [], 
  stockDisponible = {},
  filters = {}
}) => {
  const [formData, setFormData] = useState({
    type: 'sortie',
    produit_id: filters.produit_id || '',
    tonnage_livre: '',
    date_sortie: new Date().toISOString().split('T')[0],
    heure_sortie: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    type_livraison: filters.client_id ? 'client' : (filters.magasin_id ? 'magasin' : 'magasin'),
    magasin_id: filters.magasin_id || '',
    client_id: filters.client_id || '',
    particulier_nom: '',
    particulier_telephone: '',
    particulier_adresse: '',
    reference_bon: '',
    transporteur: '',
    numero_camion: '',
    nom_chauffeur: '',
    permis_chauffeur: '',
    telephone_chauffeur: '',
    destination_finale: '',
    observations: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showStockAlert, setShowStockAlert] = useState(false);
  const [livraisons, setLivraisons] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [showAddChauffeur, setShowAddChauffeur] = useState(false);
  const [newChauffeur, setNewChauffeur] = useState({
    nom: '',
    telephone: '',
    numero_camion: '',
    permis: ''
  });

  // Charger les livraisons existantes et les chauffeurs
  useEffect(() => {
    loadLivraisons();
    loadChauffeurs();
  }, []);

  // Mettre à jour le formulaire quand les filtres changent
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      produit_id: filters.produit_id || prev.produit_id,
      magasin_id: filters.magasin_id || prev.magasin_id,
      client_id: filters.client_id || prev.client_id,
      type_livraison: filters.client_id ? 'client' : (filters.magasin_id ? 'magasin' : prev.type_livraison)
    }));
  }, [filters]);

  const loadLivraisons = async () => {
    try {
      const response = await api.get('/livraisons');
      setLivraisons(response.data || []);
    } catch (error) {
      console.error('Erreur chargement livraisons:', error);
    }
  };

  const loadChauffeurs = async () => {
    try {
      const response = await api.get('/chauffeurs');
      console.log('Chauffeurs chargés:', response);
      setChauffeurs(response.data || response || []);
    } catch (error) {
      console.error('Erreur chargement chauffeurs:', error);
      // Essayer de charger depuis un autre endpoint si nécessaire
      try {
        const altResponse = await api.get('/api/chauffeurs');
        setChauffeurs(altResponse.data || altResponse || []);
      } catch (altError) {
        console.error('Erreur alternative chauffeurs:', altError);
      }
    }
  };

  const handleAddChauffeur = async () => {
    try {
      // Validation
      if (!newChauffeur.nom || !newChauffeur.telephone || !newChauffeur.numero_camion || !newChauffeur.permis) {
        toast.error('Veuillez remplir tous les champs du chauffeur');
        return;
      }

      // Créer le chauffeur
      const response = await api.post('/chauffeurs', {
        ...newChauffeur,
        statut: 'actif'
      });

      // Ajouter à la liste et sélectionner
      setChauffeurs([...chauffeurs, response.data]);
      setFormData({
        ...formData,
        transporteur: response.data.nom,
        nom_chauffeur: response.data.nom,
        permis_chauffeur: response.data.permis,
        telephone_chauffeur: response.data.telephone,
        numero_camion: response.data.numero_camion
      });

      // Réinitialiser et fermer
      setNewChauffeur({ nom: '', telephone: '', numero_camion: '', permis: '' });
      setShowAddChauffeur(false);
      toast.success('Chauffeur ajouté avec succès');
    } catch (error) {
      console.error('Erreur création chauffeur:', error);
      toast.error('Erreur lors de l\'ajout du chauffeur');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Réinitialiser certains champs selon le type de livraison
    if (name === 'type_livraison') {
      setFormData(prev => ({
        ...prev,
        magasin_id: '',
        client_id: '',
        particulier_nom: '',
        particulier_telephone: '',
        particulier_adresse: ''
      }));
    }
  };

  const getStockForProduct = () => {
    if (!formData.produit_id) return 0;
    
    // Le stock est maintenant centralisé au niveau manager (depuis navire_cargaison)
    const key = `${formData.produit_id}_manager`;
    return stockDisponible[key] || 0;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.produit_id) newErrors.produit_id = 'Le produit est requis';
    if (!formData.tonnage_livre || parseFloat(formData.tonnage_livre) <= 0) {
      newErrors.tonnage_livre = 'Le tonnage doit être supérieur à 0';
    }
    if (!formData.date_sortie) newErrors.date_sortie = 'La date est requise';
    if (!formData.reference_bon) newErrors.reference_bon = 'La référence du bon est requise';
    
    // Validation selon le type de livraison
    if (formData.type_livraison === 'magasin' && !formData.magasin_id) {
      newErrors.magasin_id = 'Le magasin est requis';
    }
    if (formData.type_livraison === 'client' && !formData.client_id) {
      newErrors.client_id = 'Le client est requis';
    }
    if (formData.type_livraison === 'particulier') {
      if (!formData.particulier_nom) newErrors.particulier_nom = 'Le nom est requis';
      if (!formData.particulier_telephone) newErrors.particulier_telephone = 'Le téléphone est requis';
      if (!formData.particulier_adresse) newErrors.particulier_adresse = 'L\'adresse est requise';
    }

    // Validation transport
    if (!formData.transporteur) newErrors.transporteur = 'Le transporteur est requis';
    if (!formData.numero_camion) newErrors.numero_camion = 'Le numéro du camion est requis';
    if (!formData.nom_chauffeur) newErrors.nom_chauffeur = 'Le nom du chauffeur est requis';
    if (!formData.permis_chauffeur) newErrors.permis_chauffeur = 'Le permis du chauffeur est requis';

    // Vérifier le stock disponible
    const stock = getStockForProduct();
    const tonnageLivre = parseFloat(formData.tonnage_livre);
    if (tonnageLivre > stock) {
      newErrors.tonnage_livre = `Stock insuffisant dans navire_cargaison. Disponible: ${formatNumber(stock)} T`;
      setShowStockAlert(true);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }

    setLoading(true);
    try {
      const stockAvant = getStockForProduct();
      const tonnageLivre = parseFloat(formData.tonnage_livre);
      
      const dataToSend = {
        ...formData,
        tonnage_livre: tonnageLivre,
        stock_avant: stockAvant,
        stock_apres: stockAvant - tonnageLivre
      };

      await onSubmit(dataToSend);
      
      // Réinitialiser le formulaire
      setFormData({
        type: 'sortie',
        produit_id: '',
        tonnage_livre: '',
        date_sortie: new Date().toISOString().split('T')[0],
        heure_sortie: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        type_livraison: 'magasin',
        magasin_id: '',
        client_id: '',
        particulier_nom: '',
        particulier_telephone: '',
        particulier_adresse: '',
        reference_bon: '',
        transporteur: '',
        numero_camion: '',
        nom_chauffeur: '',
        permis_chauffeur: '',
        telephone_chauffeur: '',
        destination_finale: '',
        observations: ''
      });
      
      setShowStockAlert(false);
      toast.success('Livraison enregistrée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      toast.error('Erreur lors de l\'enregistrement de la livraison');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Truck className="w-5 h-5 text-red-600" />
          Nouvelle Livraison
        </h2>
        {formData.produit_id && (
          <div className="text-sm">
            Stock central disponible: 
            <span className={`ml-2 font-bold ${getStockForProduct() > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatNumber(getStockForProduct())} T
            </span>
            <span className="text-xs text-gray-500 ml-2">(navire_cargaison)</span>
          </div>
        )}
      </div>

      {showStockAlert && (
        <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-md flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Stock insuffisant dans navire_cargaison</p>
            <p className="text-sm text-red-600">
              Le tonnage demandé dépasse le stock disponible du manager. Veuillez ajuster la quantité ou vérifier les réceptions de navires.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type de livraison */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de livraison *
          </label>
          <div className="grid grid-cols-3 gap-4">
            <label className="relative flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="type_livraison"
                value="magasin"
                checked={formData.type_livraison === 'magasin'}
                onChange={handleChange}
                className="mr-2"
              />
              <Building className="w-4 h-4 mr-2 text-gray-600" />
              <span className="text-sm font-medium">Magasin</span>
            </label>
            <label className="relative flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="type_livraison"
                value="client"
                checked={formData.type_livraison === 'client'}
                onChange={handleChange}
                className="mr-2"
              />
              <User className="w-4 h-4 mr-2 text-gray-600" />
              <span className="text-sm font-medium">Client</span>
            </label>
            <label className="relative flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="type_livraison"
                value="particulier"
                checked={formData.type_livraison === 'particulier'}
                onChange={handleChange}
                className="mr-2"
              />
              <User className="w-4 h-4 mr-2 text-gray-600" />
              <span className="text-sm font-medium">Particulier</span>
            </label>
          </div>
        </div>

        {/* Informations produit et quantité */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Produit *
            </label>
            <select
              name="produit_id"
              value={formData.produit_id}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                errors.produit_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Sélectionner un produit</option>
              {produits.map(produit => (
                <option key={produit.id} value={produit.id}>
                  {produit.nom} - {produit.reference}
                </option>
              ))}
            </select>
            {errors.produit_id && (
              <p className="mt-1 text-sm text-red-600">{errors.produit_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tonnage à livrer (T) *
            </label>
            <input
              type="number"
              name="tonnage_livre"
              value={formData.tonnage_livre}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                errors.tonnage_livre ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.tonnage_livre && (
              <p className="mt-1 text-sm text-red-600">{errors.tonnage_livre}</p>
            )}
          </div>
        </div>

        {/* Destination selon le type */}
        {formData.type_livraison === 'magasin' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Magasin de destination *
            </label>
            <select
              name="magasin_id"
              value={formData.magasin_id}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                errors.magasin_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Sélectionner un magasin</option>
              {magasins.map(magasin => (
                <option key={magasin.id} value={magasin.id}>
                  {magasin.nom} - {magasin.ville}
                </option>
              ))}
            </select>
            {errors.magasin_id && (
              <p className="mt-1 text-sm text-red-600">{errors.magasin_id}</p>
            )}
          </div>
        )}

        {formData.type_livraison === 'client' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client *
            </label>
            <select
              name="client_id"
              value={formData.client_id}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                errors.client_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Sélectionner un client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.nom}
                </option>
              ))}
            </select>
            {errors.client_id && (
              <p className="mt-1 text-sm text-red-600">{errors.client_id}</p>
            )}
          </div>
        )}

        {formData.type_livraison === 'particulier' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du particulier *
                </label>
                <input
                  type="text"
                  name="particulier_nom"
                  value={formData.particulier_nom}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.particulier_nom ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nom complet"
                />
                {errors.particulier_nom && (
                  <p className="mt-1 text-sm text-red-600">{errors.particulier_nom}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  name="particulier_telephone"
                  value={formData.particulier_telephone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.particulier_telephone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+221 77 123 45 67"
                />
                {errors.particulier_telephone && (
                  <p className="mt-1 text-sm text-red-600">{errors.particulier_telephone}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse de livraison *
              </label>
              <textarea
                name="particulier_adresse"
                value={formData.particulier_adresse}
                onChange={handleChange}
                rows={2}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.particulier_adresse ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Adresse complète"
              />
              {errors.particulier_adresse && (
                <p className="mt-1 text-sm text-red-600">{errors.particulier_adresse}</p>
              )}
            </div>
          </div>
        )}

        {/* Informations de transport */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-gray-600" />
            Informations de transport
          </h3>

          {/* Sélection du transporteur */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transporteur * {chauffeurs.length > 0 && <span className="text-xs text-gray-500">({chauffeurs.length} disponibles)</span>}
            </label>
            <div className="flex gap-2">
              <select
                name="transporteur"
                value={formData.transporteur}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'nouveau') {
                    setShowAddChauffeur(true);
                  } else if (value !== '') {
                    // Si c'est un chauffeur existant
                    const chauffeur = chauffeurs.find(c => c.nom === value);
                    if (chauffeur) {
                      setFormData({
                        ...formData,
                        transporteur: chauffeur.nom,
                        nom_chauffeur: chauffeur.nom,
                        numero_camion: chauffeur.numero_camion || chauffeur.vehicule || '',
                        permis_chauffeur: chauffeur.permis || chauffeur.numero_permis || '',
                        telephone_chauffeur: chauffeur.telephone || ''
                      });
                    }
                  } else {
                    handleChange(e);
                  }
                }}
                className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.transporteur ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Sélectionner un transporteur</option>
                <optgroup label="Chauffeurs de la société">
                  {chauffeurs.length > 0 ? (
                    chauffeurs.filter(c => !c.statut || c.statut === 'actif').map(chauffeur => (
                      <option key={chauffeur.id} value={chauffeur.nom}>
                        {chauffeur.nom} - {chauffeur.numero_camion || chauffeur.vehicule || 'N/A'}
                      </option>
                    ))
                  ) : (
                    <option disabled>Aucun chauffeur disponible</option>
                  )}
                </optgroup>
                <option value="nouveau">➕ Nouveau transporteur externe</option>
              </select>
            </div>
            {errors.transporteur && (
              <p className="mt-1 text-sm text-red-600">{errors.transporteur}</p>
            )}
          </div>

          {/* Modal pour ajouter un nouveau chauffeur */}
          {showAddChauffeur && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Ajouter un nouveau transporteur</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du chauffeur *
                    </label>
                    <input
                      type="text"
                      value={newChauffeur.nom}
                      onChange={(e) => setNewChauffeur({ ...newChauffeur, nom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nom complet"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      value={newChauffeur.telephone}
                      onChange={(e) => setNewChauffeur({ ...newChauffeur, telephone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+221 77 123 45 67"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numéro du camion *
                    </label>
                    <input
                      type="text"
                      value={newChauffeur.numero_camion}
                      onChange={(e) => setNewChauffeur({ ...newChauffeur, numero_camion: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="DK-1234-AB"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numéro de permis *
                    </label>
                    <input
                      type="text"
                      value={newChauffeur.permis}
                      onChange={(e) => setNewChauffeur({ ...newChauffeur, permis: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Numéro de permis"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddChauffeur(false);
                      setNewChauffeur({ nom: '', telephone: '', numero_camion: '', permis: '' });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleAddChauffeur}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Afficher les détails du transporteur sélectionné */}
          {formData.transporteur && !showAddChauffeur && (
            <div className="bg-gray-50 p-4 rounded-md mt-4">
              <h4 className="font-medium text-gray-700 mb-2">Détails du transport</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Chauffeur:</span>
                  <span className="ml-2 font-medium">{formData.nom_chauffeur}</span>
                </div>
                <div>
                  <span className="text-gray-600">Camion:</span>
                  <span className="ml-2 font-medium">{formData.numero_camion}</span>
                </div>
                <div>
                  <span className="text-gray-600">Permis:</span>
                  <span className="ml-2 font-medium">{formData.permis_chauffeur}</span>
                </div>
                <div>
                  <span className="text-gray-600">Téléphone:</span>
                  <span className="ml-2 font-medium">{formData.telephone_chauffeur}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Autres informations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de livraison *
            </label>
            <input
              type="date"
              name="date_sortie"
              value={formData.date_sortie}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                errors.date_sortie ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.date_sortie && (
              <p className="mt-1 text-sm text-red-600">{errors.date_sortie}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Heure de départ
            </label>
            <input
              type="time"
              name="heure_sortie"
              value={formData.heure_sortie}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Référence bon de livraison *
            </label>
            <input
              type="text"
              name="reference_bon"
              value={formData.reference_bon}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                errors.reference_bon ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="BL-2024-001"
            />
            {errors.reference_bon && (
              <p className="mt-1 text-sm text-red-600">{errors.reference_bon}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destination finale
            </label>
            <input
              type="text"
              name="destination_finale"
              value={formData.destination_finale}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Ville, quartier..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observations
          </label>
          <textarea
            name="observations"
            value={formData.observations}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Notes supplémentaires..."
          />
        </div>

        {/* Boutons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => setFormData({
              type: 'sortie',
              produit_id: '',
              tonnage_livre: '',
              date_sortie: new Date().toISOString().split('T')[0],
              heure_sortie: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              type_livraison: 'magasin',
              magasin_id: '',
              client_id: '',
              particulier_nom: '',
              particulier_telephone: '',
              particulier_adresse: '',
              reference_bon: '',
              transporteur: '',
              numero_camion: '',
              nom_chauffeur: '',
              permis_chauffeur: '',
              telephone_chauffeur: '',
              destination_finale: '',
              observations: ''
            })}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Réinitialiser
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Enregistrement...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Enregistrer la livraison
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LivraisonTonnage;