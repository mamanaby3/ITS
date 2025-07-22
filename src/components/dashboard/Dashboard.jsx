// src/components/dashboard/Dashboard.jsx
import { useState, useEffect } from 'react';
import { mockAPI } from '../../services/api';
import {
    CubeIcon,
    ExclamationTriangleIcon,
    ArrowTrendingUpIcon,
    UsersIcon,
    BanknotesIcon,
    TruckIcon
} from '@heroicons/react/24/outline';
import { Package, AlertTriangle } from 'lucide-react';
import dispatchService from '../../services/dispatch';
import rotationService from '../../services/rotation';
import { useAuth } from '../../hooks/useAuth';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalProduits: 0,
        totalStock: 0,
        produitsEnRupture: 0,
        mouvementsAujourdhui: 0,
        valeurStock: 0,
        totalClients: 0,
        dispatchesEnCours: 0,
        rotationsEnTransit: 0,
        ecartsTotal: 0
    });
    const [recentMovements, setRecentMovements] = useState([]);
    const [recentDispatches, setRecentDispatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const promises = [
                mockAPI.getStats(),
                mockAPI.get('its_mouvements')
            ];

            // Ajouter les stats dispatch/rotation seulement pour les managers
            if (user?.role === 'manager') {
                promises.push(
                    dispatchService.getDispatches({ statut: 'en_cours' }).catch(() => []),
                    rotationService.getRotationsEnTransit().catch(() => []),
                    rotationService.getEcartsReport().catch(() => ({ rotations: [] }))
                );
            }

            const results = await Promise.all(promises);
            const [statsData, movements, dispatches, rotations, ecarts] = results;

            let additionalStats = {};
            if (user?.role === 'manager') {
                additionalStats = {
                    dispatchesEnCours: dispatches?.length || 0,
                    rotationsEnTransit: rotations?.length || 0,
                    ecartsTotal: ecarts?.rotations?.reduce((sum, r) => sum + r.ecart, 0) || 0
                };
            }

            setStats({ ...statsData, ...additionalStats });
            setRecentMovements(movements.slice(-5).reverse());
            if (dispatches) {
                setRecentDispatches(dispatches.slice(0, 3));
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-SN', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    {subtitle && (
                        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                    )}
                    {trend && (
                        <div className="flex items-center mt-2">
                            <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-sm text-green-600">{trend}</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-lg ${color}`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* En-tête */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
                <h1 className="text-2xl font-bold mb-2">Tableau de Bord</h1>
                <p className="text-blue-100">
                    Aperçu de votre système de gestion de stock ITS Sénégal
                </p>
            </div>

            {/* Cartes de statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    title="Produits en Stock"
                    value={stats.totalProduits.toLocaleString()}
                    icon={CubeIcon}
                    color="bg-blue-500"
                    subtitle={`${stats.totalStock} unités au total`}
                />

                <StatCard
                    title="Valeur du Stock"
                    value={formatCurrency(stats.valeurStock)}
                    icon={BanknotesIcon}
                    color="bg-green-500"
                    trend="+5.2% ce mois"
                />

                <StatCard
                    title="Produits en Rupture"
                    value={stats.produitsEnRupture}
                    icon={ExclamationTriangleIcon}
                    color={stats.produitsEnRupture > 0 ? "bg-red-500" : "bg-gray-400"}
                    subtitle={stats.produitsEnRupture > 0 ? "Attention requise" : "Tout va bien"}
                />

                <StatCard
                    title="Mouvements Aujourd'hui"
                    value={stats.mouvementsAujourdhui}
                    icon={TruckIcon}
                    color="bg-purple-500"
                    subtitle="Entrées et sorties"
                />

                <StatCard
                    title="Clients Actifs"
                    value={stats.totalClients}
                    icon={UsersIcon}
                    color="bg-indigo-500"
                    trend="+2 ce mois"
                />

                <StatCard
                    title="Taux de Rotation"
                    value="85%"
                    icon={ArrowTrendingUpIcon}
                    color="bg-emerald-500"
                    subtitle="Performance stock"
                />
            </div>

            {/* Nouvelles stats pour managers */}
            {user?.role === 'manager' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Dispatches en Cours"
                        value={stats.dispatchesEnCours}
                        icon={Package}
                        color="bg-blue-500"
                        subtitle="Transferts actifs"
                    />
                    <StatCard
                        title="Rotations en Transit"
                        value={stats.rotationsEnTransit}
                        icon={TruckIcon}
                        color="bg-orange-500"
                        subtitle="Camions en route"
                    />
                    <StatCard
                        title="Écarts Détectés"
                        value={formatCurrency(stats.ecartsTotal)}
                        icon={AlertTriangle}
                        color="bg-red-500"
                        subtitle="Total des manquements"
                    />
                </div>
            )}

            {/* Activité récente */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mouvements récents */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Mouvements Récents</h3>
                    </div>
                    <div className="p-6">
                        {recentMovements.length > 0 ? (
                            <div className="space-y-4">
                                {recentMovements.map((movement) => (
                                    <div key={movement.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                                        <div className="flex items-center space-x-3">
                                            <div className={`p-2 rounded-full ${
                                                movement.type === 'entree' ? 'bg-green-100' : 'bg-red-100'
                                            }`}>
                                                {movement.type === 'entree' ? (
                                                    <ArrowTrendingUpIcon className={`h-4 w-4 ${
                                                        movement.type === 'entree' ? 'text-green-600' : 'text-red-600'
                                                    }`} />
                                                ) : (
                                                    <TruckIcon className="h-4 w-4 text-red-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {movement.type === 'entree' ? 'Entrée' : 'Sortie'} - {movement.quantite} unités
                                                </p>
                                                <p className="text-sm text-gray-600">{movement.motif}</p>
                                                <p className="text-xs text-gray-500">{formatDate(movement.date)}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            movement.type === 'entree'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                      {movement.reference}
                    </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <TruckIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">Aucun mouvement récent</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Alertes et notifications */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Alertes & Notifications</h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {stats.produitsEnRupture > 0 && (
                                <div className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-red-800">
                                            Produits en rupture de stock
                                        </p>
                                        <p className="text-sm text-red-600">
                                            {stats.produitsEnRupture} produit(s) nécessitent un réapprovisionnement
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <CubeIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                                <div>
                                    <p className="font-medium text-blue-800">
                                        Inventaire mensuel
                                    </p>
                                    <p className="text-sm text-blue-600">
                                        Planifié pour la fin du mois
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <ArrowTrendingUpIcon className="h-5 w-5 text-green-500 mt-0.5" />
                                <div>
                                    <p className="font-medium text-green-800">
                                        Performance excellente
                                    </p>
                                    <p className="text-sm text-green-600">
                                        Taux de rotation du stock optimal ce mois
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions rapides */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                        <CubeIcon className="h-8 w-8 text-blue-500 mb-2" />
                        <span className="text-sm font-medium text-gray-900">Ajouter Produit</span>
                    </button>

                    <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                        <ArrowTrendingUpIcon className="h-8 w-8 text-green-500 mb-2" />
                        <span className="text-sm font-medium text-gray-900">Entrée Stock</span>
                    </button>

                    <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                        <TruckIcon className="h-8 w-8 text-red-500 mb-2" />
                        <span className="text-sm font-medium text-gray-900">Sortie Stock</span>
                    </button>

                    <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                        <UsersIcon className="h-8 w-8 text-purple-500 mb-2" />
                        <span className="text-sm font-medium text-gray-900">Nouveau Client</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;