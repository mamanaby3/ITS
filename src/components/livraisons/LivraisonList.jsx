// src/components/livraisons/LivraisonList.jsx
import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, Plus, Truck, Calendar } from 'lucide-react';
import Table from '../ui/Table';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { DELIVERY_STATUS_LABELS, DELIVERY_STATUS } from '../../utils/constants';

const LivraisonList = ({
    livraisons = [],
    loading = false,
    onAdd,
    onView,
    onUpdateStatus,
    onPrint,
    onExport,
    showFilters = true,
    selectable = false,
    onSelectionChange,
    className = ''
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [filters, setFilters] = useState({
        statut: '',
        transporteur: '',
        dateDebut: '',
        dateFin: ''
    });

    // Colonnes du tableau
    const columns = [
        {
            key: 'numero',
            label: 'N° Livraison',
            render: (value, row) => (
                <div>
                    <p className="font-medium text-gray-900">{value}</p>
                    <p className="text-sm text-gray-500">Cmd: {row.numeroCommande}</p>
                </div>
            )
        },
        {
            key: 'client',
            label: 'Client',
            render: (_, row) => (
                <div>
                    <p className="font-medium text-gray-900">{row.clientNom}</p>
                    <p className="text-sm text-gray-500 line-clamp-1">{row.adresseLivraison}</p>
                </div>
            )
        },
        {
            key: 'dateLivraisonPrevue',
            label: 'Date prévue',
            render: (value, row) => {
                const isLate = value && new Date(value) < new Date() && 
                    ![DELIVERY_STATUS.LIVREE, DELIVERY_STATUS.RETOURNEE].includes(row.statut);
                
                return (
                    <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className={isLate ? 'text-red-600 font-medium' : 'text-gray-900'}>
                            {value ? formatDate(value) : '-'}
                        </span>
                        {isLate && <Badge variant="red" size="sm">Retard</Badge>}
                    </div>
                );
            }
        },
        {
            key: 'transporteur',
            label: 'Transporteur',
            render: (value) => value || '-'
        },
        {
            key: 'statut',
            label: 'Statut',
            render: (value) => {
                const color = getStatusColor(value);
                return (
                    <Badge variant={color}>
                        {DELIVERY_STATUS_LABELS[value] || value}
                    </Badge>
                );
            }
        },
        {
            key: 'montant',
            label: 'Montant',
            render: (_, row) => (
                <div className="text-right">
                    <p className="font-medium text-gray-900">
                        {formatCurrency(row.montantTotal || 0)}
                    </p>
                    {row.fraisLivraison > 0 && (
                        <p className="text-sm text-gray-500">
                            +{formatCurrency(row.fraisLivraison)}
                        </p>
                    )}
                </div>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            sortable: false,
            render: (_, row) => (
                <div className="flex items-center space-x-2">
                    {onUpdateStatus && row.statut !== DELIVERY_STATUS.LIVREE && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                                e.stopPropagation();
                                onUpdateStatus(row);
                            }}
                        >
                            Mettre à jour
                        </Button>
                    )}
                    {onPrint && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                                e.stopPropagation();
                                onPrint(row);
                            }}
                        >
                            Bon
                        </Button>
                    )}
                </div>
            )
        }
    ];

    // Fonction pour déterminer la couleur du statut
    const getStatusColor = (status) => {
        switch (status) {
            case DELIVERY_STATUS.PROGRAMMEE:
                return 'blue';
            case DELIVERY_STATUS.EN_CHARGEMENT:
                return 'yellow';
            case DELIVERY_STATUS.EN_ROUTE:
                return 'purple';
            case DELIVERY_STATUS.LIVREE:
                return 'green';
            case DELIVERY_STATUS.RETOURNEE:
                return 'orange';
            case DELIVERY_STATUS.INCIDENT:
                return 'red';
            default:
                return 'gray';
        }
    };

    // Filtrage des données
    const filteredData = useMemo(() => {
        let filtered = [...livraisons];

        // Recherche
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(livraison =>
                livraison.numero.toLowerCase().includes(search) ||
                livraison.numeroCommande?.toLowerCase().includes(search) ||
                livraison.clientNom?.toLowerCase().includes(search) ||
                livraison.transporteur?.toLowerCase().includes(search) ||
                livraison.numeroTracking?.toLowerCase().includes(search)
            );
        }

        // Filtres
        if (filters.statut) {
            filtered = filtered.filter(l => l.statut === filters.statut);
        }
        if (filters.transporteur) {
            filtered = filtered.filter(l => 
                l.transporteur?.toLowerCase().includes(filters.transporteur.toLowerCase())
            );
        }
        if (filters.dateDebut) {
            filtered = filtered.filter(l => 
                new Date(l.dateLivraison) >= new Date(filters.dateDebut)
            );
        }
        if (filters.dateFin) {
            filtered = filtered.filter(l => 
                new Date(l.dateLivraison) <= new Date(filters.dateFin)
            );
        }

        return filtered;
    }, [livraisons, searchTerm, filters]);

    // Statistiques
    const stats = useMemo(() => {
        const total = filteredData.length;
        const parStatut = {};
        let enRetard = 0;
        
        Object.values(DELIVERY_STATUS).forEach(statut => {
            parStatut[statut] = 0;
        });
        
        filteredData.forEach(livraison => {
            if (parStatut[livraison.statut] !== undefined) {
                parStatut[livraison.statut]++;
            }
            
            // Vérifier les retards
            if (livraison.dateLivraisonPrevue && 
                new Date(livraison.dateLivraisonPrevue) < new Date() &&
                ![DELIVERY_STATUS.LIVREE, DELIVERY_STATUS.RETOURNEE].includes(livraison.statut)) {
                enRetard++;
            }
        });
        
        return { total, parStatut, enRetard };
    }, [filteredData]);

    // Gestion des filtres
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        setFilters({
            statut: '',
            transporteur: '',
            dateDebut: '',
            dateFin: ''
        });
    };

    // Transporteurs uniques pour le filtre
    const transporteurs = useMemo(() => {
        const unique = new Set(livraisons.map(l => l.transporteur).filter(Boolean));
        return Array.from(unique).sort();
    }, [livraisons]);

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm font-medium text-gray-500">En cours</p>
                    <p className="text-2xl font-bold text-blue-600">
                        {stats.parStatut[DELIVERY_STATUS.EN_ROUTE] || 0}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Livrées</p>
                    <p className="text-2xl font-bold text-green-600">
                        {stats.parStatut[DELIVERY_STATUS.LIVREE] || 0}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm font-medium text-gray-500">En retard</p>
                    <p className="text-2xl font-bold text-red-600">{stats.enRetard}</p>
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
                                placeholder="Rechercher par numéro, client, transporteur..."
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
                                {Object.values(filters).some(v => v) && (
                                    <Badge size="sm" variant="blue">
                                        {Object.values(filters).filter(v => v).length}
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
                                <span>Nouvelle livraison</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Panneau de filtres */}
                {showFilters && showFilterPanel && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Statut
                                </label>
                                <select
                                    value={filters.statut}
                                    onChange={(e) => handleFilterChange('statut', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Tous les statuts</option>
                                    {Object.entries(DELIVERY_STATUS_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Transporteur
                                </label>
                                <select
                                    value={filters.transporteur}
                                    onChange={(e) => handleFilterChange('transporteur', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Tous les transporteurs</option>
                                    {transporteurs.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date début
                                </label>
                                <Input
                                    type="date"
                                    value={filters.dateDebut}
                                    onChange={(e) => handleFilterChange('dateDebut', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date fin
                                </label>
                                <Input
                                    type="date"
                                    value={filters.dateFin}
                                    onChange={(e) => handleFilterChange('dateFin', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Button variant="ghost" size="sm" onClick={resetFilters}>
                                Réinitialiser
                            </Button>
                        </div>
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
                    onRowClick={onView}
                    emptyMessage="Aucune livraison trouvée"
                    className="border-none"
                />
            </div>
        </div>
    );
};

export default LivraisonList;