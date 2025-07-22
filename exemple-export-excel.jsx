// EXEMPLES D'UTILISATION DE L'EXPORT EXCEL AMÉLIORÉ
// Copiez ces exemples dans vos composants existants

import React from 'react';
import ExcelExportButton, { 
  StockExportButton, 
  RotationsExportButton, 
  CommandesExportButton 
} from './components/ui/ExcelExportButton';

// ===== EXEMPLE 1: EXPORT DE STOCK =====
const ExempleStockList = () => {
  const [stockData, setStockData] = useState([]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Liste du Stock</h2>
        
        {/* Bouton d'export automatique pour le stock */}
        <StockExportButton 
          data={stockData}
          filename="inventaire_stock"
          size="md"
        />
      </div>
      
      {/* Votre tableau de stock existant */}
      <div className="bg-white rounded-lg shadow">
        {/* ... contenu du tableau ... */}
      </div>
    </div>
  );
};

// ===== EXEMPLE 2: EXPORT DE ROTATIONS =====
const ExempleRotationsList = () => {
  const [rotations, setRotations] = useState([]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Rotations en Transit</h2>
        
        {/* Bouton d'export automatique pour les rotations */}
        <RotationsExportButton 
          data={rotations}
          filename="rotations_transport"
          size="md"
        />
      </div>
      
      {/* Votre liste de rotations existante */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* ... cartes de rotations ... */}
      </div>
    </div>
  );
};

// ===== EXEMPLE 3: EXPORT PERSONNALISÉ =====
const ExempleExportPersonnalise = () => {
  const [donnees, setDonnees] = useState([]);

  // Configuration personnalisée des colonnes
  const colonnesPersonnalisees = [
    { key: 'id', header: 'Identifiant', type: 'text' },
    { key: 'nom', header: 'Nom', type: 'text' },
    { key: 'quantite', header: 'Quantité', type: 'number' },
    { key: 'prix', header: 'Prix Unitaire', type: 'currency' },
    { key: 'total', header: 'Total', type: 'currency' },
    { key: 'date_creation', header: 'Date', type: 'date' },
    { key: 'actif', header: 'Actif', type: 'boolean' }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Rapport Personnalisé</h2>
        
        {/* Export avec configuration personnalisée */}
        <ExcelExportButton 
          data={donnees}
          columns={colonnesPersonnalisees}
          filename="rapport_personnalise"
          title="Exporter vers Excel"
          type="custom"
          size="md"
        />
      </div>
      
      {/* Votre contenu */}
    </div>
  );
};

// ===== EXEMPLE 4: INTÉGRATION DANS UN COMPOSANT EXISTANT =====

// Dans votre composant StockList.jsx existant:
/*
import { StockExportButton } from '../ui/ExcelExportButton';

// Ajoutez dans le JSX où vous voulez le bouton d'export:
<div className="flex items-center space-x-2">
  {onExport && (
    <Button
      variant="outline"
      onClick={onExport}
      className="flex items-center space-x-2"
    >
      <Download className="h-4 w-4" />
      <span>Exporter</span>
    </Button>
  )}
  
  // REMPLACEZ par:
  <StockExportButton 
    data={filteredData}  // vos données filtrées
    filename="stock_liste"
    size="sm"
    className="mr-2"
  />
</div>
*/

// ===== EXEMPLE 5: EXPORT AVEC GESTION D'ERREURS =====
const ExempleAvecGestionErreurs = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleExportSuccess = () => {
    console.log('Export réussi !');
    // Vous pouvez ajouter ici une notification de succès
  };

  const handleExportError = (error) => {
    console.error('Erreur lors de l\'export:', error);
    // Vous pouvez ajouter ici une notification d'erreur
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Mes Données</h2>
        
        <div className="flex gap-2">
          {/* Plusieurs boutons d'export */}
          <StockExportButton 
            data={data}
            filename="export_stock"
            disabled={loading}
            size="sm"
          />
          
          <RotationsExportButton 
            data={data}
            filename="export_rotations"
            disabled={loading}
            size="sm"
          />
          
          <CommandesExportButton 
            data={data}
            filename="export_commandes"
            disabled={loading}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
};

// ===== CARACTÉRISTIQUES DU NOUVEAU SYSTÈME D'EXPORT =====
/*

✅ STRUCTURE EXCEL PARFAITE:
- Première ligne = En-têtes des colonnes
- Lignes suivantes = Données
- Format .xlsx natif Excel

✅ FORMATAGE AUTOMATIQUE:
- Nombres: alignés à droite, format #,##0
- Devises: format "1 234 XOF"
- Dates: format dd/mm/yyyy
- Texte: aligné à gauche

✅ STYLES PROFESSIONNELS:
- En-têtes avec fond bleu et texte blanc
- Bordures sur toutes les cellules
- Alternance de couleurs (lignes paires/impaires)
- Largeurs de colonnes ajustées automatiquement

✅ FONCTIONNALITÉS EXCEL:
- Autofilter activé (tri et filtrage)
- Première ligne figée (scroll vertical)
- Métadonnées du fichier (auteur, titre, etc.)

✅ FACILITÉ D'UTILISATION:
- Import simple: import { StockExportButton } from '...'
- Un seul composant par type de données
- Gestion automatique des erreurs
- Feedback visuel (loading, succès, erreur)

✅ TYPES DE DONNÉES SUPPORTÉS:
- text: Texte simple
- number: Nombres (avec formatage)
- currency: Devises (XOF)
- date: Dates (format français)
- percentage: Pourcentages
- boolean: Oui/Non

*/

export {
  ExempleStockList,
  ExempleRotationsList,
  ExempleExportPersonnalise,
  ExempleAvecGestionErreurs
};