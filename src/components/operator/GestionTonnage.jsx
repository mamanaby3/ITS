import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, Clock, Building2, Truck, BarChart3, Calendar, Plus } from 'lucide-react';
import api from '../../services/api';
import { formatNumber } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import dashboardService from '../../services/dashboard';

export default function GestionTonnage() {
  const { user } = useAuth();
  const [tonnageData, setTonnageData] = useState({
    journalier: [],
    mensuel: [],
    par_produit: [],
    totaux: {
      total_receptionne: 0,
      total_dispatche: 0,
      total_en_attente: 0,
      moyenne_journaliere: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [periodeAffichage, setPeriodeAffichage] = useState('7j'); // 7j, 30j, 6m
  const [showAddTonnage, setShowAddTonnage] = useState(false);

  useEffect(() => {
    fetchTonnageData();
  }, [periodeAffichage]);

  const fetchTonnageData = async () => {
    try {
      setLoading(true);
      setError('');

      // Construire l'URL selon le rôle de l'utilisateur
      let url = '/rotations';
      if (user.role === 'operator' && user.magasin_id) {
        url += `?magasin_id=${user.magasin_id}`;
      } else if (user.role === 'operator' && !user.magasin_id) {
        setError('Aucun magasin assigné à cet utilisateur');
        setLoading(false);
        return;
      }
      // Les managers et admins voient toutes les rotations

      // Récupérer les rotations pour calculer le tonnage
      const response = await api.get(url);
      
      // La réponse peut être soit un tableau direct, soit un objet {success: true, data: [...]}
      let rotations = [];
      if (Array.isArray(response.data)) {
        rotations = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        rotations = response.data.data;
      }

      // Récupérer aussi le total dispatché depuis navire_dispatching
      let totalDispatche = 0;
      try {
        const stockUrl = user.role === 'operator' && user.magasin_id 
          ? `/navire-dispatching/stock-magasin?magasin_id=${user.magasin_id}`
          : '/navire-dispatching/stock-magasin';
        const stockResponse = await api.get(stockUrl);
        if (stockResponse.data?.data?.totaux?.total_dispatche) {
          totalDispatche = stockResponse.data.data.totaux.total_dispatche;
        }
      } catch (err) {
        console.error('Erreur récupération total dispatché:', err);
      }

      // Récupérer le total réceptionné depuis la table navires
      let totalReceptionne = 0;
      try {
        const dateDebut = calculerDateDebut(periodeAffichage);
        const totalReceptionneResponse = await dashboardService.getTotalReceptionne({
          date_debut: dateDebut.toISOString().split('T')[0],
          date_fin: new Date().toISOString().split('T')[0],
          ...(user.role === 'operator' && user.magasin_id && { magasin_id: user.magasin_id })
        });
        
        if (totalReceptionneResponse && totalReceptionneResponse.data) {
          totalReceptionne = totalReceptionneResponse.data.total_receptionne || 0;
        }
      } catch (err) {
        console.error('Erreur récupération total réceptionné:', err);
      }

      // Calculer les données journalières
      const donneesTonnage = calculerDonneesTonnage(rotations, periodeAffichage, totalDispatche);
      setTonnageData(donneesTonnage);

    } catch (error) {
      console.error('Erreur récupération tonnage:', error);
      setError('Erreur lors du chargement des données de tonnage');
    } finally {
      setLoading(false);
    }
  };

  const calculerDonneesTonnage = (rotations, periode, totalDispatcheNavire = 0) => {
    const maintenant = new Date();
    let dateDebut;

    switch (periode) {
      case '7j':
        dateDebut = new Date(maintenant.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30j':
        dateDebut = new Date(maintenant.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '6m':
        dateDebut = new Date(maintenant.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateDebut = new Date(maintenant.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Filtrer les rotations selon la période
    const rotationsFiltrees = rotations.filter(rotation => {
      const dateRotation = new Date(rotation.date_arrivee || rotation.created_at);
      return dateRotation >= dateDebut;
    });

    // Calculer les données journalières
    const donneesJournalieres = {};
    const donneesParProduit = {};
    let totalReceptionne = 0;
    let totalDispatche = 0;
    let totalEnAttente = 0;

    // Pas de log ici, juste continuer

    rotationsFiltrees.forEach(rotation => {
      const date = new Date(rotation.date_arrivee || rotation.created_at).toISOString().split('T')[0];
      // Utiliser la structure correcte des données de l'API
      const produit = rotation.produit_nom || rotation.dispatch?.produit?.nom || 'Produit inconnu';
      const quantite = parseFloat(rotation.quantite_livree || 0);
      const quantitePrevue = parseFloat(rotation.quantite_prevue || 0);

      // Données journalières
      if (!donneesJournalieres[date]) {
        donneesJournalieres[date] = {
          date,
          receptionne: 0,
          livre: 0,
          en_attente: 0
        };
      }

      if (rotation.statut === 'livre') {
        donneesJournalieres[date].receptionne += quantite;
        donneesJournalieres[date].livre += quantite;
        totalReceptionne += quantite;
      } else if (rotation.statut === 'planifie' || rotation.statut === 'en_transit') {
        donneesJournalieres[date].en_attente += quantitePrevue;
        totalEnAttente += quantitePrevue;
      }

      // Ne plus calculer totalDispatche ici, on utilise celui de navire_dispatching

      // Données par produit
      if (!donneesParProduit[produit]) {
        donneesParProduit[produit] = {
          produit,
          total_receptionne: 0,
          total_prevu: 0,
          nombre_rotations: 0
        };
      }

      donneesParProduit[produit].total_prevu += quantitePrevue;
      donneesParProduit[produit].nombre_rotations += 1;

      if (rotation.statut === 'livre') {
        donneesParProduit[produit].total_receptionne += quantite;
      }
    });

    // Convertir en tableaux
    const journalier = Object.values(donneesJournalieres).sort((a, b) => a.date.localeCompare(b.date));
    const par_produit = Object.values(donneesParProduit).sort((a, b) => b.total_receptionne - a.total_receptionne);

    // Calculer la moyenne journalière
    const nombreJours = Math.max(1, journalier.length);
    const moyenneJournaliere = totalReceptionne / nombreJours;

    return {
      journalier,
      mensuel: [], // À implémenter si nécessaire
      par_produit,
      totaux: {
        total_receptionne: totalReceptionne,
        total_dispatche: totalDispatcheNavire, // Utiliser le total depuis navire_dispatching
        total_en_attente: totalEnAttente,
        moyenne_journaliere: moyenneJournaliere
      }
    };
  };

  const renderGraphiqueTonnage = () => {
    if (tonnageData.journalier.length === 0) return null;

    const maxValue = Math.max(...tonnageData.journalier.map(d => d.receptionne));

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Évolution du Tonnage - {periodeAffichage}
        </h3>
        
        <div className="space-y-2">
          {tonnageData.journalier.map((jour, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="text-sm font-medium text-gray-600 w-20">
                {new Date(jour.date).toLocaleDateString('fr-FR', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                <div 
                  className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${maxValue > 0 ? (jour.receptionne / maxValue) * 100 : 0}%` 
                  }}
                />
                <span className="absolute right-2 top-0 text-xs font-medium text-white leading-4">
                  {formatNumber(jour.receptionne)}t
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
        {error}
      </div>
    );
  }

  // Wrapper avec gestion d'erreur
  try {
    return (
      <div className="space-y-6">
      {/* Header avec boutons de période */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Truck className="w-6 h-6 text-blue-600" />
          Gestion du Tonnage - {user?.magasin?.nom || user?.magasin_id}
        </h2>
        
        <div className="flex gap-2">
          {['7j', '30j', '6m'].map((periode) => (
            <button
              key={periode}
              onClick={() => setPeriodeAffichage(periode)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                periodeAffichage === periode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {periode}
            </button>
          ))}
        </div>
      </div>

      {/* Indicateurs de tonnage */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <Package className="w-8 h-8 text-green-500" />
            <span className="text-2xl font-bold text-green-600">
              {formatNumber(tonnageData.totaux.total_receptionne)}t
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">Total Réceptionné</h3>
          <p className="text-sm text-gray-600">Tonnage total livré</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            <span className="text-2xl font-bold text-blue-600">
              {formatNumber(tonnageData.totaux.total_dispatche)}t
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">Total Dispatché</h3>
          <p className="text-sm text-gray-600">Tonnage total prévu</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-orange-500" />
            <span className="text-2xl font-bold text-orange-600">
              {formatNumber(tonnageData.totaux.total_en_attente)}t
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">En Attente</h3>
          <p className="text-sm text-gray-600">À réceptionner</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 text-purple-500" />
            <span className="text-2xl font-bold text-purple-600">
              {formatNumber(tonnageData.totaux.moyenne_journaliere)}t
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">Moyenne/Jour</h3>
          <p className="text-sm text-gray-600">Tonnage moyen quotidien</p>
        </div>
      </div>

      {/* Graphique et tableau */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique d'évolution */}
        {renderGraphiqueTonnage()}

        {/* Tonnage par produit */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Tonnage par Produit
          </h3>
          
          <div className="space-y-3">
            {tonnageData.par_produit.slice(0, 8).map((produit, index) => {
              const pourcentage = tonnageData.totaux.total_receptionne > 0 
                ? (produit.total_receptionne / tonnageData.totaux.total_receptionne) * 100 
                : 0;
              
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {produit.produit}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatNumber(produit.total_receptionne)}t
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${pourcentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {produit.nombre_rotations} rotation(s)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {tonnageData.par_produit.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              Aucune donnée de tonnage disponible
            </p>
          )}
        </div>
      </div>

      {/* Historique des rotations récentes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Rotations Récentes
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tonnage Prévu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tonnage Livré
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tonnageData.journalier.slice(-10).reverse().map((jour, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(jour.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Divers produits
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(jour.receptionne + jour.en_attente)}t
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {formatNumber(jour.receptionne)}t
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      jour.receptionne > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {jour.receptionne > 0 ? 'Livré' : 'En attente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
  } catch (error) {
    console.error('Erreur dans GestionTonnage render:', error);
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <h3 className="text-red-800 font-semibold">Erreur dans GestionTonnage</h3>
        <p className="text-red-600 mt-2">{error.message}</p>
        <p className="text-sm text-red-500 mt-1">Vérifiez la console pour plus de détails</p>
      </div>
    );
  }
}