import React, { useState, useEffect } from 'react';
import { Truck, Package, MapPin, Clock, AlertTriangle, CheckCircle, Plus, Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DELIVERY_STATUS, DELIVERY_STATUS_LABELS, DELIVERY_STATUS_COLORS, TRUCK_TYPES, TRUCK_TYPE_LABELS, TRUCK_CAPACITIES } from '../utils/constants';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { formatCurrency } from '../utils/formatters';
import { MockApiService } from '../services/mockApi';

const GestionLivraisons = () => {
    const { user, hasPermission } = useAuth();
    const [loading, setLoading] = useState(true);
    const [livraisons, setLivraisons] = useState([]);
    const [camions, setCamions] = useState([]);
    const [showModalLivraison, setShowModalLivraison] = useState(false);
    const [showModalPartielle, setShowModalPartielle] = useState(false);
    const [selectedLivraison, setSelectedLivraison] = useState(null);

    useEffect(() => {
        loadLivraisonsData();
    }, []);

    const loadLivraisonsData = async () => {
        try {
            setLoading(true);
            
            // Mock data livraisons
            const mockLivraisons = [
                {
                    id: 1,
                    numero: 'LIV-2024-001',
                    commande: {
                        numero: 'CMD-2024-001',
                        client: { nom: 'SENEGAL AVICOLE', adresse: 'Zone Industrielle, Dakar' }
                    },
                    statut: 'programmee',
                    dateProgrammee: '2024-12-20',
                    camion: {
                        id: 1,
                        numero: 'CAM-001',
                        type: 'grand',
                        capacite: 300,
                        chauffeur: 'Moussa Diop',
                        telephone: '+221 77 123 45 67'
                    },
                    items: [
                        {
                            produit: { nom: 'Maïs jaune', unite: 'Tonnes' },
                            quantiteCommande: 250,
                            quantiteChargee: 0,
                            quantiteLivree: 0
                        }
                    ],
                    distanceKm: 15,
                    tempsEstime: '45 min'
                },
                {
                    id: 2,
                    numero: 'LIV-2024-002',
                    commande: {
                        numero: 'CMD-2024-002',
                        client: { nom: 'FERME MODERNE SARL', adresse: 'Route de Rufisque, Km 15' }
                    },
                    statut: 'en_route',
                    dateProgrammee: '2024-12-19',
                    heureDepart: '08:30',
                    camion: {
                        id: 2,
                        numero: 'CAM-002',
                        type: 'moyen',
                        capacite: 150,
                        chauffeur: 'Amadou Ba',
                        telephone: '+221 76 987 65 43'
                    },
                    items: [
                        {
                            produit: { nom: 'Soja', unite: 'Tonnes' },
                            quantiteCommande: 120,
                            quantiteChargee: 120,
                            quantiteLivree: 0
                        }
                    ],
                    distanceKm: 25,
                    tempsEstime: '1h 15min',
                    positionActuelle: 'Km 10 Route de Rufisque'
                },
                {
                    id: 3,
                    numero: 'LIV-2024-003',
                    commande: {
                        numero: 'CMD-2024-003',
                        client: { nom: 'ELEVAGE DU SAHEL', adresse: 'Route de Saint-Louis' }
                    },
                    statut: 'livree_partielle',
                    dateProgrammee: '2024-12-18',
                    dateLivraison: '2024-12-18',
                    camion: {
                        id: 1,
                        numero: 'CAM-001',
                        type: 'grand',
                        capacite: 300,
                        chauffeur: 'Moussa Diop'
                    },
                    items: [
                        {
                            produit: { nom: 'Blé tendre', unite: 'Tonnes' },
                            quantiteCommande: 200,
                            quantiteChargee: 200,
                            quantiteLivree: 150
                        }
                    ],
                    raisonPartielle: 'Problème d\'accès au site - route impraticable',
                    quantiteRestante: 50,
                    nouvelleDatePrevue: '2024-12-21'
                }
            ];

            const mockCamions = [
                {
                    id: 1,
                    numero: 'CAM-001',
                    type: 'grand',
                    capacite: 300,
                    chauffeur: 'Moussa Diop',
                    telephone: '+221 77 123 45 67',
                    statut: 'disponible',
                    derniereMaintenance: '2024-11-15'
                },
                {
                    id: 2,
                    numero: 'CAM-002',
                    type: 'moyen',
                    capacite: 150,
                    chauffeur: 'Amadou Ba',
                    telephone: '+221 76 987 65 43',
                    statut: 'en_route',
                    derniereMaintenance: '2024-11-20'
                },
                {
                    id: 3,
                    numero: 'CAM-003',
                    type: 'petit',
                    capacite: 50,
                    chauffeur: 'Ibrahima Fall',
                    telephone: '+221 78 456 78 90',
                    statut: 'maintenance',
                    derniereMaintenance: '2024-12-01'
                }
            ];

            setLivraisons(mockLivraisons);
            setCamions(mockCamions);
            setLoading(false);
        } catch (error) {
            console.error('Erreur chargement livraisons:', error);
            setLoading(false);
        }
    };

    const validateStockAvailability = async (produitId, quantiteRequise, magasinId) => {
        try {
            const stocks = await MockApiService.getStock({ produitId, magasin_id: magasinId });
            const stockTotal = stocks.reduce((sum, stock) => sum + stock.quantite, 0);
            return {
                disponible: stockTotal >= quantiteRequise,
                stockTotal,
                quantiteRequise
            };
        } catch (error) {
            console.error('Erreur validation stock:', error);
            return { disponible: false, stockTotal: 0, quantiteRequise };
        }
    };

    const handleLivraisonPartielle = async (livraison, quantiteLivree, raison) => {
        try {
            // Valider la disponibilité du stock avant livraison
            const item = livraison.items[0]; // Simplifié pour l'exemple
            
            // Validation des entrées
            if (quantiteLivree <= 0) {
                alert('La quantité livrée doit être supérieure à 0');
                return;
            }
            
            if (quantiteLivree > item.quantiteCommande) {
                alert(`Quantité livrée (${quantiteLivree}) supérieure à la commande (${item.quantiteCommande})`);
                return;
            }

            // Valider le stock disponible
            const stockValidation = await validateStockAvailability(
                item.produit.id, 
                quantiteLivree, 
                livraison.magasin_id || 'dkr-port'
            );

            if (!stockValidation.disponible) {
                alert(`Stock insuffisant! Disponible: ${stockValidation.stockTotal}, Requis: ${quantiteLivree}`);
                return;
            }

            // Procéder à la livraison
            const quantiteRestante = item.quantiteCommande - quantiteLivree;
            
            setLivraisons(prev => prev.map(liv => {
                if (liv.id === livraison.id) {
                    return {
                        ...liv,
                        statut: quantiteRestante > 0 ? 'livree_partielle' : 'livree_complete',
                        dateLivraison: new Date().toISOString().split('T')[0],
                        items: liv.items.map(item => ({
                            ...item,
                            quantiteLivree: quantiteLivree
                        })),
                        raisonPartielle: raison,
                        quantiteRestante: quantiteRestante > 0 ? quantiteRestante : 0,
                        nouvelleDatePrevue: quantiteRestante > 0 ? '2024-12-25' : null
                    };
                }
                return liv;
            }));

            // Enregistrer le mouvement de stock
            await MockApiService.removeStock(
                stockValidation.stockId || 1, // ID du stock
                quantiteLivree,
                `Livraison ${livraison.numero} - ${livraison.commande.client.nom}`
            );

            setShowModalPartielle(false);
            alert(`Livraison ${quantiteRestante > 0 ? 'partielle' : 'complète'} enregistrée avec succès!`);
            
        } catch (error) {
            console.error('Erreur livraison partielle:', error);
            alert('Erreur lors de l\'enregistrement de la livraison');
        }
    };

    const updateStatutLivraison = (livraisonId, nouveauStatut) => {
        setLivraisons(prev => prev.map(liv => 
            liv.id === livraisonId 
                ? { ...liv, statut: nouveauStatut }
                : liv
        ));
    };

    const getStatutCamionColor = (statut) => {
        switch (statut) {
            case 'disponible': return 'green';
            case 'en_route': return 'blue';
            case 'maintenance': return 'red';
            default: return 'gray';
        }
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestion des Livraisons</h1>
                    <p className="text-gray-600">Planifiez et suivez les livraisons avec votre flotte</p>
                </div>
                {hasPermission('livraisons.create') && (
                    <Button onClick={() => setShowModalLivraison(true)} className="flex items-center gap-2">
                        <Plus size={20} />
                        Nouvelle Livraison
                    </Button>
                )}
            </div>

            {/* Stats rapides */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Truck className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-gray-600">Camions actifs</p>
                            <p className="text-xl font-bold">{camions.filter(c => c.statut === 'disponible' || c.statut === 'en_route').length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-gray-600">En transit</p>
                            <p className="text-xl font-bold">{livraisons.filter(l => l.statut === 'en_route').length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-gray-600">Livrées complètes</p>
                            <p className="text-xl font-bold">{livraisons.filter(l => l.statut === 'livree_complete').length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-gray-600">Partielles</p>
                            <p className="text-xl font-bold">{livraisons.filter(l => l.statut === 'livree_partielle').length}</p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Liste des livraisons */}
                <div className="lg:col-span-2">
                    <Card>
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Livraisons Actives</h3>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {livraisons.map((livraison) => (
                                <div key={livraison.id} className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{livraison.numero}</h4>
                                            <p className="text-sm text-gray-500">{livraison.commande.numero}</p>
                                        </div>
                                        <Badge variant={DELIVERY_STATUS_COLORS[livraison.statut]}>
                                            {DELIVERY_STATUS_LABELS[livraison.statut]}
                                        </Badge>
                                    </div>

                                    <div className="space-y-3">
                                        {/* Client et destination */}
                                        <div className="flex items-start space-x-3">
                                            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-sm">{livraison.commande.client.nom}</p>
                                                <p className="text-sm text-gray-500">{livraison.commande.client.adresse}</p>
                                            </div>
                                        </div>

                                        {/* Camion assigné */}
                                        <div className="flex items-center space-x-3">
                                            <Truck className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm">
                                                    <span className="font-medium">{livraison.camion.numero}</span>
                                                    <span className="text-gray-500 ml-2">
                                                        ({TRUCK_TYPE_LABELS[livraison.camion.type]})
                                                    </span>
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Chauffeur: {livraison.camion.chauffeur}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Articles */}
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            {livraison.items.map((item, index) => (
                                                <div key={index} className="flex justify-between items-center">
                                                    <span className="text-sm">{item.produit.nom}</span>
                                                    <div className="text-right">
                                                        {livraison.statut === 'livree_partielle' ? (
                                                            <div>
                                                                <p className="text-sm font-medium text-orange-600">
                                                                    {item.quantiteLivree}/{item.quantiteCommande} {item.produit.unite}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    Restant: {item.quantiteCommande - item.quantiteLivree} {item.produit.unite}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm font-medium">
                                                                {item.quantiteCommande} {item.produit.unite}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Position actuelle si en route */}
                                        {livraison.statut === 'en_route' && livraison.positionActuelle && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                <p className="text-sm text-blue-800">
                                                    📍 Position: {livraison.positionActuelle}
                                                </p>
                                            </div>
                                        )}

                                        {/* Raison livraison partielle */}
                                        {livraison.statut === 'livree_partielle' && livraison.raisonPartielle && (
                                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                                <p className="text-sm text-orange-800">
                                                    ⚠️ {livraison.raisonPartielle}
                                                </p>
                                                {livraison.nouvelleDatePrevue && (
                                                    <p className="text-xs text-orange-600 mt-1">
                                                        Nouvelle livraison prévue le {new Date(livraison.nouvelleDatePrevue).toLocaleDateString('fr-FR')}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                            <p className="text-xs text-gray-500">
                                                {livraison.distanceKm} km • {livraison.tempsEstime}
                                            </p>
                                            <div className="flex space-x-2">
                                                {livraison.statut === 'programmee' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => updateStatutLivraison(livraison.id, 'en_chargement')}
                                                    >
                                                        Démarrer chargement
                                                    </Button>
                                                )}
                                                {livraison.statut === 'en_chargement' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => updateStatutLivraison(livraison.id, 'en_route')}
                                                    >
                                                        Départ livraison
                                                    </Button>
                                                )}
                                                {livraison.statut === 'en_route' && (
                                                    <div className="flex space-x-1">
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => {
                                                                setSelectedLivraison(livraison);
                                                                setShowModalPartielle(true);
                                                            }}
                                                        >
                                                            Livraison partielle
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => updateStatutLivraison(livraison.id, 'livree_complete')}
                                                        >
                                                            Livraison complète
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Statut des camions */}
                <div>
                    <Card>
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Flotte de Camions</h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {camions.map((camion) => (
                                    <div key={camion.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium text-gray-900">{camion.numero}</h4>
                                            <Badge variant={getStatutCamionColor(camion.statut)}>
                                                {camion.statut}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-gray-600 space-y-1">
                                            <p>Type: {TRUCK_TYPE_LABELS[camion.type]}</p>
                                            <p>Capacité: {camion.capacite} tonnes</p>
                                            <p>Chauffeur: {camion.chauffeur}</p>
                                            {camion.telephone && (
                                                <p>Tél: {camion.telephone}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Modal Livraison Partielle */}
            <Modal
                isOpen={showModalPartielle}
                onClose={() => setShowModalPartielle(false)}
                title="Livraison Partielle"
            >
                {selectedLivraison && (
                    <div className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="font-medium text-yellow-800 mb-2">
                                {selectedLivraison.numero} - {selectedLivraison.commande.client.nom}
                            </h4>
                            <div className="text-sm text-yellow-700">
                                {selectedLivraison.items.map((item, index) => (
                                    <p key={index}>
                                        {item.produit.nom}: {item.quantiteCommande} {item.produit.unite} commandées
                                    </p>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantité livrée
                            </label>
                            <input
                                type="number"
                                placeholder="Ex: 200"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Raison de la livraison partielle
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Ex: Route impraticable, problème d'accès..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            ></textarea>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <Button variant="secondary" onClick={() => setShowModalPartielle(false)}>
                                Annuler
                            </Button>
                            <Button onClick={() => handleLivraisonPartielle(selectedLivraison, 200, "Route impraticable")}>
                                Confirmer livraison partielle
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default GestionLivraisons;