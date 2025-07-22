import React, { useState, useRef, useEffect } from 'react';
import {
    Menu,
    Bell,
    User,
    Settings,
    LogOut,
    ChevronDown,
    Package,
    Truck,
    AlertTriangle,
    CheckCircle,
    Ship
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/helpers';
import naviresService from '../../services/navires';
import stockService from '../../services/stock';
import toast from 'react-hot-toast';
import MagasinSelector from './MagasinSelector';
import ProduitSelector from './ProduitSelector';
import ClientSelector from './ClientSelector';
import { useFilters } from '../../hooks/useFilters';

const Header = ({ onMenuClick }) => {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const userMenuRef = useRef(null);
    const notificationRef = useRef(null);

    const { user, getUserFullName, logout, isManager, isOperator } = useAuth();
    const { filters, updateFilter } = useFilters();

    // Fermer les menus en cliquant à l'extérieur
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Charger les notifications
    useEffect(() => {
        if (user) {
            loadNotifications();
            // Recharger toutes les 30 secondes
            const interval = setInterval(loadNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const loadNotifications = async () => {
        try {
            let notifs = [];

            if (isManager()) {
                // Notifications pour le manager via l'API
                try {
                    // Récupérer toutes les données en parallèle
                    const [alertesResponse, naviresResponse, dispatchesResponse] = await Promise.all([
                        stockService.getAlertes().catch(() => ({ data: [] })),
                        naviresService.getNavires({ statut: 'en_attente' }).catch(() => ({ data: [] })),
                        naviresService.getDispatchesEnAttente().catch(() => ({ data: [] }))
                    ]);

                    const alertesStock = alertesResponse.data || alertesResponse || [];
                    const naviresAttente = naviresResponse.data || naviresResponse || [];
                    const dispatches = dispatchesResponse.data || dispatchesResponse || [];

                    // Alertes de stock bas
                    if (Array.isArray(alertesStock)) {
                        alertesStock.forEach(alerte => {
                            if (alerte.type === 'stock_bas' || alerte.type === 'rupture') {
                                notifs.push({
                                    id: `stock-${alerte.id}`,
                                    type: 'warning',
                                    icon: AlertTriangle,
                                    title: alerte.type === 'rupture' ? 'Rupture de stock' : 'Stock faible',
                                    message: `${alerte.produit?.nom || alerte.produit_nom} - ${alerte.quantite_restante || 0} T restantes`,
                                    time: new Date(alerte.created_at || Date.now()),
                                    priority: alerte.type === 'rupture' ? 'high' : 'medium'
                                });
                            }
                        });
                    }

                    // Navires en attente
                    if (Array.isArray(naviresAttente)) {
                        naviresAttente.forEach(navire => {
                            notifs.push({
                                id: `navire-${navire.id}`,
                                type: 'info',
                                icon: Ship,
                                title: 'Navire en attente',
                                message: `${navire.nom} - ${navire.tonnage_total} T à dispatcher`,
                                time: new Date(navire.date_arrivee || Date.now()),
                                priority: 'medium'
                            });
                        });
                    }

                    // Dispatches non confirmés
                    if (Array.isArray(dispatches)) {
                        dispatches.forEach(dispatch => {
                            notifs.push({
                                id: `dispatch-${dispatch.id}`,
                                type: 'warning',
                                icon: Package,
                                title: 'Dispatch en attente',
                                message: `${dispatch.quantite} T de ${dispatch.produit?.nom || dispatch.produit_nom} vers ${dispatch.magasin?.nom || dispatch.magasin_nom}`,
                                time: new Date(dispatch.created_at || Date.now()),
                                priority: 'high'
                            });
                        });
                    }
                } catch (error) {
                    console.error('Erreur chargement notifications manager:', error);
                }
            }

            if (isOperator()) {
                // Notifications pour l'opérateur via l'API
                const userMagasinId = user.magasin_id || user.magasin?.id;
                
                try {
                    // Récupérer toutes les données en parallèle
                    const [stockResponse, dispatchesResponse, rotationsResponse] = await Promise.all([
                        stockService.getStockByMagasin(userMagasinId).catch(() => ({ data: [] })),
                        naviresService.getDispatchesRecents({ magasin_id: userMagasinId, limit: 5 }).catch(() => ({ data: [] })),
                        naviresService.getRotationsEnTransit({ magasin_id: userMagasinId }).catch(() => ({ data: [] }))
                    ]);

                    const stockMagasin = stockResponse.data || stockResponse || [];
                    const recentDispatches = dispatchesResponse.data || dispatchesResponse || [];
                    const rotations = rotationsResponse.data || rotationsResponse || [];

                    // Stock dispatché reçu
                    if (Array.isArray(recentDispatches)) {
                        recentDispatches.forEach(dispatch => {
                            notifs.push({
                                id: `dispatch-recu-${dispatch.id}`,
                                type: 'success',
                                icon: CheckCircle,
                                title: 'Stock reçu',
                                message: `${dispatch.quantite} T de ${dispatch.produit?.nom || dispatch.produit_nom} disponible`,
                                time: new Date(dispatch.date_confirmation || dispatch.created_at || Date.now()),
                                priority: 'medium'
                            });
                        });
                    }

                    // Rotations en transit
                    if (Array.isArray(rotations)) {
                        rotations.forEach(rotation => {
                            notifs.push({
                                id: `rotation-${rotation.id}`,
                                type: 'info',
                                icon: Truck,
                                title: 'Rotation en transit',
                                message: `${rotation.quantite} T en route - Arrivée prévue: ${new Date(rotation.date_arrivee_prevue).toLocaleTimeString()}`,
                                time: new Date(rotation.created_at || Date.now()),
                                priority: 'medium'
                            });
                        });
                    }

                    // Alertes stock bas dans le magasin
                    if (Array.isArray(stockMagasin)) {
                        stockMagasin.forEach(stock => {
                            const quantite = stock.quantite_disponible || stock.quantite || 0;
                            if (quantite < 50) {
                                notifs.push({
                                    id: `stock-mag-${stock.id}`,
                                    type: 'warning',
                                    icon: AlertTriangle,
                                    title: 'Stock faible',
                                    message: `${stock.produit?.nom || stock.produit_nom} - ${quantite} T restantes`,
                                    time: new Date(),
                                    priority: quantite < 20 ? 'high' : 'medium'
                                });
                            }
                        });
                    }
                } catch (error) {
                    console.error('Erreur chargement notifications opérateur:', error);
                }
            }

            // Trier par priorité et date
            notifs.sort((a, b) => {
                if (a.priority === 'high' && b.priority !== 'high') return -1;
                if (a.priority !== 'high' && b.priority === 'high') return 1;
                return new Date(b.time) - new Date(a.time);
            });

            // Limiter à 10 notifications
            notifs = notifs.slice(0, 10);

            // Formater le temps
            notifs = notifs.map(notif => ({
                ...notif,
                timeAgo: formatTimeAgo(notif.time)
            }));

            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);

        } catch (error) {
            console.error('Erreur lors du chargement des notifications:', error);
        }
    };

    const formatTimeAgo = (date) => {
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "À l'instant";
        if (minutes < 60) return `${minutes} min`;
        if (hours < 24) return `${hours}h`;
        return `${days}j`;
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Erreur déconnexion:', error);
        }
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    return (
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Left section */}
                    <div className="flex items-center">
                        {/* Mobile menu button */}
                        <button
                            onClick={onMenuClick}
                            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <Menu className="h-6 w-6" />
                        </button>

                        {/* Titre de l'application */}
                        <div className="hidden md:block ml-4">
                            <h1 className="text-lg font-semibold text-gray-900">
                                ITS Sénégal - Gestion des Tonnages
                            </h1>
                        </div>
                    </div>

                    {/* Right section */}
                    <div className="flex items-center space-x-4">
                        {/* Date et heure */}
                        <div className="hidden sm:block text-sm text-gray-600">
                            {formatDate(new Date(), 'EEEE dd MMMM yyyy')}
                        </div>

                        {/* Notifications */}
                        <div className="relative" ref={notificationRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 relative"
                            >
                                <Bell className="h-6 w-6" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown notifications */}
                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                                        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                className="text-sm text-blue-600 hover:text-blue-700"
                                            >
                                                Tout marquer comme lu
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-gray-500">
                                                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                                <p>Aucune notification</p>
                                            </div>
                                        ) : (
                                            notifications.map((notification) => {
                                                const Icon = notification.icon;
                                                return (
                                                    <div 
                                                        key={notification.id} 
                                                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                                                            !notification.read ? 'bg-blue-50' : ''
                                                        }`}
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className={`p-2 rounded-lg ${
                                                                notification.type === 'warning' ? 'bg-orange-100' :
                                                                notification.type === 'success' ? 'bg-green-100' :
                                                                notification.type === 'error' ? 'bg-red-100' :
                                                                'bg-blue-100'
                                                            }`}>
                                                                <Icon className={`h-5 w-5 ${
                                                                    notification.type === 'warning' ? 'text-orange-600' :
                                                                    notification.type === 'success' ? 'text-green-600' :
                                                                    notification.type === 'error' ? 'text-red-600' :
                                                                    'text-blue-600'
                                                                }`} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex justify-between items-start">
                                                                    <p className="text-sm font-medium text-gray-900">
                                                                        {notification.title}
                                                                    </p>
                                                                    <span className="text-xs text-gray-500">
                                                                        {notification.timeAgo}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    {notification.message}
                                                                </p>
                                                                {notification.priority === 'high' && (
                                                                    <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                                        Urgent
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                    {notifications.length > 0 && (
                                        <div className="p-4 text-center border-t border-gray-200">
                                            <button 
                                                onClick={() => {
                                                    setShowNotifications(false);
                                                    if (isManager()) {
                                                        window.location.href = '/tableau-bord-operationnel';
                                                    } else {
                                                        window.location.href = '/operator-dashboard';
                                                    }
                                                }}
                                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                Voir le tableau de bord
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* User menu */}
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                                    <User className="h-5 w-5 text-white" />
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-medium text-gray-900">
                                        {getUserFullName()}
                                    </p>
                                    <p className="text-xs text-gray-600 capitalize">
                                        {user?.role === 'manager' ? 'Manager' : 'Opérateur'}
                                        {user?.magasin && ` - ${user.magasin.nom}`}
                                    </p>
                                </div>
                                <ChevronDown className="h-4 w-4 text-gray-600" />
                            </button>

                            {/* Dropdown menu */}
                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                    <div className="p-4 border-b border-gray-200">
                                        <p className="text-sm font-medium text-gray-900">
                                            {getUserFullName()}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {user?.email}
                                        </p>
                                    </div>

                                    <div className="py-2">
                                        <a
                                            href="/profile"
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <User className="h-4 w-4 mr-3" />
                                            Mon Profil
                                        </a>
                                        {isManager() && (
                                            <a
                                                href="/settings"
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <Settings className="h-4 w-4 mr-3" />
                                                Paramètres
                                            </a>
                                        )}
                                    </div>

                                    <div className="border-t border-gray-200 py-2">
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <LogOut className="h-4 w-4 mr-3" />
                                            Se déconnecter
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;