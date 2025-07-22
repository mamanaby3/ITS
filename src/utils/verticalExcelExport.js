import * as XLSX from 'xlsx';
import { formatDate, formatNumber, formatCurrency } from './formatters';

/**
 * Génère un fichier Excel avec format colonnes verticales
 * Chaque enregistrement est affiché en colonnes verticales avec libellés à gauche
 */
export const generateVerticalExcelFile = (data, columns, filename = 'tableau_vertical', options = {}) => {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Aucune donnée à exporter');
    }

    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      throw new Error('Configuration des colonnes manquante');
    }

    // Créer un nouveau workbook
    const workbook = XLSX.utils.book_new();

    // Préparer les données pour format vertical
    const verticalData = prepareVerticalData(data, columns);

    // Créer la worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(verticalData);

    // Appliquer le formatage vertical
    applyVerticalFormatting(worksheet, data.length, columns.length);

    // Ajouter la feuille au workbook
    const sheetName = options.sheetName || 'Rapport Vertical';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Définir les propriétés du fichier
    setWorkbookProperties(workbook, options);

    // Générer et télécharger le fichier
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const finalFilename = `${filename}_vertical_${timestamp}.xlsx`;
    
    XLSX.writeFile(workbook, finalFilename, {
      bookType: 'xlsx',
      type: 'binary',
      compression: true
    });

    console.log(`Fichier Excel vertical généré: ${finalFilename}`);
    return { success: true, filename: finalFilename };

  } catch (error) {
    console.error('Erreur lors de la génération du fichier Excel vertical:', error);
    throw new Error(`Erreur d'export Excel: ${error.message}`);
  }
};

/**
 * Prépare les données pour le format vertical
 * Structure: [Libellé] [Enreg1] [Enreg2] [Enreg3] ...
 */
const prepareVerticalData = (data, columns) => {
  const verticalData = [];

  // Ligne d'en-tête avec numéros d'enregistrements
  const headerRow = ['CHAMPS'];
  data.forEach((_, index) => {
    headerRow.push(`ENREGISTREMENT ${index + 1}`);
  });
  verticalData.push(headerRow);

  // Ligne vide pour séparation
  verticalData.push([]);

  // Pour chaque colonne, créer une ligne avec le libellé et les valeurs
  columns.forEach(col => {
    const row = [col.header || col.label || col.key]; // Libellé de la colonne
    
    // Ajouter les valeurs de tous les enregistrements pour cette colonne
    data.forEach(record => {
      let value = getValue(record, col.key);
      
      // Formater la valeur selon le type
      if (value !== null && value !== undefined && value !== '') {
        switch (col.type) {
          case 'number':
            value = formatNumber(parseFloat(value) || 0);
            break;
          case 'currency':
            value = formatCurrency(parseFloat(value) || 0);
            break;
          case 'date':
            if (value) {
              const date = new Date(value);
              value = isValidDate(date) ? formatDate(date) : value;
            }
            break;
          case 'percentage':
            value = `${parseFloat(value) || 0}%`;
            break;
          case 'boolean':
            value = value ? 'Oui' : 'Non';
            break;
          default:
            value = String(value);
            break;
        }
      } else {
        value = '-';
      }
      
      row.push(value);
    });
    
    verticalData.push(row);
  });

  return verticalData;
};

/**
 * Applique le formatage spécifique au format vertical
 */
const applyVerticalFormatting = (worksheet, dataCount, fieldsCount) => {
  // Définir les largeurs de colonnes
  const columnWidths = [
    { wch: 25 }, // Colonne des libellés plus large
    ...Array(dataCount).fill({ wch: 18 }) // Colonnes de données
  ];
  
  worksheet['!cols'] = columnWidths;

  // Appliquer les styles
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
            fgColor: { rgb: '2B5394' } 
          },
          alignment: { 
            horizontal: 'center', 
            vertical: 'center' 
          },
          border: getBorders()
        };
      }
      // Ligne vide (R = 1)
      else if (R === 1) {
        worksheet[cellAddress].s = {
          fill: { fgColor: { rgb: 'E8F1FF' } }
        };
      }
      // Lignes de données (R > 1)
      else {
        const isLabelColumn = C === 0;
        const isEvenRow = R % 2 === 0;
        
        worksheet[cellAddress].s = {
          font: isLabelColumn ? { bold: true, size: 10 } : { size: 10 },
          fill: { 
            fgColor: isLabelColumn ? 
              { rgb: 'F0F5FF' } : 
              (isEvenRow ? { rgb: 'F8F9FA' } : { rgb: 'FFFFFF' })
          },
          alignment: { 
            horizontal: isLabelColumn ? 'left' : 'center',
            vertical: 'center' 
          },
          border: getBorders()
        };
      }
    }
  }

  // Figer la première colonne (libellés)
  worksheet['!freeze'] = { xSplit: 1, ySplit: 2 };
};

/**
 * Génère les bordures standard
 */
const getBorders = () => ({
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } }
});

/**
 * Version carte verticale - chaque enregistrement dans une section séparée
 */
export const generateCardVerticalExcel = (data, columns, filename = 'cartes_verticales', options = {}) => {
  try {
    const workbook = XLSX.utils.book_new();
    const cardData = prepareCardData(data, columns);
    const worksheet = XLSX.utils.aoa_to_sheet(cardData);
    
    applyCardFormatting(worksheet, data.length, columns.length);
    
    const sheetName = options.sheetName || 'Cartes';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    setWorkbookProperties(workbook, options);
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const finalFilename = `${filename}_cartes_${timestamp}.xlsx`;
    
    XLSX.writeFile(workbook, finalFilename, {
      bookType: 'xlsx',
      type: 'binary',
      compression: true
    });

    return { success: true, filename: finalFilename };
  } catch (error) {
    throw new Error(`Erreur d'export cartes: ${error.message}`);
  }
};

/**
 * Prépare les données en format carte (chaque enregistrement = bloc vertical)
 */
const prepareCardData = (data, columns) => {
  const cardData = [];
  
  // Titre principal
  cardData.push(['RAPPORT DÉTAILLÉ PAR ENREGISTREMENT']);
  cardData.push([]); // Ligne vide

  data.forEach((record, index) => {
    // En-tête de l'enregistrement
    cardData.push([`ENREGISTREMENT ${index + 1}`, '']);
    cardData.push([]); // Ligne de séparation
    
    // Chaque champ sur une ligne
    columns.forEach(col => {
      let value = getValue(record, col.key);
      
      // Formater la valeur
      if (value !== null && value !== undefined && value !== '') {
        switch (col.type) {
          case 'number':
            value = formatNumber(parseFloat(value) || 0);
            break;
          case 'currency':
            value = formatCurrency(parseFloat(value) || 0);
            break;
          case 'date':
            if (value) {
              const date = new Date(value);
              value = isValidDate(date) ? formatDate(date) : value;
            }
            break;
          case 'boolean':
            value = value ? 'Oui' : 'Non';
            break;
          default:
            value = String(value);
            break;
        }
      } else {
        value = '-';
      }
      
      cardData.push([col.header || col.key, value]);
    });
    
    // Espacement entre les cartes
    cardData.push([]);
    cardData.push([]);
  });

  return cardData;
};

/**
 * Applique le formatage pour les cartes
 */
const applyCardFormatting = (worksheet, dataCount, fieldsCount) => {
  worksheet['!cols'] = [
    { wch: 30 }, // Colonne des libellés
    { wch: 25 }  // Colonne des valeurs
  ];

  const range = XLSX.utils.decode_range(worksheet['!ref']);
  
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      
      if (!worksheet[cellAddress]) continue;
      
      const cellValue = worksheet[cellAddress].v;
      
      // Titre principal
      if (R === 0) {
        worksheet[cellAddress].s = {
          font: { bold: true, size: 16, color: { rgb: '1F4E79' } },
          alignment: { horizontal: 'center' },
          fill: { fgColor: { rgb: 'E8F1FF' } }
        };
      }
      // En-têtes d'enregistrements
      else if (cellValue && String(cellValue).includes('ENREGISTREMENT')) {
        worksheet[cellAddress].s = {
          font: { bold: true, size: 12, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '2B5394' } },
          alignment: { horizontal: 'center' },
          border: getBorders()
        };
      }
      // Lignes de données (libellés et valeurs)
      else if (cellValue && !String(cellValue).includes('ENREGISTREMENT')) {
        const isLabelColumn = C === 0;
        worksheet[cellAddress].s = {
          font: { bold: isLabelColumn, size: 10 },
          fill: { fgColor: isLabelColumn ? { rgb: 'F5F5F5' } : { rgb: 'FFFFFF' } },
          alignment: { horizontal: isLabelColumn ? 'right' : 'left', vertical: 'center' },
          border: getBorders()
        };
      }
    }
  }
};

/**
 * Utilitaires partagés
 */
const getValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date);
};

const setWorkbookProperties = (workbook, options) => {
  workbook.Props = {
    Title: options.title || 'Export vertical',
    Subject: options.subject || 'Données en format vertical - ITS Sénégal',
    Author: options.author || 'ITS Sénégal',
    Company: 'Institut de Technologie Sociale - Sénégal',
    CreatedDate: new Date(),
    ModifiedDate: new Date()
  };
};

export default {
  generateVerticalExcelFile,
  generateCardVerticalExcel
};