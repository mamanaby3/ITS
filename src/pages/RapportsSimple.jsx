import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, TrendingUp, Package, Users } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';

const RapportsSimple = () => {
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState('mois');
  const [stats, setStats] = useState({
    entrees: 0,
    sorties: 0,
    valeurStock: 0,
    nombreClients: 0,
    nombreProduits: 0,
    tauxRotation: 0
  });

  useEffect(() => {
    loadStats();
  }, [periode]);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      const [mouvementsRes, produitsRes, clientsRes, stockRes] = await Promise.all([
        api.get('/mouvements').catch(() => ({ data: [] })),
        api.get('/produits').catch(() => ({ data: [] })),
        api.get('/clients').catch(() => ({ data: [] })),
        api.get('/stock').catch(() => ({ data: [] }))
      ]);

      const mouvements = mouvementsRes.data || [];
      const produits = produitsRes.data || [];
      const clients = clientsRes.data || [];
      const stock = stockRes.data || [];

      // Filtrer par période
      const dateDebut = new Date();
      if (periode === 'jour') {
        dateDebut.setHours(0, 0, 0, 0);
      } else if (periode === 'semaine') {
        dateDebut.setDate(dateDebut.getDate() - 7);
      } else if (periode === 'mois') {
        dateDebut.setMonth(dateDebut.getMonth() - 1);
      } else if (periode === 'annee') {
        dateDebut.setFullYear(dateDebut.getFullYear() - 1);
      }

      const mouvementsFiltres = mouvements.filter(m => 
        new Date(m.date || m.created_at) >= dateDebut
      );

      // Calculer les stats
      const entrees = mouvementsFiltres
        .filter(m => m.type === 'entree')
        .reduce((sum, m) => sum + (m.tonnage || m.quantite || 0), 0);

      const sorties = mouvementsFiltres
        .filter(m => m.type === 'sortie')
        .reduce((sum, m) => sum + (m.tonnage_livre || m.quantite || 0), 0);

      // Calculer la valeur du stock
      const stockParProduit = {};
      stock.forEach(s => {
        if (!stockParProduit[s.produitId]) {
          stockParProduit[s.produitId] = 0;
        }
        stockParProduit[s.produitId] += s.quantite || 0;
      });

      const valeurStock = Object.entries(stockParProduit).reduce((total, [produitId, quantite]) => {
        const produit = produits.find(p => p.id === parseInt(produitId));
        return total + (quantite * (produit?.prix_achat || 0));
      }, 0);

      // Taux de rotation (simplifi\u00e9)
      const stockMoyen = Object.values(stockParProduit).reduce((sum, q) => sum + q, 0) / Object.keys(stockParProduit).length || 1;
      const tauxRotation = stockMoyen > 0 ? (sorties / stockMoyen) : 0;

      setStats({
        entrees,
        sorties,
        valeurStock,
        nombreClients: clients.length,
        nombreProduits: produits.length,
        tauxRotation: tauxRotation.toFixed(2)
      });

    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = (type) => {
    const date = new Date().toLocaleDateString('fr-FR');
    let content = '';

    switch(type) {
      case 'inventaire':
        content = `RAPPORT D'INVENTAIRE - ${date}\n\n`;
        content += `Période: ${periode}\n\n`;
        content += `Entrées: ${stats.entrees} tonnes\n`;
        content += `Sorties: ${stats.sorties} tonnes\n`;
        content += `Valeur du stock: ${formatCurrency(stats.valeurStock)}\n`;
        content += `Taux de rotation: ${stats.tauxRotation}\n`;
        break;
      
      case 'activite':
        content = `RAPPORT D'ACTIVITÉ - ${date}\n\n`;
        content += `Période: ${periode}\n\n`;
        content += `Mouvements:\n`;
        content += `- Entrées: ${stats.entrees} tonnes\n`;
        content += `- Sorties: ${stats.sorties} tonnes\n`;
        content += `- Solde: ${stats.entrees - stats.sorties} tonnes\n\n`;
        content += `Base clients: ${stats.nombreClients} clients actifs\n`;
        content += `Catalogue: ${stats.nombreProduits} produits\n`;
        break;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_${type}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  if (loading) return <Loading />;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-xl font-bold mb-6 flex items-center gap-2">
        <FileText className="h-5 w-5" />
        Rapports
      </h1>

      {/* Sélecteur de période */}
      <div className="flex gap-2 mb-6">
        {['jour', 'semaine', 'mois', 'annee'].map(p => (
          <Button
            key={p}
            variant={periode === p ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setPeriode(p)}
          >
            {p === 'jour' ? 'Aujourd\'hui' : 
             p === 'semaine' ? '7 jours' :
             p === 'mois' ? '30 jours' : 
             'Année'}
          </Button>
        ))}
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Entrées</p>
              <p className="text-2xl font-bold text-green-600">{stats.entrees} t</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-200" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sorties</p>
              <p className="text-2xl font-bold text-red-600">{stats.sorties} t</p>
            </div>
            <TrendingUp className="h-8 w-8 text-red-200 rotate-180" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valeur Stock</p>
              <p className="text-xl font-bold">{formatCurrency(stats.valeurStock)}</p>
            </div>
            <Package className="h-8 w-8 text-blue-200" />
          </div>
        </Card>
      </div>

      {/* Indicateurs secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 bg-gray-50">
          <p className="text-sm text-gray-600">Taux de rotation</p>
          <p className="text-lg font-semibold">{stats.tauxRotation}</p>
        </Card>

        <Card className="p-4 bg-gray-50">
          <p className="text-sm text-gray-600">Nombre de clients</p>
          <p className="text-lg font-semibold">{stats.nombreClients}</p>
        </Card>

        <Card className="p-4 bg-gray-50">
          <p className="text-sm text-gray-600">Nombre de produits</p>
          <p className="text-lg font-semibold">{stats.nombreProduits}</p>
        </Card>
      </div>

      {/* Actions de génération */}
      <Card className="p-6">
        <h2 className="font-semibold mb-4">Générer des rapports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Rapport d'inventaire</h3>
            <p className="text-sm text-gray-600 mb-3">
              État complet du stock avec valorisation
            </p>
            <Button 
              size="sm" 
              onClick={() => generateReport('inventaire')}
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Rapport d'activité</h3>
            <p className="text-sm text-gray-600 mb-3">
              Résumé des mouvements et performances
            </p>
            <Button 
              size="sm" 
              onClick={() => generateReport('activite')}
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RapportsSimple;