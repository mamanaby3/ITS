import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Package, 
    TruckIcon, 
    AlertTriangle, 
    ArrowDownIcon, 
    ArrowUpIcon,
    Eye,
    Plus,
    BarChart3,
    Clock,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import StockEntryModal from './components/StockEntryModal';
import StockExitModal from './components/StockExitModal';
import StockViewModal from './components/StockViewModal';
import RecentMovements from './components/RecentMovements';
import PendingDispatches from './components/PendingDispatches';
import apiService from '@/services/api';

const OperatorDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        stock: [],
        todayStats: {
            entries: 0,
            exits: 0,
            pendingDispatches: 0,
            lowStockAlerts: 0
        },
        recentMovements: [],
        alerts: [],
        pendingDispatches: []
    });

    const [showEntryModal, setShowEntryModal] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [stock, stats, movements, dispatches] = await Promise.all([
                apiService.get(`/stock/magasin/${user.magasin_id}`),
                apiService.get(`/dashboard/operator/stats`),
                apiService.get(`/mouvements/recent?magasin_id=${user.magasin_id}&limit=10`),
                apiService.get(`/dispatches/pending/${user.magasin_id}`)
            ]);

            const lowStockProducts = stock.data.filter(item => 
                item.quantite_actuelle <= item.seuil_alerte
            );

            setDashboardData({
                stock: stock.data || [],
                todayStats: {
                    entries: stats.data.entries || 0,
                    exits: stats.data.exits || 0,
                    pendingDispatches: dispatches.data?.length || 0,
                    lowStockAlerts: lowStockProducts.length
                },
                recentMovements: movements.data || [],
                alerts: lowStockProducts,
                pendingDispatches: dispatches.data || []
            });
        } catch (error) {
            console.error('Erreur chargement dashboard:', error);
            toast.error('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const handleStockEntry = async (data) => {
        try {
            await apiService.post('/mouvements/entree', {
                ...data,
                magasin_id: user.magasin_id,
                utilisateur_id: user.id
            });
            toast.success('Entrée enregistrée avec succès');
            setShowEntryModal(false);
            fetchDashboardData();
        } catch (error) {
            toast.error('Erreur lors de l\'enregistrement');
        }
    };

    const handleStockExit = async (data) => {
        try {
            await apiService.post('/mouvements/sortie', {
                ...data,
                magasin_id: user.magasin_id,
                utilisateur_id: user.id
            });
            toast.success('Sortie enregistrée avec succès');
            setShowExitModal(false);
            fetchDashboardData();
        } catch (error) {
            toast.error('Erreur lors de l\'enregistrement');
        }
    };

    const StatCard = ({ title, value, icon: Icon, trend, color = 'blue' }) => (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600">{title}</p>
                        <h3 className="text-2xl font-bold mt-1">{value}</h3>
                        {trend && (
                            <p className={`text-sm mt-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {trend > 0 ? '+' : ''}{trend}% aujourd'hui
                            </p>
                        )}
                    </div>
                    <div className={`p-3 bg-${color}-100 rounded-lg`}>
                        <Icon className={`w-6 h-6 text-${color}-600`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Tableau de bord Opérateur</h1>
                    <p className="text-gray-600 mt-1">
                        {user.magasin?.nom} - {new Date().toLocaleDateString('fr-FR', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button 
                        onClick={() => setShowEntryModal(true)}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <ArrowDownIcon className="w-4 h-4 mr-2" />
                        Nouvelle Entrée
                    </Button>
                    <Button 
                        onClick={() => setShowExitModal(true)}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        <ArrowUpIcon className="w-4 h-4 mr-2" />
                        Nouvelle Sortie
                    </Button>
                </div>
            </div>

            {/* Alertes urgentes */}
            {dashboardData.alerts.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-red-800 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Alertes Stock Bas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {dashboardData.alerts.map((alert, index) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-white rounded">
                                    <span className="font-medium">{alert.produit?.nom}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-red-600 font-bold">
                                            {alert.quantite_actuelle} {alert.produit?.unite}
                                        </span>
                                        <Badge variant="destructive">Stock bas</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Statistiques du jour */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard 
                    title="Entrées du jour"
                    value={dashboardData.todayStats.entries}
                    icon={ArrowDownIcon}
                    color="green"
                />
                <StatCard 
                    title="Sorties du jour"
                    value={dashboardData.todayStats.exits}
                    icon={ArrowUpIcon}
                    color="orange"
                />
                <StatCard 
                    title="Dispatches en attente"
                    value={dashboardData.todayStats.pendingDispatches}
                    icon={TruckIcon}
                    color="blue"
                />
                <StatCard 
                    title="Alertes stock"
                    value={dashboardData.todayStats.lowStockAlerts}
                    icon={AlertTriangle}
                    color="red"
                />
            </div>

            {/* Contenu principal avec onglets */}
            <Tabs defaultValue="stock" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="stock">Mon Stock</TabsTrigger>
                    <TabsTrigger value="movements">Mouvements Récents</TabsTrigger>
                    <TabsTrigger value="dispatches">Dispatches en Attente</TabsTrigger>
                    <TabsTrigger value="history">Historique</TabsTrigger>
                </TabsList>

                <TabsContent value="stock" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>État du Stock</CardTitle>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setShowStockModal(true)}
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Vue détaillée
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {dashboardData.stock.slice(0, 10).map((item) => (
                                    <div key={item.id} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold">{item.produit?.nom}</h4>
                                                <p className="text-sm text-gray-600">
                                                    Code: {item.produit?.code}
                                                </p>
                                            </div>
                                            <Badge variant={
                                                item.quantite_actuelle <= item.seuil_alerte ? 'destructive' : 
                                                item.quantite_actuelle <= item.seuil_alerte * 2 ? 'warning' : 
                                                'success'
                                            }>
                                                {item.quantite_actuelle} {item.produit?.unite}
                                            </Badge>
                                        </div>
                                        <div className="mt-3">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Niveau de stock</span>
                                                <span>{Math.round((item.quantite_actuelle / item.quantite_max) * 100)}%</span>
                                            </div>
                                            <Progress 
                                                value={(item.quantite_actuelle / item.quantite_max) * 100}
                                                className="h-2"
                                            />
                                        </div>
                                        <div className="mt-2 flex gap-2">
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedProduct(item.produit);
                                                    setShowEntryModal(true);
                                                }}
                                            >
                                                <Plus className="w-3 h-3 mr-1" />
                                                Entrée
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedProduct(item.produit);
                                                    setShowExitModal(true);
                                                }}
                                            >
                                                <ArrowUpIcon className="w-3 h-3 mr-1" />
                                                Sortie
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="movements">
                    <RecentMovements movements={dashboardData.recentMovements} />
                </TabsContent>

                <TabsContent value="dispatches">
                    <PendingDispatches 
                        dispatches={dashboardData.pendingDispatches}
                        onAccept={fetchDashboardData}
                    />
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historique des mouvements</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600">Fonctionnalité en cours de développement...</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Modals */}
            <StockEntryModal 
                open={showEntryModal}
                onClose={() => {
                    setShowEntryModal(false);
                    setSelectedProduct(null);
                }}
                onSubmit={handleStockEntry}
                defaultProduct={selectedProduct}
            />

            <StockExitModal 
                open={showExitModal}
                onClose={() => {
                    setShowExitModal(false);
                    setSelectedProduct(null);
                }}
                onSubmit={handleStockExit}
                defaultProduct={selectedProduct}
                currentStock={dashboardData.stock}
            />

            <StockViewModal 
                open={showStockModal}
                onClose={() => setShowStockModal(false)}
                stock={dashboardData.stock}
            />
        </div>
    );
};

export default OperatorDashboard;