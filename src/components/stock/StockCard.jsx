// src/components/stock/StockCard.jsx
import React from 'react';
import { Package, AlertTriangle, TrendingUp, TrendingDown, Calendar, MapPin } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { formatQuantity, formatCurrency, formatDate } from '../../utils/formatters';

const StockCard = ({ stock, onClick, className = '' }) => {
    if (!stock || !stock.produit) return null;

    const { produit, quantite, emplacement, lot, dateExpiration, valeurTotal } = stock;
    
    // Déterminer le niveau d'alerte
    const getStockStatus = () => {
        if (quantite === 0) return { label: 'Rupture', color: 'red', icon: AlertTriangle };
        if (quantite <= (produit.seuilAlerte || 0)) return { label: 'Stock faible', color: 'yellow', icon: TrendingDown };
        return { label: 'En stock', color: 'green', icon: TrendingUp };
    };

    const status = getStockStatus();
    const StatusIcon = status.icon;

    // Vérifier si le produit expire bientôt
    const isExpiringSoon = () => {
        if (!dateExpiration) return false;
        const daysUntilExpiry = Math.ceil((new Date(dateExpiration) - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    };

    const isExpired = () => {
        if (!dateExpiration) return false;
        return new Date(dateExpiration) < new Date();
    };

    return (
        <Card 
            className={`p-4 hover:shadow-lg transition-shadow cursor-pointer ${className}`}
            onClick={() => onClick?.(stock)}
        >
            {/* En-tête */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-1">
                            {produit.nom}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {produit.reference}
                        </p>
                    </div>
                </div>
                <Badge variant={status.color} className="flex items-center space-x-1">
                    <StatusIcon className="h-3 w-3" />
                    <span>{status.label}</span>
                </Badge>
            </div>

            {/* Informations principales */}
            <div className="space-y-2">
                {/* Quantité */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Quantité</span>
                    <span className="font-semibold text-gray-900">
                        {formatQuantity(quantite, produit.unite)}
                    </span>
                </div>

                {/* Valeur */}
                {valeurTotal !== undefined && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Valeur totale</span>
                        <span className="font-semibold text-gray-900">
                            {formatCurrency(valeurTotal)}
                        </span>
                    </div>
                )}

                {/* Emplacement */}
                {emplacement && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>Emplacement</span>
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                            {emplacement}
                        </span>
                    </div>
                )}

                {/* Lot */}
                {lot && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Lot</span>
                        <span className="text-sm font-medium text-gray-700">
                            {lot}
                        </span>
                    </div>
                )}

                {/* Date d'expiration */}
                {dateExpiration && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Expiration</span>
                        </span>
                        <span className={`text-sm font-medium ${
                            isExpired() ? 'text-red-600' : 
                            isExpiringSoon() ? 'text-yellow-600' : 
                            'text-gray-700'
                        }`}>
                            {formatDate(dateExpiration)}
                        </span>
                    </div>
                )}
            </div>

            {/* Alertes */}
            {(isExpired() || isExpiringSoon() || quantite <= (produit.seuilAlerte || 0)) && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="space-y-1">
                        {isExpired() && (
                            <div className="flex items-center space-x-2 text-red-600">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-sm font-medium">Produit expiré</span>
                            </div>
                        )}
                        {!isExpired() && isExpiringSoon() && (
                            <div className="flex items-center space-x-2 text-yellow-600">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-sm font-medium">Expire bientôt</span>
                            </div>
                        )}
                        {quantite <= (produit.seuilAlerte || 0) && quantite > 0 && (
                            <div className="flex items-center space-x-2 text-yellow-600">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                    Stock sous le seuil ({produit.seuilAlerte} {produit.unite})
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Catégorie */}
            <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                    <Badge variant="gray" size="sm">
                        {produit.categorie}
                    </Badge>
                    {produit.prixUnitaire && (
                        <span className="text-sm text-gray-500">
                            {formatCurrency(produit.prixUnitaire)}/{produit.unite}
                        </span>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default StockCard;