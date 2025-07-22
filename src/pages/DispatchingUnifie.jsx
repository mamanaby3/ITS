import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  TruckIcon, 
  Store, 
  Users, 
  Plus, 
  Eye, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Ship
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingState from '../components/ui/LoadingState';
import api from '../services/api';
import toast from 'react-hot-toast';

const DispatchingUnifie = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('navires'); // 'navires' ou 'historique'
  
  // Données
  const [navires, setNavires] = useState([]);
  const [magasins, setMagasins] = useState([]);
  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  
  // État du formulaire de dispatch
  const [showDispatchForm, setShowDispatchForm] = useState(false);
  const [selectedNavire, setSelectedNavire] = useState(null);
  const [dispatchType, setDispatchType] = useState('magasin'); // 'magasin' ou 'client'
  const [dispatchData, setDispatchData] = useState({
    produit_id: '',
    quantite: '',
    destination_id: '',
    observations: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      // Récupérer seulement les navires avec statut 'receptionne' (prêts pour dispatch)
      const [naviresRes, magasinsRes, clientsRes, produitsRes] = await Promise.all([
        api.get('/navires', { params: { statut: 'receptionne' } }).catch(() => ({ data: [] })),
        api.get('/magasins').catch(() => ({ data: [] })),
        api.get('/clients').catch(() => ({ data: [] })),
        api.get('/produits').catch(() => ({ data: [] }))
      ]);

      setNavires(naviresRes.data || []);
      setMagasins(magasinsRes.data || []);
      setClients(clientsRes.data || []);
      setProduits(produitsRes.data || []);
      
      await loadDispatches();
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadDispatches = async () => {
    try {
      const response = await api.get('/dispatches');
      setDispatches(response.data || []);
    } catch (error) {
      console.error('Erreur chargement dispatches:', error);
    }
  };

  const handleDispatch = async () => {
    try {
      if (!dispatchData.produit_id || !dispatchData.quantite || !dispatchData.destination_id) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }

      const payload = {
        navire_id: selectedNavire.id,
        produit_id: dispatchData.produit_id,
        quantite: parseFloat(dispatchData.quantite),
        type_destination: dispatchType,
        destination_id: dispatchData.destination_id,
        observations: dispatchData.observations
      };

      if (dispatchType === 'magasin') {
        // Dispatch vers magasin
        await api.post('/navire-dispatching/dispatcher', {
          ...payload,
          magasin_id: dispatchData.destination_id
        });
      } else {
        // Dispatch direct vers client
        await api.post('/dispatches/direct-client', {
          ...payload,
          client_id: dispatchData.destination_id
        });
      }

      toast.success(`Dispatch effectué vers ${dispatchType === 'magasin' ? 'le magasin' : 'le client'}`);
      setShowDispatchForm(false);
      resetDispatchForm();
      await loadInitialData();
    } catch (error) {
      console.error('Erreur dispatch:', error);
      toast.error('Erreur lors du dispatch');
    }
  };

  const resetDispatchForm = () => {
    setSelectedNavire(null);
    setDispatchType('magasin');
    setDispatchData({
      produit_id: '',
      quantite: '',
      destination_id: '',
      observations: ''
    });
  };

  const NavireCard = ({ navire }) => {
    const hasStock = navire.cargaisons && navire.cargaisons.length > 0;
    
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Ship className="h-5 w-5 text-blue-600" />
                {navire.nom_navire}
              </h3>
              <p className="text-sm text-gray-500">IMO: {navire.numero_imo}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              navire.statut === 'receptionne' ? 'bg-green-100 text-green-800' :
              navire.statut === 'dispatche' ? 'bg-blue-100 text-blue-800' :
              navire.statut === 'arrive' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {navire.statut === 'receptionne' ? 'Réceptionné' :
               navire.statut === 'dispatche' ? 'Dispatché' :
               navire.statut === 'arrive' ? 'En attente' :
               navire.statut}
            </span>
          </div>

          {hasStock && (
            <div className="space-y-2 mb-4">
              {navire.cargaisons.map((cargaison, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{cargaison.produit_nom}</span>
                  <span className="font-medium">{cargaison.quantite} T</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedNavire(navire);
                setShowDispatchForm(true);
              }}
              disabled={!hasStock}
            >
              <TruckIcon className="h-4 w-4 mr-1" />
              Dispatcher
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/navires/${navire.id}`)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Détails
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  const DispatchHistoryItem = ({ dispatch }) => {
    const isToMagasin = dispatch.type_destination === 'magasin';
    
    return (
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-gray-900">
            {dispatch.navire_nom}
          </div>
          <div className="text-sm text-gray-500">
            {new Date(dispatch.date_dispatch).toLocaleDateString('fr-FR')}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{dispatch.produit_nom}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-center">
          <span className="text-sm font-medium">{dispatch.quantite} T</span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            {isToMagasin ? (
              <Store className="h-4 w-4 text-blue-500 mr-2" />
            ) : (
              <Users className="h-4 w-4 text-green-500 mr-2" />
            )}
            <span className="text-sm text-gray-900">
              {dispatch.destination_nom}
            </span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-center">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            dispatch.statut === 'confirmé' ? 'bg-green-100 text-green-800' :
            dispatch.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {dispatch.statut}
          </span>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dispatching Central
            </h1>
            <p className="text-gray-600 mt-1">
              Gérer les dispatches vers les magasins et clients
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => loadInitialData()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Info workflow */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Workflow :</strong> 
              1. Réceptionner le navire → 
              2. Dispatcher vers magasins ou clients → 
              3. Les magasins livrent aux clients
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('navires')}
              className={`py-2 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'navires'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Ship className="h-4 w-4 inline mr-2" />
              Navires à dispatcher
            </button>
            <button
              onClick={() => setActiveTab('historique')}
              className={`py-2 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'historique'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <CheckCircle className="h-4 w-4 inline mr-2" />
              Historique des dispatches
            </button>
          </nav>
        </div>

        <LoadingState loading={loading}>
          {activeTab === 'navires' ? (
            <div className="p-6">
              {navires.length === 0 ? (
                <div className="text-center py-12">
                  <Ship className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun navire réceptionné en attente de dispatch</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Les navires doivent d'abord être réceptionnés avant de pouvoir être dispatchés
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {navires.map(navire => (
                    <NavireCard key={navire.id} navire={navire} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Navire / Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Destination
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dispatches.map(dispatch => (
                    <DispatchHistoryItem key={dispatch.id} dispatch={dispatch} />
                  ))}
                </tbody>
              </table>
              
              {dispatches.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun dispatch enregistré</p>
                </div>
              )}
            </div>
          )}
        </LoadingState>
      </div>

      {/* Modal de dispatch */}
      {showDispatchForm && selectedNavire && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowDispatchForm(false)} />
            
            <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-xl font-bold mb-4">
                Dispatcher depuis {selectedNavire.nom_navire}
              </h2>

              <div className="space-y-4">
                {/* Type de destination */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de destination
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="magasin"
                        checked={dispatchType === 'magasin'}
                        onChange={(e) => setDispatchType(e.target.value)}
                        className="mr-2"
                      />
                      <Store className="h-4 w-4 mr-1" />
                      Vers Magasin
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="client"
                        checked={dispatchType === 'client'}
                        onChange={(e) => setDispatchType(e.target.value)}
                        className="mr-2"
                      />
                      <Users className="h-4 w-4 mr-1" />
                      Direct Client
                    </label>
                  </div>
                </div>

                {/* Produit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Produit
                  </label>
                  <select
                    value={dispatchData.produit_id}
                    onChange={(e) => setDispatchData({...dispatchData, produit_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un produit</option>
                    {selectedNavire.cargaisons?.map(cargaison => (
                      <option key={cargaison.produit_id} value={cargaison.produit_id}>
                        {cargaison.produit_nom} - {cargaison.quantite} T disponibles
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantité (T)
                  </label>
                  <input
                    type="number"
                    value={dispatchData.quantite}
                    onChange={(e) => setDispatchData({...dispatchData, quantite: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                {/* Destination */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {dispatchType === 'magasin' ? 'Magasin de destination' : 'Client'}
                  </label>
                  <select
                    value={dispatchData.destination_id}
                    onChange={(e) => setDispatchData({...dispatchData, destination_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner {dispatchType === 'magasin' ? 'un magasin' : 'un client'}</option>
                    {dispatchType === 'magasin' 
                      ? magasins.map(magasin => (
                          <option key={magasin.id} value={magasin.id}>
                            {magasin.nom}
                          </option>
                        ))
                      : clients.map(client => (
                          <option key={client.id} value={client.id}>
                            {client.nom}
                          </option>
                        ))
                    }
                  </select>
                </div>

                {/* Observations */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observations
                  </label>
                  <textarea
                    value={dispatchData.observations}
                    onChange={(e) => setDispatchData({...dispatchData, observations: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Notes additionnelles..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDispatchForm(false);
                    resetDispatchForm();
                  }}
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDispatch}
                >
                  <TruckIcon className="h-4 w-4 mr-2" />
                  Confirmer le Dispatch
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DispatchingUnifie;