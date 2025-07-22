// src/components/rapports/ExportButton.jsx
import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, File, Check } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { formatDate } from '../../utils/formatters';
import { exportToPDF, exportToExcel, exportToJSON } from '../../utils/exportUtils';

const ExportButton = ({
    data,
    columns,
    filename = 'rapport',
    title = 'Exporter',
    exportTitle = 'Rapport',
    formats = ['pdf', 'excel', 'csv', 'json'],
    onExport,
    disabled = false,
    variant = 'outline',
    size = 'md',
    className = ''
}) => {
    const [showModal, setShowModal] = useState(false);
    const [selectedFormat, setSelectedFormat] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);

    // Configuration des formats d'export
    const formatConfig = {
        pdf: {
            icon: FileText,
            label: 'PDF',
            extension: '.pdf',
            mimeType: 'application/pdf',
            description: 'Document portable, id�al pour l\'impression'
        },
        excel: {
            icon: FileSpreadsheet,
            label: 'Excel',
            extension: '.xlsx',
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            description: 'Feuille de calcul, id�al pour l\'analyse'
        },
        csv: {
            icon: File,
            label: 'CSV',
            extension: '.csv',
            mimeType: 'text/csv',
            description: 'Valeurs s�par�es, compatible avec tous les tableurs'
        },
        json: {
            icon: File,
            label: 'JSON',
            extension: '.json',
            mimeType: 'application/json',
            description: 'Format de données structurées'
        }
    };

    // Convertir les donn�es en CSV
    const convertToCSV = (data) => {
        if (!data || data.length === 0) return '';

        // Extraire les en-t�tes
        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');

        // Convertir les donn�es
        const csvData = data.map(row => {
            return headers.map(header => {
                const value = row[header];
                // �chapper les valeurs contenant des virgules ou des guillemets
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value || '';
            }).join(',');
        }).join('\n');

        return `${csvHeaders}\n${csvData}`;
    };

    // Cr�er un fichier Excel simple (format HTML table)
    const createExcelFile = (data) => {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        
        let html = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="utf-8" />
                <style>
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #4CAF50; color: white; font-weight: bold; }
                    tr:nth-child(even) { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <table>
                    <thead>
                        <tr>
                            ${headers.map(h => `<th>${h}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;

        data.forEach(row => {
            html += '<tr>';
            headers.forEach(header => {
                html += `<td>${row[header] || ''}</td>`;
            });
            html += '</tr>';
        });

        html += `
                    </tbody>
                </table>
            </body>
            </html>
        `;

        return html;
    };

    // Cr�er un PDF simple (utilise l'impression du navigateur)
    const createPDFFile = (data) => {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const date = formatDate(new Date(), 'dd/MM/yyyy HH:mm');
        
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>${filename}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #333; font-size: 24px; margin-bottom: 10px; }
                    .date { color: #666; font-size: 12px; margin-bottom: 20px; }
                    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                    th { background-color: #f8f9fa; font-weight: bold; color: #333; }
                    tr:nth-child(even) { background-color: #f8f9fa; }
                    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
                    @media print {
                        body { margin: 0; }
                        table { page-break-inside: auto; }
                        tr { page-break-inside: avoid; page-break-after: auto; }
                    }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <div class="date">G�n�r� le ${date}</div>
                <table>
                    <thead>
                        <tr>
                            ${headers.map(h => `<th>${h}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;

        data.forEach(row => {
            html += '<tr>';
            headers.forEach(header => {
                html += `<td>${row[header] || ''}</td>`;
            });
            html += '</tr>';
        });

        html += `
                    </tbody>
                </table>
                <div class="footer">
                    Document g�n�r� automatiquement - Syst�me de Gestion de Stock ITS
                </div>
            </body>
            </html>
        `;

        return html;
    };

    // G�rer l'export
    const handleExport = async (format) => {
        setSelectedFormat(format);
        setIsExporting(true);
        setExportSuccess(false);

        try {
            // Si une fonction d'export personnalis�e est fournie
            if (onExport) {
                await onExport(format, data);
            } else {
                // Utiliser les nouvelles fonctions d'export
                switch (format) {
                    case 'pdf':
                        if (columns) {
                            exportToPDF(exportTitle, data, columns);
                        } else {
                            // Fallback sur l'ancienne méthode si pas de colonnes définies
                            const content = createPDFFile(data);
                            const printWindow = window.open('', '_blank');
                            printWindow.document.write(content);
                            printWindow.document.close();
                            setTimeout(() => {
                                printWindow.print();
                            }, 500);
                        }
                        break;
                    case 'excel':
                        if (columns) {
                            exportToExcel(filename, data, columns);
                        } else {
                            // Fallback sur l'ancienne méthode
                            const content = createExcelFile(data);
                            const blob = new Blob([content], { type: 'application/vnd.ms-excel' });
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `${filename}_${formatDate(new Date(), 'yyyyMMdd_HHmmss')}.xls`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(url);
                        }
                        break;
                    case 'csv':
                        const csvContent = convertToCSV(data);
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `${filename}_${formatDate(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                        break;
                    case 'json':
                        exportToJSON(filename, data);
                        break;
                    default:
                        throw new Error(`Format ${format} non support�`);
                }
            }

            setExportSuccess(true);
            setTimeout(() => {
                setExportSuccess(false);
                setShowModal(false);
                setSelectedFormat('');
            }, 1500);
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
            alert('Une erreur est survenue lors de l\'export');
        } finally {
            setIsExporting(false);
        }
    };

    // Filtrer les formats disponibles
    const availableFormats = formats.filter(f => formatConfig[f]);

    return (
        <>
            <Button
                variant={variant}
                size={size}
                onClick={() => setShowModal(true)}
                disabled={disabled || !data || data.length === 0}
                className={`flex items-center space-x-2 ${className}`}
            >
                <Download className="h-4 w-4" />
                <span>{title}</span>
            </Button>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                size="sm"
            >
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Choisir le format d'export
                    </h3>

                    <div className="space-y-3">
                        {availableFormats.map((format) => {
                            const config = formatConfig[format];
                            const Icon = config.icon;
                            const isSelected = selectedFormat === format;

                            return (
                                <button
                                    key={format}
                                    onClick={() => handleExport(format)}
                                    disabled={isExporting}
                                    className={`w-full flex items-center p-4 rounded-lg border transition-all ${
                                        isSelected && exportSuccess
                                            ? 'border-green-500 bg-green-50'
                                            : isSelected && isExporting
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    } ${isExporting ? 'cursor-wait' : 'cursor-pointer'}`}
                                >
                                    <div className={`p-3 rounded-lg ${
                                        isSelected && exportSuccess
                                            ? 'bg-green-100'
                                            : isSelected && isExporting
                                            ? 'bg-blue-100'
                                            : 'bg-gray-100'
                                    }`}>
                                        {isSelected && exportSuccess ? (
                                            <Check className="h-6 w-6 text-green-600" />
                                        ) : (
                                            <Icon className={`h-6 w-6 ${
                                                isSelected && isExporting
                                                    ? 'text-blue-600'
                                                    : 'text-gray-600'
                                            }`} />
                                        )}
                                    </div>
                                    <div className="ml-4 text-left flex-1">
                                        <p className="font-medium text-gray-900">
                                            {config.label}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {config.description}
                                        </p>
                                    </div>
                                    {isSelected && isExporting && (
                                        <div className="ml-4">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setShowModal(false)}
                            disabled={isExporting}
                        >
                            Annuler
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default ExportButton;