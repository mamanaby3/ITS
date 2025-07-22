// src/components/ui/Table.jsx
import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';

/**
 * Composant Table réutilisable avec tri, pagination et sélection
 */
const Table = ({
    columns = [],
    data = [],
    loading = false,
    emptyMessage = 'Aucune donnée disponible',
    sortable = true,
    selectable = false,
    onSelectionChange,
    pagination = true,
    pageSize = 20,
    pageSizeOptions = [10, 20, 50, 100],
    onRowClick,
    rowClassName,
    stickyHeader = true,
    className = '',
    ...props
}) => {
    // État pour le tri
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    
    // État pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(pageSize);
    
    // État pour la sélection
    const [selectedRows, setSelectedRows] = useState(new Set());

    // Données triées
    const sortedData = useMemo(() => {
        if (!sortable || !sortConfig.key) return data;

        return [...data].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [data, sortConfig, sortable]);

    // Données paginées
    const paginatedData = useMemo(() => {
        if (!pagination) return sortedData;

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return sortedData.slice(startIndex, endIndex);
    }, [sortedData, currentPage, itemsPerPage, pagination]);

    // Calcul du nombre total de pages
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);

    // Gestion du tri
    const handleSort = (key) => {
        if (!sortable) return;

        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = null;
        }

        setSortConfig({ key: direction ? key : null, direction });
    };

    // Gestion de la sélection
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const newSelected = new Set(paginatedData.map((_, index) => index));
            setSelectedRows(newSelected);
            onSelectionChange?.(Array.from(newSelected).map(index => paginatedData[index]));
        } else {
            setSelectedRows(new Set());
            onSelectionChange?.([]);
        }
    };

    const handleSelectRow = (index) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedRows(newSelected);
        onSelectionChange?.(Array.from(newSelected).map(i => paginatedData[i]));
    };

    // Gestion de la pagination
    const goToPage = (page) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const handlePageSizeChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    // Rendu de l'icône de tri
    const renderSortIcon = (columnKey) => {
        if (!sortable) return null;

        if (sortConfig.key !== columnKey) {
            return <ChevronUp className="h-4 w-4 text-gray-400" />;
        }

        return sortConfig.direction === 'asc' ? (
            <ChevronUp className="h-4 w-4 text-gray-700" />
        ) : (
            <ChevronDown className="h-4 w-4 text-gray-700" />
        );
    };

    // Rendu du contenu de la cellule
    const renderCellContent = (row, column) => {
        if (column.render) {
            return column.render(row[column.key], row);
        }
        return row[column.key];
    };

    return (
        <div className={`flex flex-col ${className}`} {...props}>
            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className={`bg-gray-50 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
                        <tr>
                            {selectable && (
                                <th className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                            )}
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                                        sortable && column.sortable !== false ? 'cursor-pointer select-none' : ''
                                    } ${column.className || ''}`}
                                    onClick={() => column.sortable !== false && handleSort(column.key)}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>{column.label}</span>
                                        {column.sortable !== false && renderSortIcon(column.key)}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td 
                                    colSpan={columns.length + (selectable ? 1 : 0)} 
                                    className="px-6 py-12 text-center"
                                >
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                </td>
                            </tr>
                        ) : paginatedData.length === 0 ? (
                            <tr>
                                <td 
                                    colSpan={columns.length + (selectable ? 1 : 0)} 
                                    className="px-6 py-12 text-center text-gray-500"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((row, rowIndex) => (
                                <tr
                                    key={rowIndex}
                                    className={`
                                        ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                                        ${selectedRows.has(rowIndex) ? 'bg-blue-50' : ''}
                                        ${rowClassName ? rowClassName(row, rowIndex) : ''}
                                    `}
                                    onClick={() => onRowClick?.(row, rowIndex)}
                                >
                                    {selectable && (
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                checked={selectedRows.has(rowIndex)}
                                                onChange={() => handleSelectRow(rowIndex)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </td>
                                    )}
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className={`px-6 py-4 whitespace-nowrap text-sm ${column.cellClassName || ''}`}
                                        >
                                            {renderCellContent(row, column)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && !loading && sortedData.length > 0 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Précédent
                        </button>
                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Suivant
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div className="flex items-center space-x-2">
                            <p className="text-sm text-gray-700">
                                Affichage de{' '}
                                <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                                {' à '}
                                <span className="font-medium">
                                    {Math.min(currentPage * itemsPerPage, sortedData.length)}
                                </span>
                                {' sur '}
                                <span className="font-medium">{sortedData.length}</span>
                                {' résultats'}
                            </p>
                            <select
                                value={itemsPerPage}
                                onChange={handlePageSizeChange}
                                className="ml-2 block w-20 rounded-md border-gray-300 py-1 px-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                {pageSizeOptions.map(size => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                <button
                                    onClick={() => goToPage(1)}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                    Page {currentPage} sur {totalPages}
                                </span>
                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => goToPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Table;