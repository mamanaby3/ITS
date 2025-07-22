import React, { useState, useEffect } from 'react';
import { 
  Truck, Package, Calendar, Clock, 
  CheckCircle, XCircle, AlertCircle, RefreshCw,
  Filter, Eye, Edit2, Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatDate, formatNumber } from '../utils/format';
import { StockExportButton } from '../components/ui/ExcelExportButton';

const Livraisons = () => {
  const navigate = useNavigate();
  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtres, setFiltres] = useState({
    statut: 'tous',
    dateDebut: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateFin: new Date().toISOString().split('T')[0],
    search: ''
  });
  const [selectedLivraison, setSelectedLivraison] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    planifie: 0,
    en_cours: 0,
    livre: 0,
    annule: 0,
    retard: 0
  });

  useEffect(() => {
    loadLivraisons();
  }, [filtres]);

  const loadLivraisons = async () => {
    setLoading(true);
    try {
      const params = {
        date_debut: filtres.dateDebut,
        date_fin: filtres.dateFin,
        statut: filtres.statut === 'tous' ? undefined : filtres.statut,
        search: filtres.search || undefined,
        include: 'produit,magasin,client'
      };

      const response = await api.get('/livraisons', { params });
      const livraisonsData = response.data?.data || response.data || [];
      
      setLivraisons(livraisonsData);
      
      // Calculer les statistiques
      const newStats = {
        total: livraisonsData.length,
        planifie: livraisonsData.filter(l => l.statut === 'planifie').length,
        en_cours: livraisonsData.filter(l => l.statut === 'en_cours').length,
        livre: livraisonsData.filter(l => l.statut === 'livre').length,
        annule: livraisonsData.filter(l => l.statut === 'annule').length,
        retard: livraisonsData.filter(l => l.statut === 'retard').length
      };
      
      setStats(newStats);
    } catch (error) {
      console.error('Erreur chargement livraisons:', error);
      toast.error('Erreur lors du chargement des livraisons');
    } finally {
      setLoading(false);
    }
  };

  const handleMarquerEnCours = async (livraison) => {
    try {
      await api.post(`/livraisons/${livraison.id}/en-cours`);
      toast.success('Livraison marquée en cours');
      loadLivraisons();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleMarquerLivre = async (livraison) => {
    // Rediriger vers la page de saisie pour enregistrer la réception
    navigate('/saisie-entrees', { state: { livraison } });
  };

  const handleAnnuler = async (livraison) => {
    const motif = prompt('Motif d\'annulation :');
    if (!motif) return;

    try {
      await api.post(`/livraisons/${livraison.id}/annuler`, { motif });
      toast.success('Livraison annulée');
      loadLivraisons();
    } catch (error) {
      toast.error('Erreur lors de l\'annulation');
    }
  };

  const getStatutBadge = (statut) => {
    const badges = {
      planifie: { icon: Clock, color: 'bg-gray-100 text-gray-800', label: 'Planifiée' },
      en_cours: { icon: Truck, color: 'bg-blue-100 text-blue-800', label: 'En cours' },
      livre: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Livrée' },
      annule: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Annulée' },
      retard: { icon: AlertCircle, color: 'bg-orange-100 text-orange-800', label: 'En retard' }
    };

    const badge = badges[statut] || badges.planifie;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  const getActions = (livraison) => {
    switch (livraison.statut) {
      case 'planifie':
        return (
          <>
            <button
              onClick={() => handleMarquerEnCours(livraison)}
              className="text-blue-600 hover:text-blue-800 text-sm"
              title="Marquer en cours"
            >
              En cours
            </button>
            <button
              onClick={() => handleAnnuler(livraison)}
              className="text-red-600 hover:text-red-800 text-sm"
              title="Annuler"
            >
              Annuler
            </button>
          </>
        );
      case 'en_cours':
        return (
          <button
            onClick={() => handleMarquerLivre(livraison)}
            className="text-green-600 hover:text-green-800 text-sm"
            title="Enregistrer réception"
          >
            Réceptionner
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Truck className="w-6 h-6 text-blue-600" />
                Gestion des Livraisons
              </h1>
              <p className="text-gray-600 mt-1">
                Suivez toutes les livraisons planifiées et leur statut en temps réel
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/gestion-tonnage')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nouvelle livraison
              </button>
              
              <button
                onClick={loadLivraisons}
                disabled={loading}
                className="p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                title="Actualiser"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              
              <StockExportButton 
                data={livraisons}
                filename="livraisons"
                size="sm"
              />
            </div>
          </div>

          {/* Filtres */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={filtres.statut}
                onChange={(e) => setFiltres(prev => ({ ...prev, statut: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="tous">Tous les statuts</option>
                <option value="planifie">Planifiée</option>
                <option value="en_cours">En cours</option>
                <option value="livre">Livrée</option>
                <option value="annule">Annulée</option>
                <option value="retard">En retard</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date début
              </label>
              <input
                type="date"
                value={filtres.dateDebut}
                onChange={(e) => setFiltres(prev => ({ ...prev, dateDebut: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date fin
              </label>
              <input
                type="date"
                value={filtres.dateFin}
                onChange={(e) => setFiltres(prev => ({ ...prev, dateFin: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recherche
              </label>
              <input
                type="text"
                value={filtres.search}
                onChange={(e) => setFiltres(prev => ({ ...prev, search: e.target.value }))}
                placeholder="N° bon, camion, chauffeur..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg shadow-md p-4 border border-gray-200">
            <p className="text-sm text-gray-700">Planifiées</p>
            <p className="text-2xl font-bold text-gray-600">{stats.planifie}</p>
          </div>
          
          <div className="bg-blue-50 rounded-lg shadow-md p-4 border border-blue-200">
            <p className="text-sm text-blue-700">En cours</p>
            <p className="text-2xl font-bold text-blue-600">{stats.en_cours}</p>
          </div>
          
          <div className="bg-green-50 rounded-lg shadow-md p-4 border border-green-200">
            <p className="text-sm text-green-700">Livrées</p>
            <p className="text-2xl font-bold text-green-600">{stats.livre}</p>
          </div>
          
          <div className="bg-red-50 rounded-lg shadow-md p-4 border border-red-200">
            <p className="text-sm text-red-700">Annulées</p>
            <p className="text-2xl font-bold text-red-600">{stats.annule}</p>
          </div>
          
          <div className="bg-orange-50 rounded-lg shadow-md p-4 border border-orange-200">
            <p className="text-sm text-orange-700">En retard</p>
            <p className="text-2xl font-bold text-orange-600">{stats.retard}</p>
          </div>
        </div>

        {/* Tableau des livraisons */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Liste des livraisons
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    N° Bon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Produit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Destination
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Quantité (T)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Transport
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : livraisons.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                      Aucune livraison trouvée
                    </td>
                  </tr>
                ) : (
                  livraisons.map((livraison) => (
                    <tr key={livraison.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {livraison.numero_bon_livraison}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                          {formatDate(livraison.date_livraison)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 text-gray-400 mr-2" />
                          {livraison.produit?.nom || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {livraison.destination_nom || 
                         livraison.magasin?.nom || 
                         livraison.client?.nom || 
                         livraison.particulier_nom || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium">
                        {formatNumber(livraison.quantite)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="flex items-center">
                            <Truck className="w-4 h-4 text-gray-400 mr-1" />
                            {livraison.numero_camion}
                          </div>
                          <div className="text-xs text-gray-500">
                            {livraison.nom_chauffeur}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getStatutBadge(livraison.statut)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedLivraison(livraison);
                              setShowDetails(true);
                            }}
                            className="text-gray-600 hover:text-gray-800"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {getActions(livraison)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de détails */}
        {showDetails && selectedLivraison && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Détails de la livraison {selectedLivraison.numero_bon_livraison}
                </h3>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedLivraison(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Informations générales */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Informations générales</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Date de livraison:</p>
                      <p className="font-medium">{formatDate(selectedLivraison.date_livraison)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Heure de départ:</p>
                      <p className="font-medium">{selectedLivraison.heure_depart || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Produit:</p>
                      <p className="font-medium">{selectedLivraison.produit?.nom}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Quantité:</p>
                      <p className="font-medium">{formatNumber(selectedLivraison.quantite)} T</p>
                    </div>
                  </div>
                </div>

                {/* Transport */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Informations de transport</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Transporteur:</p>
                      <p className="font-medium">{selectedLivraison.transporteur}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Camion:</p>
                      <p className="font-medium">{selectedLivraison.numero_camion}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Chauffeur:</p>
                      <p className="font-medium">{selectedLivraison.nom_chauffeur}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Permis:</p>
                      <p className="font-medium">{selectedLivraison.permis_chauffeur}</p>
                    </div>
                  </div>
                </div>

                {/* Destination */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Destination</h4>
                  <div className="text-sm">
                    <p className="text-gray-600">Type: {selectedLivraison.type_livraison}</p>
                    <p className="font-medium">
                      {selectedLivraison.destination_nom || 
                       selectedLivraison.magasin?.nom || 
                       selectedLivraison.client?.nom || 
                       selectedLivraison.particulier_nom}
                    </p>
                    {selectedLivraison.destination_finale && (
                      <p className="text-gray-600 mt-1">
                        Destination finale: {selectedLivraison.destination_finale}
                      </p>
                    )}
                  </div>
                </div>

                {/* Statut */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Statut</h4>
                  <div className="flex items-center gap-2">
                    {getStatutBadge(selectedLivraison.statut)}
                    {selectedLivraison.quantite_recue !== null && (
                      <span className="text-sm text-gray-600">
                        - Quantité reçue: {formatNumber(selectedLivraison.quantite_recue)} T
                        {selectedLivraison.ecart !== 0 && (
                          <span className={selectedLivraison.ecart > 0 ? 'text-orange-600' : 'text-blue-600'}>
                            {' '}(Écart: {selectedLivraison.ecart > 0 ? '+' : ''}{formatNumber(selectedLivraison.ecart)} T)
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Observations */}
                {selectedLivraison.observations && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Observations</h4>
                    <p className="text-sm text-gray-600">{selectedLivraison.observations}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedLivraison(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Livraisons;