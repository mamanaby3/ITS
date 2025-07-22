


// src/components/produits/ProduitDetails.jsx
import React, { useState } from 'react';
import { 
    Package, 
    Tag, 
    DollarSign, 
    AlertCircle, 
    Calendar, 
    Box,
    TrendingUp,
    TrendingDown,
    Activity,
    Edit,
    Trash2,
    X,
    BarChart
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import { formatCurrency, formatDate, formatQuantity } from '../../utils/formatters';
import { PRODUIT_CATEGORIES_LABELS } from '../../utils/constants';

const ProduitDetails = ({
    isOpen,
    onClose,
    produit,
    stockInfo = {},
    mouvements = [],
    statistiques = {},
    onEdit,
    onDelete,
    loading = false
}) => {
    const [activeTab, setActiveTab] = useState('informations');

    if (!produit) return null;

    // Calculer les statistiques de stock
    const getStockStatus = () => {
        const { quantiteTotal = 0 } = stockInfo;
        const seuil = produit.seuilAlerte || 0;
        
        if (quantiteTotal === 0) {
            return { label: 'Rupture de stock', color: 'red', icon: AlertCircle };
        }
        if (quantiteTotal <= seuil) {
            return { label: 'Stock faible', color: 'yellow', icon: AlertCircle };
        }
        return { label: 'Stock normal', color: 'green', icon: Activity };
    };

    const stockStatus = getStockStatus();
    const StatusIcon = stockStatus.icon;

    const tabs = [
        { id: 'informations', label: 'Informations', icon: Package },
        { id: 'stock', label: 'Stock', icon: Box },
        { id: 'mouvements', label: 'Mouvements', icon: Activity },
        { id: 'statistiques', label: 'Statistiques', icon: BarChart }
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <div className="flex flex-col h-full max-h-[90vh]">
                {/* En-t�te */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Package className="h-8 w-8 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{produit.nom}</h2>
                                <p className="text-sm text-gray-500 flex items-center mt-1">
                                    <Tag className="h-4 w-4 mr-1" />
                                    {produit.reference}
                                </p>
                                <div className="flex items-center space-x-2 mt-2">
                                    <Badge variant="blue">
                                        {PRODUIT_CATEGORIES_LABELS[produit.categorie] || produit.categorie}
                                    </Badge>
                                    {produit.actif === false && (
                                        <Badge variant="gray">Inactif</Badge>
                                    )}
                                    <Badge variant={stockStatus.color} className="flex items-center space-x-1">
                                        <StatusIcon className="h-3 w-3" />
                                        <span>{stockStatus.label}</span>
                                    </Badge>
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
                            {/* Onglet Informations */}
                            {activeTab === 'informations' && (
                                <div className="space-y-6">
                                    <Card>
                                        <div className="p-6 space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Informations g�n�rales</h3>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">Nom</label>
                                                    <p className="mt-1 text-gray-900">{produit.nom}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">R�f�rence</label>
                                                    <p className="mt-1 text-gray-900">{produit.reference}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">Cat�gorie</label>
                                                    <p className="mt-1 text-gray-900">
                                                        {PRODUIT_CATEGORIES_LABELS[produit.categorie] || produit.categorie}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">Unit� de mesure</label>
                                                    <p className="mt-1 text-gray-900">{produit.unite}</p>
                                                </div>
                                            </div>

                                            {produit.description && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">Description</label>
                                                    <p className="mt-1 text-gray-900">{produit.description}</p>
                                                </div>
                                            )}
                                        </div>
                                    </Card>

                                    <Card>
                                        <div className="p-6 space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Informations financi�res</h3>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500 flex items-center">
                                                        <DollarSign className="h-4 w-4 mr-1" />
                                                        Prix unitaire
                                                    </label>
                                                    <p className="mt-1 text-xl font-semibold text-gray-900">
                                                        {formatCurrency(produit.prixUnitaire || 0)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500 flex items-center">
                                                        <AlertCircle className="h-4 w-4 mr-1" />
                                                        Seuil d'alerte
                                                    </label>
                                                    <p className="mt-1 text-xl font-semibold text-gray-900">
                                                        {produit.seuilAlerte || 0} {produit.unite}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {/* Onglet Stock */}
                            {activeTab === 'stock' && (
                                <div className="space-y-6">
                                    {/* R�sum� du stock */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Card className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-600">Quantit� totale</p>
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        {formatQuantity(stockInfo.quantiteTotal || 0, produit.unite)}
                                                    </p>
                                                </div>
                                                <Box className="h-8 w-8 text-blue-600" />
                                            </div>
                                        </Card>
                                        
                                        <Card className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-600">Valeur totale</p>
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        {formatCurrency(stockInfo.valeurTotal || 0)}
                                                    </p>
                                                </div>
                                                <DollarSign className="h-8 w-8 text-green-600" />
                                            </div>
                                        </Card>
                                        
                                        <Card className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-600">Emplacements</p>
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        {stockInfo.emplacements?.length || 0}
                                                    </p>
                                                </div>
                                                <Box className="h-8 w-8 text-purple-600" />
                                            </div>
                                        </Card>
                                    </div>

                                    {/* D�tail par emplacement */}
                                    {stockInfo.emplacements && stockInfo.emplacements.length > 0 && (
                                        <Card>
                                            <div className="p-6">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4">R�partition par emplacement</h3>
                                                <div className="space-y-3">
                                                    {stockInfo.emplacements.map((emp, index) => (
                                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                            <div>
                                                                <p className="font-medium text-gray-900">{emp.emplacement}</p>
                                                                {emp.lot && (
                                                                    <p className="text-sm text-gray-500">Lot: {emp.lot}</p>
                                                                )}
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-semibold text-gray-900">
                                                                    {formatQuantity(emp.quantite, produit.unite)}
                                                                </p>
                                                                {emp.dateExpiration && (
                                                                    <p className="text-sm text-gray-500">
                                                                        Exp: {formatDate(emp.dateExpiration)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </Card>
                                    )}
                                </div>
                            )}

                            {/* Onglet Mouvements */}
                            {activeTab === 'mouvements' && (
                                <div className="space-y-4">
                                    {mouvements.length === 0 ? (
                                        <Card className="p-12 text-center">
                                            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500">Aucun mouvement enregistr�</p>
                                        </Card>
                                    ) : (
                                        <div className="space-y-3">
                                            {mouvements.slice(0, 10).map((mouvement) => (
                                                <Card key={mouvement.id} className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <div className={`p-2 rounded-lg ${
                                                                mouvement.type === 'entree' ? 'bg-green-100' : 'bg-red-100'
                                                            }`}>
                                                                {mouvement.type === 'entree' ? (
                                                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                                                ) : (
                                                                    <TrendingDown className="h-5 w-5 text-red-600" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-900">
                                                                    {mouvement.type === 'entree' ? 'Entr�e' : 'Sortie'}
                                                                </p>
                                                                <p className="text-sm text-gray-500">
                                                                    {mouvement.motif || mouvement.reference}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`font-semibold ${
                                                                mouvement.type === 'entree' ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                                {mouvement.type === 'entree' ? '+' : '-'}
                                                                {formatQuantity(mouvement.quantite, produit.unite)}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                {formatDate(mouvement.date, 'dd/MM/yyyy HH:mm')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Onglet Statistiques */}
                            {activeTab === 'statistiques' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Card className="p-6">
                                            <h4 className="text-sm font-medium text-gray-600 mb-2">Rotation du stock</h4>
                                            <p className="text-3xl font-bold text-gray-900">
                                                {statistiques.rotationStock || '0'}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">fois par mois</p>
                                        </Card>
                                        
                                        <Card className="p-6">
                                            <h4 className="text-sm font-medium text-gray-600 mb-2">Couverture du stock</h4>
                                            <p className="text-3xl font-bold text-gray-900">
                                                {statistiques.couvertureStock || '0'}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">jours</p>
                                        </Card>
                                    </div>

                                    <Card className="p-6">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4">�volution mensuelle</h4>
                                        <div className="text-center text-gray-500">
                                            <BarChart className="h-12 w-12 mx-auto mb-2" />
                                            <p>Graphique disponible prochainement</p>
                                        </div>
                                    </Card>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {produit.dateCreation && (
                                <p className="text-sm text-gray-500">
                                    Cr�� le {formatDate(produit.dateCreation)}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center space-x-3">
                            {onEdit && (
                                <Button
                                    variant="outline"
                                    onClick={() => onEdit(produit)}
                                    className="flex items-center space-x-2"
                                >
                                    <Edit className="h-4 w-4" />
                                    <span>Modifier</span>
                                </Button>
                            )}
                            {onDelete && produit.actif !== false && (
                                <Button
                                    variant="outline"
                                    onClick={() => onDelete(produit)}
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

export default ProduitDetails;