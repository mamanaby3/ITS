import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Calendar, AlertTriangle, CheckCircle, 
  XCircle, Package, Truck, RefreshCw, Filter,
  Download, Eye
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatDate, formatNumber } from '../utils/format';
import { StockExportButton } from '../components/ui/ExcelExportButton';

const ComparaisonLivraisons = () => {
  const [loading, setLoading] = useState(false);
  const [livraisons, setLivraisons] = useState([]);
  const [mouvements, setMouvements] = useState([]);
  const [comparaisons, setComparaisons] = useState([]);
  const [filtres, setFiltres] = useState({
    dateDebut: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateFin: new Date().toISOString().split('T')[0],
    statut: 'tous',
    magasin: 'tous'
  });
  const [magasins, setMagasins] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedComparaison, setSelectedComparaison] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (magasins.length > 0) {
      loadComparaisons();
    }
  }, [filtres, magasins]);

  const loadInitialData = async () => {
    try {
      const magasinsRes = await api.get('/magasins').catch(() => ({ data: [] }));
      setMagasins(magasinsRes.data || []);
    } catch (error) {
      console.error('Erreur chargement magasins:', error);
    }
  };

  const loadComparaisons = async () => {
    setLoading(true);
    try {
      // Charger les livraisons (ce que le manager a enregistré)
      const livraisonsParams = {
        date_debut: filtres.dateDebut,
        date_fin: filtres.dateFin,
        include: 'produit,magasin,client'
      };
      
      // Charger les mouvements d'entrée (ce que le magasinier a saisi)
      const mouvementsParams = {
        date_debut: filtres.dateDebut,
        date_fin: filtres.dateFin,
        type: 'entree',
        include: 'produit,magasin,client'
      };

      const [livraisonsRes, mouvementsRes] = await Promise.all([
        api.get('/livraisons', { params: livraisonsParams }).catch(() => ({ data: [] })),
        api.get('/mouvements', { params: mouvementsParams }).catch(() => ({ data: [] }))
      ]);

      const livraisonsData = livraisonsRes.data || [];
      const mouvementsData = mouvementsRes.data || [];

      setLivraisons(livraisonsData);
      setMouvements(mouvementsData);

      // Créer les comparaisons
      const comparaisonsData = livraisonsData.map(livraison => {
        // Chercher le mouvement correspondant (même produit, même magasin, même jour)
        const mouvementCorrespondant = mouvementsData.find(m => {
          const sameProduit = m.produit_id === livraison.produit_id;
          const sameMagasin = m.magasin_id === livraison.magasin_id;
          const sameDate = new Date(m.date_entree).toDateString() === new Date(livraison.date_livraison).toDateString();
          return sameProduit && sameMagasin && sameDate;
        });

        const quantiteLivree = parseFloat(livraison.quantite || 0);
        const quantiteRecue = mouvementCorrespondant ? parseFloat(mouvementCorrespondant.tonnage || 0) : 0;
        const ecart = quantiteLivree - quantiteRecue;
        const ecartPourcentage = quantiteLivree > 0 ? (ecart / quantiteLivree) * 100 : 0;

        let statut = 'non_recu';
        if (mouvementCorrespondant) {
          if (Math.abs(ecart) < 0.01) {
            statut = 'conforme';
          } else if (ecart > 0) {
            statut = 'manquant';
          } else {
            statut = 'excedent';
          }
        }

        return {
          id: livraison.id,
          livraison: livraison,
          mouvement: mouvementCorrespondant,
          quantiteLivree,
          quantiteRecue,
          ecart,
          ecartPourcentage,
          statut,
          date: livraison.date_livraison,
          produit: livraison.produit,
          magasin: livraison.magasin,
          camion: livraison.numero_camion,
          chauffeur: livraison.chauffeur
        };
      });

      // Ajouter les mouvements sans livraison correspondante
      mouvementsData.forEach(mouvement => {
        const hasLivraison = comparaisonsData.some(c => 
          c.mouvement && c.mouvement.id === mouvement.id
        );

        if (!hasLivraison) {
          comparaisonsData.push({
            id: `mouv-${mouvement.id}`,
            livraison: null,
            mouvement: mouvement,
            quantiteLivree: 0,
            quantiteRecue: parseFloat(mouvement.tonnage || 0),
            ecart: -parseFloat(mouvement.tonnage || 0),
            ecartPourcentage: -100,
            statut: 'non_prevu',
            date: mouvement.date_entree,
            produit: mouvement.produit,
            magasin: mouvement.magasin
          });
        }
      });

      // Appliquer les filtres
      let filteredComparaisons = comparaisonsData;

      if (filtres.statut !== 'tous') {
        filteredComparaisons = filteredComparaisons.filter(c => c.statut === filtres.statut);
      }

      if (filtres.magasin !== 'tous') {
        filteredComparaisons = filteredComparaisons.filter(c => 
          c.magasin?.id === parseInt(filtres.magasin)
        );
      }

      // Trier par date décroissante
      filteredComparaisons.sort((a, b) => new Date(b.date) - new Date(a.date));

      setComparaisons(filteredComparaisons);
    } catch (error) {
      console.error('Erreur chargement comparaisons:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut) => {
    switch (statut) {
      case 'conforme':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Conforme
          </span>
        );
      case 'manquant':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Manquant
          </span>
        );
      case 'excedent':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Excédent
          </span>
        );
      case 'non_recu':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Non reçu
          </span>
        );
      case 'non_prevu':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Non prévu
          </span>
        );
      default:
        return null;
    }
  };

  const getStatistiques = () => {
    const stats = {
      total: comparaisons.length,
      conformes: comparaisons.filter(c => c.statut === 'conforme').length,
      manquants: comparaisons.filter(c => c.statut === 'manquant').length,
      excedents: comparaisons.filter(c => c.statut === 'excedent').length,
      nonRecus: comparaisons.filter(c => c.statut === 'non_recu').length,
      nonPrevus: comparaisons.filter(c => c.statut === 'non_prevu').length,
      totalEcart: comparaisons.reduce((sum, c) => sum + Math.abs(c.ecart), 0)
    };

    stats.tauxConformite = stats.total > 0 ? (stats.conformes / stats.total) * 100 : 0;
    
    return stats;
  };

  const stats = getStatistiques();

  const handleViewDetails = (comparaison) => {
    setSelectedComparaison(comparaison);
    setShowDetails(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                Comparaison Livraisons
              </h1>
              <p className="text-gray-600 mt-1">
                Comparez les livraisons enregistrées par le manager avec les réceptions saisies par les magasiniers
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={loadComparaisons}
                disabled={loading}
                className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                title="Actualiser"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              
              <StockExportButton 
                data={comparaisons}
                filename="comparaison_livraisons"
                size="sm"
              />
            </div>
          </div>

          {/* Filtres */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
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
                Statut
              </label>
              <select
                value={filtres.statut}
                onChange={(e) => setFiltres(prev => ({ ...prev, statut: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="tous">Tous les statuts</option>
                <option value="conforme">Conforme</option>
                <option value="manquant">Manquant</option>
                <option value="excedent">Excédent</option>
                <option value="non_recu">Non reçu</option>
                <option value="non_prevu">Non prévu</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Magasin
              </label>
              <select
                value={filtres.magasin}
                onChange={(e) => setFiltres(prev => ({ ...prev, magasin: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="tous">Tous les magasins</option>
                {magasins.map(magasin => (
                  <option key={magasin.id} value={magasin.id}>
                    {magasin.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          
          <div className="bg-green-50 rounded-lg shadow-md p-4 border border-green-200">
            <p className="text-sm text-green-700">Conformes</p>
            <p className="text-2xl font-bold text-green-600">{stats.conformes}</p>
          </div>
          
          <div className="bg-orange-50 rounded-lg shadow-md p-4 border border-orange-200">
            <p className="text-sm text-orange-700">Manquants</p>
            <p className="text-2xl font-bold text-orange-600">{stats.manquants}</p>
          </div>
          
          <div className="bg-blue-50 rounded-lg shadow-md p-4 border border-blue-200">
            <p className="text-sm text-blue-700">Excédents</p>
            <p className="text-2xl font-bold text-blue-600">{stats.excedents}</p>
          </div>
          
          <div className="bg-red-50 rounded-lg shadow-md p-4 border border-red-200">
            <p className="text-sm text-red-700">Non reçus</p>
            <p className="text-2xl font-bold text-red-600">{stats.nonRecus}</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg shadow-md p-4 border border-purple-200">
            <p className="text-sm text-purple-700">Non prévus</p>
            <p className="text-2xl font-bold text-purple-600">{stats.nonPrevus}</p>
          </div>
        </div>

        {/* Taux de conformité */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3">Taux de conformité</h3>
          <div className="relative pt-1">
            <div className="overflow-hidden h-6 text-xs flex rounded bg-gray-200">
              <div 
                style={{ width: `${stats.tauxConformite}%` }}
                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                  stats.tauxConformite >= 90 ? 'bg-green-500' :
                  stats.tauxConformite >= 70 ? 'bg-orange-500' :
                  'bg-red-500'
                }`}
              >
                {stats.tauxConformite.toFixed(1)}%
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Écart total: {formatNumber(stats.totalEcart)} T
          </p>
        </div>

        {/* Tableau des comparaisons */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Détail des comparaisons
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Produit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Magasin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Camion / Chauffeur
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Qtité livrée (T)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Qtité reçue (T)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Écart (T)
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
                    <td colSpan="9" className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : comparaisons.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                      Aucune comparaison trouvée pour les filtres sélectionnés
                    </td>
                  </tr>
                ) : (
                  comparaisons.map((comparaison) => (
                    <tr key={comparaison.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(comparaison.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 text-gray-400 mr-2" />
                          {comparaison.produit?.nom || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {comparaison.magasin?.nom || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {comparaison.camion && comparaison.chauffeur ? (
                          <div>
                            <div className="flex items-center">
                              <Truck className="w-4 h-4 text-gray-400 mr-1" />
                              {comparaison.camion}
                            </div>
                            <div className="text-xs text-gray-500">
                              {comparaison.chauffeur}
                            </div>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        {formatNumber(comparaison.quantiteLivree)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        {formatNumber(comparaison.quantiteRecue)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${
                        comparaison.ecart > 0 ? 'text-orange-600' :
                        comparaison.ecart < 0 ? 'text-blue-600' :
                        'text-green-600'
                      }`}>
                        {comparaison.ecart > 0 ? '+' : ''}{formatNumber(comparaison.ecart)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getStatutBadge(comparaison.statut)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleViewDetails(comparaison)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de détails */}
        {showDetails && selectedComparaison && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Détails de la comparaison
                </h3>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedComparaison(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Colonne Livraison (Manager) */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-3">
                    Livraison enregistrée (Manager)
                  </h4>
                  {selectedComparaison.livraison ? (
                    <div className="space-y-2 text-sm">
                      <p><strong>Date:</strong> {formatDate(selectedComparaison.livraison.date_livraison)}</p>
                      <p><strong>Produit:</strong> {selectedComparaison.livraison.produit?.nom}</p>
                      <p><strong>Quantité:</strong> {formatNumber(selectedComparaison.livraison.quantite)} T</p>
                      <p><strong>Magasin:</strong> {selectedComparaison.livraison.magasin?.nom}</p>
                      <p><strong>Transporteur:</strong> {selectedComparaison.livraison.transporteur}</p>
                      <p><strong>Camion:</strong> {selectedComparaison.livraison.numero_camion}</p>
                      <p><strong>Chauffeur:</strong> {selectedComparaison.livraison.chauffeur}</p>
                      <p><strong>Bon de livraison:</strong> {selectedComparaison.livraison.numero_bon_livraison}</p>
                      {selectedComparaison.livraison.observations && (
                        <p><strong>Observations:</strong> {selectedComparaison.livraison.observations}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Aucune livraison prévue</p>
                  )}
                </div>

                {/* Colonne Réception (Magasinier) */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-3">
                    Réception saisie (Magasinier)
                  </h4>
                  {selectedComparaison.mouvement ? (
                    <div className="space-y-2 text-sm">
                      <p><strong>Date:</strong> {formatDate(selectedComparaison.mouvement.date_entree)}</p>
                      <p><strong>Produit:</strong> {selectedComparaison.mouvement.produit?.nom}</p>
                      <p><strong>Quantité:</strong> {formatNumber(selectedComparaison.mouvement.tonnage)} T</p>
                      <p><strong>Magasin:</strong> {selectedComparaison.mouvement.magasin?.nom}</p>
                      <p><strong>Référence bon:</strong> {selectedComparaison.mouvement.reference_bon}</p>
                      <p><strong>Saisi par:</strong> {selectedComparaison.mouvement.created_by || 'Magasinier'}</p>
                      {selectedComparaison.mouvement.observations && (
                        <p><strong>Observations:</strong> {selectedComparaison.mouvement.observations}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Aucune réception saisie</p>
                  )}
                </div>
              </div>

              {/* Résumé de l'écart */}
              <div className="mt-6 bg-gray-100 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Analyse de l'écart</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Quantité livrée:</p>
                    <p className="font-bold">{formatNumber(selectedComparaison.quantiteLivree)} T</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Quantité reçue:</p>
                    <p className="font-bold">{formatNumber(selectedComparaison.quantiteRecue)} T</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Écart:</p>
                    <p className={`font-bold ${
                      selectedComparaison.ecart > 0 ? 'text-orange-600' :
                      selectedComparaison.ecart < 0 ? 'text-blue-600' :
                      'text-green-600'
                    }`}>
                      {selectedComparaison.ecart > 0 ? '+' : ''}{formatNumber(selectedComparaison.ecart)} T
                      ({selectedComparaison.ecartPourcentage.toFixed(1)}%)
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  {getStatutBadge(selectedComparaison.statut)}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedComparaison(null);
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

export default ComparaisonLivraisons;