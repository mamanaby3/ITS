import * as XLSX from 'xlsx';
import { formatDate, formatNumber, formatCurrency } from './formatters';

/**
 * Génère un vrai fichier Excel .xlsx structuré avec en-têtes et données
 * @param {Array} data - Tableau des données à exporter
 * @param {Array} columns - Configuration des colonnes avec headers et formatage
 * @param {String} filename - Nom du fichier (sans extension)
 * @param {Object} options - Options supplémentaires
 */
export const generateExcelFile = (data, columns, filename = 'tableau', options = {}) => {
  try {
    // Vérification des données
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Aucune donnée à exporter');
    }

    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      throw new Error('Configuration des colonnes manquante');
    }

    // Créer un nouveau workbook
    const workbook = XLSX.utils.book_new();

    // Préparer les données pour Excel
    const excelData = prepareDataForExcel(data, columns);

    // Créer la worksheet avec les données
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);

    // Appliquer le formatage et les styles
    applyExcelFormatting(worksheet, columns, data.length);

    // Ajouter la feuille au workbook
    const sheetName = options.sheetName || 'Données';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Définir les propriétés du fichier
    setWorkbookProperties(workbook, options);

    // Générer et télécharger le fichier
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const finalFilename = `${filename}_${timestamp}.xlsx`;
    
    XLSX.writeFile(workbook, finalFilename, {
      bookType: 'xlsx',
      type: 'binary',
      compression: true
    });

    console.log(`Fichier Excel généré: ${finalFilename}`);
    return { success: true, filename: finalFilename };

  } catch (error) {
    console.error('Erreur lors de la génération du fichier Excel:', error);
    throw new Error(`Erreur d'export Excel: ${error.message}`);
  }
};

/**
 * Prépare les données pour Excel avec en-têtes en première ligne
 */
const prepareDataForExcel = (data, columns) => {
  // Première ligne: en-têtes des colonnes
  const headers = columns.map(col => col.header || col.label || col.title || col.key);
  
  // Lignes de données
  const rows = data.map(row => {
    return columns.map(col => {
      let value = getValue(row, col.key);
      
      // Appliquer le formatage selon le type de colonne
      if (value !== null && value !== undefined && value !== '') {
        switch (col.type) {
          case 'number':
            return parseFloat(value) || 0;
          
          case 'currency':
            return parseFloat(value) || 0;
          
          case 'date':
            if (value) {
              const date = new Date(value);
              return isValidDate(date) ? date : value;
            }
            break;
          
          case 'percentage':
            return parseFloat(value) || 0;
          
          case 'boolean':
            return value ? 'Oui' : 'Non';
          
          default:
            return String(value);
        }
      }
      
      return value || '';
    });
  });

  // Retourner tableau avec en-têtes + données
  return [headers, ...rows];
};

/**
 * Applique le formatage Excel (largeurs, styles, formats numériques)
 */
const applyExcelFormatting = (worksheet, columns, dataLength) => {
  // Définir les largeurs de colonnes optimisées pour format vertical
  const columnWidths = columns.map(col => {
    if (col.width) return { wch: col.width };
    
    // Largeurs optimisées pour orientation portrait/verticale
    switch (col.type) {
      case 'date': return { wch: 14 };
      case 'currency': return { wch: 16 };
      case 'number': return { wch: 10 };
      case 'percentage': return { wch: 8 };
      case 'text': 
        // Ajuster selon la longueur probable du contenu
        if (col.key.includes('nom') || col.key.includes('name')) return { wch: 25 };
        if (col.key.includes('reference') || col.key.includes('ref')) return { wch: 12 };
        if (col.key.includes('description')) return { wch: 30 };
        return { wch: 15 };
      default: return { wch: 15 };
    }
  });
  
  worksheet['!cols'] = columnWidths;

  // Appliquer les styles et formats cellule par cellule
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      
      if (!worksheet[cellAddress]) continue;
      
      // Style pour la ligne d'en-têtes (R = 0)
      if (R === 0) {
        worksheet[cellAddress].s = {
          font: { 
            bold: true, 
            color: { rgb: 'FFFFFF' },
            size: 12
          },
          fill: { 
            fgColor: { rgb: '366092' } 
          },
          alignment: { 
            horizontal: 'center', 
            vertical: 'center' 
          },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        };
      } 
      // Style pour les lignes de données
      else {
        const column = columns[C];
        const isEvenRow = R % 2 === 0;
        
        worksheet[cellAddress].s = {
          alignment: { 
            horizontal: getHorizontalAlignment(column?.type),
            vertical: 'center' 
          },
          fill: isEvenRow ? 
            { fgColor: { rgb: 'F8F9FA' } } : 
            { fgColor: { rgb: 'FFFFFF' } },
          border: {
            top: { style: 'thin', color: { rgb: 'E1E5E9' } },
            bottom: { style: 'thin', color: { rgb: 'E1E5E9' } },
            left: { style: 'thin', color: { rgb: 'E1E5E9' } },
            right: { style: 'thin', color: { rgb: 'E1E5E9' } }
          }
        };

        // Appliquer les formats numériques
        if (column) {
          switch (column.type) {
            case 'currency':
              worksheet[cellAddress].z = '#,##0 "XOF"';
              break;
            case 'number':
              worksheet[cellAddress].z = '#,##0';
              break;
            case 'percentage':
              worksheet[cellAddress].z = '0.00%';
              break;
            case 'date':
              worksheet[cellAddress].z = 'dd/mm/yyyy';
              break;
          }
        }
      }
    }
  }

  // Figer la première ligne (en-têtes)
  worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };

  // Ajouter l'autofilter sur toutes les données
  worksheet['!autofilter'] = { 
    ref: `A1:${XLSX.utils.encode_col(columns.length - 1)}${dataLength + 1}` 
  };
};

/**
 * Définit les propriétés du workbook
 */
const setWorkbookProperties = (workbook, options) => {
  workbook.Props = {
    Title: options.title || 'Export de données',
    Subject: options.subject || 'Données exportées depuis le système ITS',
    Author: options.author || 'ITS Sénégal',
    Company: 'Institut de Technologie Sociale - Sénégal',
    CreatedDate: new Date(),
    ModifiedDate: new Date()
  };
};

/**
 * Utilitaires
 */
const getValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date);
};

const getHorizontalAlignment = (type) => {
  switch (type) {
    case 'number':
    case 'currency':
    case 'percentage':
      return 'right';
    case 'date':
      return 'center';
    default:
      return 'left';
  }
};

/**
 * Fonction spécialisée pour exporter les données de stock
 */
export const exportStockToExcel = (stockData, filename = 'stock') => {
  const columns = [
    { key: 'produit.reference', header: 'Référence', type: 'text' },
    { key: 'produit.nom', header: 'Nom du Produit', type: 'text' },
    { key: 'produit.categorie', header: 'Catégorie', type: 'text' },
    { key: 'quantite', header: 'Quantité', type: 'number' },
    { key: 'produit.unite', header: 'Unité', type: 'text' },
    { key: 'prixUnitaire', header: 'Prix Unitaire', type: 'currency' },
    { key: 'valeurTotale', header: 'Valeur Totale', type: 'currency' },
    { key: 'emplacement', header: 'Emplacement', type: 'text' },
    { key: 'dateExpiration', header: 'Date d\'Expiration', type: 'date' }
  ];

  // Calculer la valeur totale pour chaque article
  const enrichedData = stockData.map(item => ({
    ...item,
    valeurTotale: (item.quantite || 0) * (item.prixUnitaire || 0)
  }));

  return generateExcelFile(enrichedData, columns, filename, {
    title: 'Rapport de Stock',
    sheetName: 'Stock'
  });
};

/**
 * Fonction spécialisée pour exporter les rotations
 */
export const exportRotationsToExcel = (rotationsData, filename = 'rotations') => {
  const columns = [
    { key: 'numero_rotation', header: 'N° Rotation', type: 'text' },
    { key: 'chauffeur.nom', header: 'Chauffeur', type: 'text' },
    { key: 'chauffeur.numero_camion', header: 'N° Camion', type: 'text' },
    { key: 'dispatch.produit.nom', header: 'Produit', type: 'text' },
    { key: 'quantite_prevue', header: 'Quantité Prévue (T)', type: 'number' },
    { key: 'quantite_livree', header: 'Quantité Livrée (T)', type: 'number' },
    { key: 'ecart', header: 'Écart (T)', type: 'number' },
    { key: 'statut', header: 'Statut', type: 'text' },
    { key: 'date_arrivee', header: 'Date d\'Arrivée', type: 'date' },
    { key: 'dispatch.client.nom', header: 'Client', type: 'text' }
  ];

  return generateExcelFile(rotationsData, columns, filename, {
    title: 'Rapport des Rotations',
    sheetName: 'Rotations'
  });
};

/**
 * Fonction spécialisée pour exporter les commandes
 */
export const exportCommandesToExcel = (commandesData, filename = 'commandes') => {
  const columns = [
    { key: 'numero', header: 'N° Commande', type: 'text' },
    { key: 'date', header: 'Date', type: 'date' },
    { key: 'client.nom', header: 'Client', type: 'text' },
    { key: 'statut', header: 'Statut', type: 'text' },
    { key: 'montantTotal', header: 'Montant Total', type: 'currency' },
    { key: 'nombreProduits', header: 'Nb Produits', type: 'number' }
  ];

  return generateExcelFile(commandesData, columns, filename, {
    title: 'Rapport des Commandes',
    sheetName: 'Commandes'
  });
};

export default {
  generateExcelFile,
  exportStockToExcel,
  exportRotationsToExcel,
  exportCommandesToExcel
};