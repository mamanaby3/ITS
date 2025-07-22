// Utilitaires pour l'export de données
import { formatCurrency, formatDate } from './formatters';

// Importer les fonctions améliorées
import {
  exportToPDFEnhanced,
  exportToExcelEnhanced,
  exportStockReportEnhanced,
  exportOrdersReportEnhanced,
  exportBonLivraisonEnhanced
} from './exportUtils-enhanced';

// Export PDF en utilisant une table HTML et window.print()
export const exportToPDF = (title, data, columns) => {
  // Créer une fenêtre d'impression
  const printWindow = window.open('', '_blank');
  
  // Générer le HTML pour le PDF
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @media print {
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
          }
          h1 {
            text-align: center;
            color: #333;
            margin-bottom: 20px;
          }
          .header-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        }
      </style>
    </head>
    <body>
      <h1>ITS Sénégal - ${title}</h1>
      <div class="header-info">
        <div>
          <strong>Institut de Technologie Sociale</strong><br>
          Immeuble ITS SN, Rue 19x06<br>
          Point E, Dakar - Sénégal<br>
          Tél: +221 33 869 45 67
        </div>
        <div style="text-align: right;">
          <strong>Date d'impression:</strong> ${formatDate(new Date())}<br>
          <strong>Heure:</strong> ${new Date().toLocaleTimeString('fr-FR')}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${col.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${columns.map(col => {
                const value = row[col.key];
                let displayValue = value || '-';
                
                // Formater selon le type
                if (col.type === 'currency') {
                  displayValue = formatCurrency(value);
                } else if (col.type === 'date') {
                  displayValue = formatDate(value);
                } else if (col.type === 'number') {
                  displayValue = value?.toLocaleString('fr-FR') || '0';
                }
                
                return `<td>${displayValue}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">
        <p>Document généré automatiquement par le système de gestion de stock ITS SN</p>
        <p>© ${new Date().getFullYear()} ITS Sénégal - Tous droits réservés</p>
      </div>
    </body>
    </html>
  `;
  
  // Écrire le HTML dans la fenêtre
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Déclencher l'impression
  printWindow.onload = () => {
    printWindow.print();
    printWindow.onafterprint = () => {
      printWindow.close();
    };
  };
};

// Export Excel en utilisant CSV
export const exportToExcel = (filename, data, columns) => {
  // Créer l'en-tête CSV
  const headers = columns.map(col => col.label).join(',');
  
  // Créer les lignes de données
  const rows = data.map(row => {
    return columns.map(col => {
      let value = row[col.key] || '';
      
      // Formater selon le type
      if (col.type === 'currency' && value) {
        value = formatCurrency(value);
      } else if (col.type === 'date' && value) {
        value = formatDate(value);
      } else if (col.type === 'number' && value) {
        value = value.toLocaleString('fr-FR');
      }
      
      // Échapper les virgules et guillemets dans les valeurs
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    }).join(',');
  });
  
  // Combiner tout
  const csv = [headers, ...rows].join('\n');
  
  // Ajouter BOM pour Excel (UTF-8)
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csv;
  
  // Créer et télécharger le fichier
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${formatDate(new Date(), 'YYYY-MM-DD')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Libérer l'URL
  URL.revokeObjectURL(url);
};

// Export JSON
export const exportToJSON = (filename, data) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${formatDate(new Date(), 'YYYY-MM-DD')}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// Export de rapport de stock complet
export const exportStockReport = async (stocks, format = 'pdf') => {
  // Utiliser la version améliorée
  return exportStockReportEnhanced(stocks, format);
};

// Version legacy pour compatibilité
export const exportStockReportLegacy = (stocks, format = 'pdf') => {
  const columns = [
    { key: 'reference', label: 'Référence', type: 'text' },
    { key: 'nom', label: 'Produit', type: 'text' },
    { key: 'categorie', label: 'Catégorie', type: 'text' },
    { key: 'entrepot', label: 'Entrepôt', type: 'text' },
    { key: 'quantite', label: 'Quantité', type: 'number' },
    { key: 'unite', label: 'Unité', type: 'text' },
    { key: 'valeurUnitaire', label: 'Valeur Unit.', type: 'currency' },
    { key: 'valeurTotale', label: 'Valeur Totale', type: 'currency' }
  ];
  
  // Préparer les données
  const data = stocks.map(stock => ({
    ...stock,
    valeurTotale: stock.quantite * stock.valeurUnitaire
  }));
  
  if (format === 'pdf') {
    exportToPDF('Rapport de Stock', data, columns);
  } else if (format === 'excel') {
    exportToExcel('rapport_stock', data, columns);
  } else if (format === 'json') {
    exportToJSON('rapport_stock', data);
  }
};

// Export de rapport de commandes
export const exportOrdersReport = async (orders, format = 'pdf') => {
  // Utiliser la version améliorée
  return exportOrdersReportEnhanced(orders, format);
};

// Version legacy pour compatibilité
export const exportOrdersReportLegacy = (orders, format = 'pdf') => {
  const columns = [
    { key: 'numero', label: 'N° Commande', type: 'text' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'client', label: 'Client', type: 'text' },
    { key: 'statut', label: 'Statut', type: 'text' },
    { key: 'nombreProduits', label: 'Nb Produits', type: 'number' },
    { key: 'montantTotal', label: 'Montant Total', type: 'currency' }
  ];
  
  // Préparer les données
  const data = orders.map(order => ({
    numero: order.numero,
    date: order.date,
    client: order.client?.nom || 'N/A',
    statut: order.statut,
    nombreProduits: order.produits?.length || 0,
    montantTotal: order.montantTotal
  }));
  
  if (format === 'pdf') {
    exportToPDF('Rapport des Commandes', data, columns);
  } else if (format === 'excel') {
    exportToExcel('rapport_commandes', data, columns);
  } else if (format === 'json') {
    exportToJSON('rapport_commandes', orders);
  }
};

// Export de bon de livraison
export const exportBonLivraison = async (livraison) => {
  // Utiliser la version améliorée
  return exportBonLivraisonEnhanced(livraison);
};

// Version legacy pour compatibilité
export const exportBonLivraisonLegacy = (livraison) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bon de Livraison - ${livraison.numero}</title>
      <style>
        @media print {
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .company-info h2 {
            margin: 0;
            color: #0066cc;
          }
          .doc-info {
            text-align: right;
          }
          .doc-title {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            text-decoration: underline;
          }
          .info-section {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
          }
          .info-box {
            border: 1px solid #ddd;
            padding: 10px;
            width: 48%;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
          }
          .signature-box {
            width: 40%;
            text-align: center;
            border-top: 1px solid #333;
            padding-top: 10px;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <h2>ITS SÉNÉGAL</h2>
          <p>Institut de Technologie Sociale<br>
          Immeuble ITS SN, Rue 19x06<br>
          Point E, Dakar - Sénégal<br>
          Tél: +221 33 869 45 67</p>
        </div>
        <div class="doc-info">
          <p><strong>N° BL:</strong> ${livraison.numero}<br>
          <strong>Date:</strong> ${formatDate(livraison.date)}<br>
          <strong>N° Commande:</strong> ${livraison.commande?.numero || 'N/A'}</p>
        </div>
      </div>
      
      <h1 class="doc-title">BON DE LIVRAISON</h1>
      
      <div class="info-section">
        <div class="info-box">
          <h3>Livrer à:</h3>
          <p><strong>${livraison.client?.nom || 'N/A'}</strong><br>
          ${livraison.client?.adresse || ''}<br>
          Tél: ${livraison.client?.telephone || ''}<br>
          Email: ${livraison.client?.email || ''}</p>
        </div>
        <div class="info-box">
          <h3>Transporteur:</h3>
          <p><strong>${livraison.transporteur || 'À définir'}</strong><br>
          Véhicule: ${livraison.vehicule || 'N/A'}<br>
          Chauffeur: ${livraison.chauffeur || 'N/A'}</p>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Référence</th>
            <th>Désignation</th>
            <th>Quantité Commandée</th>
            <th>Quantité Livrée</th>
            <th>Unité</th>
          </tr>
        </thead>
        <tbody>
          ${livraison.produits?.map(item => `
            <tr>
              <td>${item.produit?.reference || 'N/A'}</td>
              <td>${item.produit?.nom || 'N/A'}</td>
              <td>${item.quantiteCommandee}</td>
              <td>${item.quantiteLivree}</td>
              <td>${item.produit?.unite || 'N/A'}</td>
            </tr>
          `).join('') || '<tr><td colspan="5">Aucun produit</td></tr>'}
        </tbody>
      </table>
      
      <div class="signatures">
        <div class="signature-box">
          <p>Signature et cachet du livreur</p>
        </div>
        <div class="signature-box">
          <p>Signature et cachet du client</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
    printWindow.onafterprint = () => {
      printWindow.close();
    };
  };
};