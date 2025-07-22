// src/components/dashboard/Charts.jsx
import React, { useState, useMemo } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Calendar,
    Filter,
    Download,
    BarChart,
    LineChart,
    PieChart,
    Activity
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';

const Charts = ({
    salesData = [],
    inventoryData = [],
    categoryData = [],
    trendData = [],
    period = 'month',
    onPeriodChange,
    onExport,
    loading = false,
    className = ''
}) => {
    const [activeChart, setActiveChart] = useState('sales');
    const [showFilters, setShowFilters] = useState(false);

    // Simuler des données de graphique pour la démonstration
    const mockChartData = useMemo(() => {
        const generateDailyData = (days = 30) => {
            const data = [];
            const today = new Date();
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                data.push({
                    date: date.toISOString().split('T')[0],
                    sales: Math.floor(Math.random() * 100000) + 50000,
                    orders: Math.floor(Math.random() * 50) + 20,
                    units: Math.floor(Math.random() * 200) + 100
                });
            }
            return data;
        };

        return {
            daily: salesData.length > 0 ? salesData : generateDailyData(30),
            categories: categoryData.length > 0 ? categoryData : [
                { name: 'Électronique', value: 35, count: 125 },
                { name: 'Alimentation', value: 25, count: 89 },
                { name: 'Textiles', value: 20, count: 72 },
                { name: 'Cosmétiques', value: 15, count: 54 },
                { name: 'Autres', value: 5, count: 18 }
            ],
            inventory: inventoryData.length > 0 ? inventoryData : [
                { month: 'Jan', entrees: 850, sorties: 720, stock: 2100 },
                { month: 'Fév', entrees: 920, sorties: 810, stock: 2210 },
                { month: 'Mar', entrees: 780, sorties: 890, stock: 2100 },
                { month: 'Avr', entrees: 1050, sorties: 920, stock: 2230 },
                { month: 'Mai', entrees: 980, sorties: 850, stock: 2360 },
                { month: 'Jun', entrees: 1100, sorties: 970, stock: 2490 }
            ]
        };
    }, [salesData, categoryData, inventoryData]);

    // Calculer les totaux et moyennes
    const summary = useMemo(() => {
        const data = mockChartData.daily;
        const totalSales = data.reduce((sum, day) => sum + day.sales, 0);
        const totalOrders = data.reduce((sum, day) => sum + day.orders, 0);
        const avgDailySales = totalSales / data.length;
        const avgDailyOrders = totalOrders / data.length;

        // Calculer la tendance
        const firstHalf = data.slice(0, Math.floor(data.length / 2));
        const secondHalf = data.slice(Math.floor(data.length / 2));
        const firstHalfAvg = firstHalf.reduce((sum, day) => sum + day.sales, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, day) => sum + day.sales, 0) / secondHalf.length;
        const trend = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

        return {
            totalSales,
            totalOrders,
            avgDailySales,
            avgDailyOrders,
            trend,
            lastUpdate: new Date()
        };
    }, [mockChartData.daily]);

    const chartTypes = [
        { id: 'sales', label: 'Ventes', icon: TrendingUp },
        { id: 'inventory', label: 'Stock', icon: BarChart },
        { id: 'categories', label: 'Catégories', icon: PieChart },
        { id: 'trends', label: 'Tendances', icon: LineChart }
    ];

    const periods = [
        { value: 'week', label: '7 jours' },
        { value: 'month', label: '30 jours' },
        { value: 'quarter', label: '3 mois' },
        { value: 'year', label: '1 an' }
    ];

    // Composant de graphique simulé
    const ChartPlaceholder = ({ type, height = 300 }) => {
        const gradientId = `gradient-${type}`;
        
        return (
            <div className="relative" style={{ height }}>
                <svg className="w-full h-full" viewBox="0 0 400 300">
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    
                    {type === 'line' && (
                        <>
                            {/* Axes */}
                            <line x1="40" y1="250" x2="360" y2="250" stroke="#E5E7EB" strokeWidth="2" />
                            <line x1="40" y1="250" x2="40" y2="30" stroke="#E5E7EB" strokeWidth="2" />
                            
                            {/* Grille */}
                            {[0, 1, 2, 3, 4].map((i) => (
                                <line
                                    key={i}
                                    x1="40"
                                    y1={250 - (i + 1) * 44}
                                    x2="360"
                                    y2={250 - (i + 1) * 44}
                                    stroke="#F3F4F6"
                                    strokeWidth="1"
                                />
                            ))}
                            
                            {/* Courbe */}
                            <path
                                d="M 40 200 Q 100 150, 160 170 T 280 120 Q 320 100, 360 80"
                                fill="none"
                                stroke="#3B82F6"
                                strokeWidth="3"
                            />
                            <path
                                d="M 40 200 Q 100 150, 160 170 T 280 120 Q 320 100, 360 80 L 360 250 L 40 250 Z"
                                fill={`url(#${gradientId})`}
                            />
                        </>
                    )}
                    
                    {type === 'bar' && (
                        <>
                            {/* Axes */}
                            <line x1="40" y1="250" x2="360" y2="250" stroke="#E5E7EB" strokeWidth="2" />
                            <line x1="40" y1="250" x2="40" y2="30" stroke="#E5E7EB" strokeWidth="2" />
                            
                            {/* Barres */}
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <rect
                                    key={i}
                                    x={60 + i * 50}
                                    y={250 - (Math.random() * 150 + 50)}
                                    width="30"
                                    height={Math.random() * 150 + 50}
                                    fill="#3B82F6"
                                    opacity="0.8"
                                />
                            ))}
                        </>
                    )}
                    
                    {type === 'pie' && (
                        <g transform="translate(200, 150)">
                            <circle cx="0" cy="0" r="100" fill="#EF4444" />
                            <path d="M 0 0 L 100 0 A 100 100 0 0 1 30.9 95.1 Z" fill="#F59E0B" />
                            <path d="M 0 0 L 30.9 95.1 A 100 100 0 0 1 -80.9 58.8 Z" fill="#10B981" />
                            <path d="M 0 0 L -80.9 58.8 A 100 100 0 0 1 -80.9 -58.8 Z" fill="#3B82F6" />
                            <path d="M 0 0 L -80.9 -58.8 A 100 100 0 0 1 100 0 Z" fill="#8B5CF6" />
                        </g>
                    )}
                </svg>
                
                {/* Message de placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Graphique en temps réel</p>
                        <p className="text-xs text-gray-400 mt-1">Données mises à jour automatiquement</p>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className={`space-y-6 ${className}`}>
                <Card className="p-6">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
                        <div className="h-64 bg-gray-200 rounded"></div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* En-tête avec résumé */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Ventes</p>
                            <p className="text-xl font-bold text-gray-900">
                                {formatCurrency(summary.totalSales)}
                            </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Commandes</p>
                            <p className="text-xl font-bold text-gray-900">
                                {formatNumber(summary.totalOrders)}
                            </p>
                        </div>
                        <BarChart className="h-8 w-8 text-blue-500" />
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Moyenne/jour</p>
                            <p className="text-xl font-bold text-gray-900">
                                {formatCurrency(summary.avgDailySales)}
                            </p>
                        </div>
                        <LineChart className="h-8 w-8 text-purple-500" />
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Tendance</p>
                            <p className={`text-xl font-bold ${summary.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {summary.trend >= 0 ? '+' : ''}{summary.trend.toFixed(1)}%
                            </p>
                        </div>
                        {summary.trend >= 0 ? (
                            <TrendingUp className="h-8 w-8 text-green-500" />
                        ) : (
                            <TrendingDown className="h-8 w-8 text-red-500" />
                        )}
                    </div>
                </Card>
            </div>

            {/* Graphique principal */}
            <Card>
                <div className="p-6">
                    {/* Contrôles du graphique */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                            {chartTypes.map((chart) => {
                                const ChartIcon = chart.icon;
                                return (
                                    <button
                                        key={chart.id}
                                        onClick={() => setActiveChart(chart.id)}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                                            activeChart === chart.id
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        <ChartIcon className="h-4 w-4" />
                                        <span className="text-sm font-medium">{chart.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <select
                                value={period}
                                onChange={(e) => onPeriodChange?.(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                {periods.map((p) => (
                                    <option key={p.value} value={p.value}>
                                        {p.label}
                                    </option>
                                ))}
                            </select>
                            
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter className="h-4 w-4" />
                            </Button>
                            
                            {onExport && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onExport}
                                >
                                    <Download className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Zone du graphique */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        {activeChart === 'sales' && (
                            <ChartPlaceholder type="line" height={350} />
                        )}
                        {activeChart === 'inventory' && (
                            <ChartPlaceholder type="bar" height={350} />
                        )}
                        {activeChart === 'categories' && (
                            <ChartPlaceholder type="pie" height={350} />
                        )}
                        {activeChart === 'trends' && (
                            <ChartPlaceholder type="line" height={350} />
                        )}
                    </div>

                    {/* Légende ou informations supplémentaires */}
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center space-x-4">
                            {activeChart === 'sales' && (
                                <>
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                        <span>Ventes</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                        <span>Objectif</span>
                                    </div>
                                </>
                            )}
                            {activeChart === 'inventory' && (
                                <>
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                        <span>Entrées</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                                        <span>Sorties</span>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>Dernière mise à jour : {formatDate(summary.lastUpdate, 'HH:mm')}</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Graphiques secondaires */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top produits */}
                <Card>
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Produits</h3>
                        <div className="space-y-3">
                            {[
                                { name: 'Produit A', sales: 45000, units: 150 },
                                { name: 'Produit B', sales: 38000, units: 120 },
                                { name: 'Produit C', sales: 32000, units: 98 },
                                { name: 'Produit D', sales: 28000, units: 87 },
                                { name: 'Produit E', sales: 24000, units: 76 }
                            ].map((product, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{product.name}</p>
                                            <p className="text-sm text-gray-500">{product.units} unités</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">
                                            {formatCurrency(product.sales)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Répartition par catégorie */}
                <Card>
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par Catégorie</h3>
                        <div className="space-y-3">
                            {mockChartData.categories.map((category, index) => (
                                <div key={index}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-700">{category.name}</span>
                                        <span className="text-sm text-gray-600">{category.value}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${
                                                index === 0 ? 'bg-blue-500' :
                                                index === 1 ? 'bg-green-500' :
                                                index === 2 ? 'bg-yellow-500' :
                                                index === 3 ? 'bg-purple-500' :
                                                'bg-gray-500'
                                            }`}
                                            style={{ width: `${category.value}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{category.count} produits</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Charts;