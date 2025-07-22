import React, { useState, useEffect } from 'react';
import { Package, Search, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { formatNumber } from '../utils/formatters';
import stockService from '../services/stock';

const StockSimple = () => {
    const navigate = useNavigate();
    const { getCurrentMagasin } = useAuth();
    const [stock, setStock] = useState([]);
    const [filteredStock, setFilteredStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, alert, ok

    useEffect(() => {
        loadStock();
    }, []);

    useEffect(() => {
        filterStock();
    }, [stock, searchTerm, filterStatus]);

    const loadStock = async () => {
        try {
            setLoading(true);
            const magasinId = getCurrentMagasin();
            const data = await stockService.getStockByMagasin(magasinId);
            setStock(data);
            setFilteredStock(data);
        } catch (error) {
            console.error('Erreur chargement stock:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterStock = () => {
        let filtered = [...stock];

        // Filtrer par recherche
        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.produit?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.produit?.reference?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtrer par statut
        if (filterStatus === 'alert') {
            filtered = filtered.filter(item => 
                item.quantite <= (item.seuil_alerte || 50)
            );
        } else if (filterStatus === 'ok') {
            filtered = filtered.filter(item => 
                item.quantite > (item.seuil_alerte || 50)
            );
        }

        setFilteredStock(filtered);
    };

    const getStockStatus = (item) => {
        const seuil = item.seuil_alerte || 50;
        if (item.quantite <= 0) {
            return { color: 'red', text: 'Rupture', icon: AlertTriangle };
        } else if (item.quantite <= seuil) {
            return { color: 'yellow', text: 'Alerte', icon: AlertTriangle };
        }
        return { color: 'green', text: 'OK', icon: CheckCircle };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const alertCount = stock.filter(item => item.quantite <= (item.seuil_alerte || 50)).length;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* Header */}
            <div className="mb-6">
                <Button
                    variant="outline"
                    size="sm"
                    className="mb-4"
                    onClick={() => navigate('/magasinier-simple')}
                >
                    ← Retour au tableau de bord
                </Button>
                
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Mon Stock
                </h1>
                <p className="text-gray-600">
                    {stock.length} produits • {alertCount} en alerte
                </p>
            </div>

            {/* Filtres */}
            <Card className="p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Rechercher un produit..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <Button
                            variant={filterStatus === 'all' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setFilterStatus('all')}
                        >
                            Tout ({stock.length})
                        </Button>
                        <Button
                            variant={filterStatus === 'alert' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setFilterStatus('alert')}
                            className={filterStatus === 'alert' ? 'bg-red-600 hover:bg-red-700' : ''}
                        >
                            Alertes ({alertCount})
                        </Button>
                        <Button
                            variant={filterStatus === 'ok' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setFilterStatus('ok')}
                            className={filterStatus === 'ok' ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                            OK ({stock.length - alertCount})
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Liste des produits */}
            <div className="space-y-4">
                {filteredStock.length === 0 ? (
                    <Card className="p-8 text-center">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                            {searchTerm || filterStatus !== 'all' 
                                ? 'Aucun produit trouvé avec ces critères' 
                                : 'Aucun produit en stock'}
                        </p>
                    </Card>
                ) : (
                    filteredStock.map((item) => {
                        const status = getStockStatus(item);
                        const StatusIcon = status.icon;
                        
                        return (
                            <Card 
                                key={item.id} 
                                className={`p-4 ${
                                    status.color === 'red' 
                                        ? 'border-red-300 bg-red-50' 
                                        : status.color === 'yellow'
                                        ? 'border-yellow-300 bg-yellow-50'
                                        : ''
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {item.produit?.nom || 'Produit inconnu'}
                                            </h3>
                                            <Badge color={status.color}>
                                                <StatusIcon className="h-3 w-3 mr-1" />
                                                {status.text}
                                            </Badge>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">Référence</p>
                                                <p className="font-medium">{item.produit?.reference || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Quantité</p>
                                                <p className="font-medium text-lg">
                                                    {formatNumber(item.quantite)} {item.produit?.unite}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Seuil d'alerte</p>
                                                <p className="font-medium">
                                                    {formatNumber(item.seuil_alerte || 50)} {item.produit?.unite}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Emplacement</p>
                                                <p className="font-medium">{item.emplacement || 'Non défini'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Barre de progression pour visualiser le niveau de stock */}
                                <div className="mt-4">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full transition-all ${
                                                status.color === 'red' 
                                                    ? 'bg-red-500' 
                                                    : status.color === 'yellow'
                                                    ? 'bg-yellow-500'
                                                    : 'bg-green-500'
                                            }`}
                                            style={{ 
                                                width: `${Math.min(
                                                    (item.quantite / ((item.seuil_alerte || 50) * 2)) * 100, 
                                                    100
                                                )}%` 
                                            }}
                                        />
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Action flottante pour ajouter des entrées */}
            <div className="fixed bottom-6 right-6">
                <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full p-4"
                    onClick={() => navigate('/saisie-simple')}
                >
                    <Package className="h-6 w-6" />
                </Button>
            </div>
        </div>
    );
};

export default StockSimple;