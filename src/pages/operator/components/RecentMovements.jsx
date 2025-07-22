import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    ArrowDownIcon, 
    ArrowUpIcon, 
    Clock, 
    Package,
    User,
    FileText
} from 'lucide-react';

const RecentMovements = ({ movements }) => {
    const getMovementIcon = (type) => {
        return type === 'entree' ? 
            <ArrowDownIcon className="w-4 h-4 text-green-600" /> : 
            <ArrowUpIcon className="w-4 h-4 text-orange-600" />;
    };

    const getMovementColor = (type) => {
        return type === 'entree' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200';
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const today = new Date();
        const isToday = d.toDateString() === today.toDateString();
        
        if (isToday) {
            return `Aujourd'hui à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        return d.toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'short', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const getTypeLabel = (mouvement) => {
        const typeLabels = {
            'reception_dispatch': 'Réception Dispatch',
            'achat': 'Achat Direct',
            'retour_client': 'Retour Client',
            'vente': 'Vente Client',
            'transfert': 'Transfert',
            'perte': 'Perte/Casse',
            'ajustement': 'Ajustement'
        };
        return typeLabels[mouvement.type_mouvement] || mouvement.type_mouvement;
    };

    if (!movements || movements.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Mouvements Récents</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Aucun mouvement récent</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Mouvements Récents</span>
                    <Badge variant="outline">
                        {movements.length} mouvements
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {movements.map((mouvement) => (
                        <div 
                            key={mouvement.id} 
                            className={`border rounded-lg p-4 ${getMovementColor(mouvement.type)}`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3">
                                    <div className="mt-1">
                                        {getMovementIcon(mouvement.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold">
                                                {mouvement.produit?.nom}
                                            </h4>
                                            <Badge variant="outline" className="text-xs">
                                                {getTypeLabel(mouvement)}
                                            </Badge>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                            <div>
                                                <span className="font-medium">Quantité:</span>{' '}
                                                <span className={mouvement.type === 'entree' ? 'text-green-700' : 'text-orange-700'}>
                                                    {mouvement.type === 'entree' ? '+' : '-'}
                                                    {mouvement.quantite} {mouvement.produit?.unite}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(mouvement.date_mouvement)}
                                            </div>
                                        </div>

                                        {mouvement.numero_bon && (
                                            <div className="flex items-center gap-1 text-sm text-gray-600 mt-2">
                                                <FileText className="w-3 h-3" />
                                                Bon N°: {mouvement.numero_bon}
                                            </div>
                                        )}

                                        {mouvement.client && (
                                            <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                                <User className="w-3 h-3" />
                                                Client: {mouvement.client.nom}
                                            </div>
                                        )}

                                        {mouvement.notes && (
                                            <p className="text-sm text-gray-600 mt-2 italic">
                                                "{mouvement.notes}"
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-xs text-gray-500">
                                        Par {mouvement.utilisateur?.prenom} {mouvement.utilisateur?.nom}
                                    </p>
                                    {mouvement.reference && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Réf: {mouvement.reference}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default RecentMovements;