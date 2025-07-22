// src/components/dashboard/StatsCards.jsx
import React from 'react';
import {
    Package,
    ShoppingCart,
    Users,
    TrendingUp,
    TrendingDown,
    DollarSign,
    AlertCircle,
    Truck,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import Card from '../ui/Card';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';

const StatsCards = ({
    stats = {},
    period = 'month',
    loading = false,
    className = ''
}) => {
    // Définir les cartes de statistiques
    const statsConfig = [
        {
            id: 'revenue',
            title: 'Chiffre d\'affaires',
            value: stats.revenue || 0,
            previousValue: stats.previousRevenue || 0,
            formatter: formatCurrency,
            icon: DollarSign,
            iconBgColor: 'bg-green-100',
            iconColor: 'text-green-600',
            trend: 'positive',
            suffix: ''
        },
        {
            id: 'orders',
            title: 'Commandes',
            value: stats.orders || 0,
            previousValue: stats.previousOrders || 0,
            formatter: formatNumber,
            icon: ShoppingCart,
            iconBgColor: 'bg-blue-100',
            iconColor: 'text-blue-600',
            trend: 'positive',
            suffix: stats.ordersUnit || ''
        },
        {
            id: 'products',
            title: 'Produits en stock',
            value: stats.products || 0,
            previousValue: stats.previousProducts || 0,
            formatter: formatNumber,
            icon: Package,
            iconBgColor: 'bg-purple-100',
            iconColor: 'text-purple-600',
            trend: 'neutral',
            suffix: ''
        },
        {
            id: 'customers',
            title: 'Clients actifs',
            value: stats.customers || 0,
            previousValue: stats.previousCustomers || 0,
            formatter: formatNumber,
            icon: Users,
            iconBgColor: 'bg-yellow-100',
            iconColor: 'text-yellow-600',
            trend: 'positive',
            suffix: ''
        },
        {
            id: 'lowStock',
            title: 'Alertes stock',
            value: stats.lowStock || 0,
            previousValue: stats.previousLowStock || 0,
            formatter: formatNumber,
            icon: AlertCircle,
            iconBgColor: 'bg-red-100',
            iconColor: 'text-red-600',
            trend: 'negative',
            suffix: ' produit(s)'
        },
        {
            id: 'deliveries',
            title: 'Livraisons en cours',
            value: stats.deliveries || 0,
            previousValue: stats.previousDeliveries || 0,
            formatter: formatNumber,
            icon: Truck,
            iconBgColor: 'bg-indigo-100',
            iconColor: 'text-indigo-600',
            trend: 'neutral',
            suffix: ''
        }
    ];

    // Calculer la variation en pourcentage
    const calculateChange = (current, previous) => {
        if (!previous || previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    };

    // Déterminer la couleur de la tendance
    const getTrendColor = (change, trendType) => {
        if (change === 0) return 'text-gray-500';
        
        if (trendType === 'negative') {
            // Pour les métriques négatives (comme les alertes), une baisse est positive
            return change < 0 ? 'text-green-600' : 'text-red-600';
        }
        
        // Pour les métriques positives, une hausse est positive
        return change > 0 ? 'text-green-600' : 'text-red-600';
    };

    // Déterminer l'icône de tendance
    const getTrendIcon = (change) => {
        if (change > 0) return ArrowUp;
        if (change < 0) return ArrowDown;
        return null;
    };

    // Filtrer les cartes à afficher
    const displayedCards = stats.customCards || statsConfig.filter(card => {
        // Afficher seulement les cartes qui ont des données
        return card.value !== undefined || stats[card.id] !== undefined;
    }).slice(0, stats.maxCards || 6);

    if (loading) {
        return (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-${Math.min(displayedCards.length, 4)} gap-4 ${className}`}>
                {[...Array(Math.min(displayedCards.length, 4))].map((_, index) => (
                    <Card key={index} className="p-6">
                        <div className="animate-pulse">
                            <div className="flex items-center justify-between">
                                <div className="space-y-3 flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                                    <div className="h-8 bg-gray-200 rounded w-32"></div>
                                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                                </div>
                                <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-${Math.min(displayedCards.length, 4)} gap-4 ${className}`}>
            {displayedCards.map((card) => {
                const IconComponent = card.icon;
                const change = calculateChange(card.value, card.previousValue);
                const TrendIcon = getTrendIcon(change);
                const trendColor = getTrendColor(change, card.trend);
                const showTrend = card.previousValue !== undefined && card.previousValue !== null;

                return (
                    <Card key={card.id} className="hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-600">
                                        {card.title}
                                    </p>
                                    <div className="mt-2 flex items-baseline">
                                        <p className="text-2xl font-bold text-gray-900">
                                            {card.formatter(card.value)}
                                        </p>
                                        {card.suffix && (
                                            <span className="ml-1 text-sm text-gray-500">
                                                {card.suffix}
                                            </span>
                                        )}
                                    </div>
                                    {showTrend && (
                                        <div className={`mt-2 flex items-center text-sm ${trendColor}`}>
                                            {TrendIcon && <TrendIcon className="h-4 w-4 mr-1" />}
                                            <span className="font-medium">
                                                {formatPercentage(Math.abs(change))}
                                            </span>
                                            <span className="ml-1 text-gray-600">
                                                vs période précédente
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className={`p-3 rounded-lg ${card.iconBgColor}`}>
                                    <IconComponent className={`h-6 w-6 ${card.iconColor}`} />
                                </div>
                            </div>

                            {/* Informations supplémentaires optionnelles */}
                            {card.details && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="space-y-1">
                                        {card.details.map((detail, index) => (
                                            <div key={index} className="flex justify-between text-sm">
                                                <span className="text-gray-600">{detail.label}</span>
                                                <span className="font-medium text-gray-900">
                                                    {detail.formatter ? detail.formatter(detail.value) : detail.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Barre de progression optionnelle */}
                            {card.progress !== undefined && (
                                <div className="mt-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">{card.progressLabel || 'Progression'}</span>
                                        <span className="font-medium text-gray-900">
                                            {formatPercentage(card.progress)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${
                                                card.progress >= 80 ? 'bg-green-500' :
                                                card.progress >= 60 ? 'bg-yellow-500' :
                                                'bg-red-500'
                                            }`}
                                            style={{ width: `${Math.min(card.progress, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Actions rapides optionnelles */}
                            {card.actions && card.actions.length > 0 && (
                                <div className="mt-4 flex space-x-2">
                                    {card.actions.map((action, index) => (
                                        <button
                                            key={index}
                                            onClick={action.onClick}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                        >
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                );
            })}
        </div>
    );
};

export default StatsCards;