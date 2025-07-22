// src/components/produits/ProduitCard.jsx
import React from 'react';
import { Package, Tag, AlertCircle, Edit, Trash2 } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatCurrency } from '../../utils/formatters';
import { PRODUIT_CATEGORIES_LABELS } from '../../utils/constants';

const ProduitCard = ({ 
    produit, 
    onEdit, 
    onDelete, 
    onView,
    stockInfo,
    showActions = true,
    className = '' 
}) => {
    if (!produit) return null;

    // Déterminer le statut du stock
    const getStockStatus = () => {
        if (!stockInfo) return null;
        
        const { quantiteTotal = 0, seuilAlerte = produit.seuilAlerte || 0 } = stockInfo;
        
        if (quantiteTotal === 0) {
            return { label: 'Rupture de stock', color: 'red', textColor: 'text-red-600' };
        }
        if (quantiteTotal <= seuilAlerte) {
            return { label: 'Stock faible', color: 'yellow', textColor: 'text-yellow-600' };
        }
        return { label: 'En stock', color: 'green', textColor: 'text-green-600' };
    };

    const stockStatus = getStockStatus();

    return (
        <Card 
            className={`hover:shadow-lg transition-shadow ${onView ? 'cursor-pointer' : ''} ${className}`}
            onClick={() => onView?.(produit)}
        >
            <div className="p-6">
                {/* En-tête */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Package className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                                {produit.nom}
                            </h3>
                            <p className="text-sm text-gray-500 flex items-center mt-1">
                                <Tag className="h-3 w-3 mr-1" />
                                {produit.reference}
                            </p>
                        </div>
                    </div>
                    {produit.actif === false && (
                        <Badge variant="gray" size="sm">
                            Inactif
                        </Badge>
                    )}
                </div>

                {/* Informations principales */}
                <div className="space-y-3">
                    {/* Catégorie */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Catégorie</span>
                        <Badge variant="blue" size="sm">
                            {PRODUIT_CATEGORIES_LABELS[produit.categorie] || produit.categorie}
                        </Badge>
                    </div>

                    {/* Prix unitaire */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Prix unitaire</span>
                        <span className="font-semibold text-gray-900">
                            {formatCurrency(produit.prixUnitaire || 0)}
                        </span>
                    </div>

                    {/* Unité */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Unité de mesure</span>
                        <span className="text-sm font-medium text-gray-700">
                            {produit.unite}
                        </span>
                    </div>

                    {/* Seuil d'alerte */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Seuil d'alerte
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                            {produit.seuilAlerte || 0} {produit.unite}
                        </span>
                    </div>

                    {/* Stock actuel (si disponible) */}
                    {stockInfo && (
                        <div className="pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Stock actuel</span>
                                <div className="flex items-center space-x-2">
                                    <span className={`font-semibold ${stockStatus?.textColor || 'text-gray-900'}`}>
                                        {stockInfo.quantiteTotal || 0} {produit.unite}
                                    </span>
                                    {stockStatus && (
                                        <Badge variant={stockStatus.color} size="sm">
                                            {stockStatus.label}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Description (si disponible) */}
                    {produit.description && (
                        <div className="pt-3">
                            <p className="text-sm text-gray-600 line-clamp-2">
                                {produit.description}
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                {showActions && (
                    <div className="flex items-center justify-end space-x-2 mt-6 pt-4 border-t border-gray-200">
                        {onEdit && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(produit);
                                }}
                                className="flex items-center space-x-1"
                            >
                                <Edit className="h-4 w-4" />
                                <span>Modifier</span>
                            </Button>
                        )}
                        {onDelete && produit.actif !== false && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(produit);
                                }}
                                className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span>Supprimer</span>
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};

export default ProduitCard;