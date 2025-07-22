// src/components/commandes/CommandeCard.jsx
import React from 'react';
import {
    ShoppingCart,
    User,
    Calendar,
    DollarSign,
    Package,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Edit,
    Eye,
    Printer,
    Truck
} from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';
import { ORDER_STATUS, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../utils/constants';

const CommandeCard = ({
    commande,
    onView,
    onEdit,
    onPrint,
    onCreateDelivery,
    showActions = true,
    showDetails = true,
    className = ''
}) => {
    if (!commande) return null;

    // Déterminer l'icône du statut
    const getStatusIcon = () => {
        switch (commande.statut) {
            case ORDER_STATUS.BROUILLON:
                return Clock;
            case ORDER_STATUS.CONFIRMEE:
                return CheckCircle;
            case ORDER_STATUS.EN_PREPARATION:
                return Package;
            case ORDER_STATUS.PRETE:
                return CheckCircle;
            case ORDER_STATUS.LIVREE:
                return Truck;
            case ORDER_STATUS.ANNULEE:
                return XCircle;
            default:
                return AlertCircle;
        }
    };

    // Calculer les statistiques de la commande
    const getOrderStats = () => {
        const totalArticles = commande.articles?.reduce((sum, article) => sum + article.quantite, 0) || 0;
        const totalProduits = commande.articles?.length || 0;
        const montantHT = commande.montantTotal || 0;
        const tva = commande.tva || 0;
        const montantTTC = montantHT + tva;
        const acompte = commande.acompte || 0;
        const resteAPayer = montantTTC - acompte;

        return {
            totalArticles,
            totalProduits,
            montantHT,
            tva,
            montantTTC,
            acompte,
            resteAPayer
        };
    };

    // Déterminer si la commande est en retard
    const isLate = () => {
        if (commande.dateLivraisonPrevue && 
            [ORDER_STATUS.CONFIRMEE, ORDER_STATUS.EN_PREPARATION].includes(commande.statut)) {
            return new Date(commande.dateLivraisonPrevue) < new Date();
        }
        return false;
    };

    // Déterminer les actions disponibles
    const canEdit = [ORDER_STATUS.BROUILLON, ORDER_STATUS.CONFIRMEE].includes(commande.statut);
    const canCreateDelivery = commande.statut === ORDER_STATUS.PRETE;
    const canPrint = commande.statut !== ORDER_STATUS.BROUILLON;

    const StatusIcon = getStatusIcon();
    const stats = getOrderStats();
    const late = isLate();

    return (
        <Card 
            className={`hover:shadow-lg transition-shadow ${onView ? 'cursor-pointer' : ''} ${className}`}
            onClick={() => onView?.(commande)}
        >
            <div className="p-6">
                {/* En-tête */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <ShoppingCart className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {commande.numero}
                            </h3>
                            <p className="text-sm text-gray-500 flex items-center mt-1">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDate(commande.date)}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                        <Badge 
                            variant={ORDER_STATUS_COLORS[commande.statut] || 'gray'}
                            className="flex items-center space-x-1"
                        >
                            <StatusIcon className="h-4 w-4" />
                            <span>{ORDER_STATUS_LABELS[commande.statut]}</span>
                        </Badge>
                        {late && (
                            <Badge variant="red" size="sm">
                                En retard
                            </Badge>
                        )}
                        {commande.priorite === 'urgent' && (
                            <Badge variant="orange" size="sm">
                                Urgent
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Informations client */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    {commande.clientNom}
                                </p>
                                {commande.clientTelephone && (
                                    <p className="text-xs text-gray-500">{commande.clientTelephone}</p>
                                )}
                            </div>
                        </div>
                        {commande.clientType && (
                            <Badge variant="blue" size="sm">
                                {commande.clientType}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Détails de la commande */}
                {showDetails && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="text-center p-2 bg-gray-50 rounded">
                            <p className="text-2xl font-bold text-gray-900">{stats.totalArticles}</p>
                            <p className="text-xs text-gray-600">Articles</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                            <p className="text-2xl font-bold text-gray-900">{stats.totalProduits}</p>
                            <p className="text-xs text-gray-600">Produits</p>
                        </div>
                    </div>
                )}

                {/* Dates importantes */}
                {commande.dateLivraisonPrevue && (
                    <div className="mb-4 flex items-center justify-between text-sm">
                        <span className="text-gray-600">Livraison prévue</span>
                        <span className={`font-medium ${late ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatDate(commande.dateLivraisonPrevue)}
                        </span>
                    </div>
                )}

                {/* Informations financières */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Montant HT</span>
                        <span className="font-medium">{formatCurrency(stats.montantHT)}</span>
                    </div>
                    {stats.tva > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">TVA</span>
                            <span className="font-medium">{formatCurrency(stats.tva)}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="font-medium text-gray-900">Total TTC</span>
                        <span className="text-lg font-bold text-gray-900">
                            {formatCurrency(stats.montantTTC)}
                        </span>
                    </div>
                    
                    {stats.acompte > 0 && (
                        <>
                            <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                                <span className="text-gray-600">Acompte versé</span>
                                <span className="font-medium text-green-600">
                                    {formatCurrency(stats.acompte)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium text-gray-900">Reste à payer</span>
                                <span className="font-bold text-orange-600">
                                    {formatCurrency(stats.resteAPayer)}
                                </span>
                            </div>
                        </>
                    )}
                </div>

                {/* Notes */}
                {commande.notes && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            <AlertCircle className="h-4 w-4 inline mr-1" />
                            {commande.notes}
                        </p>
                    </div>
                )}

                {/* Actions */}
                {showActions && (
                    <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
                        {onEdit && canEdit && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(commande);
                                }}
                                className="flex items-center space-x-1"
                            >
                                <Edit className="h-4 w-4" />
                                <span>Modifier</span>
                            </Button>
                        )}
                        {onPrint && canPrint && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPrint(commande);
                                }}
                                className="flex items-center space-x-1"
                            >
                                <Printer className="h-4 w-4" />
                                <span>Imprimer</span>
                            </Button>
                        )}
                        {onCreateDelivery && canCreateDelivery && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCreateDelivery(commande);
                                }}
                                className="flex items-center space-x-1"
                            >
                                <Truck className="h-4 w-4" />
                                <span>Créer BL</span>
                            </Button>
                        )}
                        {onView && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onView(commande);
                                }}
                                className="flex items-center space-x-1"
                            >
                                <Eye className="h-4 w-4" />
                                <span>Détails</span>
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};

export default CommandeCard;