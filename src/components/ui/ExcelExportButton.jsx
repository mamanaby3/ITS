import React, { useState } from 'react';
import { Download, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { generateExcelFile, exportStockToExcel, exportRotationsToExcel, exportCommandesToExcel } from '../../utils/excelExport';

const ExcelExportButton = ({ 
  data, 
  columns, 
  filename = 'export', 
  type = 'custom', // 'custom', 'stock', 'rotations', 'commandes'
  title = 'Exporter Excel',
  className = '',
  disabled = false,
  size = 'md'
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null); // null, 'success', 'error'

  const handleExport = async () => {
    if (!data || data.length === 0) {
      setExportStatus('error');
      setTimeout(() => setExportStatus(null), 3000);
      return;
    }

    setIsExporting(true);
    setExportStatus(null);

    try {
      let result;

      switch (type) {
        case 'stock':
          result = await exportStockToExcel(data, filename);
          break;
        
        case 'rotations':
          result = await exportRotationsToExcel(data, filename);
          break;
        
        case 'commandes':
          result = await exportCommandesToExcel(data, filename);
          break;
        
        default:
          if (!columns) {
            throw new Error('Configuration des colonnes requise pour l\'export personnalisé');
          }
          result = await generateExcelFile(data, columns, filename);
          break;
      }

      if (result.success) {
        setExportStatus('success');
        setTimeout(() => setExportStatus(null), 3000);
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      setExportStatus('error');
      setTimeout(() => setExportStatus(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  const getButtonClasses = () => {
    let baseClasses = `
      ${getSizeClasses()} 
      font-medium rounded-md transition-all duration-200 
      flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2
    `;

    if (disabled || !data || data.length === 0) {
      return `${baseClasses} bg-gray-300 text-gray-500 cursor-not-allowed`;
    }

    if (exportStatus === 'success') {
      return `${baseClasses} bg-green-600 text-white hover:bg-green-700 focus:ring-green-500`;
    }

    if (exportStatus === 'error') {
      return `${baseClasses} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
    }

    if (isExporting) {
      return `${baseClasses} bg-blue-500 text-white cursor-wait`;
    }

    return `${baseClasses} bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 ${className}`;
  };

  const getIcon = () => {
    if (exportStatus === 'success') {
      return <CheckCircle className="w-4 h-4" />;
    }

    if (exportStatus === 'error') {
      return <AlertCircle className="w-4 h-4" />;
    }

    if (isExporting) {
      return (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      );
    }

    return <FileSpreadsheet className="w-4 h-4" />;
  };

  const getButtonText = () => {
    if (exportStatus === 'success') {
      return 'Exporté !';
    }

    if (exportStatus === 'error') {
      return 'Erreur';
    }

    if (isExporting) {
      return 'Export...';
    }

    return title;
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || isExporting || !data || data.length === 0}
      className={getButtonClasses()}
      title={!data || data.length === 0 ? 'Aucune donnée à exporter' : `Exporter ${data.length} ligne(s) vers Excel`}
    >
      {getIcon()}
      {getButtonText()}
    </button>
  );
};

// Composants spécialisés pour différents types d'exports
export const StockExportButton = ({ data, filename = 'stock', ...props }) => (
  <ExcelExportButton 
    data={data} 
    type="stock" 
    filename={filename} 
    title="Exporter Stock"
    {...props} 
  />
);

export const RotationsExportButton = ({ data, filename = 'rotations', ...props }) => (
  <ExcelExportButton 
    data={data} 
    type="rotations" 
    filename={filename} 
    title="Exporter Rotations"
    {...props} 
  />
);

export const CommandesExportButton = ({ data, filename = 'commandes', ...props }) => (
  <ExcelExportButton 
    data={data} 
    type="commandes" 
    filename={filename} 
    title="Exporter Commandes"
    {...props} 
  />
);

export default ExcelExportButton;