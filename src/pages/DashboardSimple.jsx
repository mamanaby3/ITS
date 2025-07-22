import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { MockApiService } from '../services/mockApi';
import Card from '../components/ui/Card';
import Loading from '../components/ui/Loading';
import { formatCurrency } from '../utils/formatters';

const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => {
    const colors = {
        blue: 'bg-blue-100 text-blue-700',
        green: 'bg-green-100 text-green-700',
        red: 'bg-red-100 text-red-700',
        purple: 'bg-purple-100 text-purple-700'
    };

    return (
        <Card className="p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600">{title}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                <div className={`p-3 rounded-lg ${colors[color]}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </Card>
    );
};

const DashboardSimple = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [alertes, setAlertes] = useState([]);
    const [activitesRecentes, setActivitesRecentes] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            
            const dashboardStats = await MockApiService.getDashboardStats();
            setStats(dashboardStats);
            
            const produits = await MockApiService.getProduits();
            const stock = await MockApiService.getStock();
            
            // Alertes simplifiées
            const alertesStock = [];
            const stockParProduit = {};
            
            stock.forEach(item => {
                stockParProduit[item.produitId] = (stockParProduit[item.produitId] || 0) + item.quantite;
            });
            
            produits.forEach(produit => {
                const quantite = stockParProduit[produit.id] || 0;
                if (quantite === 0) {
                    alertesStock.push({
                        type: 'danger',
                        message: `${produit.nom} - Rupture de stock`
                    });
                } else if (quantite <= (produit.seuilAlerte || 0)) {
                    alertesStock.push({
                        type: 'warning',
                        message: `${produit.nom} - Stock faible (${quantite})`
                    });
                }
            });
            
            setAlertes(alertesStock.slice(0, 3));
            
            // Activités récentes simplifiées
            const mouvements = await MockApiService.getTransactions();
            const recentMouvements = mouvements
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5)
                .map(m => ({
                    type: m.type,
                    description: `${m.type === 'entree' ? 'Entrée' : 'Sortie'} - ${m.produitNom}`,
                    quantite: m.quantite,
                    date: new Date(m.date).toLocaleDateString('fr-FR')
                }));
            
            setActivitesRecentes(recentMouvements);
            
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loading />;

    return (
        <div className="p-4 max-w-7xl mx-auto">
            <h1 className="text-xl font-bold mb-6">Tableau de bord</h1>

            {/* Stats principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    title="Produits en stock"
                    value={stats?.totalProduits || 0}
                    icon={Package}
                    color="blue"
                />
                <StatCard
                    title="Valeur totale"
                    value={formatCurrency(stats?.valeurTotale || 0)}
                    icon={TrendingUp}
                    color="green"
                />
                <StatCard
                    title="Alertes"
                    value={alertes.length}
                    icon={AlertTriangle}
                    color="red"
                />
                <StatCard
                    title="Mouvements du jour"
                    value={stats?.commandesJour || 0}
                    icon={Activity}
                    color="purple"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Alertes */}
                {alertes.length > 0 && (
                    <Card className="p-4">
                        <h2 className="font-semibold mb-3 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Alertes stock
                        </h2>
                        <div className="space-y-2">
                            {alertes.map((alerte, index) => (
                                <div
                                    key={index}
                                    className={`p-3 rounded text-sm ${
                                        alerte.type === 'danger' 
                                            ? 'bg-red-50 text-red-700' 
                                            : 'bg-yellow-50 text-yellow-700'
                                    }`}
                                >
                                    {alerte.message}
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Activités récentes */}
                <Card className="p-4">
                    <h2 className="font-semibold mb-3 flex items-center">
                        <Activity className="h-4 w-4 mr-2" />
                        Activités récentes
                    </h2>
                    <div className="space-y-2">
                        {activitesRecentes.length > 0 ? (
                            activitesRecentes.map((activite, index) => (
                                <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                                    <div>
                                        <p className="text-sm font-medium">{activite.description}</p>
                                        <p className="text-xs text-gray-500">{activite.date}</p>
                                    </div>
                                    <span className={`text-sm font-medium ${
                                        activite.type === 'entree' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {activite.quantite} unités
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">
                                Aucune activité récente
                            </p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default DashboardSimple;