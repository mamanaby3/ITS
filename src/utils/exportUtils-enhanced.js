// Utilitaires améliorés pour l'export de données avec design professionnel
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, formatDate } from './formatters';

// Configuration du logo ITS (en base64)
const ITS_LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // Logo placeholder

// Styles pour les exports
const STYLES = {
  primaryColor: '#0066cc',
  secondaryColor: '#003366',
  accentColor: '#ff6600',
  backgroundColor: '#f8f9fa',
  borderColor: '#dee2e6',
  headerGradient: ['#0066cc', '#004499'],
  fonts: {
    title: 'Arial Bold',
    body: 'Arial',
    header: 'Arial Bold'
  }
};

// Fonction utilitaire pour obtenir le logo depuis l'URL publique
const getLogoBase64 = async () => {
  try {
    const response = await fetch('/logo-its.png');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Logo non trouvé, utilisation du placeholder');
    return ITS_LOGO_BASE64;
  }
};

// Export PDF amélioré avec jsPDF
export const exportToPDFEnhanced = async (title, data, columns, options = {}) => {
  const pdf = new jsPDF({
    orientation: options.orientation || 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Obtenir le logo
  const logoBase64 = await getLogoBase64();

  // Configuration des marges
  const margins = {
    top: 20,
    left: 15,
    right: 15,
    bottom: 20
  };

  // En-tête avec logo et informations de l'entreprise
  const addHeader = (pageNumber) => {
    // Rectangle de fond pour l'en-tête
    pdf.setFillColor(0, 102, 204);
    pdf.rect(0, 0, 210, 40, 'F');

    // Logo
    try {
      pdf.addImage(logoBase64, 'PNG', margins.left, 10, 30, 20);
    } catch (error) {
      console.warn('Erreur lors de l\'ajout du logo');
    }

    // Informations de l'entreprise
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ITS SÉNÉGAL', 50, 18);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Institut de Technologie Sociale', 50, 24);
    pdf.text('Immeuble ITS SN, Rue 19x06, Point E, Dakar', 50, 28);
    pdf.text('Tél: +221 33 869 45 67 | Email: contact@its.sn', 50, 32);

    // Date et heure d'impression
    pdf.setFontSize(9);
    pdf.text(`Imprimé le: ${formatDate(new Date())} à ${new Date().toLocaleTimeString('fr-FR')}`, 140, 32);

    // Titre du document
    pdf.setTextColor(0, 51, 102);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title.toUpperCase(), 105, 55, { align: 'center' });

    // Ligne de séparation
    pdf.setDrawColor(255, 102, 0);
    pdf.setLineWidth(0.5);
    pdf.line(margins.left, 60, 210 - margins.right, 60);
  };

  // Pied de page
  const addFooter = (pageNumber, totalPages) => {
    const pageHeight = pdf.internal.pageSize.height;
    
    // Rectangle de fond pour le pied de page
    pdf.setFillColor(248, 249, 250);
    pdf.rect(0, pageHeight - 20, 210, 20, 'F');

    // Ligne de séparation
    pdf.setDrawColor(222, 226, 230);
    pdf.setLineWidth(0.5);
    pdf.line(margins.left, pageHeight - 20, 210 - margins.right, pageHeight - 20);

    // Texte du pied de page
    pdf.setTextColor(108, 117, 125);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    
    // Informations à gauche
    pdf.text('Document généré automatiquement par le système de gestion de stock ITS SN', margins.left, pageHeight - 10);
    pdf.text(`© ${new Date().getFullYear()} ITS Sénégal - Tous droits réservés`, margins.left, pageHeight - 6);

    // Numéro de page à droite
    pdf.text(`Page ${pageNumber} sur ${totalPages}`, 210 - margins.right - 20, pageHeight - 10);
  };

  // Ajouter la première page
  addHeader(1);

  // Préparer les données du tableau
  const tableData = data.map(row => {
    return columns.map(col => {
      let value = row[col.key] || '-';
      
      // Formater selon le type
      if (col.type === 'currency' && value !== '-') {
        value = formatCurrency(value);
      } else if (col.type === 'date' && value !== '-') {
        value = formatDate(value);
      } else if (col.type === 'number' && value !== '-') {
        value = value.toLocaleString('fr-FR');
      }
      
      return value;
    });
  });

  // Configuration du tableau avec autoTable
  pdf.autoTable({
    head: [columns.map(col => col.label)],
    body: tableData,
    startY: 70,
    margin: { left: margins.left, right: margins.right },
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
      lineColor: [222, 226, 230],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [0, 102, 204],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250]
    },
    columnStyles: columns.reduce((acc, col, index) => {
      acc[index] = {
        halign: col.type === 'currency' || col.type === 'number' ? 'right' : 'left'
      };
      return acc;
    }, {}),
    didDrawPage: function(data) {
      // Ajouter le pied de page sur chaque page
      addFooter(data.pageNumber, pdf.internal.getNumberOfPages());
    }
  });

  // Ajouter un résumé si fourni
  if (options.summary) {
    const finalY = pdf.lastAutoTable.finalY || 70;
    
    pdf.setFillColor(248, 249, 250);
    pdf.rect(margins.left, finalY + 10, 180, 30, 'F');
    
    pdf.setTextColor(0, 51, 102);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RÉSUMÉ', margins.left + 5, finalY + 20);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    let yPos = finalY + 28;
    Object.entries(options.summary).forEach(([key, value]) => {
      pdf.text(`${key}: ${value}`, margins.left + 5, yPos);
      yPos += 6;
    });
  }

  // Sauvegarder le PDF
  pdf.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${formatDate(new Date(), 'YYYY-MM-DD')}.pdf`);
};

// Export Excel amélioré avec XLSX et styles
export const exportToExcelEnhanced = async (filename, data, columns, options = {}) => {
  // Créer un nouveau workbook
  const wb = XLSX.utils.book_new();

  // Préparer les données avec en-tête stylisé
  const wsData = [];
  let currentRow = 0;

  // En-tête de l'entreprise (fusionné)
  wsData.push(['ITS SÉNÉGAL - Institut de Technologie Sociale']);
  wsData.push(['Immeuble ITS SN, Rue 19x06, Point E, Dakar']);
  wsData.push(['Tél: +221 33 869 45 67 | Email: contact@its.sn']);
  wsData.push([]); // Ligne vide
  currentRow = 4;

  // Titre du rapport
  wsData.push([options.title || filename.toUpperCase()]);
  wsData.push([`Généré le: ${formatDate(new Date())} à ${new Date().toLocaleTimeString('fr-FR')}`]);
  wsData.push([]); // Ligne vide
  const headerRowIndex = currentRow + 3;

  // En-têtes de colonnes
  wsData.push(columns.map(col => col.label));
  const dataStartRow = headerRowIndex + 1;

  // Données avec formatage approprié
  data.forEach(row => {
    const rowData = columns.map(col => {
      let value = row[col.key];
      
      // Traitement spécial pour les différents types
      if (col.type === 'currency' && value !== null && value !== undefined) {
        return typeof value === 'number' ? value : parseFloat(value) || 0;
      } else if (col.type === 'number' && value !== null && value !== undefined) {
        return typeof value === 'number' ? value : parseFloat(value) || 0;
      } else if (col.type === 'date' && value) {
        // Garder la date comme objet Date pour Excel
        return typeof value === 'string' ? new Date(value) : value;
      }
      
      return value || '';
    });
    wsData.push(rowData);
  });

  // Ajouter un résumé si fourni
  let summaryStartRow = null;
  if (options.summary) {
    wsData.push([]); // Ligne vide
    summaryStartRow = wsData.length;
    wsData.push(['RÉSUMÉ']);
    Object.entries(options.summary).forEach(([key, value]) => {
      wsData.push([key, value]);
    });
  }

  // Créer la feuille
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Configuration des largeurs de colonnes avec auto-ajustement
  const colWidths = columns.map(col => {
    let width = col.width || 15;
    // Ajuster selon le type de colonne
    if (col.type === 'currency') width = Math.max(width, 18);
    if (col.type === 'date') width = Math.max(width, 16);
    return { wch: width };
  });
  ws['!cols'] = colWidths;

  // Fusionner les cellules de l'en-tête
  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } }, // Titre entreprise
    { s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } }, // Adresse
    { s: { r: 2, c: 0 }, e: { r: 2, c: columns.length - 1 } }, // Contact
    { s: { r: 4, c: 0 }, e: { r: 4, c: columns.length - 1 } }, // Titre rapport
    { s: { r: 5, c: 0 }, e: { r: 5, c: columns.length - 1 } }  // Date
  ];

  // Ajouter fusionnement pour le résumé si présent
  if (summaryStartRow !== null) {
    merges.push({ s: { r: summaryStartRow, c: 0 }, e: { r: summaryStartRow, c: columns.length - 1 } });
  }

  ws['!merges'] = merges;

  // Appliquer des styles pour un meilleur rendu
  const range = XLSX.utils.decode_range(ws['!ref']);
  
  // Styles pour les cellules
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
      else if (R > headerRowIndex && R < (summaryStartRow || range.e.r + 1)) {
        const column = columns[C];
        const isAlternateRow = (R - dataStartRow) % 2 === 1;
        
        ws[cellAddress].s = {
          alignment: { 
            horizontal: column?.type === 'currency' || column?.type === 'number' ? 'right' : 'left',
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
        if (column?.type === 'currency') {
          ws[cellAddress].z = '#,##0" XOF"';
        }
        // Format pour les nombres
        else if (column?.type === 'number') {
          ws[cellAddress].z = '#,##0';
        }
        // Format pour les dates
        else if (column?.type === 'date') {
          ws[cellAddress].z = 'dd/mm/yyyy';
        }
      }
      // Style pour le résumé
      else if (summaryStartRow !== null && R >= summaryStartRow) {
        if (R === summaryStartRow) {
          ws[cellAddress].s = {
            font: { bold: true, size: 12, color: { rgb: '003366' } },
            alignment: { horizontal: 'center' }
          };
        } else {
          ws[cellAddress].s = {
            font: { bold: C === 0 },
            alignment: { horizontal: C === 0 ? 'left' : 'right' }
          };
        }
      }
    }
  }

  // Définir la zone d'impression pour un meilleur rendu
  ws['!printHeader'] = [0, headerRowIndex];
  ws['!autofilter'] = { ref: `${XLSX.utils.encode_cell({r: headerRowIndex, c: 0})}:${XLSX.utils.encode_cell({r: dataStartRow + data.length - 1, c: columns.length - 1})}` };

  // Ajouter la feuille au workbook avec nom approprié
  const sheetName = options.title ? options.title.substring(0, 31) : 'Rapport';
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Propriétés du workbook
  wb.Props = {
    Title: options.title || filename,
    Subject: 'Rapport généré par le système de gestion de stock ITS SN',
    Author: 'ITS Sénégal',
    CreatedDate: new Date()
  };

  // Écrire le fichier avec compression
  XLSX.writeFile(wb, `${filename}_${formatDate(new Date(), 'YYYY-MM-DD')}.xlsx`, {
    compression: true,
    bookType: 'xlsx'
  });
};

// Export de rapport de stock amélioré
export const exportStockReportEnhanced = async (stocks, format = 'pdf') => {
  const columns = [
    { key: 'reference', label: 'Référence', type: 'text', width: 15 },
    { key: 'nom', label: 'Produit', type: 'text', width: 30 },
    { key: 'categorie', label: 'Catégorie', type: 'text', width: 20 },
    { key: 'magasin', label: 'Magasin', type: 'text', width: 20 },
    { key: 'quantite', label: 'Quantité', type: 'number', width: 12 },
    { key: 'unite', label: 'Unité', type: 'text', width: 10 },
    { key: 'prix', label: 'Prix Unit.', type: 'currency', width: 15 },
    { key: 'valeurTotale', label: 'Valeur Totale', type: 'currency', width: 18 }
  ];

  // Préparer les données
  const data = stocks.map(stock => ({
    ...stock,
    valeurTotale: (stock.quantite || 0) * (stock.prix || 0)
  }));

  // Calculer le résumé
  const summary = {
    'Nombre total de produits': data.length,
    'Quantité totale': data.reduce((sum, item) => sum + (item.quantite || 0), 0).toLocaleString('fr-FR'),
    'Valeur totale du stock': formatCurrency(data.reduce((sum, item) => sum + item.valeurTotale, 0))
  };

  const options = {
    title: 'Rapport de Stock',
    summary,
    orientation: 'landscape'
  };

  if (format === 'pdf') {
    await exportToPDFEnhanced('Rapport de Stock', data, columns, options);
  } else if (format === 'excel') {
    await exportToExcelEnhanced('rapport_stock', data, columns, options);
  }
};

// Export de rapport de commandes amélioré
export const exportOrdersReportEnhanced = async (orders, format = 'pdf') => {
  const columns = [
    { key: 'numero', label: 'N° Commande', type: 'text', width: 20 },
    { key: 'date', label: 'Date', type: 'date', width: 15 },
    { key: 'client', label: 'Client', type: 'text', width: 30 },
    { key: 'statut', label: 'Statut', type: 'text', width: 15 },
    { key: 'nombreProduits', label: 'Nb Produits', type: 'number', width: 12 },
    { key: 'montantTotal', label: 'Montant Total', type: 'currency', width: 20 }
  ];

  // Préparer les données
  const data = orders.map(order => ({
    numero: order.numero,
    date: order.date,
    client: order.client?.nom || 'N/A',
    statut: order.statut,
    nombreProduits: order.produits?.length || 0,
    montantTotal: order.montantTotal || 0
  }));

  // Calculer le résumé
  const summary = {
    'Nombre total de commandes': data.length,
    'Commandes en attente': data.filter(o => o.statut === 'en_attente').length,
    'Commandes validées': data.filter(o => o.statut === 'validee').length,
    'Montant total': formatCurrency(data.reduce((sum, item) => sum + (item.montantTotal || 0), 0))
  };

  const options = {
    title: 'Rapport des Commandes',
    summary,
    orientation: 'portrait'
  };

  if (format === 'pdf') {
    await exportToPDFEnhanced('Rapport des Commandes', data, columns, options);
  } else if (format === 'excel') {
    await exportToExcelEnhanced('rapport_commandes', data, columns, options);
  }
};

// Export de bon de livraison amélioré
export const exportBonLivraisonEnhanced = async (livraison) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const logoBase64 = await getLogoBase64();
  const margins = { top: 20, left: 15, right: 15, bottom: 20 };

  // En-tête avec logo
  try {
    pdf.addImage(logoBase64, 'PNG', margins.left, 10, 30, 20);
  } catch (error) {
    console.warn('Erreur lors de l\'ajout du logo');
  }

  // Informations de l'entreprise
  pdf.setTextColor(0, 102, 204);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ITS SÉNÉGAL', 50, 18);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Institut de Technologie Sociale', 50, 24);
  pdf.text('Immeuble ITS SN, Rue 19x06, Point E, Dakar', 50, 28);

  // Informations du bon de livraison
  pdf.setFontSize(9);
  pdf.text(`N° BL: ${livraison.numero}`, 150, 18);
  pdf.text(`Date: ${formatDate(livraison.date)}`, 150, 23);
  pdf.text(`N° Commande: ${livraison.commande?.numero || 'N/A'}`, 150, 28);

  // Titre
  pdf.setTextColor(0, 51, 102);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BON DE LIVRAISON', 105, 45, { align: 'center' });

  // Ligne de séparation
  pdf.setDrawColor(255, 102, 0);
  pdf.setLineWidth(0.5);
  pdf.line(margins.left, 50, 210 - margins.right, 50);

  // Cadres d'information
  const infoY = 60;
  
  // Cadre client
  pdf.setFillColor(248, 249, 250);
  pdf.rect(margins.left, infoY, 85, 35, 'F');
  pdf.setDrawColor(222, 226, 230);
  pdf.rect(margins.left, infoY, 85, 35);
  
  pdf.setTextColor(0, 51, 102);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('LIVRER À:', margins.left + 3, infoY + 7);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(livraison.client?.nom || 'N/A', margins.left + 3, infoY + 14);
  pdf.text(livraison.client?.adresse || '', margins.left + 3, infoY + 19);
  pdf.text(`Tél: ${livraison.client?.telephone || ''}`, margins.left + 3, infoY + 24);
  pdf.text(`Email: ${livraison.client?.email || ''}`, margins.left + 3, infoY + 29);

  // Cadre transporteur
  pdf.setFillColor(248, 249, 250);
  pdf.rect(110, infoY, 85, 35, 'F');
  pdf.rect(110, infoY, 85, 35);
  
  pdf.setTextColor(0, 51, 102);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TRANSPORTEUR:', 113, infoY + 7);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(livraison.transporteur || 'À définir', 113, infoY + 14);
  pdf.text(`Véhicule: ${livraison.vehicule || 'N/A'}`, 113, infoY + 19);
  pdf.text(`Chauffeur: ${livraison.chauffeur || 'N/A'}`, 113, infoY + 24);

  // Tableau des produits
  const tableData = livraison.produits?.map(item => [
    item.produit?.reference || 'N/A',
    item.produit?.nom || 'N/A',
    item.quantiteCommandee.toString(),
    item.quantiteLivree.toString(),
    item.produit?.unite || 'N/A'
  ]) || [];

  pdf.autoTable({
    head: [['Référence', 'Désignation', 'Qté Commandée', 'Qté Livrée', 'Unité']],
    body: tableData,
    startY: 105,
    margin: { left: margins.left, right: margins.right },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [0, 102, 204],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250]
    }
  });

  // Signatures
  const signY = pdf.lastAutoTable.finalY + 30;
  
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  
  // Signature livreur
  pdf.line(margins.left, signY, margins.left + 70, signY);
  pdf.setFontSize(9);
  pdf.text('Signature et cachet du livreur', margins.left + 35, signY + 5, { align: 'center' });
  
  // Signature client
  pdf.line(125, signY, 195, signY);
  pdf.text('Signature et cachet du client', 160, signY + 5, { align: 'center' });

  // Pied de page
  const pageHeight = pdf.internal.pageSize.height;
  pdf.setTextColor(108, 117, 125);
  pdf.setFontSize(8);
  pdf.text('Document à conserver', 105, pageHeight - 15, { align: 'center' });
  pdf.text(`© ${new Date().getFullYear()} ITS Sénégal - Tous droits réservés`, 105, pageHeight - 10, { align: 'center' });

  // Sauvegarder le PDF
  pdf.save(`BL_${livraison.numero}_${formatDate(new Date(), 'YYYY-MM-DD')}.pdf`);
};

// Export de facture améliorée
export const exportFactureEnhanced = async (facture) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const logoBase64 = await getLogoBase64();
  const margins = { top: 20, left: 15, right: 15, bottom: 20 };

  // En-tête similaire au bon de livraison mais adapté pour facture
  // ... (code similaire avec adaptations pour facture)

  pdf.save(`Facture_${facture.numero}_${formatDate(new Date(), 'YYYY-MM-DD')}.pdf`);
};

// Export par défaut
export {
  exportToPDFEnhanced as exportToPDF,
  exportToExcelEnhanced as exportToExcel,
  exportStockReportEnhanced as exportStockReport,
  exportOrdersReportEnhanced as exportOrdersReport,
  exportBonLivraisonEnhanced as exportBonLivraison
};