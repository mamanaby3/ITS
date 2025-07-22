import React, { useState } from 'react';
import { FileSpreadsheet, LayoutGrid, CheckCircle, AlertCircle } from 'lucide-react';
import { generateVerticalExcelFile, generateCardVerticalExcel } from '../../utils/verticalExcelExport';

const VerticalExcelExportButton = ({ 
  data, 
  columns, 
  filename = 'export_vertical', 
  format = 'vertical', // 'vertical' ou 'cards'
  title = 'Export Vertical',
  className = '',
  disabled = false,
  size = 'md'
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);

  const handleExport = async () => {
    if (!data || data.length === 0) {
      setExportStatus('error');
      setTimeout(() => setExportStatus(null), 3000);
      return;
    }

    if (!columns || columns.length === 0) {
      setExportStatus('error');
      setTimeout(() => setExportStatus(null), 3000);
      return;
    }

    setIsExporting(true);
    setExportStatus(null);

    try {
      let result;
      
      if (format === 'cards') {
        result = await generateCardVerticalExcel(data, columns, filename, {
          title: `${title} - Format Cartes`,
          sheetName: 'Cartes Verticales'
        });
      } else {
        result = await generateVerticalExcelFile(data, columns, filename, {
          title: `${title} - Format Vertical`,
          sheetName: 'Tableau Vertical'
        });
      }

      if (result.success) {
        setExportStatus('success');
        setTimeout(() => setExportStatus(null), 3000);
      }
    } catch (error) {
      console.error('Erreur lors de l\'export vertical:', error);
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
      return `${baseClasses} bg-purple-500 text-white cursor-wait`;
    }

    return `${baseClasses} bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500 ${className}`;
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

    return format === 'cards' ? <LayoutGrid className="w-4 h-4" /> : <FileSpreadsheet className="w-4 h-4" />;
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

  const getTooltip = () => {
    if (!data || data.length === 0) {
      return 'Aucune donnée à exporter';
    }
    
    if (format === 'cards') {
      return `Exporter ${data.length} enregistrement(s) en format cartes verticales`;
    }
    
    return `Exporter ${data.length} enregistrement(s) en colonnes verticales`;
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || isExporting || !data || data.length === 0}
      className={getButtonClasses()}
      title={getTooltip()}
    >
      {getIcon()}
      {getButtonText()}
    </button>
  );
};

// Composants spécialisés pour différents formats verticaux

// Export en colonnes verticales (tableau transposé)
export const VerticalTableExportButton = ({ data, columns, filename = 'tableau_vertical', ...props }) => (
  <VerticalExcelExportButton 
    data={data} 
    columns={columns}
    format="vertical"
    filename={filename} 
    title="Export Colonnes ↕"
    {...props} 
  />
);

// Export en cartes verticales (chaque enregistrement = bloc)
export const CardExportButton = ({ data, columns, filename = 'cartes_verticales', ...props }) => (
  <VerticalExcelExportButton 
    data={data} 
    columns={columns}
    format="cards"
    filename={filename} 
    title="Export Cartes 📋"
    {...props} 
  />
);

// Composant combiné avec choix de format
export const DualFormatExportButton = ({ data, columns, filename = 'export', ...props }) => {
  return (
    <div className="flex gap-2">
      <VerticalTableExportButton 
        data={data} 
        columns={columns} 
        filename={`${filename}_colonnes`}
        size="sm"
        {...props} 
      />
      <CardExportButton 
        data={data} 
        columns={columns} 
        filename={`${filename}_cartes`}
        size="sm"
        {...props} 
      />
    </div>
  );
};

export default VerticalExcelExportButton;