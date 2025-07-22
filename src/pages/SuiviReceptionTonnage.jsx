import React, { useState, useEffect } from 'react';
import { 
  Package, Building, Clock, RefreshCw, 
  TrendingUp, Truck, Calendar
} from 'lucide-react';
import { formatDate, formatNumber } from '../utils/format';
import { StockExportButton } from '../components/ui/ExcelExportButton';
import api from '../services/api';
import toast from 'react-hot-toast';

const SuiviReceptionTonnage = () => {
  const [receptions, setReceptions] = useState([]);
  const [navires, setNavires] = useState([]);
  const [dispatching, setDispatching] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Charger les données
  useEffect(() => {
    loadReceptions();
    
    // Auto-refresh toutes les 30 secondes si activé
    if (autoRefresh) {
      const interval = setInterval(loadReceptions, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedDate, autoRefresh]);

  const loadReceptions = async () => {
    setLoading(true);
    try {
      // Utiliser la nouvelle API qui récupère les navires avec leur dispatching
      const response = await api.get('/navires/suivi-tonnage', { 
        params: { date: selectedDate }
      });
      
      // La réponse contient { success: true, data: [...], date: '...' }
      const naviresData = response?.data || [];
      
      // S'assurer que les données sont dans le bon format
      if (!Array.isArray(naviresData)) {
        console.error('Format de réponse inattendu:', response);
        setReceptions([]);
        setNavires([]);
        return;
      }
      
      // Transformer les données pour l'affichage
      const naviresFormatted = naviresData.map(navire => {
        // Formater les réceptions
        const receptionsFormatees = (navire.receptions || []).map(r => ({
          id: r.id,
          heure: new Date(r.date_mouvement).toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          magasin: r.magasin_nom,
          produit: r.produit_nom,
          tonnage: parseFloat(r.quantite || 0),
          responsable_magasin: r.responsable_nom ? `${r.responsable_nom} ${r.responsable_prenom}` : 'Responsable'
        }));
        
        return {
          id: navire.id,
          nom: navire.nom_navire,
          numero_imo: navire.numero_imo,
          date_arrivee: navire.date_arrivee,
          created_at: navire.created_at,
          date_reception: navire.date_reception,
          tonnage_total: navire.tonnage_total || 0,
          receptions: receptionsFormatees
        };
      });
      
      // Créer l'objet dispatching à partir des données
      const dispatchingData = {};
      naviresData.forEach(navire => {
        dispatchingData[navire.id] = (navire.dispatching || []).map(d => ({
          id: d.id,
          camion: d.numero_camion,
          transporteur: d.transporteur,
          destination: d.client_nom || d.destination,
          tonnage: parseFloat(d.tonnage || 0),
          statut: d.statut,
          heure_depart: d.heure_depart ? 
            new Date(`1970-01-01T${d.heure_depart}`).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit'
            }) : 'N/A'
        }));
      });
      
      setNavires(naviresFormatted);
      setDispatching(dispatchingData);
      
      // Garder la liste plate des réceptions pour compatibilité
      const allReceptions = naviresFormatted.flatMap(n => n.receptions);
      setReceptions(allReceptions);
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Calculer le résumé par magasin
  const getResumeMagasins = () => {
    const resume = {};
    
    receptions.forEach(reception => {
      if (!resume[reception.magasin]) {
        resume[reception.magasin] = {
          nom: reception.magasin,
          responsable: reception.responsable_magasin,
          total_tonnage: 0,
          nombre_receptions: 0,
          produits: new Set()
        };
      }
      
      resume[reception.magasin].total_tonnage += reception.tonnage;
      resume[reception.magasin].nombre_receptions += 1;
      resume[reception.magasin].produits.add(reception.produit);
    });
    
    // Convertir Set en Array pour l'affichage
    Object.values(resume).forEach(magasin => {
      magasin.produits = Array.from(magasin.produits);
    });
    
    return Object.values(resume);
  };

  const resumeMagasins = getResumeMagasins();
  // Calculer le total à partir des navires pour être plus précis
  const totalJour = navires.reduce((sum, navire) => sum + navire.tonnage_total, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-6 h-6 text-blue-600" />
                Suivi des Réceptions de Tonnage
              </h1>
              <p className="text-gray-600 mt-1">
                Suivi en temps réel des produits arrivés dans chaque magasin
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Auto-refresh
              </label>
              
              <button
                onClick={loadReceptions}
                disabled={loading}
                className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                title="Actualiser"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              
              <StockExportButton 
                data={receptions}
                filename="receptions_tonnage"
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* Total du jour */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-md p-6 mb-6 text-white">
          <div className="text-center">
            <p className="text-green-100 text-lg">Total Réceptionné - {formatDate(selectedDate)}</p>
            <p className="text-5xl font-bold mt-2">{formatNumber(totalJour)} Tonnes</p>
            <p className="text-green-100 mt-2">{receptions.length} réceptions dans {resumeMagasins.length} magasins</p>
          </div>
        </div>

        {/* Résumé par magasin */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {resumeMagasins.map((magasin, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-start justify-between mb-3">
                <Building className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">
                  {formatNumber(magasin.total_tonnage)} T
                </span>
              </div>
              <h3 className="font-semibold text-gray-900">{magasin.nom}</h3>
              <p className="text-sm text-gray-600 mt-1">Responsable: {magasin.responsable}</p>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">{magasin.nombre_receptions} réception(s)</p>
                <p className="text-xs text-gray-500 mt-1">
                  Produits: {magasin.produits.join(', ')}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Détail des réceptions par navire */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Détail des Réceptions par Navire
            </h2>
            <div className="text-sm text-gray-500">
              Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            </div>
          ) : navires.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              Aucune réception enregistrée pour cette date
            </div>
          ) : (
            navires.map((navire) => (
              <div key={navire.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* En-tête du navire */}
                <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                        🚢 {navire.nom}
                        <span className="text-sm text-blue-600">({navire.numero_imo})</span>
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        {navire.date_reception 
                          ? `Réceptionné le ${new Date(navire.date_reception).toLocaleDateString('fr-FR')} à ${new Date(navire.date_reception).toLocaleTimeString('fr-FR')}`
                          : `Arrivé le ${formatDate(navire.date_arrivee)}`
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-600">Total réceptionné</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatNumber(navire.tonnage_total)} T
                      </p>
                    </div>
                  </div>
                </div>

                {/* Réceptions du navire */}
                <div className="px-6 py-4">
                  <h4 className="font-medium text-gray-700 mb-3">Réceptions :</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Heure</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Magasin</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Tonnage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {navire.receptions.map((reception) => (
                          <tr key={reception.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{reception.heure}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{reception.magasin}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{reception.produit}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-center text-green-600">
                              {formatNumber(reception.tonnage)} T
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Dispatching / Livraisons en cours */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Dispatching - Livraisons en cours :
                  </h4>
                  {dispatching[navire.id] && dispatching[navire.id].length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {dispatching[navire.id].map((livraison) => (
                        <div key={livraison.id} className="bg-white rounded-md p-3 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-gray-500" />
                                <span className="font-medium text-gray-900">{livraison.camion}</span>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  livraison.statut === 'en_route' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {livraison.statut === 'en_route' ? 'En route' : 'Chargement'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {livraison.transporteur} → {livraison.destination}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Départ: {livraison.heure_depart}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-blue-600">{livraison.tonnage} T</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Aucune livraison en cours</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SuiviReceptionTonnage;