import React from 'react';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';
import { formatDate, formatNumber, formatCurrency } from '../../utils/formatters';

const ExcelTableExport = ({ 
  data, 
  columns, 
  filename = 'tableau', 
  title = 'Rapport',
  buttonText = 'Exporter Excel',
  buttonClassName = 'px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2'
}) => {
  
  const exportToExcel = () => {
    if (!data || data.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    // Créer un nouveau workbook
    const wb = XLSX.utils.book_new();
    
    // Préparer les données avec en-têtes
    const wsData = [];
    let currentRow = 0;

    // En-tête de l'entreprise
    wsData.push(['ITS SÉNÉGAL - Institut de Technologie Sociale']);
    wsData.push(['Immeuble ITS SN, Rue 19x06, Point E, Dakar']);
    wsData.push(['Tél: +221 33 869 45 67 | Email: contact@its.sn']);
    wsData.push([]); // Ligne vide
    currentRow = 4;

    // Titre du rapport
    wsData.push([title.toUpperCase()]);
    wsData.push([`Généré le: ${formatDate(new Date())} à ${new Date().toLocaleTimeString('fr-FR')}`]);
    wsData.push([]); // Ligne vide
    const headerRowIndex = currentRow + 3;

    // En-têtes de colonnes
    wsData.push(columns.map(col => col.label || col.header || col.key));
    
    // Données avec formatage
    data.forEach(row => {
      const rowData = columns.map(col => {
        let value = row[col.key] || row[col.dataKey] || '';
        
        // Appliquer le formatage selon le type
        if (col.format) {
          switch (col.format) {
            case 'currency':
              value = typeof value === 'number' ? value : parseFloat(value) || 0;
              break;
            case 'number':
              value = typeof value === 'number' ? value : parseFloat(value) || 0;
              break;
            case 'date':
              if (value) {
                value = typeof value === 'string' ? new Date(value) : value;
              }
              break;
            default:
              break;
          }
        }
        
        return value || '';
      });
      wsData.push(rowData);
    });

    // Ajouter statistiques si nécessaire
    if (data.length > 0) {
      wsData.push([]); // Ligne vide
      wsData.push(['STATISTIQUES']);
      wsData.push(['Nombre total de lignes:', data.length]);
      
      // Calculer des totaux pour les colonnes numériques
      columns.forEach(col => {
        if (col.format === 'number' || col.format === 'currency') {
          const total = data.reduce((sum, row) => {
            const value = parseFloat(row[col.key] || 0);
            return sum + (isNaN(value) ? 0 : value);
          }, 0);
          
          if (total > 0) {
            const label = `Total ${col.label}:`;
            const formattedTotal = col.format === 'currency' ? 
              `${formatNumber(total)} XOF` : 
              formatNumber(total);
            wsData.push([label, formattedTotal]);
          }
        }
      });
    }

    // Créer la feuille
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Configuration des largeurs de colonnes
    const colWidths = columns.map(col => {
      let width = 15;
      if (col.width) width = col.width;
      else if (col.format === 'currency') width = 18;
      else if (col.format === 'date') width = 16;
      else if (col.format === 'number') width = 12;
      return { wch: width };
    });
    ws['!cols'] = colWidths;

    // Fusionner les cellules d'en-tête
    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } }, // Titre entreprise
      { s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } }, // Adresse
      { s: { r: 2, c: 0 }, e: { r: 2, c: columns.length - 1 } }, // Contact
      { s: { r: 4, c: 0 }, e: { r: 4, c: columns.length - 1 } }, // Titre rapport
      { s: { r: 5, c: 0 }, e: { r: 5, c: columns.length - 1 } }  // Date
    ];
    ws['!merges'] = merges;

    // Appliquer des styles
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;

        // Style pour l'en-tête entreprise (0-2)
        if (R <= 2) {
          ws[cellAddress].s = {
            font: { bold: true, color: { rgb: '0066CC' }, size: R === 0 ? 14 : 11 },
            alignment: { horizontal: 'center', vertical: 'center' }
          };
        }
        // Style pour le titre du rapport (4)
        else if (R === 4) {
          ws[cellAddress].s = {
            font: { bold: true, size: 16, color: { rgb: '003366' } },
            alignment: { horizontal: 'center', vertical: 'center' }
          };
        }
        // Style pour la date (5)
        else if (R === 5) {
          ws[cellAddress].s = {
            font: { italic: true, size: 10 },
            alignment: { horizontal: 'center' }
          };
        }
        // Style pour les en-têtes de colonnes
        else if (R === headerRowIndex) {
          ws[cellAddress].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '0066CC' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } }
            }
          };
        }
        // Style pour les données
        else if (R > headerRowIndex && R < (range.e.r - (data.length > 0 ? 3 : 0))) {
          const column = columns[C];
          const isAlternateRow = (R - headerRowIndex - 1) % 2 === 1;
          
          ws[cellAddress].s = {
            alignment: { 
              horizontal: column?.format === 'currency' || column?.format === 'number' ? 'right' : 'left',
              vertical: 'center' 
            },
            fill: isAlternateRow ? { fgColor: { rgb: 'F8F9FA' } } : undefined,
            border: {
              top: { style: 'thin', color: { rgb: 'E0E0E0' } },
              bottom: { style: 'thin', color: { rgb: 'E0E0E0' } },
              left: { style: 'thin', color: { rgb: 'E0E0E0' } },
              right: { style: 'thin', color: { rgb: 'E0E0E0' } }
            }
          };

          // Format spécifique pour les devises
          if (column?.format === 'currency') {
            ws[cellAddress].z = '#,##0" XOF"';
          }
          // Format pour les nombres
          else if (column?.format === 'number') {
            ws[cellAddress].z = '#,##0';
          }
          // Format pour les dates
          else if (column?.format === 'date') {
            ws[cellAddress].z = 'dd/mm/yyyy';
          }
        }
      }
    }

    // Ajouter autofilter sur les données
    const dataEndRow = headerRowIndex + data.length;
    ws['!autofilter'] = { 
      ref: `${XLSX.utils.encode_cell({r: headerRowIndex, c: 0})}:${XLSX.utils.encode_cell({r: dataEndRow, c: columns.length - 1})}` 
    };

    // Ajouter la feuille au workbook
    XLSX.utils.book_append_sheet(wb, ws, title.substring(0, 31));

    // Propriétés du workbook
    wb.Props = {
      Title: title,
      Subject: 'Rapport généré par le système de gestion de stock ITS SN',
      Author: 'ITS Sénégal',
      CreatedDate: new Date()
    };

    // Télécharger le fichier
    const timestamp = formatDate(new Date(), 'YYYY-MM-DD_HHmmss');
    XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`, {
      compression: true,
      bookType: 'xlsx'
    });
  };

  return (
    <button
      onClick={exportToExcel}
      className={buttonClassName}
      disabled={!data || data.length === 0}
    >
      <Download className="w-4 h-4" />
      {buttonText}
    </button>
  );
};

export default ExcelTableExport;