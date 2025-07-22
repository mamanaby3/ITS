import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { AlertCircle, CheckCircle, TrendingUp, Package, Truck, FileText, Calendar, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import stockService from '../services/stock';
import clientService from '../services/clients';
import produitService from '../services/produits';

const SaisieEntrees = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    produit_id: '',
    fournisseur_id: '',
    client_id: '',
    quantite: '',
    prix_unitaire: '',
    numero_bl: '',
    date_livraison: new Date().toISOString().split('T')[0],
    transporteur: '',
    nom_chauffeur: '',
    telephone_chauffeur: '',
    numero_camion: '',
    lot_number: '',
    date_expiration: '',
    type_livraison: 'client',
    observations: ''
  });
  const [message, setMessage] = useState(null);

  // Charger les produits
  const { data: produits = [] } = useQuery({
    queryKey: ['produits'],
    queryFn: produitService.getAll
  });

  // Charger les clients
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: clientService.getAll
  });

  // Charger le stock du magasin
  const { data: stocks = [], refetch: refetchStock } = useQuery({
    queryKey: ['stock', user?.magasin_id],
    queryFn: () => stockService.getByMagasin(user?.magasin_id),
    enabled: !!user?.magasin_id
  });

  // Charger les entrées du jour
  const { data: entreesJour = [], refetch: refetchEntreesJour } = useQuery({
    queryKey: ['entrees-jour', user?.magasin_id],
    queryFn: () => stockService.getEntreesJour(user?.magasin_id),
    enabled: !!user?.magasin_id
  });

  // Mutation pour enregistrer une entrée
  const createEntree = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        magasin_id: user.magasin_id,
        type: 'entree',
        motif: 'Réception de livraison'
      };
      // Si c'est une livraison client, on utilise client_id pour le destinataire
      // et fournisseur_id pour le fournisseur
      if (data.fournisseur_id) {
        payload.fournisseur_id = data.fournisseur_id;
      }
      return stockService.enregistrerEntree(payload);
    },
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Entrée enregistrée avec succès!' });
      setFormData({
        produit_id: '',
        fournisseur_id: '',
        client_id: '',
        quantite: '',
        prix_unitaire: '',
        numero_bl: '',
        date_livraison: new Date().toISOString().split('T')[0],
        transporteur: '',
        nom_chauffeur: '',
        telephone_chauffeur: '',
        numero_camion: '',
        lot_number: '',
        date_expiration: '',
        type_livraison: 'client',
        observations: ''
      });
      refetchStock();
      refetchEntreesJour();
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message || error.response?.data?.error || 'Erreur lors de l\'enregistrement' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createEntree.mutate(formData);
  };

  const getStockDisponible = (produitId) => {
    const stock = stocks.find(s => s.produit_id === parseInt(produitId));
    return stock?.quantite || 0;
  };

  const totalEntreesJour = entreesJour.reduce((sum, v) => sum + (v.quantite * v.prix_unitaire), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Saisie des Entrées - {user?.magasin?.nom || 'Mon Magasin'}</h1>

      {/* Message de feedback */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire de saisie */}
        <Card className="lg:col-span-2">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Truck size={20} />
              Nouvelle Réception de Livraison
            </h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section Informations de livraison */}
              <div className="border-b pb-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <FileText size={16} />
                  Informations de livraison
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1 font-medium">N° Bon de Livraison*</label>
                    <Input
                      type="text"
                      value={formData.numero_bl}
                      onChange={(e) => setFormData({...formData, numero_bl: e.target.value})}
                      placeholder="BL-2024-001"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Date de livraison*</label>
                    <Input
                      type="date"
                      value={formData.date_livraison}
                      onChange={(e) => setFormData({...formData, date_livraison: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Fournisseur*</label>
                    <select
                      value={formData.fournisseur_id}
                      onChange={(e) => setFormData({...formData, fournisseur_id: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                      required
                    >
                      <option value="">Sélectionner un fournisseur</option>
                      {clients.filter(c => c.type === 'fournisseur' || c.type === 'entreprise').map(c => (
                        <option key={c.id} value={c.id}>{c.nom}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block mb-1 font-medium">Client destinataire*</label>
                    <select
                      value={formData.client_id}
                      onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                      required
                    >
                      <option value="">Sélectionner le client</option>
                      {clients.filter(c => c.type === 'particulier' || c.type === 'entreprise').map(c => (
                        <option key={c.id} value={c.id}>{c.nom}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Type de livraison</label>
                    <select
                      value={formData.type_livraison || 'client'}
                      onChange={(e) => setFormData({...formData, type_livraison: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="client">Livraison client</option>
                      <option value="stock">Mise en stock</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section Transport */}
              <div className="border-b pb-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Truck size={16} />
                  Informations de transport
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Nom du chauffeur</label>
                    <Input
                      type="text"
                      value={formData.nom_chauffeur}
                      onChange={(e) => setFormData({...formData, nom_chauffeur: e.target.value})}
                      placeholder="Nom complet"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Téléphone chauffeur</label>
                    <Input
                      type="tel"
                      value={formData.telephone_chauffeur}
                      onChange={(e) => setFormData({...formData, telephone_chauffeur: e.target.value})}
                      placeholder="+221 XX XXX XX XX"
                    />
                  </div>
                </div>
              </div>

              {/* Section Produit */}
              <div className="border-b pb-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Package size={16} />
                  Détails du produit
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-medium">Produit</label>
                  <select
                    value={formData.produit_id}
                    onChange={(e) => setFormData({...formData, produit_id: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    required
                  >
                    <option value="">Sélectionner un produit</option>
                    {produits.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nom} (Stock: {getStockDisponible(p.id)} {p.unite})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-medium">N° de lot</label>
                  <Input
                    type="text"
                    value={formData.lot_number}
                    onChange={(e) => setFormData({...formData, lot_number: e.target.value})}
                    placeholder="LOT-2024-001"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium">Quantité reçue</label>
                  <Input
                    type="number"
                    value={formData.quantite}
                    onChange={(e) => setFormData({...formData, quantite: e.target.value})}
                    placeholder="0"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium">Prix unitaire</label>
                  <Input
                    type="number"
                    value={formData.prix_unitaire}
                    onChange={(e) => setFormData({...formData, prix_unitaire: e.target.value})}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium">Date d'expiration</label>
                  <Input
                    type="date"
                    value={formData.date_expiration}
                    onChange={(e) => setFormData({...formData, date_expiration: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                </div>
              </div>

              {/* Section Observations */}
              <div>
                <label className="block mb-1 font-medium">Observations</label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => setFormData({...formData, observations: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  rows="3"
                  placeholder="Notes complémentaires sur la livraison..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData({
                    produit_id: '',
                    fournisseur_id: '',
                    client_id: '',
                    quantite: '',
                    prix_unitaire: '',
                    numero_bl: '',
                    date_livraison: new Date().toISOString().split('T')[0],
                    transporteur: '',
                    nom_chauffeur: '',
                    telephone_chauffeur: '',
                    numero_camion: '',
                    lot_number: '',
                    date_expiration: '',
                    type_livraison: 'client',
                    observations: ''
                  })}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={createEntree.isLoading}>
                  {createEntree.isLoading ? 'Enregistrement...' : 'Enregistrer l\'entrée'}
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* Résumé du jour */}
        <div className="space-y-4">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Entrées du jour</h3>
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {totalEntreesJour.toFixed(2)} €
              </div>
              <p className="text-sm text-gray-500">
                {entreesJour.length} entrée(s) effectuée(s)
              </p>
            </div>
          </Card>

          {/* Stock rapide */}
          <Card>
            <div className="p-6 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Package size={20} />
                Stock disponible
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {stocks.map(stock => (
                  <div key={stock.id} className="flex justify-between p-2 hover:bg-gray-50 rounded">
                    <span className="text-sm">{stock.produit?.nom}</span>
                    <span className={`text-sm font-medium ${
                      stock.quantite < stock.produit?.seuil_min ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {stock.quantite} {stock.produit?.unite}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Liste des entrées du jour */}
      <Card className="mt-6">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Entrées effectuées aujourd'hui</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Heure</th>
                  <th className="text-left p-2">N° BL</th>
                  <th className="text-left p-2">Produit</th>
                  <th className="text-left p-2">Fournisseur</th>
                  <th className="text-left p-2">Transporteur</th>
                  <th className="text-right p-2">Quantité</th>
                  <th className="text-right p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {entreesJour.map((entree, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="p-2">{new Date(entree.created_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</td>
                    <td className="p-2">{entree.numero_bl || '-'}</td>
                    <td className="p-2">{entree.produit?.nom}</td>
                    <td className="p-2">{entree.fournisseur?.nom || entree.client?.nom}</td>
                    <td className="p-2">{entree.transporteur || '-'}</td>
                    <td className="p-2 text-right">{entree.quantite} {entree.produit?.unite}</td>
                    <td className="p-2 text-right font-medium">{(entree.quantite * entree.prix_unitaire).toFixed(2)}€</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SaisieEntrees;