// src/components/dashboard/RecentActivity.jsx
import React, { useState, useMemo } from 'react';
import {
    Clock,
    Package,
    ShoppingCart,
    Users,
    Truck,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    CheckCircle,
    XCircle,
    Filter,
    RefreshCw
} from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatDate, formatCurrency, formatQuantity } from '../../utils/formatters';

const RecentActivity = ({
    activities = [],
    maxItems = 10,
    onViewAll,
    onRefresh,
    loading = false,
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute
    className = ''
}) => {
    const [filterType, setFilterType] = useState('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Types d'activités
    const activityTypes = {
        stock_entry: {
            icon: TrendingUp,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
            label: 'Entrée stock'
        },
        stock_exit: {
            icon: TrendingDown,
            color: 'text-red-600',
            bgColor: 'bg-red-100',
            label: 'Sortie stock'
        },
        new_order: {
            icon: ShoppingCart,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
            label: 'Nouvelle commande'
        },
        new_customer: {
            icon: Users,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
            label: 'Nouveau client'
        },
        delivery: {
            icon: Truck,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-100',
            label: 'Livraison'
        },
        alert: {
            icon: AlertCircle,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100',
            label: 'Alerte'
        },
        success: {
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
            label: 'Succès'
        },
        error: {
            icon: XCircle,
            color: 'text-red-600',
            bgColor: 'bg-red-100',
            label: 'Erreur'
        }
    };

    // Générer des activités de démonstration si aucune n'est fournie
    const mockActivities = useMemo(() => {
        if (activities.length > 0) return activities;

        const types = Object.keys(activityTypes);
        const users = ['Jean Dupont', 'Marie Martin', 'Pierre Bernard', 'Sophie Durand'];
        const products = ['Produit A', 'Produit B', 'Produit C', 'Produit D'];
        const customers = ['Client X', 'Client Y', 'Client Z'];
        
        const generateActivity = (hoursAgo) => {
            const type = types[Math.floor(Math.random() * types.length)];
            const user = users[Math.floor(Math.random() * users.length)];
            const timestamp = new Date();
            timestamp.setHours(timestamp.getHours() - hoursAgo);
            timestamp.setMinutes(Math.floor(Math.random() * 60));

            const baseActivity = {
                id: `activity-${hoursAgo}-${Math.random()}`,
                type,
                user,
                timestamp: timestamp.toISOString(),
                read: Math.random() > 0.3
            };

            switch (type) {
                case 'stock_entry':
                    return {
                        ...baseActivity,
                        title: 'Entrée de stock',
                        description: `${products[Math.floor(Math.random() * products.length)]}`,
                        details: {
                            quantity: Math.floor(Math.random() * 100) + 10,
                            unit: 'unités'
                        }
                    };
                case 'stock_exit':
                    return {
                        ...baseActivity,
                        title: 'Sortie de stock',
                        description: `${products[Math.floor(Math.random() * products.length)]}`,
                        details: {
                            quantity: Math.floor(Math.random() * 50) + 5,
                            unit: 'unités'
                        }
                    };
                case 'new_order':
                    return {
                        ...baseActivity,
                        title: 'Nouvelle commande',
                        description: `Commande #${Math.floor(Math.random() * 9000) + 1000}`,
                        details: {
                            customer: customers[Math.floor(Math.random() * customers.length)],
                            amount: Math.floor(Math.random() * 500000) + 50000
                        }
                    };
                case 'new_customer':
                    return {
                        ...baseActivity,
                        title: 'Nouveau client',
                        description: customers[Math.floor(Math.random() * customers.length)],
                        details: {
                            type: Math.random() > 0.5 ? 'Particulier' : 'Entreprise'
                        }
                    };
                case 'delivery':
                    return {
                        ...baseActivity,
                        title: 'Livraison',
                        description: `Livraison #LIV${Math.floor(Math.random() * 9000) + 1000}`,
                        details: {
                            status: Math.random() > 0.7 ? 'Livrée' : 'En cours',
                            customer: customers[Math.floor(Math.random() * customers.length)]
                        }
                    };
                case 'alert':
                    return {
                        ...baseActivity,
                        title: 'Alerte stock',
                        description: `Stock faible - ${products[Math.floor(Math.random() * products.length)]}`,
                        details: {
                            level: Math.random() > 0.5 ? 'Critique' : 'Attention'
                        }
                    };
                default:
                    return baseActivity;
            }
        };

        // Générer 20 activités récentes
        return Array.from({ length: 20 }, (_, i) => generateActivity(i * 0.5))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [activities]);

    // Filtrer les activités
    const filteredActivities = useMemo(() => {
        if (filterType === 'all') return mockActivities;
        return mockActivities.filter(activity => activity.type === filterType);
    }, [mockActivities, filterType]);

    // Activités à afficher
    const displayedActivities = filteredActivities.slice(0, maxItems);

    // Calculer le temps écoulé
    const getTimeAgo = (timestamp) => {
        const now = new Date();
        const date = new Date(timestamp);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "À l'instant";
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays < 7) return `Il y a ${diffDays}j`;
        return formatDate(date, 'dd/MM/yyyy');
    };

    // Rafraîchir les données
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await onRefresh?.();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    // Auto-refresh
    React.useEffect(() => {
        if (autoRefresh && refreshInterval > 0) {
            const interval = setInterval(handleRefresh, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [autoRefresh, refreshInterval]);

    // Obtenir l'icône et les couleurs pour un type d'activité
    const getActivityStyle = (type) => {
        return activityTypes[type] || activityTypes.alert;
    };

    // Résumé des activités non lues
    const unreadCount = useMemo(() => {
        return mockActivities.filter(a => !a.read).length;
    }, [mockActivities]);

    if (loading) {
        return (
            <Card className={className}>
                <div className="p-6">
                    <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-start space-x-3">
                                    <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <div className="p-6">
                {/* En-tête */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">Activité récente</h3>
                        {unreadCount > 0 && (
                            <Badge variant="blue" size="sm">
                                {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        {onRefresh && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="p-2"
                            >
                                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </Button>
                        )}
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="text-sm border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Toutes</option>
                            {Object.entries(activityTypes).map(([key, config]) => (
                                <option key={key} value={key}>{config.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Liste des activités */}
                <div className="space-y-4">
                    {displayedActivities.length === 0 ? (
                        <div className="text-center py-8">
                            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500">Aucune activité récente</p>
                        </div>
                    ) : (
                        displayedActivities.map((activity) => {
                            const style = getActivityStyle(activity.type);
                            const IconComponent = style.icon;

                            return (
                                <div
                                    key={activity.id}
                                    className={`flex items-start space-x-3 ${
                                        !activity.read ? 'relative' : ''
                                    }`}
                                >
                                    {/* Indicateur non lu */}
                                    {!activity.read && (
                                        <div className="absolute -left-4 top-5 w-2 h-2 bg-blue-600 rounded-full"></div>
                                    )}

                                    {/* Icône */}
                                    <div className={`p-2 rounded-lg ${style.bgColor} flex-shrink-0`}>
                                        <IconComponent className={`h-5 w-5 ${style.color}`} />
                                    </div>

                                    {/* Contenu */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className={`text-sm font-medium text-gray-900 ${
                                                    !activity.read ? 'font-semibold' : ''
                                                }`}>
                                                    {activity.title}
                                                </p>
                                                <p className="text-sm text-gray-600 mt-0.5">
                                                    {activity.description}
                                                </p>
                                                
                                                {/* Détails supplémentaires */}
                                                {activity.details && (
                                                    <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500">
                                                        {activity.details.quantity && (
                                                            <span>
                                                                {formatQuantity(activity.details.quantity, activity.details.unit)}
                                                            </span>
                                                        )}
                                                        {activity.details.amount && (
                                                            <span className="font-medium">
                                                                {formatCurrency(activity.details.amount)}
                                                            </span>
                                                        )}
                                                        {activity.details.customer && (
                                                            <span>{activity.details.customer}</span>
                                                        )}
                                                        {activity.details.status && (
                                                            <Badge 
                                                                variant={activity.details.status === 'Livrée' ? 'green' : 'blue'} 
                                                                size="xs"
                                                            >
                                                                {activity.details.status}
                                                            </Badge>
                                                        )}
                                                        {activity.details.level && (
                                                            <Badge 
                                                                variant={activity.details.level === 'Critique' ? 'red' : 'yellow'} 
                                                                size="xs"
                                                            >
                                                                {activity.details.level}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {/* Utilisateur et temps */}
                                                <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                                                    <span>{activity.user}</span>
                                                    <span>"</span>
                                                    <span>{getTimeAgo(activity.timestamp)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                {filteredActivities.length > maxItems && onViewAll && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onViewAll}
                            className="w-full"
                        >
                            Voir toute l'activité ({filteredActivities.length} éléments)
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default RecentActivity;