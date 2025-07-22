import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import stockService from '../services/stock';
import naviresService from '../services/navires';
import { 
  Anchor, 
  TruckIcon, 
  Package, 
  Scale, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Download,
  RefreshCw,
  Bell,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

const OperatorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stock');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalReceptionne: 0,
    totalLivre: 0,
    stockRestant: 0,
    mouvementsJour: 0
  });
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [mouvements, setMouvements] = useState([]);
  const [stockDispatche, setStockDispatche] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Supprimer le formulaire de réception car c'est le manager qui réceptionne

  // Formulaire de livraison
  const [livraisonForm, setLivraisonForm] = useState({
    produit_id: '',
    client_id: '',
    quantite: '',
    vehicule: '',
    chauffeur: '',
    date_livraison: new Date().toISOString().split('T')[0],
    bon_livraison: ''
  });

  useEffect(() => {
    if (user?.role !== 'operator') {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Charger les données filtrées par magasin de l'opérateur
      const [statsData, clientsData, mouvementsData, stockDispatcheData, notificationsData] = await Promise.all([
        stockService.getStockStats({ magasin_id: user?.magasin_id }),
        stockService.getClients(),
        stockService.getMouvements({ 
          limit: 10, 
          magasin_id: user?.magasin_id 
        }),
        naviresService.getStockDispatche({ magasin_id: user?.magasin_id }),
        naviresService.getNotifications({ magasin_id: user?.magasin_id })
      ]);

      setStats(statsData.data);
      setClients(clientsData.data);
      setMouvements(mouvementsData.data);
      setStockDispatche(stockDispatcheData.data || []);
      setNotifications(notificationsData.data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour marquer une notification comme lue
  const markNotificationAsRead = async (notificationId) => {
    try {
      await naviresService.markNotificationAsRead(notificationId);
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de la notification');
    }
  };

  const handleLivraison = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Vérifier le stock disponible
      const stockDispo = await stockService.getStockByProduct(livraisonForm.produit_id);
      if (stockDispo.data.quantite_disponible < parseFloat(livraisonForm.quantite)) {
        throw new Error(`Stock insuffisant. Disponible: ${stockDispo.data.quantite_disponible} tonnes`);
      }

      await stockService.sortieStock({
        ...livraisonForm,
        type: 'livraison_client',
        reference: livraisonForm.bon_livraison,
        destination: `${livraisonForm.vehicule} - ${livraisonForm.chauffeur}`
      });
      
      toast.success('Livraison enregistrée avec succès');
      setLivraisonForm({
        produit_id: '',
        client_id: '',
        quantite: '',
        vehicule: '',
        chauffeur: '',
        date_livraison: new Date().toISOString().split('T')[0],
        bon_livraison: ''
      });
      loadData();
    } catch (error) {
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    // Logique d'export à implémenter
    toast.info('Export en cours de développement');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Anchor className="h-8 w-8 text-blue-600" />
                Gestion des Tonnages - Port de {user?.magasin?.nom || 'Dakar'}
              </h1>
              <p className="text-gray-600 mt-1">
                Opérateur: {user?.nom} {user?.prenom}
              </p>
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Réceptionné aujourd'hui</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalReceptionne.toFixed(2)} T
                </p>
              </div>
              <Package className="h-10 w-10 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Livré aujourd'hui</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.totalLivre.toFixed(2)} T
                </p>
              </div>
              <TruckIcon className="h-10 w-10 text-green-200" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stock total</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.stockRestant.toFixed(2)} T
                </p>
              </div>
              <Scale className="h-10 w-10 text-purple-200" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mouvements du jour</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.mouvementsJour}
                </p>
              </div>
              <Calendar className="h-10 w-10 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Notifications de nouveaux dispatchings */}
        {notifications.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <Bell className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>{notifications.length} nouveau(x) dispatching(s)</strong> reçu(s) pour votre magasin
                </p>
                <div className="mt-2 space-y-1">
                  {notifications.slice(0, 3).map((notification) => (
                    <div key={notification.id} className="text-xs text-blue-600 flex items-center justify-between">
                      <span>
                        {notification.message}
                      </span>
                      <button
                        onClick={() => markNotificationAsRead(notification.id)}
                        className="ml-2 text-blue-500 hover:text-blue-700"
                      >
                        Marquer comme lu
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglets */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('stock')}
                className={`py-2 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'stock'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Stock Reçu
                </div>
              </button>
              <button
                onClick={() => setActiveTab('livraison')}
                className={`py-2 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'livraison'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <TruckIcon className="h-4 w-4" />
                  Livraison Client
                </div>
              </button>
              <button
                onClick={() => setActiveTab('historique')}
                className={`py-2 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'historique'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Historique
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Vue du stock dispatché */}
            {activeTab === 'stock' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Stock dispatché dans votre magasin
                  </h3>
                  <div className="text-sm text-gray-500">
                    Magasin: {user?.magasin?.nom || user?.magasin_id}
                  </div>
                </div>

                {stockDispatche.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun stock dispatché pour votre magasin</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Le manager dispatchera le stock des navires vers votre magasin
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Produit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Quantité Reçue
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Quantité Disponible
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Navire Source
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Statut
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stockDispatche.map((stock) => (
                          <tr key={stock.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {stock.produit_nom}
                              </div>
                              <div className="text-sm text-gray-500">
                                {stock.origine}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                              {stock.quantite_recue?.toFixed(2)} T
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`font-medium ${
                                stock.quantite_disponible > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {stock.quantite_disponible?.toFixed(2)} T
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {stock.navire_nom}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(stock.date_dispatching).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                stock.quantite_disponible > 0 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {stock.quantite_disponible > 0 ? 'Disponible' : 'Épuisé'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Formulaire de livraison */}
            {activeTab === 'livraison' && (
              <form onSubmit={handleLivraison} className="space-y-6">
                <h3 className="text-lg font-semibold mb-4">
                  Enregistrer une livraison client
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Produit
                    </label>
                    <select
                      value={livraisonForm.produit_id}
                      onChange={(e) => setLivraisonForm({ ...livraisonForm, produit_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Sélectionner un produit</option>
                      {stockDispatche.filter(stock => stock.quantite_disponible > 0).map(stock => (
                        <option key={stock.id} value={stock.produit_id}>
                          {stock.produit_nom} - Disponible: {stock.quantite_disponible?.toFixed(2)} T
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client
                    </label>
                    <select
                      value={livraisonForm.client_id}
                      onChange={(e) => setLivraisonForm({ ...livraisonForm, client_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Sélectionner un client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.nom} - {client.code}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantité (tonnes)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={livraisonForm.quantite}
                      onChange={(e) => setLivraisonForm({ ...livraisonForm, quantite: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 50.25"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      N° Bon de livraison
                    </label>
                    <input
                      type="text"
                      value={livraisonForm.bon_livraison}
                      onChange={(e) => setLivraisonForm({ ...livraisonForm, bon_livraison: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: BL-2024-001"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Véhicule
                    </label>
                    <input
                      type="text"
                      value={livraisonForm.vehicule}
                      onChange={(e) => setLivraisonForm({ ...livraisonForm, vehicule: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: DK 1234 AB"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chauffeur
                    </label>
                    <input
                      type="text"
                      value={livraisonForm.chauffeur}
                      onChange={(e) => setLivraisonForm({ ...livraisonForm, chauffeur: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Nom du chauffeur"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de livraison
                    </label>
                    <input
                      type="date"
                      value={livraisonForm.date_livraison}
                      onChange={(e) => setLivraisonForm({ ...livraisonForm, date_livraison: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setLivraisonForm({
                      produit_id: '',
                      client_id: '',
                      quantite: '',
                      vehicule: '',
                      chauffeur: '',
                      date_livraison: new Date().toISOString().split('T')[0],
                      bon_livraison: ''
                    })}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <TruckIcon className="h-4 w-4" />
                    Enregistrer la livraison
                  </button>
                </div>
              </form>
            )}

            {/* Historique */}
            {activeTab === 'historique' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Historique des mouvements
                  </h3>
                  <button
                    onClick={exportData}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    <Download className="h-4 w-4" />
                    Exporter
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Produit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Quantité
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Référence
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mouvements.map((mouvement) => (
                        <tr key={mouvement.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {new Date(mouvement.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              mouvement.type === 'entree' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {mouvement.type === 'entree' ? 'Réception' : 'Livraison'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {mouvement.produit?.nom}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {mouvement.quantite} T
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {mouvement.reference}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorDashboard;