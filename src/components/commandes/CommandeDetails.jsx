// src/components/commandes/CommandeDetails.jsx
import React, { useState } from 'react';
import {
    ShoppingCart,
    User,
    Calendar,
    DollarSign,
    Package,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    FileText,
    Edit,
    Trash2,
    X,
    Printer,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    AlertCircle,
    Download
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import Table from '../ui/Table';
import { formatCurrency, formatDate, formatQuantity, formatPhone } from '../../utils/formatters';
import { ORDER_STATUS, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_METHODS_LABELS } from '../../utils/constants';

const CommandeDetails = ({
    isOpen,
    onClose,
    commande,
    livraisons = [],
    paiements = [],
    onEdit,
    onDelete,
    onUpdateStatus,
    onCreateDelivery,
    onPrint,
    onSendEmail,
    loading = false
}) => {
    const [activeTab, setActiveTab] = useState('details');

    if (!commande) return null;

    // Calculer les totaux
    const calculateTotals = () => {
        const sousTotal = commande.articles?.reduce((sum, article) => 
            sum + (article.prixUnitaire * article.quantite), 0) || 0;
        const remise = commande.remise || 0;
        const montantRemise = (sousTotal * remise) / 100;
        const montantHT = sousTotal - montantRemise;
        const tva = commande.tva || 0;
        const montantTVA = (montantHT * tva) / 100;
        const montantTTC = montantHT + montantTVA;
        const totalPaye = paiements.reduce((sum, p) => sum + p.montant, 0);
        const resteAPayer = montantTTC - totalPaye;

        return {
            sousTotal,
            remise,
            montantRemise,
            montantHT,
            tva,
            montantTVA,
            montantTTC,
            totalPaye,
            resteAPayer
        };
    };

    // Déterminer les actions disponibles
    const getAvailableActions = () => {
        const actions = [];
        
        switch (commande.statut) {
            case ORDER_STATUS.BROUILLON:
                actions.push(
                    { label: 'Confirmer', status: ORDER_STATUS.CONFIRMEE, variant: 'primary' },
                    { label: 'Annuler', status: ORDER_STATUS.ANNULEE, variant: 'outline' }
                );
                break;
            case ORDER_STATUS.CONFIRMEE:
                actions.push(
                    { label: 'Préparer', status: ORDER_STATUS.EN_PREPARATION, variant: 'primary' },
                    { label: 'Annuler', status: ORDER_STATUS.ANNULEE, variant: 'outline' }
                );
                break;
            case ORDER_STATUS.EN_PREPARATION:
                actions.push(
                    { label: 'Marquer prête', status: ORDER_STATUS.PRETE, variant: 'primary' }
                );
                break;
            case ORDER_STATUS.PRETE:
                if (livraisons.length === 0) {
                    actions.push(
                        { label: 'Créer bon de livraison', action: 'createDelivery', variant: 'primary' }
                    );
                }
                break;
        }
        
        return actions;
    };

    const totals = calculateTotals();
    const availableActions = getAvailableActions();

    const tabs = [
        { id: 'details', label: 'Détails', icon: FileText },
        { id: 'articles', label: 'Articles', icon: Package },
        { id: 'livraisons', label: 'Livraisons', icon: Truck },
        { id: 'paiements', label: 'Paiements', icon: CreditCard }
    ];

    // Colonnes pour le tableau des articles
    const articlesColumns = [
        {
            key: 'reference',
            label: 'Référence',
            render: (_, article) => (
                <div>
                    <p className="font-medium text-gray-900">{article.reference}</p>
                    <p className="text-sm text-gray-500">{article.nom}</p>
                </div>
            )
        },
        {
            key: 'quantite',
            label: 'Quantité',
            render: (_, article) => formatQuantity(article.quantite, article.unite)
        },
        {
            key: 'prixUnitaire',
            label: 'Prix unitaire',
            render: (value) => formatCurrency(value)
        },
        {
            key: 'montant',
            label: 'Montant',
            render: (_, article) => formatCurrency(article.quantite * article.prixUnitaire)
        }
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <div className="flex flex-col h-full max-h-[90vh]">
                {/* En-tête */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <ShoppingCart className="h-8 w-8 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Commande {commande.numero}
                                </h2>
                                <p className="text-sm text-gray-500 flex items-center mt-1">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {formatDate(commande.date, 'dd MMMM yyyy à HH:mm')}
                                </p>
                                <div className="flex items-center space-x-2 mt-2">
                                    <Badge 
                                        variant={ORDER_STATUS_COLORS[commande.statut] || 'gray'}
                                        className="flex items-center space-x-1"
                                    >
                                        {ORDER_STATUS_LABELS[commande.statut]}
                                    </Badge>
                                    {commande.priorite === 'urgent' && (
                                        <Badge variant="orange">Urgent</Badge>
                                    )}
                                    {totals.resteAPayer > 0 && (
                                        <Badge variant="yellow">
                                            Reste {formatCurrency(totals.resteAPayer)}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Actions rapides */}
                {availableActions.length > 0 && (
                    <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                            {availableActions.map((action, index) => (
                                <Button
                                    key={index}
                                    variant={action.variant}
                                    size="sm"
                                    onClick={() => {
                                        if (action.action === 'createDelivery') {
                                            onCreateDelivery?.(commande);
                                        } else {
                                            onUpdateStatus?.(commande, action.status);
                                        }
                                    }}
                                >
                                    {action.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Onglets */}
                <div className="border-b border-gray-200">
                    <div className="flex space-x-8 px-6">
                        {tabs.map(tab => {
                            const TabIcon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <TabIcon className="h-4 w-4" />
                                    <span>{tab.label}</span>
                                    {tab.id === 'articles' && commande.articles && (
                                        <Badge size="sm" variant="gray">
                                            {commande.articles.length}
                                        </Badge>
                                    )}
                                    {tab.id === 'livraisons' && livraisons.length > 0 && (
                                        <Badge size="sm" variant="gray">
                                            {livraisons.length}
                                        </Badge>
                                    )}
                                    {tab.id === 'paiements' && paiements.length > 0 && (
                                        <Badge size="sm" variant="gray">
                                            {paiements.length}
                                        </Badge>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Contenu */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <>
                            {/* Onglet Détails */}
                            {activeTab === 'details' && (
                                <div className="space-y-6">
                                    {/* Informations client */}
                                    <Card>
                                        <div className="p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                                Informations client
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <div className="flex items-center">
                                                        <User className="h-5 w-5 text-gray-400 mr-3" />
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-500">Client</p>
                                                            <p className="text-gray-900">{commande.clientNom}</p>
                                                        </div>
                                                    </div>
                                                    {commande.clientEmail && (
                                                        <div className="flex items-center">
                                                            <Mail className="h-5 w-5 text-gray-400 mr-3" />
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-500">Email</p>
                                                                <p className="text-gray-900">{commande.clientEmail}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {commande.clientTelephone && (
                                                        <div className="flex items-center">
                                                            <Phone className="h-5 w-5 text-gray-400 mr-3" />
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-500">Téléphone</p>
                                                                <p className="text-gray-900">
                                                                    {formatPhone(commande.clientTelephone)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-3">
                                                    {commande.adresseLivraison && (
                                                        <div className="flex items-start">
                                                            <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-500">
                                                                    Adresse de livraison
                                                                </p>
                                                                <p className="text-gray-900 whitespace-pre-wrap">
                                                                    {commande.adresseLivraison}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Résumé financier */}
                                    <Card>
                                        <div className="p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                                Résumé financier
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Sous-total</span>
                                                    <span className="font-medium">{formatCurrency(totals.sousTotal)}</span>
                                                </div>
                                                {totals.remise > 0 && (
                                                    <div className="flex justify-between text-green-600">
                                                        <span>Remise ({totals.remise}%)</span>
                                                        <span>-{formatCurrency(totals.montantRemise)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between font-medium">
                                                    <span>Total HT</span>
                                                    <span>{formatCurrency(totals.montantHT)}</span>
                                                </div>
                                                {totals.tva > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">TVA ({totals.tva}%)</span>
                                                        <span>{formatCurrency(totals.montantTVA)}</span>
                                                    </div>
                                                )}
                                                <div className="pt-3 border-t border-gray-200">
                                                    <div className="flex justify-between text-lg font-bold">
                                                        <span>Total TTC</span>
                                                        <span className="text-blue-600">
                                                            {formatCurrency(totals.montantTTC)}
                                                        </span>
                                                    </div>
                                                </div>
                                                {totals.totalPaye > 0 && (
                                                    <>
                                                        <div className="flex justify-between text-green-600">
                                                            <span>Payé</span>
                                                            <span>{formatCurrency(totals.totalPaye)}</span>
                                                        </div>
                                                        <div className="flex justify-between font-bold text-orange-600">
                                                            <span>Reste à payer</span>
                                                            <span>{formatCurrency(totals.resteAPayer)}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Informations supplémentaires */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card>
                                            <div className="p-6">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                                    Dates importantes
                                                </h3>
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500">
                                                            Date de commande
                                                        </p>
                                                        <p className="text-gray-900">
                                                            {formatDate(commande.date, 'dd/MM/yyyy')}
                                                        </p>
                                                    </div>
                                                    {commande.dateLivraisonPrevue && (
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-500">
                                                                Livraison prévue
                                                            </p>
                                                            <p className="text-gray-900">
                                                                {formatDate(commande.dateLivraisonPrevue, 'dd/MM/yyyy')}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {commande.dateValidation && (
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-500">
                                                                Date de validation
                                                            </p>
                                                            <p className="text-gray-900">
                                                                {formatDate(commande.dateValidation, 'dd/MM/yyyy')}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>

                                        <Card>
                                            <div className="p-6">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                                    Paiement
                                                </h3>
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500">
                                                            Mode de paiement
                                                        </p>
                                                        <p className="text-gray-900">
                                                            {PAYMENT_METHODS_LABELS[commande.modePaiement] || commande.modePaiement}
                                                        </p>
                                                    </div>
                                                    {commande.conditionsPaiement && (
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-500">
                                                                Conditions
                                                            </p>
                                                            <p className="text-gray-900">
                                                                {commande.conditionsPaiement}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    </div>

                                    {/* Notes */}
                                    {commande.notes && (
                                        <Card>
                                            <div className="p-6">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
                                                <p className="text-gray-700 whitespace-pre-wrap">{commande.notes}</p>
                                            </div>
                                        </Card>
                                    )}
                                </div>
                            )}

                            {/* Onglet Articles */}
                            {activeTab === 'articles' && (
                                <div className="space-y-4">
                                    {commande.articles && commande.articles.length > 0 ? (
                                        <>
                                            <Table
                                                columns={articlesColumns}
                                                data={commande.articles}
                                                className="bg-white rounded-lg shadow-sm"
                                            />
                                            
                                            {/* Totaux */}
                                            <Card>
                                                <div className="p-4">
                                                    <div className="flex justify-end">
                                                        <div className="w-64 space-y-2">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Sous-total</span>
                                                                <span className="font-medium">
                                                                    {formatCurrency(totals.sousTotal)}
                                                                </span>
                                                            </div>
                                                            {totals.remise > 0 && (
                                                                <div className="flex justify-between text-green-600">
                                                                    <span>Remise ({totals.remise}%)</span>
                                                                    <span>-{formatCurrency(totals.montantRemise)}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex justify-between pt-2 border-t font-bold">
                                                                <span>Total</span>
                                                                <span>{formatCurrency(totals.montantTTC)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </>
                                    ) : (
                                        <Card className="p-12 text-center">
                                            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500">Aucun article dans cette commande</p>
                                        </Card>
                                    )}
                                </div>
                            )}

                            {/* Onglet Livraisons */}
                            {activeTab === 'livraisons' && (
                                <div className="space-y-4">
                                    {livraisons.length > 0 ? (
                                        livraisons.map((livraison) => (
                                            <Card key={livraison.id} className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {livraison.numero}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {formatDate(livraison.date)}
                                                        </p>
                                                    </div>
                                                    <Badge variant={
                                                        livraison.statut === 'livree' ? 'green' :
                                                        livraison.statut === 'en_route' ? 'blue' :
                                                        'gray'
                                                    }>
                                                        {livraison.statut}
                                                    </Badge>
                                                </div>
                                            </Card>
                                        ))
                                    ) : (
                                        <Card className="p-12 text-center">
                                            <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500">Aucune livraison pour cette commande</p>
                                            {commande.statut === ORDER_STATUS.PRETE && onCreateDelivery && (
                                                <Button
                                                    onClick={() => onCreateDelivery(commande)}
                                                    className="mt-4"
                                                >
                                                    Créer un bon de livraison
                                                </Button>
                                            )}
                                        </Card>
                                    )}
                                </div>
                            )}

                            {/* Onglet Paiements */}
                            {activeTab === 'paiements' && (
                                <div className="space-y-4">
                                    {paiements.length > 0 ? (
                                        <>
                                            {paiements.map((paiement) => (
                                                <Card key={paiement.id} className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {formatCurrency(paiement.montant)}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                {paiement.mode} - {formatDate(paiement.date)}
                                                            </p>
                                                        </div>
                                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                                    </div>
                                                </Card>
                                            ))}
                                            
                                            <Card className="p-4 bg-gray-50">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">Total payé</span>
                                                        <span className="font-bold text-green-600">
                                                            {formatCurrency(totals.totalPaye)}
                                                        </span>
                                                    </div>
                                                    {totals.resteAPayer > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="font-medium">Reste à payer</span>
                                                            <span className="font-bold text-orange-600">
                                                                {formatCurrency(totals.resteAPayer)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </Card>
                                        </>
                                    ) : (
                                        <Card className="p-12 text-center">
                                            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500">Aucun paiement enregistré</p>
                                            <p className="text-2xl font-bold text-orange-600 mt-2">
                                                {formatCurrency(totals.montantTTC)}
                                            </p>
                                            <p className="text-sm text-gray-500">à payer</p>
                                        </Card>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {commande.utilisateur && (
                                <p className="text-sm text-gray-500">
                                    Créée par {commande.utilisateur}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center space-x-3">
                            {onSendEmail && (
                                <Button
                                    variant="outline"
                                    onClick={() => onSendEmail(commande)}
                                    className="flex items-center space-x-2"
                                >
                                    <Mail className="h-4 w-4" />
                                    <span>Envoyer</span>
                                </Button>
                            )}
                            {onPrint && (
                                <Button
                                    variant="outline"
                                    onClick={() => onPrint(commande)}
                                    className="flex items-center space-x-2"
                                >
                                    <Printer className="h-4 w-4" />
                                    <span>Imprimer</span>
                                </Button>
                            )}
                            {onEdit && [ORDER_STATUS.BROUILLON, ORDER_STATUS.CONFIRMEE].includes(commande.statut) && (
                                <Button
                                    variant="outline"
                                    onClick={() => onEdit(commande)}
                                    className="flex items-center space-x-2"
                                >
                                    <Edit className="h-4 w-4" />
                                    <span>Modifier</span>
                                </Button>
                            )}
                            {onDelete && commande.statut === ORDER_STATUS.BROUILLON && (
                                <Button
                                    variant="outline"
                                    onClick={() => onDelete(commande)}
                                    className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Supprimer</span>
                                </Button>
                            )}
                            <Button variant="outline" onClick={onClose}>
                                Fermer
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default CommandeDetails;