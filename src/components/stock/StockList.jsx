// src/components/stock/StockList.jsx
import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, Plus, Package } from 'lucide-react';
import Table from '../ui/Table';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import StockFilters from './StockFilters';
import { formatQuantity, formatCurrency, formatDate } from '../../utils/formatters';
import { STOCK_ALERT_LEVELS } from '../../utils/constants';

const StockList = ({
    stock = [],
    loading = false,
    onAdd,
    onEdit,
    onDelete,
    onExport,
    onFilter,
    showFilters = true,
    selectable = false,
    onSelectionChange,
    className = ''
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [filters, setFilters] = useState({});

    // Colonnes du tableau
    const columns = [
        {
            key: 'produit',
            label: 'Produit',
            render: (_, row) => (
                <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-600" />
                        </div>
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">
                            {row.produit?.nom || 'Produit inconnu'}
                        </div>
                        <div className="text-sm text-gray-500">
                            {row.produit?.reference}
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'quantite',
            label: 'Quantité',
            render: (_, row) => {
                const status = getStockStatus(row);
                return (
                    <div className="flex items-center space-x-2">
                        <span className={`font-medium ${getQuantityColor(status)}`}>
                            {formatQuantity(row.quantite, row.produit?.unite)}
                        </span>
                        {status !== STOCK_ALERT_LEVELS.OK && (
                            <Badge variant={getBadgeVariant(status)} size="sm">
                                {getStatusLabel(status)}
                            </Badge>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'valeur',
            label: 'Valeur',
            render: (_, row) => {
                const valeur = row.quantite * (row.prixUnitaire || row.produit?.prixUnitaire || 0);
                return formatCurrency(valeur);
            }
        },
        {
            key: 'emplacement',
            label: 'Emplacement',
            render: (value) => value || '-'
        },
        {
            key: 'lot',
            label: 'Lot',
            render: (value) => value || '-'
        },
        {
            key: 'dateExpiration',
            label: 'Expiration',
            render: (value, row) => {
                if (!value) return '-';
                
                const isExpired = new Date(value) < new Date();
                const isExpiringSoon = !isExpired && 
                    Math.ceil((new Date(value) - new Date()) / (1000 * 60 * 60 * 24)) <= 30;
                
                return (
                    <span className={`
                        ${isExpired ? 'text-red-600 font-medium' : 
                          isExpiringSoon ? 'text-yellow-600 font-medium' : 
                          'text-gray-900'}
                    `}>
                        {formatDate(value)}
                    </span>
                );
            }
        },
        {
            key: 'actions',
            label: 'Actions',
            sortable: false,
            render: (_, row) => (
                <div className="flex items-center space-x-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.(row);
                        }}
                    >
                        Modifier
                    </Button>
                    {onDelete && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete?.(row);
                            }}
                        >
                            Supprimer
                        </Button>
                    )}
                </div>
            )
        }
    ];

    // Fonctions utilitaires
    const getStockStatus = (item) => {
        const quantite = item.quantite || 0;
        const seuil = item.produit?.seuilAlerte || 0;
        
        if (quantite === 0) return STOCK_ALERT_LEVELS.VIDE;
        if (quantite <= seuil * 0.5) return STOCK_ALERT_LEVELS.CRITIQUE;
        if (quantite <= seuil) return STOCK_ALERT_LEVELS.FAIBLE;
        return STOCK_ALERT_LEVELS.OK;
    };

    const getQuantityColor = (status) => {
        switch (status) {
            case STOCK_ALERT_LEVELS.VIDE:
                return 'text-gray-500';
            case STOCK_ALERT_LEVELS.CRITIQUE:
                return 'text-red-600';
            case STOCK_ALERT_LEVELS.FAIBLE:
                return 'text-yellow-600';
            default:
                return 'text-green-600';
        }
    };

    const getBadgeVariant = (status) => {
        switch (status) {
            case STOCK_ALERT_LEVELS.VIDE:
                return 'gray';
            case STOCK_ALERT_LEVELS.CRITIQUE:
                return 'red';
            case STOCK_ALERT_LEVELS.FAIBLE:
                return 'yellow';
            default:
                return 'green';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case STOCK_ALERT_LEVELS.VIDE:
                return 'Rupture';
            case STOCK_ALERT_LEVELS.CRITIQUE:
                return 'Critique';
            case STOCK_ALERT_LEVELS.FAIBLE:
                return 'Faible';
            default:
                return 'Normal';
        }
    };

    // Filtrage des données
    const filteredData = useMemo(() => {
        let filtered = [...stock];

        // Recherche
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                item.produit?.nom?.toLowerCase().includes(search) ||
                item.produit?.reference?.toLowerCase().includes(search) ||
                item.emplacement?.toLowerCase().includes(search) ||
                item.lot?.toLowerCase().includes(search)
            );
        }

        // Filtres avancés
        if (filters.categorie) {
            filtered = filtered.filter(item => item.produit?.categorie === filters.categorie);
        }
        if (filters.emplacement) {
            filtered = filtered.filter(item => item.emplacement === filters.emplacement);
        }
        if (filters.status) {
            filtered = filtered.filter(item => getStockStatus(item) === filters.status);
        }
        if (filters.expirationSoon) {
            filtered = filtered.filter(item => {
                if (!item.dateExpiration) return false;
                const days = Math.ceil((new Date(item.dateExpiration) - new Date()) / (1000 * 60 * 60 * 24));
                return days <= 30 && days > 0;
            });
        }

        return filtered;
    }, [stock, searchTerm, filters]);

    // Gestion des filtres
    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        onFilter?.(newFilters);
    };

    // Statistiques
    const stats = useMemo(() => {
        const totalItems = filteredData.length;
        const totalValue = filteredData.reduce((sum, item) => 
            sum + (item.quantite * (item.prixUnitaire || item.produit?.prixUnitaire || 0)), 0
        );
        const lowStock = filteredData.filter(item => 
            getStockStatus(item) === STOCK_ALERT_LEVELS.FAIBLE || 
            getStockStatus(item) === STOCK_ALERT_LEVELS.CRITIQUE
        ).length;
        const outOfStock = filteredData.filter(item => 
            getStockStatus(item) === STOCK_ALERT_LEVELS.VIDE
        ).length;

        return { totalItems, totalValue, lowStock, outOfStock };
    }, [filteredData]);

    return (
        <div className={`space-y-4 ${className}`}>
            {/* En-tête avec statistiques */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total produits</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Valeur totale</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Stock faible</p>
                        <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Ruptures</p>
                        <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
                    </div>
                </div>
            </div>

            {/* Barre d'outils */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1 flex items-center space-x-2">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Rechercher un produit, référence, lot..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        {showFilters && (
                            <Button
                                variant="outline"
                                onClick={() => setShowFilterPanel(!showFilterPanel)}
                                className="flex items-center space-x-2"
                            >
                                <Filter className="h-4 w-4" />
                                <span>Filtres</span>
                                {Object.keys(filters).length > 0 && (
                                    <Badge size="sm" variant="blue">
                                        {Object.keys(filters).length}
                                    </Badge>
                                )}
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        {onExport && (
                            <Button
                                variant="outline"
                                onClick={onExport}
                                className="flex items-center space-x-2"
                            >
                                <Download className="h-4 w-4" />
                                <span>Exporter</span>
                            </Button>
                        )}
                        {onAdd && (
                            <Button
                                onClick={onAdd}
                                className="flex items-center space-x-2"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Ajouter</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Panneau de filtres */}
                {showFilters && showFilterPanel && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <StockFilters
                            filters={filters}
                            onChange={handleFilterChange}
                            stock={stock}
                        />
                    </div>
                )}
            </div>

            {/* Tableau */}
            <div className="bg-white rounded-lg shadow-sm">
                <Table
                    columns={columns}
                    data={filteredData}
                    loading={loading}
                    selectable={selectable}
                    onSelectionChange={onSelectionChange}
                    onRowClick={onEdit}
                    emptyMessage="Aucun produit en stock"
                    className="border-none"
                />
            </div>
        </div>
    );
};

export default StockList;