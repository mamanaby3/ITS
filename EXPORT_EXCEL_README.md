# 📊 Système d'Export Excel Professionnel

## 🎯 Vue d'ensemble

Ce système génère de **vrais fichiers Excel (.xlsx)** avec une structure parfaite :
- **Première ligne** : En-têtes des colonnes
- **Lignes suivantes** : Données formatées
- **Styles professionnels** : Bordures, couleurs, alignements
- **Fonctionnalités Excel** : Autofilter, lignes figées, métadonnées

## 🚀 Utilisation Rapide

### Import
```javascript
import { 
  StockExportButton, 
  RotationsExportButton, 
  CommandesExportButton 
} from '../components/ui/ExcelExportButton';
```

### Boutons Prêts à l'Emploi
```jsx
// Export de stock
<StockExportButton 
  data={stockData}
  filename="inventaire"
  size="md"
/>

// Export de rotations
<RotationsExportButton 
  data={rotations}
  filename="transport"
  size="sm"
/>

// Export de commandes
<CommandesExportButton 
  data={commandes}
  filename="ventes"
  size="lg"
/>
```

### Export Personnalisé
```jsx
import ExcelExportButton from '../components/ui/ExcelExportButton';

const colonnes = [
  { key: 'nom', header: 'Nom du Produit', type: 'text' },
  { key: 'quantite', header: 'Quantité', type: 'number' },
  { key: 'prix', header: 'Prix', type: 'currency' },
  { key: 'date', header: 'Date', type: 'date' }
];

<ExcelExportButton 
  data={mesData}
  columns={colonnes}
  filename="mon_rapport"
  title="Exporter Excel"
  type="custom"
/>
```

## 📋 Configuration des Colonnes

### Propriétés Obligatoires
- `key` : Clé de la donnée (supporte les chemins : 'produit.nom')
- `header` : Titre affiché dans l'en-tête Excel

### Types de Données Supportés
- `text` : Texte simple (aligné à gauche)
- `number` : Nombres (aligné à droite, format #,##0)
- `currency` : Devises (format "1 234 XOF")
- `date` : Dates (format dd/mm/yyyy)
- `percentage` : Pourcentages (format 0.00%)
- `boolean` : Booléens (affiche "Oui"/"Non")

### Exemple Complet
```javascript
const colonnesStock = [
  { key: 'produit.reference', header: 'Référence', type: 'text', width: 15 },
  { key: 'produit.nom', header: 'Nom du Produit', type: 'text', width: 30 },
  { key: 'quantite', header: 'Quantité', type: 'number', width: 12 },
  { key: 'prixUnitaire', header: 'Prix Unitaire', type: 'currency', width: 18 },
  { key: 'dateExpiration', header: 'Expiration', type: 'date', width: 16 },
  { key: 'actif', header: 'Actif', type: 'boolean', width: 10 }
];
```

## 🎨 Styles et Formatage

### En-têtes
- **Fond bleu** (#366092)
- **Texte blanc** et gras
- **Alignement centré**
- **Bordures noires**

### Données
- **Alternance de couleurs** (blanc/gris clair)
- **Bordures grises**
- **Alignement selon le type** :
  - Texte : gauche
  - Nombres/Devises : droite
  - Dates : centré

### Fonctionnalités Excel
- ✅ **Autofilter** : Tri et filtrage automatiques
- ✅ **Ligne figée** : En-têtes toujours visibles
- ✅ **Largeurs ajustées** : Selon le contenu
- ✅ **Métadonnées** : Auteur, titre, date de création

## 📁 Structure du Fichier Excel Généré

```
Fichier: inventaire_2024-01-15_143022.xlsx

┌─────────────────────────────────────────────────┐
│ Référence │ Nom du Produit │ Quantité │ Prix   │ <- EN-TÊTES (bleu, figées)
├─────────────────────────────────────────────────┤
│ REF-001   │ Produit A      │      150 │ 5000   │ <- DONNÉES (formatées)
│ REF-002   │ Produit B      │      200 │ 3500   │
│ REF-003   │ Produit C      │       75 │ 8000   │
└─────────────────────────────────────────────────┘
  [Autofilter activé] [Bordures] [Couleurs alternées]
```

## 🔧 Remplacement de l'Ancien Système

### Avant (ancien système)
```jsx
{onExport && (
  <Button variant="outline" onClick={onExport}>
    <Download className="h-4 w-4" />
    <span>Exporter</span>
  </Button>
)}
```

### Après (nouveau système)
```jsx
<StockExportButton 
  data={filteredData}
  filename="stock_liste"
  size="sm"
/>
```

## 📊 Exemples d'Intégration

### Dans StockList.jsx
```jsx
import { StockExportButton } from '../ui/ExcelExportButton';

// Dans la barre d'outils
<div className="flex items-center space-x-2">
  <StockExportButton 
    data={filteredData}
    filename="inventaire_stock"
    size="sm"
    className="mr-2"
  />
  {onAdd && (
    <Button onClick={onAdd}>
      <Plus className="h-4 w-4" />
      <span>Ajouter</span>
    </Button>
  )}
</div>
```

### Dans RotationsEnTransit.jsx
```jsx
import { RotationsExportButton } from '../ui/ExcelExportButton';

// Dans l'en-tête
<div className="flex justify-between items-center">
  <h2>Rotations en Transit</h2>
  <RotationsExportButton 
    data={rotations}
    filename="rotations_transport"
  />
</div>
```

## 🛠️ Fonctions Utilitaires

### Export Direct (sans composant)
```javascript
import { generateExcelFile, exportStockToExcel } from '../utils/excelExport';

// Export générique
const handleExport = async () => {
  try {
    await generateExcelFile(data, columns, 'mon_fichier');
    console.log('Export réussi !');
  } catch (error) {
    console.error('Erreur:', error);
  }
};

// Export de stock prédéfini
const handleStockExport = async () => {
  try {
    await exportStockToExcel(stockData, 'inventaire');
    console.log('Stock exporté !');
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

## 🎛️ Propriétés des Composants

### ExcelExportButton (générique)
| Propriété | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `data` | Array | [] | Données à exporter |
| `columns` | Array | [] | Configuration des colonnes |
| `filename` | String | 'export' | Nom du fichier (sans extension) |
| `type` | String | 'custom' | Type d'export ('custom', 'stock', 'rotations', 'commandes') |
| `title` | String | 'Exporter Excel' | Texte du bouton |
| `size` | String | 'md' | Taille ('sm', 'md', 'lg') |
| `disabled` | Boolean | false | Désactiver le bouton |
| `className` | String | '' | Classes CSS supplémentaires |

### Boutons Spécialisés
Tous les boutons spécialisés (`StockExportButton`, `RotationsExportButton`, `CommandesExportButton`) acceptent les mêmes propriétés sauf `columns` et `type` qui sont prédéfinis.

## 🚨 Gestion d'Erreurs

Le système gère automatiquement :
- ✅ **Données vides** : Bouton désactivé + message d'erreur
- ✅ **Erreurs d'export** : Affichage visuel + console.error
- ✅ **Feedback utilisateur** : Loading, succès, erreur
- ✅ **Validation** : Configuration des colonnes

## 📈 Avantages vs Ancien Système

| Fonctionnalité | Ancien Système | Nouveau Système |
|----------------|----------------|-----------------|
| **Format de sortie** | CSV/HTML dans .xls | Vrai XLSX Excel |
| **Styles** | Basiques ou aucun | Professionnels complets |
| **En-têtes** | Simples | Colorés, figés, formatés |
| **Types de données** | Texte uniquement | 6 types formatés |
| **Fonctionnalités Excel** | Aucune | Autofilter, largeurs auto |
| **Facilité d'usage** | Configuration manuelle | Boutons prêts à l'emploi |
| **Feedback utilisateur** | Aucun | Loading + succès/erreur |
| **Compatibilité** | Limitée | Excel natif |

---

## 📞 Support

Pour toute question ou problème :
1. Vérifiez que `xlsx` est installé : `npm install xlsx`
2. Consultez les exemples dans `exemple-export-excel.jsx`
3. Vérifiez la console pour les messages d'erreur
4. Assurez-vous que vos données ont la structure attendue

**Votre export Excel est maintenant professionnel ! 🎉**