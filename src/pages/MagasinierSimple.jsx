import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, TrendingUp, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { formatNumber } from '../utils/formatters';
import dashboardMagasinierService from '../services/dashboardMagasinier';

const MagasinierSimple = () => {
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadDashboardData();
        // Actualiser toutes les 30 secondes
        const interval = setInterval(loadDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadDashboardData = async () => {
        try {
            setError(null);
            console.log('Chargement du dashboard magasinier...');
            console.log('User:', user);
            console.log('Magasin ID:', user?.magasin_id);
            
            const response = await dashboardMagasinierService.getDashboardData();
            console.log('Réponse API:', response);
            
            // L'intercepteur axios retourne déjà response.data du backend
            // qui contient directement {stats, alertes, dernieresSorties, mouvementsJour}
            if (response && response.success && response.data) {
                setDashboardData(response.data);
            } else if (response && (response.stats || response.alertes || response.dernieresSorties)) {
                setDashboardData(response);
            } else {
                throw new Error('Erreur lors du chargement des données');
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Erreur complète:', error);
            let errorMessage = 'Erreur lors du chargement des données';
            
            if (error.status === 400 || error.message?.includes('magasin')) {
                errorMessage = 'Aucun magasin associé à votre compte. Contactez votre administrateur.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            setError(errorMessage);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        const isUserMagasinError = error.includes('magasin');
        
        return (
            <div className="min-h-screen bg-gray-50 p-4 md:p-6">
                <Card className="bg-red-50 border-red-200">
                    <div className="p-6 text-center">
                        <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-red-900 mb-2">
                            {isUserMagasinError ? 'Configuration manquante' : 'Erreur de chargement'}
                        </h3>
                        <p className="text-red-700">{error}</p>
                        
                        {isUserMagasinError ? (
                            <div className="mt-6 space-y-4">
                                <p className="text-sm text-gray-600">
                                    En attendant, vous pouvez accéder aux fonctions de base :
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Button
                                        onClick={() => window.location.href = '/saisie-simple'}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        Saisie simple
                                    </Button>
                                    <Button
                                        onClick={() => window.location.href = '/tableau-stock'}
                                        variant="outline"
                                    >
                                        Tableau de stock
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button 
                                onClick={loadDashboardData} 
                                className="mt-4"
                                variant="outline"
                            >
                                Réessayer
                            </Button>
                        )}
                    </div>
                </Card>
            </div>
        );
    }

    const { stats, alertes, dernieresSorties } = dashboardData || {};

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Bonjour {user?.prenom} 👋
                </h1>
                <p className="text-gray-600">
                    Voici l'état de votre stock aujourd'hui
                </p>
            </div>

            {/* Alertes importantes */}
            {alertes && alertes.length > 0 && (
                <Card className="mb-6 bg-red-50 border-red-200">
                    <div className="p-4">
                        <div className="flex items-start">
                            <AlertTriangle className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-red-900 mb-2">
                                    ⚠️ Attention: Stock faible!
                                </h3>
                                <div className="space-y-2">
                                    {alertes.slice(0, 3).map((alerte) => (
                                        <div key={alerte.id} className="text-red-700">
                                            <span className="font-medium">{alerte.produit_nom}</span>: 
                                            <span className="ml-2 font-bold">
                                                {formatNumber(alerte.quantite_disponible)} {alerte.unite}
                                            </span>
                                            <span className="text-sm ml-2">
                                                (Seuil: {formatNumber(alerte.seuil_alerte || 50)} {alerte.unite})
                                            </span>
                                        </div>
                                    ))}
                                    {alertes.length > 3 && (
                                        <p className="text-sm text-red-600 italic">
                                            Et {alertes.length - 3} autres produits...
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Actions rapides */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Button
                    size="lg"
                    className="h-24 bg-red-600 hover:bg-red-700 text-white flex flex-col items-center justify-center space-y-2"
                    onClick={() => window.location.href = '/saisie-sorties'}
                >
                    <ArrowUp className="h-8 w-8" />
                    <span className="text-lg font-semibold">Enregistrer une sortie</span>
                </Button>

                <Button
                    size="lg"
                    className="h-24 bg-blue-600 hover:bg-blue-700 text-white flex flex-col items-center justify-center space-y-2"
                    onClick={() => window.location.href = '/stock-simple'}
                >
                    <Package className="h-8 w-8" />
                    <span className="text-lg font-semibold">Voir mon stock</span>
                </Button>
            </div>

            {/* Statistiques */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card className="p-4 text-center">
                        <p className="text-sm text-gray-600 mb-1">Total produits</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalProduits || 0}</p>
                    </Card>

                    <Card className="p-4 text-center">
                        <p className="text-sm text-gray-600 mb-1">En alerte</p>
                        <p className="text-2xl font-bold text-red-600">{stats.produitsEnAlerte || 0}</p>
                    </Card>

                    <Card className="p-4 text-center">
                        <p className="text-sm text-gray-600 mb-1">Sorties du jour</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.sortiesJour || 0}</p>
                        {stats.tonnageSorties > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                                {formatNumber(stats.tonnageSorties)} tonnes
                            </p>
                        )}
                    </Card>

                    <Card className="p-4 text-center">
                        <p className="text-sm text-gray-600 mb-1">Dernière sortie</p>
                        <p className="text-lg font-semibold text-gray-900">
                            {stats.derniereSortie || 'Aucune'}
                        </p>
                    </Card>
                </div>
            )}

            {/* Résumé du tonnage */}
            {stats && stats.tonnageTotal > 0 && (
                <Card className="mb-8">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Résumé du tonnage
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Stock total</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatNumber(stats.tonnageTotal)} tonnes
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Entrées aujourd'hui</p>
                                <p className="text-xl font-semibold text-green-600">
                                    <ArrowDown className="inline h-5 w-5 mr-1" />
                                    {formatNumber(stats.tonnageEntrees || 0)} tonnes
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Sorties aujourd'hui</p>
                                <p className="text-xl font-semibold text-blue-600">
                                    <ArrowUp className="inline h-5 w-5 mr-1" />
                                    {formatNumber(stats.tonnageSorties || 0)} tonnes
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Dernières sorties */}
            {dernieresSorties && dernieresSorties.length > 0 && (
                <Card className="mb-8">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Dernières sorties du jour
                        </h3>
                        <div className="space-y-2">
                            {dernieresSorties.map((sortie) => (
                                <div key={sortie.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                    <div>
                                        <p className="font-medium text-gray-900">{sortie.produit_nom}</p>
                                        <p className="text-sm text-gray-600">
                                            {sortie.client_nom || 'Client non spécifié'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">
                                            {formatNumber(sortie.quantite)} {sortie.unite}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(sortie.date_mouvement).toLocaleTimeString('fr-FR', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            )}

            {/* Conseil du jour */}
            <Card className="bg-blue-50 border-blue-200">
                <div className="p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">💡 Conseil du jour</h3>
                    <p className="text-blue-800">
                        N'oubliez pas de vérifier régulièrement votre stock et d'enregistrer 
                        toutes les entrées et sorties dès qu'elles se produisent pour maintenir 
                        un inventaire précis.
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default MagasinierSimple;