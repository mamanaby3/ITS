import React, { useState, useEffect } from 'react';
import { Package, ShoppingCart, AlertTriangle, CheckCircle, Clock, Truck, Scan, ClipboardList, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ORDER_STATUS, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../utils/constants';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import SimplifiedInterface from '../components/ui/SimplifiedInterface';
import { X } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import magasinsService from '../services/magasins';

const MagasinierDashboard = () => {
    const { user, getCurrentMagasin } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stockData, setStockData] = useState([]);
    const [commandes, setCommandes] = useState([]);
    const [stats, setStats] = useState({});
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
    const [isTabletView, setIsTabletView] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
    const [magasin, setMagasin] = useState(null);

    const currentMagasinId = getCurrentMagasin();

    useEffect(() => {
        loadMagasinierData();
    }, [currentMagasinId]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth < 768);
            setIsTabletView(window.innerWidth >= 768 && window.innerWidth < 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const loadMagasinierData = async () => {
        try {
            setLoading(true);
            
            // Récupérer les informations du magasin
            if (currentMagasinId) {
                try {
                    const response = await magasinsService.getById(currentMagasinId);
                    setMagasin(response.data || response);
                } catch (error) {
                    console.error('Erreur lors de la récupération du magasin:', error);
                }
            }
            
            // Mock data pour le magasinier
            const mockStock = [
                {
                    id: 1,
                    produit: { id: 1, nom: 'Maïs jaune', reference: 'MAIS-001', unite: 'Tonnes' },
                    quantite: 150,
                    quantiteReservee: 50,
                    quantiteDisponible: 100,
                    seuilAlerte: 50,
                    emplacement: 'A1-01',
                    lotNumber: 'LOT-2024-001',
                    dateExpiration: '2025-01-15'
                },
                {
                    id: 2,
                    produit: { id: 2, nom: 'Soja', reference: 'SOJA-001', unite: 'Tonnes' },
                    quantite: 80,
                    quantiteReservee: 30,
                    quantiteDisponible: 50,
                    seuilAlerte: 30,
                    emplacement: 'B2-05',
                    lotNumber: 'LOT-2024-002',
                    dateExpiration: '2025-02-15'
                }
            ];

            const mockCommandes = [
                {
                    id: 1,
                    numero: 'CMD-2024-001',
                    client: { nom: 'SENEGAL AVICOLE', email: 'contact@senegal-avicole.sn' },
                    statut: 'confirmee',
                    dateCommande: '2024-12-15',
                    dateLivraisonPrevue: '2024-12-20',
                    items: [
                        { produitId: 1, produit: { nom: 'Maïs jaune' }, quantite: 50, quantitePrete: 0 }
                    ],
                    total: 9000000,
                    priorite: 'haute'
                },
                {
                    id: 2,
                    numero: 'CMD-2024-002',
                    client: { nom: 'FERME MODERNE SARL', email: 'info@ferme-moderne.sn' },
                    statut: 'en_preparation',
                    dateCommande: '2024-12-14',
                    dateLivraisonPrevue: '2024-12-19',
                    items: [
                        { produitId: 2, produit: { nom: 'Soja' }, quantite: 30, quantitePrete: 15 }
                    ],
                    total: 7500000,
                    priorite: 'normale'
                }
            ];

            setStockData(mockStock);
            setCommandes(mockCommandes);
            setStats({
                stockItems: mockStock.length,
                commandesEnAttente: mockCommandes.filter(c => c.statut === 'confirmee').length,
                commandesEnPreparation: mockCommandes.filter(c => c.statut === 'en_preparation').length,
                produitsEnAlerte: mockStock.filter(s => s.quantiteDisponible <= s.seuilAlerte).length
            });
            
            setLoading(false);
        } catch (error) {
            console.error('Erreur chargement données magasinier:', error);
            setLoading(false);
        }
    };

    const marquerProduitPret = (commandeId, produitId) => {
        setCommandes(prev => prev.map(cmd => {
            if (cmd.id === commandeId) {
                const updatedItems = cmd.items.map(item => {
                    if (item.produitId === produitId) {
                        return { ...item, quantitePrete: item.quantite };
                    }
                    return item;
                });
                
                // Vérifier si toute la commande est prête
                const toutPret = updatedItems.every(item => item.quantitePrete === item.quantite);
                
                return {
                    ...cmd,
                    items: updatedItems,
                    statut: toutPret ? 'prete' : 'en_preparation'
                };
            }
            return cmd;
        }));
    };

    const getStockStatus = (stock) => {
        if (stock.quantiteDisponible <= 0) return { color: 'red', label: 'Épuisé' };
        if (stock.quantiteDisponible <= stock.seuilAlerte) return { color: 'orange', label: 'Alerte' };
        return { color: 'green', label: 'Disponible' };
    };

    const getPrioriteColor = (priorite) => {
        switch (priorite) {
            case 'haute': return 'red';
            case 'normale': return 'blue';
            case 'basse': return 'gray';
            default: return 'blue';
        }
    };

    // Interface optimisée pour tablette
    if (isTabletView) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                {/* Header optimisé pour tablette */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white shadow-lg mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Interface Magasinier</h1>
                            <p className="text-blue-100 text-lg">
                                {magasin?.nom} - {magasin?.ville}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-blue-200 mb-1">Connecté en tant que</p>
                            <p className="font-semibold text-lg">{user?.prenom} {user?.nom}</p>
                        </div>
                    </div>
                </div>

                {/* Grille d'actions principales */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                    <Card 
                        className="p-8 hover:shadow-xl transition-all cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 transform hover:scale-105"
                        onClick={() => window.location.href = '/stock'}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="p-6 rounded-full bg-blue-500 mb-4">
                                <Scan className="h-12 w-12 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Scanner & Gérer Stock</h3>
                            <p className="text-gray-600">Vérifier et gérer les produits</p>
                            <div className="mt-4 text-2xl font-bold text-blue-600">{stats.stockItems} produits</div>
                        </div>
                    </Card>
                    
                    <Card 
                        className="p-8 hover:shadow-xl transition-all cursor-pointer bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 transform hover:scale-105"
                        onClick={() => window.location.href = '/commandes'}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="p-6 rounded-full bg-green-500 mb-4">
                                <ClipboardList className="h-12 w-12 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Préparer Commandes</h3>
                            <p className="text-gray-600">Gérer les commandes</p>
                            <div className="mt-4 text-2xl font-bold text-green-600">{stats.commandesEnAttente} en attente</div>
                        </div>
                    </Card>
                </div>

                {/* Boutons d'action secondaires */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <Button 
                        size="lg"
                        className="h-24 text-lg font-semibold bg-purple-500 hover:bg-purple-600 text-white shadow-lg"
                        onClick={() => window.location.href = '/livraisons-magasinier'}
                    >
                        <div className="flex flex-col items-center">
                            <Truck className="h-10 w-10 mb-2" />
                            <span>Livraisons</span>
                        </div>
                    </Button>
                    <Button 
                        size="lg"
                        className="h-24 text-lg font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
                        onClick={() => window.location.href = '/mouvements'}
                    >
                        <div className="flex flex-col items-center">
                            <TrendingUp className="h-10 w-10 mb-2" />
                            <span>Mouvements</span>
                        </div>
                    </Button>
                    <Button 
                        size="lg"
                        className="h-24 text-lg font-semibold bg-teal-500 hover:bg-teal-600 text-white shadow-lg"
                        onClick={() => window.location.href = '/planning'}
                    >
                        <div className="flex flex-col items-center">
                            <Calendar className="h-10 w-10 mb-2" />
                            <span>Planning</span>
                        </div>
                    </Button>
                </div>

                {/* Alertes importantes */}
                {stats.produitsEnAlerte > 0 && (
                    <Card className="mb-8 p-6 bg-red-50 border-2 border-red-200">
                        <div className="flex items-center">
                            <AlertTriangle className="h-8 w-8 text-red-600 mr-4" />
                            <div>
                                <h3 className="text-lg font-bold text-red-900">Alertes Stock</h3>
                                <p className="text-red-700">{stats.produitsEnAlerte} produits nécessitent votre attention</p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Résumé des statistiques */}
                <div className="grid grid-cols-2 gap-6">
                    <Card className="p-8">
                        <h3 className="text-xl font-bold mb-4">Commandes du jour</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">En préparation</span>
                                <span className="text-2xl font-bold text-blue-600">{stats.commandesEnPreparation}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">En attente</span>
                                <span className="text-2xl font-bold text-yellow-600">{stats.commandesEnAttente}</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-8">
                        <h3 className="text-xl font-bold mb-4">État du Stock</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Total articles</span>
                                <span className="text-2xl font-bold text-gray-900">{stats.stockItems}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Alertes</span>
                                <span className="text-2xl font-bold text-red-600">{stats.produitsEnAlerte}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Interface simplifiée pour mobile
    if (isMobileView) {
        const simplifiedActions = [
            {
                title: 'Voir Mon Stock',
                subtitle: `${stockData.length} produits`,
                icon: Package,
                primary: true,
                onClick: () => window.location.href = '/stock'
            },
            {
                title: 'Commandes à Préparer',
                subtitle: `${commandes.filter(c => c.statut === 'confirmee').length} en attente`,
                icon: ShoppingCart,
                badge: commandes.filter(c => c.statut === 'confirmee').length,
                onClick: () => window.location.href = '/commandes'
            },
            {
                title: 'Historique Mouvements',
                subtitle: 'Voir les entrées/sorties',
                icon: Truck,
                onClick: () => window.location.href = '/mouvements'
            }
        ];

        const simplifiedData = {
            stats: [
                { label: 'Produits', value: stockData.length },
                { label: 'Stock bas', value: stats.produitsEnAlerte || 0 },
                { label: 'Commandes', value: commandes.length },
                { label: 'Urgentes', value: commandes.filter(c => c.priorite === 'haute').length }
            ],
            alerts: [
                ...stockData.filter(s => s.quantiteDisponible <= s.seuilAlerte).map(s => ({
                    type: 'warning',
                    message: `Stock bas: ${s.produit.nom} (${s.quantiteDisponible} ${s.produit.unite})`
                })),
                ...commandes.filter(c => c.priorite === 'haute').map(c => ({
                    type: 'error',
                    message: `Commande urgente: ${c.numero} - ${c.client.nom}`
                }))
            ]
        };

        return (
            <div className="min-h-screen bg-gray-100 p-4">
                <SimplifiedInterface 
                    user={user} 
                    data={simplifiedData} 
                    actions={simplifiedActions} 
                />
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${isTabletView ? 'p-6' : ''}`}>
            {/* Header optimisé pour tablette */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className={`${isTabletView ? 'text-3xl' : 'text-2xl'} font-bold mb-2`}>Interface Magasinier</h1>
                        <p className="text-blue-100 text-lg">
                            {magasin?.nom} - {magasin?.ville}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-blue-200 mb-1">Connecté en tant que</p>
                        <p className="font-semibold text-lg">{user?.prenom} {user?.nom}</p>
                    </div>
                </div>
            </div>

            {/* Boutons d'action rapide pour tablette */}
            {isTabletView && (
                <div className="grid grid-cols-2 gap-6 mb-8">
                    <Card 
                        className="p-8 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200"
                        onClick={() => window.location.href = '/stock'}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="p-6 rounded-full bg-blue-500 mb-4">
                                <Scan className="h-12 w-12 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Scanner & Gérer Stock</h3>
                            <p className="text-gray-600">Vérifier et gérer les produits en stock</p>
                        </div>
                    </Card>
                    
                    <Card 
                        className="p-8 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200"
                        onClick={() => window.location.href = '/commandes'}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="p-6 rounded-full bg-green-500 mb-4">
                                <ClipboardList className="h-12 w-12 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Préparer Commandes</h3>
                            <p className="text-gray-600">Gérer les commandes en attente</p>
                        </div>
                    </Card>
                </div>
            )}

            {/* Boutons d'action rapide additionnels pour tablette */}
            {isTabletView && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <Button 
                        size="lg"
                        className="h-20 text-lg font-semibold bg-purple-500 hover:bg-purple-600 text-white"
                        onClick={() => window.location.href = '/livraisons-magasinier'}
                    >
                        <div className="flex flex-col items-center">
                            <Truck className="h-8 w-8 mb-1" />
                            <span>Livraisons</span>
                        </div>
                    </Button>
                    <Button 
                        size="lg"
                        className="h-20 text-lg font-semibold bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => window.location.href = '/mouvements'}
                    >
                        <div className="flex flex-col items-center">
                            <TrendingUp className="h-8 w-8 mb-1" />
                            <span>Mouvements</span>
                        </div>
                    </Button>
                    <Button 
                        size="lg"
                        className="h-20 text-lg font-semibold bg-teal-500 hover:bg-teal-600 text-white"
                        onClick={() => window.location.href = '/planning'}
                    >
                        <div className="flex flex-col items-center">
                            <Calendar className="h-8 w-8 mb-1" />
                            <span>Planning</span>
                        </div>
                    </Button>
                </div>
            )}

            {/* Stats Cards */}
            <div className={`grid ${isTabletView ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-4'} gap-6`}>
                <Card className={`${isTabletView ? 'p-8' : 'p-6'} hover:shadow-md transition-shadow`}>
                    <div className="flex items-center">
                        <div className={`${isTabletView ? 'p-5' : 'p-3'} rounded-full bg-blue-100`}>
                            <Package className={`${isTabletView ? 'h-10 w-10' : 'h-6 w-6'} text-blue-600`} />
                        </div>
                        <div className="ml-4">
                            <p className={`${isTabletView ? 'text-base' : 'text-sm'} font-medium text-gray-600`}>Articles en stock</p>
                            <p className={`${isTabletView ? 'text-3xl' : 'text-2xl'} font-bold text-gray-900`}>{stats.stockItems}</p>
                        </div>
                    </div>
                </Card>

                <Card className={`${isTabletView ? 'p-8' : 'p-6'} hover:shadow-md transition-shadow`}>
                    <div className="flex items-center">
                        <div className={`${isTabletView ? 'p-5' : 'p-3'} rounded-full bg-yellow-100`}>
                            <Clock className={`${isTabletView ? 'h-10 w-10' : 'h-6 w-6'} text-yellow-600`} />
                        </div>
                        <div className="ml-4">
                            <p className={`${isTabletView ? 'text-base' : 'text-sm'} font-medium text-gray-600`}>En attente</p>
                            <p className={`${isTabletView ? 'text-3xl' : 'text-2xl'} font-bold text-gray-900`}>{stats.commandesEnAttente}</p>
                        </div>
                    </div>
                </Card>

                <Card className={`${isTabletView ? 'p-8' : 'p-6'} hover:shadow-md transition-shadow`}>
                    <div className="flex items-center">
                        <div className={`${isTabletView ? 'p-5' : 'p-3'} rounded-full bg-blue-100`}>
                            <ShoppingCart className={`${isTabletView ? 'h-10 w-10' : 'h-6 w-6'} text-blue-600`} />
                        </div>
                        <div className="ml-4">
                            <p className={`${isTabletView ? 'text-base' : 'text-sm'} font-medium text-gray-600`}>En préparation</p>
                            <p className={`${isTabletView ? 'text-3xl' : 'text-2xl'} font-bold text-gray-900`}>{stats.commandesEnPreparation}</p>
                        </div>
                    </div>
                </Card>

                <Card className={`${isTabletView ? 'p-8' : 'p-6'} hover:shadow-md transition-shadow`}>
                    <div className="flex items-center">
                        <div className={`${isTabletView ? 'p-5' : 'p-3'} rounded-full bg-red-100`}>
                            <AlertTriangle className={`${isTabletView ? 'h-10 w-10' : 'h-6 w-6'} text-red-600`} />
                        </div>
                        <div className="ml-4">
                            <p className={`${isTabletView ? 'text-base' : 'text-sm'} font-medium text-gray-600`}>Alertes stock</p>
                            <p className={`${isTabletView ? 'text-3xl' : 'text-2xl'} font-bold text-gray-900`}>{stats.produitsEnAlerte}</p>
                        </div>
                    </div>
                </Card>
            </div>

        </div>
    );
};

export default MagasinierDashboard;