// src/components/rapports/ReportsList.jsx
import React, { useState, useMemo } from 'react';
import {
    FileText,
    Download,
    Calendar,
    Filter,
    Search,
    Eye,
    Share2,
    Trash2,
    Clock,
    BarChart,
    PieChart,
    TrendingUp,
    Package,
    Users,
    DollarSign,
    AlertCircle
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import Table from '../ui/Table';
import { formatDate, formatFileSize } from '../../utils/formatters';

const ReportsList = ({
    reports = [],
    onView,
    onDownload,
    onShare,
    onDelete,
    onGenerate,
    loading = false,
    className = ''
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterPeriod, setFilterPeriod] = useState('all');
    const [selectedReports, setSelectedReports] = useState([]);

    // Types de rapports
    const reportTypes = {
        inventory: {
            label: 'Inventaire',
            icon: Package,
            color: 'blue',
            description: 'État des stocks et mouvements'
        },
        sales: {
            label: 'Ventes',
            icon: TrendingUp,
            color: 'green',
            description: 'Analyse des ventes et performances'
        },
        financial: {
            label: 'Financier',
            icon: DollarSign,
            color: 'purple',
            description: 'Résultats financiers et comptabilité'
        },
        customers: {
            label: 'Clients',
            icon: Users,
            color: 'yellow',
            description: 'Analyse clientèle et comportements'
        },
        alerts: {
            label: 'Alertes',
            icon: AlertCircle,
            color: 'red',
            description: 'Stocks faibles et anomalies'
        },
        custom: {
            label: 'Personnalisé',
            icon: FileText,
            color: 'gray',
            description: 'Rapports personnalisés'
        }
    };

    // Rapports prédéfinis disponibles
    const predefinedReports = [
        {
            id: 'inventory-current',
            type: 'inventory',
            name: 'État des stocks actuel',
            description: 'Inventaire complet avec valorisation',
            icon: Package
        },
        {
            id: 'inventory-movements',
            type: 'inventory',
            name: 'Mouvements de stock',
            description: 'Entrées et sorties sur une période',
            icon: BarChart
        },
        {
            id: 'sales-summary',
            type: 'sales',
            name: 'Résumé des ventes',
            description: 'Chiffre d\'affaires et statistiques',
            icon: TrendingUp
        },
        {
            id: 'sales-by-product',
            type: 'sales',
            name: 'Ventes par produit',
            description: 'Performance des produits',
            icon: PieChart
        },
        {
            id: 'customer-activity',
            type: 'customers',
            name: 'Activité clients',
            description: 'Commandes et achats par client',
            icon: Users
        },
        {
            id: 'stock-alerts',
            type: 'alerts',
            name: 'Alertes de stock',
            description: 'Produits en rupture ou stock faible',
            icon: AlertCircle
        }
    ];

    // Générer des rapports de démonstration si aucun n'est fourni
    const mockReports = useMemo(() => {
        if (reports.length > 0) return reports;

        const statuses = ['completed', 'generating', 'error'];
        const now = new Date();
        
        return Array.from({ length: 10 }, (_, i) => {
            const type = Object.keys(reportTypes)[Math.floor(Math.random() * Object.keys(reportTypes).length)];
            const createdDate = new Date(now);
            createdDate.setDate(createdDate.getDate() - i);
            
            return {
                id: `report-${i + 1}`,
                name: `Rapport ${reportTypes[type].label} - ${formatDate(createdDate, 'MMMM yyyy')}`,
                type,
                status: statuses[Math.floor(Math.random() * statuses.length)],
                createdAt: createdDate.toISOString(),
                createdBy: ['Jean Dupont', 'Marie Martin', 'Pierre Bernard'][Math.floor(Math.random() * 3)],
                size: Math.floor(Math.random() * 5000000) + 100000, // Entre 100KB et 5MB
                format: ['pdf', 'excel', 'csv'][Math.floor(Math.random() * 3)],
                period: {
                    start: new Date(createdDate.getFullYear(), createdDate.getMonth(), 1).toISOString(),
                    end: new Date(createdDate.getFullYear(), createdDate.getMonth() + 1, 0).toISOString()
                },
                downloads: Math.floor(Math.random() * 20),
                shared: Math.random() > 0.7
            };
        });
    }, [reports]);

    // Filtrer les rapports
    const filteredReports = useMemo(() => {
        let filtered = [...mockReports];

        // Recherche
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(report =>
                report.name.toLowerCase().includes(search) ||
                report.createdBy?.toLowerCase().includes(search) ||
                reportTypes[report.type]?.label.toLowerCase().includes(search)
            );
        }

        // Filtre par type
        if (filterType !== 'all') {
            filtered = filtered.filter(report => report.type === filterType);
        }

        // Filtre par période
        if (filterPeriod !== 'all') {
            const now = new Date();
            const filterDate = new Date();
            
            switch (filterPeriod) {
                case 'today':
                    filterDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    filterDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    filterDate.setMonth(now.getMonth() - 1);
                    break;
                case 'year':
                    filterDate.setFullYear(now.getFullYear() - 1);
                    break;
            }
            
            filtered = filtered.filter(report =>
                new Date(report.createdAt) >= filterDate
            );
        }

        return filtered;
    }, [mockReports, searchTerm, filterType, filterPeriod]);

    // Colonnes du tableau
    const columns = [
        {
            key: 'name',
            label: 'Rapport',
            render: (_, report) => {
                const typeConfig = reportTypes[report.type];
                const Icon = typeConfig?.icon || FileText;
                
                return (
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-${typeConfig?.color || 'gray'}-100`}>
                            <Icon className={`h-5 w-5 text-${typeConfig?.color || 'gray'}-600`} />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">{report.name}</p>
                            <p className="text-sm text-gray-500">
                                {typeConfig?.label} " {report.format?.toUpperCase()}
                            </p>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'status',
            label: 'Statut',
            render: (_, report) => {
                const statusConfig = {
                    completed: { label: 'Terminé', color: 'green', icon: CheckCircle },
                    generating: { label: 'En cours', color: 'blue', icon: Clock },
                    error: { label: 'Erreur', color: 'red', icon: AlertCircle }
                };
                
                const config = statusConfig[report.status] || statusConfig.completed;
                
                return (
                    <Badge variant={config.color} size="sm">
                        {config.label}
                    </Badge>
                );
            }
        },
        {
            key: 'period',
            label: 'Période',
            render: (_, report) => {
                if (!report.period) return '-';
                return (
                    <span className="text-sm text-gray-600">
                        {formatDate(report.period.start, 'dd/MM')} - {formatDate(report.period.end, 'dd/MM/yyyy')}
                    </span>
                );
            }
        },
        {
            key: 'createdAt',
            label: 'Créé le',
            render: (value, report) => (
                <div className="text-sm">
                    <p className="text-gray-900">{formatDate(value, 'dd/MM/yyyy')}</p>
                    <p className="text-gray-500">{report.createdBy}</p>
                </div>
            )
        },
        {
            key: 'size',
            label: 'Taille',
            render: (value) => (
                <span className="text-sm text-gray-600">
                    {formatFileSize(value)}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            sortable: false,
            render: (_, report) => (
                <div className="flex items-center space-x-1">
                    {report.status === 'completed' && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onView?.(report);
                                }}
                                className="p-2"
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDownload?.(report);
                                }}
                                className="p-2"
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onShare?.(report);
                                }}
                                className="p-2"
                            >
                                <Share2 className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(report);
                            }}
                            className="p-2 text-red-600 hover:text-red-700"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            )
        }
    ];

    // Gérer la sélection
    const handleSelectionChange = (selected) => {
        setSelectedReports(selected);
    };

    // Actions groupées
    const handleBulkDelete = () => {
        if (selectedReports.length > 0 && onDelete) {
            if (confirm(`Supprimer ${selectedReports.length} rapport(s) ?`)) {
                selectedReports.forEach(id => {
                    const report = filteredReports.find(r => r.id === id);
                    if (report) onDelete(report);
                });
                setSelectedReports([]);
            }
        }
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Section de génération de rapports */}
            {onGenerate && (
                <Card>
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Générer un nouveau rapport
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {predefinedReports.map((template) => {
                                const typeConfig = reportTypes[template.type];
                                const Icon = template.icon;
                                
                                return (
                                    <button
                                        key={template.id}
                                        onClick={() => onGenerate(template)}
                                        className="flex items-start p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                                    >
                                        <div className={`p-2 rounded-lg bg-${typeConfig.color}-100 mr-3`}>
                                            <Icon className={`h-5 w-5 text-${typeConfig.color}-600`} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{template.name}</p>
                                            <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </Card>
            )}

            {/* Barre de recherche et filtres */}
            <Card>
                <div className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1 flex items-center space-x-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Rechercher un rapport..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Tous types</option>
                                    {Object.entries(reportTypes).map(([key, config]) => (
                                        <option key={key} value={key}>{config.label}</option>
                                    ))}
                                </select>
                                
                                <select
                                    value={filterPeriod}
                                    onChange={(e) => setFilterPeriod(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Toutes périodes</option>
                                    <option value="today">Aujourd'hui</option>
                                    <option value="week">7 derniers jours</option>
                                    <option value="month">30 derniers jours</option>
                                    <option value="year">Cette année</option>
                                </select>
                            </div>
                        </div>
                        
                        {selectedReports.length > 0 && (
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">
                                    {selectedReports.length} sélectionné(s)
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleBulkDelete}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    Supprimer
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Liste des rapports */}
            <Card>
                <Table
                    columns={columns}
                    data={filteredReports}
                    loading={loading}
                    selectable={true}
                    onSelectionChange={handleSelectionChange}
                    onRowClick={onView}
                    emptyMessage="Aucun rapport trouvé"
                    className="border-none"
                />
            </Card>
        </div>
    );
};

// Fonction utilitaire pour formater la taille des fichiers
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default ReportsList;