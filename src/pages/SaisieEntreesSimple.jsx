import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { AlertCircle, CheckCircle, TrendingUp, Package, History, Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const SaisieEntreesSimple = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    produit_id: '',
    client_id: '',
    quantite: '',
    prix_unitaire: ''
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [produits, setProduits] = useState([]);
  const [clients, setClients] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [entreesJour, setEntreesJour] = useState([]);
  const [historiqueEntrees, setHistoriqueEntrees] = useState([]);
  const [showHistorique, setShowHistorique] = useState(false);

  // Charger les données au montage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger les produits
      const produitsRes = await api.get('/produits');
      setProduits(produitsRes.data?.data || []);

      // Charger uniquement les fournisseurs du magasin de l'utilisateur
      const clientsRes = await api.get(`/clients?magasin_id=${user.magasin_id}`);
      setClients(clientsRes.data?.data || []);

      // Charger le stock du magasin de l'utilisateur
      const stockRes = await api.get(`/stock/magasin/${user.magasin_id}`);
      setStocks(stockRes.data?.data || []);

      // Charger les entrées du jour (mouvements de type entree)
      const today = new Date().toISOString().split('T')[0];
      const mouvementsRes = await api.get(`/stock/mouvements?type=entree&magasin_id=${user.magasin_id}&date=${today}`);
      setEntreesJour(mouvementsRes.data?.data || []);
      
      // Charger l'historique des entrées (30 derniers jours)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const historiqueRes = await api.get(`/stock/mouvements?type=entree&magasin_id=${user.magasin_id}&start_date=${thirtyDaysAgo.toISOString().split('T')[0]}`);
      setHistoriqueEntrees(historiqueRes.data?.data || []);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Enregistrer l'entrée
      await api.post('/stock/entree', {
        produit_id: parseInt(formData.produit_id),
        quantite: parseInt(formData.quantite),
        magasin_id: user.magasin_id,
        type: 'entree',
        raison: `Réception fournisseur ${formData.client_id}`,
        reference: `ENTREE-${Date.now()}-FOURNISSEUR-${formData.client_id}`,
        prix_unitaire: parseFloat(formData.prix_unitaire)
      });

      setMessage({ type: 'success', text: 'Entrée enregistrée avec succès!' });
      setFormData({ produit_id: '', client_id: '', quantite: '', prix_unitaire: '' });
      
      // Recharger les données
      await loadData();
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Erreur lors de l\'enregistrement' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getStockDisponible = (produitId) => {
    const stock = stocks.find(s => s.produit_id === parseInt(produitId));
    return stock?.quantite || 0;
  };

  const totalEntreesJour = entreesJour.reduce((sum, v) => sum + (v.quantite * (v.prix_unitaire || 0)), 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        Saisie des Entrées - {user?.nom} {user?.prenom}
      </h1>

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
        {/* Formulaire de saisie - Plus grand et simple */}
        <Card className="lg:col-span-2" title="Nouvelle Entrée">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 text-lg font-medium">Produit</label>
              <select
                value={formData.produit_id}
                onChange={(e) => setFormData({...formData, produit_id: e.target.value})}
                className="w-full p-3 text-lg border rounded-lg"
                required
              >
                <option value="">-- Choisir un produit --</option>
                {produits.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nom} (Stock actuel: {getStockDisponible(p.id)} {p.unite})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-lg font-medium">Fournisseur</label>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                className="w-full p-3 text-lg border rounded-lg"
                required
              >
                <option value="">-- Choisir un fournisseur --</option>
                {clients.length === 0 ? (
                  <option disabled>Aucun fournisseur enregistré pour votre magasin</option>
                ) : (
                  clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nom} {c.type && `(${c.type})`}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-lg font-medium">Quantité reçue</label>
                <Input
                  type="number"
                  value={formData.quantite}
                  onChange={(e) => setFormData({...formData, quantite: e.target.value})}
                  placeholder="0"
                  min="1"
                  className="text-lg p-3"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-lg font-medium">Prix unitaire (€)</label>
                <Input
                  type="number"
                  value={formData.prix_unitaire}
                  onChange={(e) => setFormData({...formData, prix_unitaire: e.target.value})}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="text-lg p-3"
                  required
                />
              </div>
            </div>

            {/* Montant total */}
            {formData.quantite && formData.prix_unitaire && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-lg">Montant total de l'entrée:</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(parseFloat(formData.quantite) * parseFloat(formData.prix_unitaire)).toFixed(2)} €
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setFormData({ produit_id: '', client_id: '', quantite: '', prix_unitaire: '' })}
                className="flex-1"
              >
                Effacer
              </Button>
              <Button 
                type="submit" 
                size="lg"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Enregistrement...' : 'Enregistrer l\'entrée'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Résumé du jour */}
        <div className="space-y-4">
          <Card className="bg-green-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Entrées du jour</h3>
                <TrendingUp className="text-green-600" size={28} />
              </div>
              <div className="text-3xl font-bold text-green-600">
                {totalEntreesJour.toFixed(2)} €
              </div>
              <p className="text-gray-600 mt-2">
                {entreesJour.length} entrée(s) effectuée(s)
              </p>
          </Card>

          {/* Stock rapide */}
          <Card title={
            <div className="flex items-center gap-2">
              <Package size={20} />
              Stock disponible
            </div>
          }>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {stocks.map(stock => {
                  const produit = produits.find(p => p.id === stock.produit_id);
                  if (!produit) return null;
                  
                  return (
                    <div key={stock.id} className="flex justify-between p-2 hover:bg-gray-50 rounded">
                      <span className="text-sm">{produit.nom}</span>
                      <span className={`text-sm font-medium ${
                        stock.quantite < (produit.seuil_min || 10) ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {stock.quantite} {produit.unite}
                      </span>
                    </div>
                  );
                })}
              </div>
          </Card>
        </div>
      </div>

      {/* Liste simplifiée des entrées du jour */}
      {entreesJour.length > 0 && (
        <Card className="mt-6" title="Entrées d'aujourd'hui">
            <div className="space-y-2">
              {entreesJour.slice(0, 10).map((entree, idx) => (
                <div key={idx} className="flex justify-between p-3 bg-gray-50 rounded">
                  <span>{entree.produit?.nom || 'Produit'}</span>
                  <span className="font-medium">
                    {entree.quantite} x {entree.prix_unitaire || 0}€ = {(entree.quantite * (entree.prix_unitaire || 0)).toFixed(2)}€
                  </span>
                </div>
              ))}
            </div>
        </Card>
      )}
      
      {/* Bouton Historique */}
      <div className="mt-6 flex justify-end">
        <Button
          variant="outline"
          onClick={() => setShowHistorique(!showHistorique)}
          className="flex items-center gap-2"
        >
          <History size={20} />
          {showHistorique ? 'Masquer' : 'Voir'} l'historique des entrées
        </Button>
      </div>
      
      {/* Historique des entrées */}
      {showHistorique && (
        <Card className="mt-6" title={
          <div className="flex items-center gap-2">
            <Calendar size={20} />
            Historique des entrées (30 derniers jours)
          </div>
        }>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Produit</th>
                  <th className="text-left p-3">Fournisseur</th>
                  <th className="text-center p-3">Quantité</th>
                  <th className="text-right p-3">Prix Unit.</th>
                  <th className="text-right p-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {historiqueEntrees.map((entree, idx) => {
                  const produit = produits.find(p => p.id === entree.produit_id);
                  const date = new Date(entree.created_at);
                  const total = entree.quantite * (entree.prix_unitaire || 0);
                  
                  return (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        {date.toLocaleDateString('fr-FR', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="p-3">{produit?.nom || 'Produit inconnu'}</td>
                      <td className="p-3">{entree.reference || '-'}</td>
                      <td className="p-3 text-center">{entree.quantite} {produit?.unite}</td>
                      <td className="p-3 text-right">{(entree.prix_unitaire || 0).toFixed(2)}€</td>
                      <td className="p-3 text-right font-medium">{total.toFixed(2)}€</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td colSpan="5" className="p-3 text-right">Total période :</td>
                  <td className="p-3 text-right">
                    {historiqueEntrees.reduce((sum, v) => sum + (v.quantite * (v.prix_unitaire || 0)), 0).toFixed(2)}€
                  </td>
                </tr>
              </tfoot>
            </table>
            
            {historiqueEntrees.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Aucune entrée enregistrée sur cette période
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default SaisieEntreesSimple;