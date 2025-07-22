import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, Eye, Edit, AlertTriangle, CheckCircle, Plus, Download } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';
import stockService from '../../services/stock';
import { formatDate, formatCurrency } from '../../utils/formatters';
import EntreeLivraisonForm from '../livraisons/EntreeLivraisonForm';

const StockMagasinier = () => {
    const { user, getCurrentMagasin } = useAuth();
    const [loading, setLoading] = useState(false);
    const [stockData, setStockData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showEntreeForm, setShowEntreeForm] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        disponible: 0,
        alerte: 0,
        epuise: 0
    });

    const magasin_id = getCurrentMagasin();

    useEffect(() => {
        loadStockData();
    }, [magasin_id]);

    useEffect(() => {
        filterData();
    }, [stockData, searchTerm, statusFilter]);

    const loadStockData = async () => {
        if (!magasin_id) return;
        
        setLoading(true);
        try {
            const response = await stockService.getByMagasin(magasin_id);
            const stock = response.data || [];
            setStockData(stock);
            calculateStats(stock);
        } catch (error) {
            console.error('Erreur lors du chargement du stock:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (stock) => {
        const total = stock.length;
        const disponible = stock.filter(s => s.quantite_disponible > s.seuil_alerte).length;
        const alerte = stock.filter(s => s.quantite_disponible <= s.seuil_alerte && s.quantite_disponible > 0).length;
        const epuise = stock.filter(s => s.quantite_disponible <= 0).length;

        setStats({ total, disponible, alerte, epuise });
    };

    const filterData = () => {
        let filtered = stockData;

        if (searchTerm) {
            filtered = filtered.filter(stock =>
                stock.produit?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                stock.produit?.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                stock.emplacement?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(stock => {
                switch (statusFilter) {
                    case 'disponible':
                        return stock.quantite_disponible > stock.seuil_alerte;
                    case 'alerte':
                        return stock.quantite_disponible <= stock.seuil_alerte && stock.quantite_disponible > 0;
                    case 'epuise':
                        return stock.quantite_disponible <= 0;
                    default:
                        return true;
                }
            });
        }

        setFilteredData(filtered);
    };

    const getStockStatus = (stock) => {
        if (stock.quantite_disponible <= 0) {
            return { color: 'red', label: 'Épuisé', icon: AlertTriangle };
        }
        if (stock.quantite_disponible <= stock.seuil_alerte) {
            return { color: 'orange', label: 'Alerte', icon: AlertTriangle };
        }
        return { color: 'green', label: 'Disponible', icon: CheckCircle };
    };

    const handleEntreeSuccess = () => {
        setShowEntreeForm(false);
        loadStockData();
    };

    const exportStock = () => {
        const csvContent = [
            ['Produit', 'Référence', 'Quantité', 'Quantité Disponible', 'Seuil Alerte', 'Emplacement', 'Statut'],
            ...filteredData.map(stock => [
                stock.produit?.nom || '',
                stock.produit?.reference || '',
                stock.quantite || 0,
                stock.quantite_disponible || 0,
                stock.seuil_alerte || 0,
                stock.emplacement || '',
                getStockStatus(stock).label
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `stock_magasin_${magasin_id}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Mon Stock</h1>
                <div className="flex space-x-3">
                    <Button
                        onClick={exportStock}
                        variant="secondary"
                        className="flex items-center"
                    >
                        <Download className="mr-2" size={16} />
                        Exporter
                    </Button>
                    <Button
                        onClick={() => setShowEntreeForm(true)}
                        className="flex items-center"
                    >
                        <Plus className="mr-2" size={16} />
                        Nouvelle Entrée
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100">
                            <Package className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total articles</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Disponible</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.disponible}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-yellow-100">
                            <AlertTriangle className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">En alerte</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.alerte}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-red-100">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Épuisé</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.epuise}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filtres */}
            <Card className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher par produit, référence ou emplacement..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">Tous les statuts</option>
                            <option value="disponible">Disponible</option>
                            <option value="alerte">En alerte</option>
                            <option value="epuise">Épuisé</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Liste du stock */}
            <Card>
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        Articles en stock ({filteredData.length})
                    </h3>
                </div>
                <div className="divide-y divide-gray-200">
                    {filteredData.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun article</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchTerm || statusFilter !== 'all' 
                                    ? 'Aucun article ne correspond aux critères de recherche'
                                    : 'Aucun article en stock pour le moment'
                                }
                            </p>
                        </div>
                    ) : (
                        filteredData.map((stock) => {
                            const status = getStockStatus(stock);
                            const StatusIcon = status.icon;
                            
                            return (
                                <div key={stock.id} className="p-6 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3">
                                                <div className="flex-shrink-0">
                                                    <Package className="h-8 w-8 text-gray-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-medium text-gray-900">
                                                        {stock.produit?.nom}
                                                    </h4>
                                                    <p className="text-sm text-gray-500">
                                                        {stock.produit?.reference} • {stock.emplacement}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-4">
                                            <div className="text-right">
                                                <div className="text-sm text-gray-500">Quantité</div>
                                                <div className="text-lg font-semibold text-gray-900">
                                                    {stock.quantite_disponible} {stock.produit?.unite}
                                                </div>
                                            </div>
                                            
                                            <div className="text-right">
                                                <div className="text-sm text-gray-500">Seuil alerte</div>
                                                <div className="text-sm font-medium text-gray-700">
                                                    {stock.seuil_alerte} {stock.produit?.unite}
                                                </div>
                                            </div>
                                            
                                            <Badge variant={status.color} className="flex items-center">
                                                <StatusIcon className="mr-1" size={14} />
                                                {status.label}
                                            </Badge>
                                            
                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => setSelectedStock(stock)}
                                                >
                                                    <Eye size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {stock.quantite_disponible <= stock.seuil_alerte && (
                                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                            <div className="flex items-center">
                                                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                                                <div className="text-sm">
                                                    <p className="font-medium text-yellow-800">
                                                        Stock en alerte
                                                    </p>
                                                    <p className="text-yellow-700">
                                                        Quantité disponible: {stock.quantite_disponible} {stock.produit?.unite} 
                                                        (seuil: {stock.seuil_alerte})
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </Card>

            {/* Modal d'entrée de livraison */}
            {showEntreeForm && (
                <EntreeLivraisonForm
                    onClose={() => setShowEntreeForm(false)}
                    onSuccess={handleEntreeSuccess}
                />
            )}

            {/* Modal de détails du stock */}
            {selectedStock && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Détails du stock
                                </h2>
                                <Button
                                    variant="secondary"
                                    onClick={() => setSelectedStock(null)}
                                    className="p-2"
                                >
                                    <X size={20} />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Produit
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {selectedStock.produit?.nom}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Référence
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {selectedStock.produit?.reference}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Quantité totale
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {selectedStock.quantite} {selectedStock.produit?.unite}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Quantité disponible
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {selectedStock.quantite_disponible} {selectedStock.produit?.unite}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Seuil d'alerte
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {selectedStock.seuil_alerte} {selectedStock.produit?.unite}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Emplacement
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {selectedStock.emplacement}
                                        </p>
                                    </div>
                                </div>

                                {selectedStock.lot_number && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Numéro de lot
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {selectedStock.lot_number}
                                        </p>
                                    </div>
                                )}

                                {selectedStock.date_expiration && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Date d'expiration
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {formatDate(selectedStock.date_expiration)}
                                        </p>
                                    </div>
                                )}

                                <div className="pt-4 border-t">
                                    <Badge variant={getStockStatus(selectedStock).color} className="text-sm">
                                        {getStockStatus(selectedStock).label}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default StockMagasinier;