import React, { useState, useEffect } from 'react';
import { Truck, Filter, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import api from '../services/api';
import toast from 'react-hot-toast';

const OperationsSimple = () => {
  const [loading, setLoading] = useState(true);
  const [operations, setOperations] = useState([]);
  const [filteredOperations, setFilteredOperations] = useState([]);
  const [filter, setFilter] = useState('tous');
  const [stats, setStats] = useState({
    total: 0,
    encours: 0,
    terminees: 0,
    annulees: 0
  });

  useEffect(() => {
    loadOperations();
  }, []);

  useEffect(() => {
    filterOperations();
  }, [operations, filter]);

  const loadOperations = async () => {
    try {
      setLoading(true);
      const [livraisonsRes, produitsRes, clientsRes] = await Promise.all([
        api.get('/livraisons').catch(() => ({ data: [] })),
        api.get('/produits').catch(() => ({ data: [] })),
        api.get('/clients').catch(() => ({ data: [] }))
      ]);

      const livraisons = livraisonsRes.data || [];
      const produits = produitsRes.data || [];
      const clients = clientsRes.data || [];

      // Enrichir les opérations
      const enrichedOperations = livraisons.map(l => ({
        ...l,
        produit: produits.find(p => p.id === l.produit_id),
        client: clients.find(c => c.id === l.client_id),
        statut: l.statut || 'encours'
      }));

      setOperations(enrichedOperations);
      
      // Calculer les stats
      const statsCalcules = {
        total: enrichedOperations.length,
        encours: enrichedOperations.filter(o => o.statut === 'encours').length,
        terminees: enrichedOperations.filter(o => o.statut === 'livre').length,
        annulees: enrichedOperations.filter(o => o.statut === 'annule').length
      };
      setStats(statsCalcules);

    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const filterOperations = () => {
    if (filter === 'tous') {
      setFilteredOperations(operations);
    } else {
      setFilteredOperations(operations.filter(o => o.statut === filter));
    }
  };

  const getStatutIcon = (statut) => {
    switch(statut) {
      case 'livre':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'encours':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'annule':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatutLabel = (statut) => {
    switch(statut) {
      case 'livre':
        return 'Livrée';
      case 'encours':
        return 'En cours';
      case 'annule':
        return 'Annulée';
      default:
        return statut;
    }
  };

  const exportData = () => {
    const csv = [
      ['Date', 'Produit', 'Client', 'Quantité', 'Chauffeur', 'Statut'],
      ...filteredOperations.map(o => [
        new Date(o.date_livraison || o.created_at).toLocaleDateString('fr-FR'),
        o.produit?.nom || '-',
        o.client?.nom || '-',
        `${o.quantite || 0} tonnes`,
        o.chauffeur || '-',
        getStatutLabel(o.statut)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `operations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) return <Loading />;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Opérations
        </h1>
        
        <Button
          size="sm"
          onClick={exportData}
          disabled={filteredOperations.length === 0}
        >
          <Download className="h-4 w-4 mr-1" />
          Exporter
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card 
          className={`p-4 cursor-pointer ${filter === 'tous' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setFilter('tous')}
        >
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        
        <Card 
          className={`p-4 cursor-pointer ${filter === 'encours' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => setFilter('encours')}
        >
          <p className="text-sm text-gray-600">En cours</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.encours}</p>
        </Card>
        
        <Card 
          className={`p-4 cursor-pointer ${filter === 'livre' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setFilter('livre')}
        >
          <p className="text-sm text-gray-600">Livrées</p>
          <p className="text-2xl font-bold text-green-600">{stats.terminees}</p>
        </Card>
        
        <Card 
          className={`p-4 cursor-pointer ${filter === 'annule' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setFilter('annule')}
        >
          <p className="text-sm text-gray-600">Annulées</p>
          <p className="text-2xl font-bold text-red-600">{stats.annulees}</p>
        </Card>
      </div>

      {/* Liste des opérations */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {filter === 'tous' ? 'Toutes les opérations' : `Opérations ${getStatutLabel(filter).toLowerCase()}s`}
          </h2>
          <span className="text-sm text-gray-500">
            {filteredOperations.length} résultat{filteredOperations.length > 1 ? 's' : ''}
          </span>
        </div>

        {filteredOperations.length > 0 ? (
          <div className="space-y-3">
            {filteredOperations.slice(0, 20).map((operation) => (
              <div key={operation.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatutIcon(operation.statut)}
                      <span className="font-medium">{operation.produit?.nom || 'Produit inconnu'}</span>
                      <span className="text-sm text-gray-500">• {operation.quantite || 0} tonnes</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Client: {operation.client?.nom || 'Non spécifié'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Chauffeur: {operation.chauffeur || 'Non spécifié'} 
                      {operation.numero_camion && ` • Camion: ${operation.numero_camion}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {new Date(operation.date_livraison || operation.created_at).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {operation.numero_bon_livraison || `BL-${operation.id}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">
            Aucune opération trouvée
          </p>
        )}
      </Card>
    </div>
  );
};

export default OperationsSimple;