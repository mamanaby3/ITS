import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Package, TrendingUp, TrendingDown, AlertTriangle, Truck, Users, ShoppingCart, Calendar, RefreshCw, Filter, Download, Eye, Activity } from 'lucide-react';
import { MockApiService } from '../services/mockApi';
import Card from '../components/ui/Card';
import Loading from '../components/ui/Loading';
import Button from '../components/ui/Button';
import { formatCurrency } from '../utils/formatters';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, colorClass = 'bg-blue-500', onClick }) => {
    return (
        <Card 
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer" 
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    {subtitle && (
                        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                    )}
                    {trend && (
                        <div className="flex items-center mt-2">
                            {trend === 'up' ? (
                                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                            )}
                            <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                {trendValue}%
                            </span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
                    <Icon className={`h-6 w-6 ${colorClass.replace('bg-', 'text-')}`} />
                </div>
            </div>
        </Card>
    );
};

const DashboardImproved = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState({
        mouvements: [],
        categories: [],
        evolution: [],
        performance: []
    });
    const [alertes, setAlertes] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState('7days');
    const [showAllAlerts, setShowAllAlerts] = useState(false);
    const [selectedChart, setSelectedChart] = useState('mouvements');

    useEffect(() => {
        loadDashboardData();
    }, [selectedPeriod]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            
            // Charger toutes les données en parallèle
            const [dashboardStats, mouvements, produits, stock, clients] = await Promise.all([
                MockApiService.getDashboardStats(),
                MockApiService.getTransactions(),
                MockApiService.getProduits(),
                MockApiService.getStock(),
                MockApiService.getClients()
            ]);

            setStats({
                ...dashboardStats,
                totalClients: clients.length,
                clientsActifs: clients.filter(c => c.actif).length
            });
            
            // Préparer les données selon la période
            const days = selectedPeriod === '30days' ? 30 : 7;
            const mouvementsData = prepareMovementsData(mouvements, days);
            const categoriesData = prepareCategoriesData(produits);
            const evolutionData = prepareEvolutionData(mouvements, produits, days);
            const performanceData = preparePerformanceData(mouvements, produits);
            
            setChartData({
                mouvements: mouvementsData,
                categories: categoriesData,
                evolution: evolutionData,
                performance: performanceData
            });
            
            // Préparer les alertes
            const alertesStock = prepareAlertes(produits, stock);
            setAlertes(alertesStock);
            
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const prepareMovementsData = (mouvements, days) => {
        const data = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const entrees = mouvements.filter(m => 
                m.type === 'entree' && m.date.startsWith(dateStr)
            );
            
            const sorties = mouvements.filter(m => 
                m.type === 'sortie' && m.date.startsWith(dateStr)
            );
            
            data.push({
                date: date.toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: days > 7 ? 'short' : undefined,
                    weekday: days <= 7 ? 'short' : undefined
                }),
                entrees: entrees.length,
                sorties: sorties.length,
                tonnageEntree: entrees.reduce((sum, m) => sum + (m.quantite || 0), 0),
                tonnageSortie: sorties.reduce((sum, m) => sum + (m.quantite || 0), 0)
            });
        }
        return data;
    };

    const prepareCategoriesData = (produits) => {
        const categoriesCount = {};
        produits.forEach(produit => {
            const cat = produit.categorie || 'Autre';
            if (!categoriesCount[cat]) {
                categoriesCount[cat] = { count: 0, value: 0 };
            }
            categoriesCount[cat].count += 1;
            categoriesCount[cat].value += produit.prix_achat * (produit.stock_actuel || 0);
        });
        
        return Object.entries(categoriesCount).map(([name, data]) => ({
            name,
            count: data.count,
            value: data.value
        }));
    };

    const prepareEvolutionData = (mouvements, produits, days) => {
        const data = [];
        let stockValue = produits.reduce((sum, p) => sum + (p.prix_achat * (p.stock_actuel || 0)), 0);
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            // Simulation de l'évolution
            stockValue += (Math.random() - 0.3) * 50000;
            
            data.push({
                date: date.toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'short'
                }),
                valeur: Math.max(0, Math.round(stockValue))
            });
        }
        return data;
    };

    const preparePerformanceData = (mouvements, produits) => {
        // Top 5 produits par mouvement
        const productMovements = {};
        
        mouvements.forEach(m => {
            if (!productMovements[m.produitId]) {
                productMovements[m.produitId] = { entrees: 0, sorties: 0 };
            }
            if (m.type === 'entree') {
                productMovements[m.produitId].entrees += m.quantite || 0;
            } else {
                productMovements[m.produitId].sorties += m.quantite || 0;
            }
        });

        return Object.entries(productMovements)
            .map(([produitId, data]) => {
                const produit = produits.find(p => p.id === parseInt(produitId));
                return {
                    nom: produit?.nom || 'Inconnu',
                    entrees: data.entrees,
                    sorties: data.sorties,
                    rotation: data.sorties / (data.entrees || 1)
                };
            })
            .sort((a, b) => b.rotation - a.rotation)
            .slice(0, 5);
    };

    const prepareAlertes = (produits, stock) => {
        const alertesStock = [];
        const stockParProduit = {};
        
        stock.forEach(item => {
            if (!stockParProduit[item.produitId]) {
                stockParProduit[item.produitId] = 0;
            }
            stockParProduit[item.produitId] += item.quantite;
        });
        
        produits.forEach(produit => {
            const quantite = stockParProduit[produit.id] || 0;
            const seuil = produit.seuilAlerte || 0;
            
            if (quantite === 0) {
                alertesStock.push({
                    type: 'danger',
                    message: `${produit.nom} est en rupture de stock`,
                    produit: produit.nom,
                    action: 'Commander immédiatement'
                });
            } else if (quantite <= seuil) {
                alertesStock.push({
                    type: 'warning',
                    message: `${produit.nom} est en stock faible (${quantite} unités)`,
                    produit: produit.nom,
                    action: 'Prévoir réapprovisionnement'
                });
            }
        });
        
        return alertesStock.sort((a, b) => {
            if (a.type === 'danger' && b.type === 'warning') return -1;
            if (a.type === 'warning' && b.type === 'danger') return 1;
            return 0;
        });
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadDashboardData();
    };

    const exportData = () => {
        const data = {
            stats,
            mouvements: chartData.mouvements,
            alertes,
            date: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard_export_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    if (loading) {
        return <Loading />;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* En-tête avec actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
                    <p className="text-gray-600 mt-1">Vue d'ensemble de votre activité</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="7days">7 derniers jours</option>
                        <option value="30days">30 derniers jours</option>
                    </select>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing}
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={exportData}
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Cartes de statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Produits en stock"
                    value={stats?.totalProduits || 0}
                    subtitle={`${stats?.produitsActifs || 0} actifs`}
                    icon={Package}
                    colorClass="bg-blue-500"
                    onClick={() => window.location.href = '/stock'}
                />
                <StatCard
                    title="Valeur totale"
                    value={formatCurrency(stats?.valeurTotale || 0)}
                    icon={TrendingUp}
                    trend="up"
                    trendValue="12.5"
                    colorClass="bg-green-500"
                />
                <StatCard
                    title="Clients"
                    value={stats?.totalClients || 0}
                    subtitle={`${stats?.clientsActifs || 0} actifs`}
                    icon={Users}
                    colorClass="bg-purple-500"
                    onClick={() => window.location.href = '/clients'}
                />
                <StatCard
                    title="Alertes stock"
                    value={alertes.filter(a => a.type === 'danger').length}
                    subtitle={`${alertes.length} total`}
                    icon={AlertTriangle}
                    colorClass="bg-red-500"
                />
            </div>

            {/* Section Alertes */}
            {alertes.length > 0 && (
                <Card className="mb-8 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            Alertes stock
                        </h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAllAlerts(!showAllAlerts)}
                        >
                            {showAllAlerts ? 'Voir moins' : `Voir tout (${alertes.length})`}
                        </Button>
                    </div>
                    <div className="space-y-3">
                        {(showAllAlerts ? alertes : alertes.slice(0, 3)).map((alerte, index) => (
                            <div
                                key={index}
                                className={`p-4 rounded-lg border flex items-center justify-between ${
                                    alerte.type === 'danger' 
                                        ? 'bg-red-50 border-red-200' 
                                        : 'bg-yellow-50 border-yellow-200'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                                        alerte.type === 'danger' ? 'text-red-600' : 'text-yellow-600'
                                    }`} />
                                    <div>
                                        <p className={`text-sm font-medium ${
                                            alerte.type === 'danger' ? 'text-red-800' : 'text-yellow-800'
                                        }`}>
                                            {alerte.message}
                                        </p>
                                        <p className={`text-xs mt-1 ${
                                            alerte.type === 'danger' ? 'text-red-600' : 'text-yellow-600'
                                        }`}>
                                            {alerte.action}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className={alerte.type === 'danger' ? 'text-red-600' : 'text-yellow-600'}
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Graphiques avec onglets */}
            <Card className="mb-8">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 px-6">
                        {[
                            { id: 'mouvements', label: 'Mouvements', icon: Activity },
                            { id: 'categories', label: 'Répartition', icon: Package },
                            { id: 'evolution', label: 'Évolution', icon: TrendingUp },
                            { id: 'performance', label: 'Performance', icon: BarChart }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedChart(tab.id)}
                                className={`
                                    py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                                    ${selectedChart === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }
                                `}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    {selectedChart === 'mouvements' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Mouvements de stock
                            </h3>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={chartData.mouvements}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="tonnageEntree" fill="#10B981" name="Entrées (tonnes)" />
                                    <Bar dataKey="tonnageSortie" fill="#EF4444" name="Sorties (tonnes)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {selectedChart === 'categories' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Répartition par catégorie
                            </h3>
                            <ResponsiveContainer width="100%" height={350}>
                                <PieChart>
                                    <Pie
                                        data={chartData.categories}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={120}
                                        fill="#8884d8"
                                        dataKey="count"
                                    >
                                        {chartData.categories.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `${value} produits`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {selectedChart === 'evolution' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Évolution de la valeur du stock
                            </h3>
                            <ResponsiveContainer width="100%" height={350}>
                                <AreaChart data={chartData.evolution}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="valeur" 
                                        stroke="#3B82F6" 
                                        fill="#3B82F6"
                                        fillOpacity={0.2}
                                        strokeWidth={2}
                                        name="Valeur totale"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {selectedChart === 'performance' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Top 5 produits par rotation
                            </h3>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={chartData.performance} layout="horizontal">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="nom" type="category" width={100} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="entrees" fill="#10B981" name="Entrées" />
                                    <Bar dataKey="sorties" fill="#F59E0B" name="Sorties" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </Card>

            {/* Indicateurs de performance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">Taux de rotation moyen</h3>
                    <div className="flex items-end gap-2">
                        <p className="text-3xl font-bold text-gray-900">
                            {((chartData.performance.reduce((sum, p) => sum + p.rotation, 0) / chartData.performance.length) || 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500 mb-1">fois/période</p>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">Mouvements aujourd'hui</h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-lg font-semibold text-green-600">
                                +{chartData.mouvements[chartData.mouvements.length - 1]?.entrees || 0}
                            </p>
                            <p className="text-xs text-gray-500">Entrées</p>
                        </div>
                        <div className="h-12 w-px bg-gray-200" />
                        <div>
                            <p className="text-lg font-semibold text-red-600">
                                -{chartData.mouvements[chartData.mouvements.length - 1]?.sorties || 0}
                            </p>
                            <p className="text-xs text-gray-500">Sorties</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">Efficacité opérationnelle</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Livraisons à temps</span>
                            <span className="text-sm font-medium">95%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }} />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default DashboardImproved;