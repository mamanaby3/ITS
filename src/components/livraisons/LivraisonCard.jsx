// src/components/livraisons/LivraisonCard.jsx
import React from 'react';
import { Truck, Package, User, Phone, MapPin, Calendar, Clock, AlertCircle } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { DELIVERY_STATUS_LABELS, DELIVERY_STATUS } from '../../utils/constants';

const LivraisonCard = ({
    livraison,
    onView,
    onUpdateStatus,
    onPrint,
    showActions = true,
    className = ''
}) => {
    if (!livraison) return null;

    // Déterminer la couleur du statut
    const getStatusColor = () => {
        switch (livraison.statut) {
            case DELIVERY_STATUS.PROGRAMMEE:
                return 'blue';
            case DELIVERY_STATUS.EN_CHARGEMENT:
                return 'yellow';
            case DELIVERY_STATUS.EN_ROUTE:
                return 'purple';
            case DELIVERY_STATUS.LIVREE:
                return 'green';
            case DELIVERY_STATUS.RETOURNEE:
                return 'orange';
            case DELIVERY_STATUS.INCIDENT:
                return 'red';
            default:
                return 'gray';
        }
    };

    // Déterminer l'icône du statut
    const getStatusIcon = () => {
        switch (livraison.statut) {
            case DELIVERY_STATUS.EN_ROUTE:
                return <Truck className="h-4 w-4" />;
            case DELIVERY_STATUS.LIVREE:
                return <Package className="h-4 w-4" />;
            case DELIVERY_STATUS.INCIDENT:
                return <AlertCircle className="h-4 w-4" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    // Vérifier si la livraison est en retard
    const isLate = () => {
        if (livraison.statut === DELIVERY_STATUS.LIVREE || livraison.statut === DELIVERY_STATUS.RETOURNEE) {
            return false;
        }
        if (livraison.dateLivraisonPrevue) {
            return new Date(livraison.dateLivraisonPrevue) < new Date();
        }
        return false;
    };

    return (
        <Card 
            className={`hover:shadow-lg transition-shadow ${onView ? 'cursor-pointer' : ''} ${className}`}
            onClick={() => onView?.(livraison)}
        >
            <div className="p-6">
                {/* En-tête */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Truck className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {livraison.numero}
                            </h3>
                            <p className="text-sm text-gray-500">
                                Commande: {livraison.numeroCommande}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                        <Badge 
                            variant={getStatusColor()} 
                            className="flex items-center space-x-1"
                        >
                            {getStatusIcon()}
                            <span>{DELIVERY_STATUS_LABELS[livraison.statut]}</span>
                        </Badge>
                        {isLate() && (
                            <Badge variant="red" size="sm">
                                En retard
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Informations client */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-600">
                                <User className="h-4 w-4 mr-2" />
                                <span className="font-medium">{livraison.clientNom}</span>
                            </div>
                            {livraison.contactLivraison && (
                                <div className="flex items-center text-sm text-gray-600">
                                    <Phone className="h-4 w-4 mr-2" />
                                    <span>{livraison.contactLivraison}</span>
                                </div>
                            )}
                            <div className="flex items-start text-sm text-gray-600">
                                <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                                <span className="line-clamp-2">{livraison.adresseLivraison}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Date prévue</p>
                        <p className="text-sm text-gray-900 flex items-center mt-1">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {livraison.dateLivraisonPrevue 
                                ? formatDate(livraison.dateLivraisonPrevue) 
                                : 'Non définie'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            {livraison.statut === DELIVERY_STATUS.LIVREE ? 'Livrée le' : 'Créée le'}
                        </p>
                        <p className="text-sm text-gray-900 flex items-center mt-1">
                            <Clock className="h-4 w-4 mr-1 text-gray-400" />
                            {formatDate(
                                livraison.statut === DELIVERY_STATUS.LIVREE && livraison.dateLivraisonEffective
                                    ? livraison.dateLivraisonEffective
                                    : livraison.dateLivraison
                            )}
                        </p>
                    </div>
                </div>

                {/* Informations de transport */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {livraison.transporteur && (
                        <div>
                            <p className="text-sm font-medium text-gray-500">Transporteur</p>
                            <p className="text-sm text-gray-900 mt-1">{livraison.transporteur}</p>
                        </div>
                    )}
                    {livraison.numeroTracking && (
                        <div>
                            <p className="text-sm font-medium text-gray-500">N° tracking</p>
                            <p className="text-sm text-gray-900 mt-1 font-mono">{livraison.numeroTracking}</p>
                        </div>
                    )}
                </div>

                {/* Montant et articles */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div>
                        <p className="text-sm text-gray-500">
                            {livraison.articles?.length || 0} article(s)
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(livraison.montantTotal || 0)}
                        </p>
                        {livraison.fraisLivraison > 0 && (
                            <p className="text-sm text-gray-500">
                                + {formatCurrency(livraison.fraisLivraison)} de frais
                            </p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                {showActions && (
                    <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
                        {onUpdateStatus && livraison.statut !== DELIVERY_STATUS.LIVREE && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateStatus(livraison);
                                }}
                            >
                                Mettre à jour
                            </Button>
                        )}
                        {onPrint && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPrint(livraison);
                                }}
                            >
                                Bon de livraison
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};

export default LivraisonCard;