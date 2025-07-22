import React, { useState, useEffect } from 'react';
import { Package, Truck, Plus, History } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/formatters';

const GestionTonnageSimple = () => {
  const [view, setView] = useState('stock'); // stock, livraison, historique
  const [loading, setLoading] = useState(true);
  const [stock, setStock] = useState([]);
  const [mouvements, setMouvements] = useState([]);
  const [produits, setProduits] = useState([]);
  const [clients, setClients] = useState([]);
  const [magasins, setMagasins] = useState([]);

  // Formulaire simplifié pour livraison
  const [livraisonForm, setLivraisonForm] = useState({
    produit_id: '',
    client_id: '',
    quantite: '',
    chauffeur: '',
    numero_camion: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [produitsRes, clientsRes, magasinsRes, mouvementsRes] = await Promise.all([
        api.get('/produits').catch(() => ({ data: [] })),
        api.get('/clients').catch(() => ({ data: [] })),
        api.get('/magasins').catch(() => ({ data: [] })),
        api.get('/mouvements').catch(() => ({ data: [] }))
      ]);

      setProduits(produitsRes.data || []);
      setClients(clientsRes.data || []);
      setMagasins(magasinsRes.data || []);
      
      const mouvementsData = mouvementsRes.data || [];
      setMouvements(mouvementsData.slice(-10)); // Derniers 10 mouvements

      // Calculer le stock
      const stockCalcule = calculateStock(mouvementsData, produitsRes.data);
      setStock(stockCalcule);

    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const calculateStock = (mouvements, produits) => {
    const stockMap = {};
    
    mouvements.forEach(m => {
      if (!stockMap[m.produit_id]) {
        stockMap[m.produit_id] = 0;
      }
      
      if (m.type === 'entree') {
        stockMap[m.produit_id] += (m.tonnage || m.quantite || 0);
      } else {
        stockMap[m.produit_id] -= (m.tonnage_livre || m.quantite || 0);
      }
    });

    return produits.map(p => ({
      ...p,
      quantite_disponible: stockMap[p.id] || 0
    }));
  };

  const handleLivraison = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/livraisons', {
        ...livraisonForm,
        date_livraison: new Date().toISOString(),
        statut: 'livre'
      });

      await api.post('/mouvements', {
        ...livraisonForm,
        type: 'sortie',
        tonnage_livre: livraisonForm.quantite,
        date: new Date().toISOString()
      });

      toast.success('Livraison enregistrée');
      setLivraisonForm({
        produit_id: '',
        client_id: '',
        quantite: '',
        chauffeur: '',
        numero_camion: ''
      });
      setView('stock');
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la livraison');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Package className="h-5 w-5" />
          Gestion du Stock
        </h1>
        
        <div className="flex gap-2">
          <Button
            variant={view === 'stock' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setView('stock')}
          >
            Stock
          </Button>
          <Button
            variant={view === 'livraison' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setView('livraison')}
          >
            <Plus className="h-4 w-4 mr-1" />
            Livraison
          </Button>
          <Button
            variant={view === 'historique' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setView('historique')}
          >
            <History className="h-4 w-4 mr-1" />
            Historique
          </Button>
        </div>
      </div>

      {/* Vue Stock */}
      {view === 'stock' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stock.map(produit => (
            <Card key={produit.id} className="p-4">
              <h3 className="font-semibold text-lg">{produit.nom}</h3>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">
                  Stock: <span className="font-medium text-black">{produit.quantite_disponible} tonnes</span>
                </p>
                <p className="text-sm text-gray-600">
                  Prix: <span className="font-medium">{formatCurrency(produit.prix_achat)}/tonne</span>
                </p>
                <p className={`text-sm font-medium ${
                  produit.quantite_disponible <= (produit.seuil_alerte || 0) ? 'text-red-600' : 'text-green-600'
                }`}>
                  {produit.quantite_disponible <= (produit.seuil_alerte || 0) ? 'Stock faible' : 'Stock OK'}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Vue Livraison */}
      {view === 'livraison' && (
        <Card className="p-6 max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold mb-4">Nouvelle Livraison</h2>
          <form onSubmit={handleLivraison} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Produit</label>
              <select
                value={livraisonForm.produit_id}
                onChange={(e) => setLivraisonForm({...livraisonForm, produit_id: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner un produit</option>
                {produits.map(p => (
                  <option key={p.id} value={p.id}>{p.nom}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Client</label>
              <select
                value={livraisonForm.client_id}
                onChange={(e) => setLivraisonForm({...livraisonForm, client_id: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner un client</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Quantité (tonnes)</label>
              <input
                type="number"
                value={livraisonForm.quantite}
                onChange={(e) => setLivraisonForm({...livraisonForm, quantite: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Chauffeur</label>
              <input
                type="text"
                value={livraisonForm.chauffeur}
                onChange={(e) => setLivraisonForm({...livraisonForm, chauffeur: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">N° Camion</label>
              <input
                type="text"
                value={livraisonForm.numero_camion}
                onChange={(e) => setLivraisonForm({...livraisonForm, numero_camion: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setView('stock')}
              >
                Annuler
              </Button>
              <Button type="submit">
                <Truck className="h-4 w-4 mr-2" />
                Enregistrer la livraison
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Vue Historique */}
      {view === 'historique' && (
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Derniers mouvements</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Produit</th>
                  <th className="text-left py-2">Quantité</th>
                  <th className="text-left py-2">Client</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {mouvements.map((m, idx) => (
                  <tr key={idx}>
                    <td className="py-2">{new Date(m.date || m.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        m.type === 'entree' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {m.type === 'entree' ? 'Entrée' : 'Sortie'}
                      </span>
                    </td>
                    <td className="py-2">{produits.find(p => p.id === m.produit_id)?.nom || '-'}</td>
                    <td className="py-2">{m.tonnage || m.tonnage_livre || m.quantite} t</td>
                    <td className="py-2">{clients.find(c => c.id === m.client_id)?.nom || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default GestionTonnageSimple;