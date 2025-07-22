import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatDate, formatCurrency } from './formatters';
import { COMPANY_INFO } from './constants';

// Générer un rapport de stock en PDF
export const generateStockReportPDF = (stockData, filters = {}) => {
    const doc = new jsPDF();
    
    // En-tête du document
    doc.setFontSize(20);
    doc.text(COMPANY_INFO.NAME, 14, 15);
    doc.setFontSize(16);
    doc.text('Rapport de Stock', 14, 25);
    
    // Informations du rapport
    doc.setFontSize(10);
    doc.text(`Date: ${formatDate(new Date())}`, 14, 35);
    if (filters.magasin) {
        doc.text(`Magasin: ${filters.magasin}`, 14, 40);
    }
    
    // Tableau des données
    const tableHeaders = ['Code', 'Produit', 'Catégorie', 'Stock', 'Unité', 'Valeur'];
    const tableData = stockData.map(item => [
        item.code,
        item.nom,
        item.categorie,
        item.quantite_actuelle.toString(),
        item.unite,
        formatCurrency(item.prix_unitaire * item.quantite_actuelle)
    ]);
    
    // Calculer le total
    const totalValue = stockData.reduce((sum, item) => 
        sum + (item.prix_unitaire * item.quantite_actuelle), 0
    );
    
    doc.autoTable({
        head: [tableHeaders],
        body: tableData,
        startY: 45,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 64, 175] }
    });
    
    // Total
    const finalY = doc.lastAutoTable.finalY || 45;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Valeur totale du stock: ${formatCurrency(totalValue)}`, 14, finalY + 10);
    
    // Sauvegarder le PDF
    doc.save(`rapport_stock_${formatDate(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Générer un rapport d'entrées en PDF
export const generateEntreesReportPDF = (entreesData, period) => {
    const doc = new jsPDF();
    
    // En-tête
    doc.setFontSize(20);
    doc.text(COMPANY_INFO.NAME, 14, 15);
    doc.setFontSize(16);
    doc.text('Rapport des Entrées', 14, 25);
    
    // Période
    doc.setFontSize(10);
    doc.text(`Période: ${period.start} - ${period.end}`, 14, 35);
    doc.text(`Date: ${formatDate(new Date())}`, 14, 40);
    
    // Tableau des entrées
    const tableHeaders = ['Date', 'N° Commande', 'Fournisseur', 'Produits', 'Montant'];
    const tableData = entreesData.map(entree => [
        formatDate(entree.date_commande),
        entree.numero_commande,
        entree.client_nom,
        entree.nombre_produits.toString(),
        formatCurrency(entree.montant_total)
    ]);
    
    // Statistiques
    const totalEntrees = entreesData.reduce((sum, entree) => sum + entree.montant_total, 0);
    const avgEntree = totalEntrees / entreesData.length || 0;
    
    doc.autoTable({
        head: [tableHeaders],
        body: tableData,
        startY: 45,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 64, 175] }
    });
    
    // Résumé
    const finalY = doc.lastAutoTable.finalY || 45;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Résumé des entrées', 14, finalY + 10);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Total des entrées: ${formatCurrency(totalEntrees)}`, 14, finalY + 18);
    doc.text(`Nombre de réceptions: ${entreesData.length}`, 14, finalY + 24);
    doc.text(`Entrée moyenne: ${formatCurrency(avgEntree)}`, 14, finalY + 30);
    
    doc.save(`rapport_entrees_${formatDate(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Générer un rapport de mouvements en PDF
export const generateMovementsReportPDF = (movementsData, filters = {}) => {
    const doc = new jsPDF('l'); // Format paysage
    
    // En-tête
    doc.setFontSize(20);
    doc.text(COMPANY_INFO.NAME, 14, 15);
    doc.setFontSize(16);
    doc.text('Rapport des Mouvements de Stock', 14, 25);
    
    // Filtres appliqués
    doc.setFontSize(10);
    doc.text(`Date: ${formatDate(new Date())}`, 14, 35);
    if (filters.dateDebut && filters.dateFin) {
        doc.text(`Période: ${formatDate(filters.dateDebut)} - ${formatDate(filters.dateFin)}`, 14, 40);
    }
    
    // Tableau des mouvements
    const tableHeaders = ['Date', 'Type', 'Produit', 'Quantité', 'Magasin', 'Utilisateur', 'Motif'];
    const tableData = movementsData.map(movement => [
        formatDate(movement.date),
        movement.type,
        movement.produit_nom,
        `${movement.type === 'sortie' ? '-' : '+'}${movement.quantite}`,
        movement.magasin || '-',
        movement.utilisateur || '-',
        movement.motif || '-'
    ]);
    
    doc.autoTable({
        head: [tableHeaders],
        body: tableData,
        startY: 45,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 64, 175] },
        columnStyles: {
            3: { halign: 'right' }
        }
    });
    
    // Statistiques par type
    const stats = movementsData.reduce((acc, mov) => {
        acc[mov.type] = (acc[mov.type] || 0) + 1;
        return acc;
    }, {});
    
    const finalY = doc.lastAutoTable.finalY || 45;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Résumé par type de mouvement', 14, finalY + 10);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    let yPos = finalY + 18;
    Object.entries(stats).forEach(([type, count]) => {
        doc.text(`${type}: ${count} mouvements`, 14, yPos);
        yPos += 6;
    });
    
    doc.save(`rapport_mouvements_${formatDate(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Générer un rapport de stock en Excel
export const generateStockReportExcel = (stockData, filters = {}) => {
    // Créer un nouveau workbook
    const wb = XLSX.utils.book_new();
    
    // Préparer les données
    const wsData = [
        // En-tête
        [`Rapport de Stock - ${COMPANY_INFO.NAME}`],
        [`Date: ${formatDate(new Date())}`],
        filters.magasin ? [`Magasin: ${filters.magasin}`] : [],
        [],
        // Headers du tableau
        ['Code', 'Produit', 'Catégorie', 'Stock Actuel', 'Unité', 'Prix Unitaire', 'Valeur Totale']
    ];
    
    // Ajouter les données
    stockData.forEach(item => {
        wsData.push([
            item.code,
            item.nom,
            item.categorie,
            item.quantite_actuelle,
            item.unite,
            item.prix_unitaire,
            item.prix_unitaire * item.quantite_actuelle
        ]);
    });
    
    // Calculer le total
    const totalValue = stockData.reduce((sum, item) => 
        sum + (item.prix_unitaire * item.quantite_actuelle), 0
    );
    
    wsData.push([]);
    wsData.push(['', '', '', '', '', 'TOTAL:', totalValue]);
    
    // Créer la feuille
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Définir les largeurs de colonnes
    ws['!cols'] = [
        { wch: 15 }, // Code
        { wch: 30 }, // Produit
        { wch: 20 }, // Catégorie
        { wch: 15 }, // Stock
        { wch: 10 }, // Unité
        { wch: 15 }, // Prix unitaire
        { wch: 15 }  // Valeur
    ];
    
    // Ajouter la feuille au workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Stock');
    
    // Générer le fichier Excel
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    
    // Convertir en blob et sauvegarder
    const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
    saveAs(blob, `rapport_stock_${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Générer un rapport d'entrées en Excel
export const generateEntreesReportExcel = (entreesData, period) => {
    const wb = XLSX.utils.book_new();
    
    // Données de la feuille principale
    const wsData = [
        [`Rapport des Entrées - ${COMPANY_INFO.NAME}`],
        [`Période: ${period.start} - ${period.end}`],
        [`Date: ${formatDate(new Date())}`],
        [],
        ['Date', 'N° Commande', 'Fournisseur', 'Nombre Produits', 'Montant Total']
    ];
    
    // Ajouter les entrées
    entreesData.forEach(entree => {
        wsData.push([
            formatDate(entree.date_commande),
            entree.numero_commande,
            entree.client_nom,
            entree.nombre_produits,
            entree.montant_total
        ]);
    });
    
    // Statistiques
    const totalEntrees = entreesData.reduce((sum, entree) => sum + entree.montant_total, 0);
    const avgEntree = totalEntrees / entreesData.length || 0;
    
    wsData.push([]);
    wsData.push(['', '', '', 'Total:', totalEntrees]);
    wsData.push(['', '', '', 'Moyenne:', avgEntree]);
    wsData.push(['', '', '', 'Nb Réceptions:', entreesData.length]);
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    ws['!cols'] = [
        { wch: 15 }, // Date
        { wch: 20 }, // N° Commande
        { wch: 30 }, // Client
        { wch: 15 }, // Nb Produits
        { wch: 15 }  // Montant
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Entrées');
    
    // Créer une feuille détaillée par produit si nécessaire
    if (entreesData.some(entree => entree.details)) {
        const detailsData = [
            ['Détails des Entrées par Produit'],
            [],
            ['Date', 'Commande', 'Produit', 'Quantité', 'Prix Unit.', 'Total']
        ];
        
        entreesData.forEach(entree => {
            if (entree.details) {
                entree.details.forEach(detail => {
                    detailsData.push([
                        formatDate(entree.date_commande),
                        entree.numero_commande,
                        detail.produit_nom,
                        detail.quantite,
                        detail.prix_unitaire,
                        detail.quantite * detail.prix_unitaire
                    ]);
                });
            }
        });
        
        const wsDetails = XLSX.utils.aoa_to_sheet(detailsData);
        XLSX.utils.book_append_sheet(wb, wsDetails, 'Détails');
    }
    
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
    saveAs(blob, `rapport_entrees_${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Générer un rapport personnalisé
export const generateCustomReport = (data, config) => {
    const { format, title, headers, filename } = config;
    
    if (format === 'pdf') {
        const doc = new jsPDF();
        
        // En-tête
        doc.setFontSize(20);
        doc.text(COMPANY_INFO.NAME, 14, 15);
        doc.setFontSize(16);
        doc.text(title, 14, 25);
        doc.setFontSize(10);
        doc.text(`Date: ${formatDate(new Date())}`, 14, 35);
        
        // Tableau
        const tableData = data.map(row => headers.map(header => row[header.key] || ''));
        
        doc.autoTable({
            head: [headers.map(h => h.label)],
            body: tableData,
            startY: 40,
            theme: 'grid',
            styles: { fontSize: 9 },
            headStyles: { fillColor: [30, 64, 175] }
        });
        
        doc.save(`${filename}.pdf`);
    } else if (format === 'excel') {
        const wb = XLSX.utils.book_new();
        
        const wsData = [
            [title],
            [`Date: ${formatDate(new Date())}`],
            [],
            headers.map(h => h.label)
        ];
        
        data.forEach(row => {
            wsData.push(headers.map(header => row[header.key] || ''));
        });
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Rapport');
        
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
        const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
        saveAs(blob, `${filename}.xlsx`);
    }
};

// Fonction utilitaire pour convertir string en ArrayBuffer
function s2ab(s) {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) {
        view[i] = s.charCodeAt(i) & 0xFF;
    }
    return buf;
}

export default {
    generateStockReportPDF,
    generateStockReportExcel,
    generateEntreesReportPDF,
    generateEntreesReportExcel,
    generateMovementsReportPDF,
    generateCustomReport
};