// src/components/rapports/StockReport.jsx
import React, { useState, useMemo } from 'react';
import {
    Package,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Download,
    Calendar,
    Filter,
    BarChart,
    PieChart,
    Activity,
    Eye,
    X
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Table from '../ui/Table';
import Modal from '../ui/Modal';
import ExportButton from './ExportButton';
import { formatCurrency, formatQuantity, formatDate, formatPercentage } from '../../utils/formatters';

const StockReport = ({
    data = {},
    period = { start: null, end: null },
    onClose,
    onExport,
    loading = false,
    isModal = false
}) => {
    const [activeView, setActiveView] = useState('overview');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Données par défaut pour la démonstration
    const defaultData = {
        summary: {
            totalProducts: 150,
            totalValue: 2500000,
            lowStockCount: 12,
            outOfStockCount: 3,
            expiringCount: 5,
            categories: 8
        },
        movements: {
            entries: 450,
            exits: 380,
            transfers: 25,
            adjustments: 15,
            totalIn: 850000,
            totalOut: 720000
        },
        categories: [
            { name: 'Électronique', count: 45, value: 850000, percentage: 34 },
            { name: 'Alimentation', count: 35, value: 450000, percentage: 18 },
            { name: 'Textiles', count: 28, value: 380000, percentage: 15.2 },
            { name: 'Cosmétiques', count: 22, value: 320000, percentage: 12.8 },
            { name: 'Mobilier', count: 15, value: 280000, percentage: 11.2 },
            { name: 'Autres', count: 5, value: 220000, percentage: 8.8 }
        ],
        topProducts: [
            { name: 'Ordinateur portable HP', quantity: 45, value: 450000, movements: 25 },
            { name: 'Smartphone Samsung A52', quantity: 78, value: 390000, movements: 42 },
            { name: 'Tablette iPad Air', quantity: 32, value: 320000, movements: 18 },
            { name: 'Écouteurs Bluetooth', quantity: 120, value: 240000, movements: 65 },
            { name: 'Chargeur universel', quantity: 200, value: 100000, movements: 110 }
        ],
        alerts: [
            { product: 'Câble USB-C', current: 5, minimum: 20, type: 'low' },
            { product: 'Batterie externe', current: 0, minimum: 15, type: 'out' },
            { product: 'Housse laptop', current: 8, minimum: 25, type: 'low' },
            { product: 'Souris sans fil', current: 0, minimum: 30, type: 'out' },
            { product: 'Clavier Bluetooth', current: 3, minimum: 20, type: 'low' }
        ],
        turnover: {
            average: 4.2,
            byCategory: [
                { category: 'Électronique', rate: 5.8 },
                { category: 'Alimentation', rate: 8.2 },
                { category: 'Textiles', rate: 3.1 },
                { category: 'Cosmétiques', rate: 4.5 },
                { category: 'Mobilier', rate: 1.8 }
            ]
        }
    };

    const reportData = data.summary ? data : defaultData;

    // Vues disponibles
    const views = [
        { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart },
        { id: 'movements', label: 'Mouvements', icon: Activity },
        { id: 'categories', label: 'Catégories', icon: PieChart },
        { id: 'alerts', label: 'Alertes', icon: AlertCircle }
    ];

    // Préparer les données pour l'export
    const prepareExportData = () => {
        const exportData = [];

        // Vue d'ensemble
        exportData.push({
            Section: 'RÉSUMÉ',
            Indicateur: 'Total produits',
            Valeur: reportData.summary.totalProducts
        });
        exportData.push({
            Section: 'RÉSUMÉ',
            Indicateur: 'Valeur totale',
            Valeur: formatCurrency(reportData.summary.totalValue)
        });
        exportData.push({
            Section: 'RÉSUMÉ',
            Indicateur: 'Stock faible',
            Valeur: reportData.summary.lowStockCount
        });
        exportData.push({
            Section: 'RÉSUMÉ',
            Indicateur: 'Rupture de stock',
            Valeur: reportData.summary.outOfStockCount
        });

        // Mouvements
        exportData.push({
            Section: 'MOUVEMENTS',
            Indicateur: 'Entrées',
            Valeur: reportData.movements.entries
        });
        exportData.push({
            Section: 'MOUVEMENTS',
            Indicateur: 'Sorties',
            Valeur: reportData.movements.exits
        });

        // Catégories
        reportData.categories.forEach(cat => {
            exportData.push({
                Section: 'CATÉGORIES',
                Indicateur: cat.name,
                Valeur: formatCurrency(cat.value),
                Pourcentage: `${cat.percentage}%`
            });
        });

        // Alertes
        reportData.alerts.forEach(alert => {
            exportData.push({
                Section: 'ALERTES',
                Indicateur: alert.product,
                'Stock actuel': alert.current,
                'Stock minimum': alert.minimum,
                Statut: alert.type === 'out' ? 'Rupture' : 'Faible'
            });
        });

        return exportData;
    };

    // Contenu du rapport
    const ReportContent = () => (
        <div className="space-y-6">
            {/* En-tête avec statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total produits</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {reportData.summary.totalProducts}
                            </p>
                        </div>
                        <Package className="h-8 w-8 text-blue-500" />
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Valeur totale</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(reportData.summary.totalValue)}
                            </p>
                        </div>
                        <BarChart className="h-8 w-8 text-green-500" />
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Stock faible</p>
                            <p className="text-2xl font-bold text-yellow-600">
                                {reportData.summary.lowStockCount}
                            </p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-yellow-500" />
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Ruptures</p>
                            <p className="text-2xl font-bold text-red-600">
                                {reportData.summary.outOfStockCount}
                            </p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                </Card>
            </div>

            {/* Navigation des vues */}
            <Card>
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-4">
                        {views.map(view => {
                            const Icon = view.icon;
                            return (
                                <button
                                    key={view.id}
                                    onClick={() => setActiveView(view.id)}
                                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                                        activeView === view.id
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="text-sm font-medium">{view.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="p-6">
                    {/* Vue d'ensemble */}
                    {activeView === 'overview' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Top 5 Produits par valeur
                                </h3>
                                <div className="space-y-3">
                                    {reportData.topProducts.map((product, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{product.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {formatQuantity(product.quantity)} en stock " {product.movements} mouvements
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="font-semibold text-gray-900">
                                                {formatCurrency(product.value)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Rotation des stocks
                                </h3>
                                <Card className="p-4 bg-blue-50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">Taux de rotation moyen</p>
                                            <p className="text-3xl font-bold text-blue-600">
                                                {reportData.turnover.average}x
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">par mois</p>
                                        </div>
                                        <Activity className="h-12 w-12 text-blue-500" />
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* Mouvements */}
                    {activeView === 'movements' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-gray-900">{reportData.movements.entries}</p>
                                    <p className="text-sm text-gray-600">Entrées</p>
                                </div>
                                <div className="text-center p-4 bg-red-50 rounded-lg">
                                    <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-gray-900">{reportData.movements.exits}</p>
                                    <p className="text-sm text-gray-600">Sorties</p>
                                </div>
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <Activity className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-gray-900">{reportData.movements.transfers}</p>
                                    <p className="text-sm text-gray-600">Transferts</p>
                                </div>
                                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                    <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-gray-900">{reportData.movements.adjustments}</p>
                                    <p className="text-sm text-gray-600">Ajustements</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="p-4">
                                    <h4 className="font-medium text-gray-900 mb-3">Valeur des entrées</h4>
                                    <p className="text-3xl font-bold text-green-600">
                                        {formatCurrency(reportData.movements.totalIn)}
                                    </p>
                                </Card>
                                <Card className="p-4">
                                    <h4 className="font-medium text-gray-900 mb-3">Valeur des sorties</h4>
                                    <p className="text-3xl font-bold text-red-600">
                                        {formatCurrency(reportData.movements.totalOut)}
                                    </p>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* Catégories */}
                    {activeView === 'categories' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        Répartition par catégorie
                                    </h3>
                                    <div className="space-y-3">
                                        {reportData.categories.map((category, index) => (
                                            <div key={index}>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {category.name}
                                                    </span>
                                                    <span className="text-sm text-gray-600">
                                                        {category.percentage}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${
                                                            index === 0 ? 'bg-blue-500' :
                                                            index === 1 ? 'bg-green-500' :
                                                            index === 2 ? 'bg-yellow-500' :
                                                            index === 3 ? 'bg-purple-500' :
                                                            index === 4 ? 'bg-pink-500' :
                                                            'bg-gray-500'
                                                        }`}
                                                        style={{ width: `${category.percentage}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {category.count} produits " {formatCurrency(category.value)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        Rotation par catégorie
                                    </h3>
                                    <div className="space-y-3">
                                        {reportData.turnover.byCategory.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <span className="font-medium text-gray-900">{item.category}</span>
                                                <div className="flex items-center space-x-2">
                                                    <span className={`text-lg font-semibold ${
                                                        item.rate >= 5 ? 'text-green-600' :
                                                        item.rate >= 3 ? 'text-yellow-600' :
                                                        'text-red-600'
                                                    }`}>
                                                        {item.rate}x
                                                    </span>
                                                    <span className="text-sm text-gray-500">/ mois</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Alertes */}
                    {activeView === 'alerts' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Produits nécessitant une attention
                                </h3>
                                <Badge variant="red">
                                    {reportData.alerts.length} alertes
                                </Badge>
                            </div>

                            {reportData.alerts.map((alert, index) => (
                                <div key={index} className={`p-4 rounded-lg border ${
                                    alert.type === 'out' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <AlertCircle className={`h-5 w-5 ${
                                                alert.type === 'out' ? 'text-red-600' : 'text-yellow-600'
                                            }`} />
                                            <div>
                                                <p className="font-medium text-gray-900">{alert.product}</p>
                                                <p className="text-sm text-gray-600">
                                                    Stock actuel: {alert.current} " Minimum requis: {alert.minimum}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant={alert.type === 'out' ? 'red' : 'yellow'}>
                                            {alert.type === 'out' ? 'Rupture de stock' : 'Stock faible'}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Si utilisé comme modal
    if (isModal) {
        return (
            <Modal isOpen={true} onClose={onClose} size="xl">
                <div className="flex flex-col h-full max-h-[90vh]">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Rapport d'inventaire</h2>
                                {period.start && period.end && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        Du {formatDate(period.start)} au {formatDate(period.end)}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center space-x-2">
                                <ExportButton
                                    data={prepareExportData()}
                                    filename={`rapport-stock-${formatDate(new Date(), 'yyyyMMdd')}`}
                                    title="Exporter"
                                    onExport={onExport}
                                />
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                        <ReportContent />
                    </div>
                </div>
            </Modal>
        );
    }

    // Utilisation standalone
    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Rapport d'inventaire</h2>
                    {period.start && period.end && (
                        <p className="text-sm text-gray-500 mt-1">
                            Du {formatDate(period.start)} au {formatDate(period.end)}
                        </p>
                    )}
                </div>
                <ExportButton
                    data={prepareExportData()}
                    filename={`rapport-stock-${formatDate(new Date(), 'yyyyMMdd')}`}
                    title="Exporter"
                    onExport={onExport}
                />
            </div>
            <ReportContent />
        </div>
    );
};

export default StockReport;