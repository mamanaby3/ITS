import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, Package, User, Calendar, CheckCircle, Clock, FileText, Printer } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Alert, AlertDescription } from '../ui/Alert';

const DispatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dispatch, setDispatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDispatch();
  }, [id]);

  const loadDispatch = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/dispatching/${id}`);
      setDispatch(response.data);
    } catch (err) {
      setError('Erreur lors du chargement du dispatch');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const printDispatch = () => {
    window.print();
  };

  const getStatutBadge = (statut) => {
    switch (statut) {
      case 'complete':
        return { class: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Complété' };
      case 'en_cours':
        return { class: 'bg-blue-100 text-blue-800', icon: Clock, text: 'En cours' };
      case 'planifie':
        return { class: 'bg-gray-100 text-gray-800', icon: Calendar, text: 'Planifié' };
      default:
        return { class: 'bg-red-100 text-red-800', icon: Clock, text: 'Annulé' };
    }
  };

  const calculateStats = () => {
    if (!dispatch || !dispatch.livraisons) return { client: 0, stock: 0, total: 0 };
    
    const stats = dispatch.livraisons
      .filter(l => l.statut !== 'annulee')
      .reduce((acc, l) => {
        const quantite = parseFloat(l.quantite_livree);
        if (l.type_livraison === 'client') {
          acc.client += quantite;
        } else {
          acc.stock += quantite;
        }
        acc.total += quantite;
        return acc;
      }, { client: 0, stock: 0, total: 0 });
    
    return stats;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dispatch) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Dispatch non trouvé</AlertDescription>
      </Alert>
    );
  }

  const statutInfo = getStatutBadge(dispatch.statut);
  const StatutIcon = statutInfo.icon;
  const stats = calculateStats();
  const progressClient = dispatch.quantite_client > 0 ? (stats.client / dispatch.quantite_client) * 100 : 0;
  const progressStock = dispatch.quantite_stock > 0 ? (stats.stock / dispatch.quantite_stock) * 100 : 0;
  const progressTotal = (stats.total / dispatch.quantite_totale) * 100;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-md p-6 print:shadow-none">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dispatching')}
              className="p-2 hover:bg-gray-100 rounded-full print:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">
              Dispatch {dispatch.numero_dispatch}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${statutInfo.class}`}>
              <StatutIcon className="w-4 h-4" />
              {statutInfo.text}
            </span>
            <button
              onClick={printDispatch}
              className="p-2 hover:bg-gray-100 rounded-full print:hidden"
              title="Imprimer"
            >
              <Printer className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Informations principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Date de création</h3>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(dispatch.created_at).toLocaleString()}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Manager</h3>
            <p className="mt-1 text-sm text-gray-900">
              {dispatch.manager?.nom} {dispatch.manager?.prenom}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Magasin Source</h3>
            <p className="mt-1 text-sm text-gray-900">
              {dispatch.magasin_source?.nom}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Magasin Destination</h3>
            <p className="mt-1 text-sm text-gray-900">
              {dispatch.magasin_destination?.nom}
            </p>
          </div>
        </div>
      </div>

      {/* Client et Produit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 print:shadow-none">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Client
          </h2>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-500">Nom:</span>
              <p className="font-medium">{dispatch.client?.nom}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Code:</span>
              <p className="font-medium">{dispatch.client?.code}</p>
            </div>
            {dispatch.client?.telephone && (
              <div>
                <span className="text-sm text-gray-500">Téléphone:</span>
                <p className="font-medium">{dispatch.client?.telephone}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 print:shadow-none">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Produit
          </h2>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-500">Nom:</span>
              <p className="font-medium">{dispatch.produit?.nom}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Code:</span>
              <p className="font-medium">{dispatch.produit?.code}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Catégorie:</span>
              <p className="font-medium">{dispatch.produit?.categorie}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques de livraison */}
      <div className="bg-white rounded-lg shadow-md p-6 print:shadow-none">
        <h2 className="text-lg font-semibold mb-4">État des livraisons</h2>
        
        {/* Progression totale */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progression totale</span>
            <span className="text-sm font-medium text-gray-900">
              {stats.total} / {dispatch.quantite_totale} tonnes ({progressTotal.toFixed(0)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressTotal}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Direct */}
          {dispatch.quantite_client > 0 && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Livraison Client Direct
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Prévu:</span>
                  <span className="font-semibold">{dispatch.quantite_client} T</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Livré:</span>
                  <span className="font-semibold">{stats.client} T</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Restant:</span>
                  <span className="font-semibold text-blue-600">
                    {(dispatch.quantite_client - stats.client).toFixed(2)} T
                  </span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressClient}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stock Magasin */}
          {dispatch.quantite_stock > 0 && (
            <div className="border rounded-lg p-4 bg-green-50">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Mise en Stock Magasin
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Prévu:</span>
                  <span className="font-semibold">{dispatch.quantite_stock} T</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Livré:</span>
                  <span className="font-semibold">{stats.stock} T</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Restant:</span>
                  <span className="font-semibold text-green-600">
                    {(dispatch.quantite_stock - stats.stock).toFixed(2)} T
                  </span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressStock}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {dispatch.notes && (
        <div className="bg-white rounded-lg shadow-md p-6 print:shadow-none">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Notes
          </h2>
          <p className="text-gray-700 whitespace-pre-wrap">{dispatch.notes}</p>
        </div>
      )}

      {/* Historique des livraisons */}
      {dispatch.livraisons && dispatch.livraisons.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 print:shadow-none">
          <h2 className="text-lg font-semibold mb-4">Historique des livraisons</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N° Bon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transport
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chauffeur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Magasinier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dispatch.livraisons.map((livraison) => (
                  <tr key={livraison.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(livraison.date_livraison).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {livraison.numero_bon}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        livraison.type_livraison === 'client' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {livraison.type_livraison === 'client' ? 'Client Direct' : 'Stock Magasin'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {livraison.quantite_livree} T
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {livraison.transporteur}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {livraison.chauffeur_nom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {livraison.magasinier?.nom} {livraison.magasinier?.prenom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        livraison.statut === 'validee' 
                          ? 'bg-green-100 text-green-800' 
                          : livraison.statut === 'annulee'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {livraison.statut === 'validee' ? 'Validée' :
                         livraison.statut === 'annulee' ? 'Annulée' : 'Enregistrée'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-3 print:hidden">
        {user.role === 'operator' && 
         user.magasin_id === dispatch.magasin_destination_id &&
         dispatch.statut !== 'complete' && dispatch.statut !== 'annule' && (
          <button
            onClick={() => navigate(`/dispatching/${dispatch.id}/delivery`)}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Enregistrer une livraison
          </button>
        )}
      </div>
    </div>
  );
};

export default DispatchDetail;