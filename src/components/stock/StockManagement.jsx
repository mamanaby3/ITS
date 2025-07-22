// src/components/stock/StockManagement.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import stockService from '../../services/stock';
import EntreeForm from './EntreeForm';
import SortieForm from './SortieForm';
import {
    PlusIcon,
    ArrowTrendingUpIcon,
    TruckIcon,
    MagnifyingGlassIcon,
    CubeIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    ClipboardDocumentListIcon
} from '../ui/SimpleIcons';

const StockManagement = () => {
    const { hasPermission, user } = useAuth();
    const isManager = user?.role === 'manager';
    const isOperator = user?.role === 'operator';
    const isAdmin = user?.role === 'admin';
    const [activeTab, setActiveTab] = useState('stock');
    const [stock, setStock] = useState([]);
    const [mouvements, setMouvements] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showEntreeForm, setShowEntreeForm] = useState(false);
    const [showSortieForm, setShowSortieForm] = useState(false);
    const [filteredData, setFilteredData] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterData();
    }, [searchTerm, activeTab, stock, mouvements]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [stockData, mouvementsData, statsData] = await Promise.all([
                stockService.getAllStock(),
                stockService.getAllMouvements(),
                stockService.getStockStats()
            ]);

            setStock(stockData);
            setMouvements(mouvementsData);
            setStats(statsData);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterData = () => {
        let data = activeTab === 'stock' ? stock : mouvements;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            data = data.filter(item => {
                if (activeTab === 'stock') {
                    return (
                        item.produit?.nom?.toLowerCase().includes(term) ||
                        item.produit?.reference?.toLowerCase().includes(term) ||
                        item.emplacement?.toLowerCase().includes(term) ||
                        item.lot?.toLowerCase().includes(term)
                    );
                } else {
                    return (
                        item.produit?.nom?.toLowerCase().includes(term) ||
                        item.produit?.reference?.toLowerCase().includes(term) ||
                        item.motif?.toLowerCase().includes(term) ||
                        item.reference?.toLowerCase().includes(term) ||
                        item.utilisateur?.toLowerCase().includes(term)
                    );
                }
            });
        }

        setFilteredData(data);
    };

    const handleEntreeStock = async (entreeData) => {
        try {
            await stockService.entreeStock(entreeData);
            await loadData();
            setShowEntreeForm(false);
        } catch (error) {
            throw error;
        }
    };

    const handleSortieStock = async (sortieData) => {
        try {
            await stockService.sortieStock(sortieData);
            await loadData();
            setShowSortieForm(false);
        } catch (error) {
            throw error;
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

    const getStockStatusBadge = (item) => {
        if (!item.produit) return null;

        if (item.quantite === 0) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
          Épuisé
        </span>
            );
        } else if (item.quantite <= (item.produit.seuil || item.produit.seuilAlerte || 0)) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
          Stock bas
        </span>
            );
        } else {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CubeIcon className="h-3 w-3 mr-1" />
          Disponible
        </span>
            );
        }
    };

    const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    {subtitle && (
                        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
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
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* En-tête */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestion du Stock</h1>
                    <p className="text-gray-600">
                        Suivi des entrées, sorties et inventaire
                    </p>
                </div>

                <div className="flex space-x-3">
                    {/* Bouton spécial pour le manager - Réception navire */}
                    
                    {/* Entrées classiques pour admin seulement */}
                    {isAdmin && (
                        <button
                            onClick={() => setShowEntreeForm(true)}
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                        >
                            <ArrowTrendingUpIcon className="h-5 w-5 mr-2" />
                            Entrée Stock
                        </button>
                    )}
                    
                    {/* Les opérateurs peuvent faire des sorties, ainsi que manager et admin */}
                    {(isOperator || isManager || isAdmin) && (
                        <button
                            onClick={() => setShowSortieForm(true)}
                            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                        >
                            <TruckIcon className="h-5 w-5 mr-2" />
                            Sortie Stock
                        </button>
                    )}
                </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Articles en Stock"
                    value={stats.totalArticles?.toLocaleString() || '0'}
                    icon={CubeIcon}
                    color="bg-blue-500"
                    subtitle={`${stats.totalQuantite || 0} unités au total`}
                />

                <StatCard
                    title="Valeur du Stock"
                    value={formatCurrency(stats.valeurTotale || 0)}
                    icon={ClipboardDocumentListIcon}
                    color="bg-green-500"
                />

                <StatCard
                    title="Entrées Aujourd'hui"
                    value={stats.entreesToday || 0}
                    icon={ArrowTrendingUpIcon}
                    color="bg-emerald-500"
                />

                <StatCard
                    title="Sorties Aujourd'hui"
                    value={stats.sortiesToday || 0}
                    icon={TruckIcon}
                    color="bg-red-500"
                />
            </div>

            {/* Alertes */}
            {stats.produitsEnRupture > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                        <p className="text-red-800 font-medium">
                            Attention : {stats.produitsEnRupture} produit(s) en rupture ou stock bas
                        </p>
                    </div>
                </div>
            )}

            {/* Onglets */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 px-6">
                        <button
                            onClick={() => setActiveTab('stock')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'stock'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <CubeIcon className="h-5 w-5 inline mr-2" />
                            Stock Actuel ({stock.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('mouvements')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'mouvements'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <ClipboardDocumentListIcon className="h-5 w-5 inline mr-2" />
                            Mouvements ({mouvements.length})
                        </button>
                    </nav>
                </div>

                {/* Barre de recherche */}
                <div className="p-6 border-b border-gray-200">
                    <div className="relative max-w-md">
                        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder={`Rechercher ${activeTab === 'stock' ? 'dans le stock' : 'dans les mouvements'}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Contenu des onglets */}
                <div className="overflow-x-auto">
                    {activeTab === 'stock' ? (
                        // Tableau du stock
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Produit
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Emplacement
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantité
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Lot
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Statut
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {filteredData.length > 0 ? (
                                filteredData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {item.produit?.nom || 'Produit supprimé'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {item.produit?.reference || '-'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {item.emplacement}
                        </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {item.quantite}
                        </span>
                                            {item.produit && (
                                                <span className="text-xs text-gray-500 block">
                            Seuil: {item.produit.seuil}
                          </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.lot || '-'}
                                            {item.dateExpiration && (
                                                <div className="text-xs">
                                                    Exp: {new Date(item.dateExpiration).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStockStatusBadge(item)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                className="text-blue-600 hover:text-blue-900 p-1"
                                                title="Voir détails"
                                            >
                                                <EyeIcon className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <CubeIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">
                                            {searchTerm
                                                ? 'Aucun article trouvé avec ces critères'
                                                : 'Aucun article en stock'
                                            }
                                        </p>
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    ) : (
                        // Tableau des mouvements
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Produit
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantité
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Motif
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Utilisateur
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Référence
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {filteredData.length > 0 ? (
                                filteredData.map((mouvement) => (
                                    <tr key={mouvement.id} className="hover:bg-gray-50 transition-colors duration-200">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(mouvement.date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            mouvement.type === 'entree'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                        }`}>
                          {mouvement.type === 'entree' ? (
                              <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                          ) : (
                              <TruckIcon className="h-3 w-3 mr-1" />
                          )}
                            {mouvement.type === 'entree' ? 'Entrée' : 'Sortie'}
                        </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {mouvement.produit?.nom || 'Produit supprimé'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {mouvement.produit?.reference || '-'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                            mouvement.type === 'entree' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {mouvement.type === 'entree' ? '+' : '-'}{mouvement.quantite}
                        </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {mouvement.motif}
                                            {mouvement.client && (
                                                <div className="text-xs">
                                                    Client: {typeof mouvement.client === 'object' ? mouvement.client.nom : mouvement.client}
                                                </div>
                                            )}
                                            {mouvement.fournisseur && (
                                                <div className="text-xs">
                                                    Fournisseur: {typeof mouvement.fournisseur === 'object' ? mouvement.fournisseur.nom : mouvement.fournisseur}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {mouvement.utilisateur}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {mouvement.reference}
                        </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <ClipboardDocumentListIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">
                                            {searchTerm
                                                ? 'Aucun mouvement trouvé avec ces critères'
                                                : 'Aucun mouvement enregistré'
                                            }
                                        </p>
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showEntreeForm && (
                <EntreeForm
                    onSubmit={handleEntreeStock}
                    onCancel={() => setShowEntreeForm(false)}
                />
            )}

            {showSortieForm && (
                <SortieForm
                    onSubmit={handleSortieStock}
                    onCancel={() => setShowSortieForm(false)}
                />
            )}

        </div>
    );
};

export default StockManagement;