import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    Truck, 
    Package, 
    Clock, 
    CheckCircle,
    AlertCircle,
    Ship
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import apiService from '@/services/api';
import toast from 'react-hot-toast';

const PendingDispatches = ({ dispatches, onAccept }) => {
    const [selectedDispatch, setSelectedDispatch] = useState(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAcceptDispatch = async () => {
        if (!selectedDispatch) return;

        setLoading(true);
        try {
            await apiService.post(`/dispatches/${selectedDispatch.id}/accept`, {
                notes,
                accepted_at: new Date().toISOString()
            });
            
            toast.success('Dispatch accepté avec succès');
            setShowConfirmDialog(false);
            setSelectedDispatch(null);
            setNotes('');
            onAccept();
        } catch (error) {
            toast.error('Erreur lors de l\'acceptation du dispatch');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getUrgencyBadge = (dispatch) => {
        const hours = Math.floor((new Date() - new Date(dispatch.created_at)) / (1000 * 60 * 60));
        
        if (hours > 48) return <Badge variant="destructive">Urgent</Badge>;
        if (hours > 24) return <Badge variant="warning">En attente</Badge>;
        return <Badge variant="success">Récent</Badge>;
    };

    if (!dispatches || dispatches.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Dispatches en Attente</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            Aucun dispatch en attente. Tous les dispatches ont été traités.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Truck className="w-5 h-5" />
                            Dispatches en Attente de Réception
                        </span>
                        <Badge variant="outline" className="text-lg">
                            {dispatches.length}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert className="mb-4 border-blue-200 bg-blue-50">
                        <AlertCircle className="w-4 h-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                            Vérifiez physiquement la marchandise avant d'accepter le dispatch.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                        {dispatches.map((dispatch) => (
                            <div key={dispatch.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <Ship className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <h4 className="font-semibold">
                                                Navire: {dispatch.navire?.nom}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                N° Dispatch: {dispatch.numero_dispatch}
                                            </p>
                                        </div>
                                    </div>
                                    {getUrgencyBadge(dispatch)}
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <p className="text-sm text-gray-600">Produit</p>
                                        <p className="font-medium">{dispatch.produit?.nom}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Quantité</p>
                                        <p className="font-medium">
                                            {dispatch.quantite} {dispatch.produit?.unite}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Envoyé par</p>
                                        <p className="font-medium">
                                            {dispatch.dispatcher?.prenom} {dispatch.dispatcher?.nom}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Date d'envoi</p>
                                        <p className="font-medium">{formatDate(dispatch.created_at)}</p>
                                    </div>
                                </div>

                                {dispatch.notes && (
                                    <div className="bg-gray-50 rounded p-3 mb-3">
                                        <p className="text-sm text-gray-600">Notes du dispatcher:</p>
                                        <p className="text-sm italic">"{dispatch.notes}"</p>
                                    </div>
                                )}

                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Clock className="w-4 h-4" />
                                        En attente depuis {Math.floor((new Date() - new Date(dispatch.created_at)) / (1000 * 60 * 60))} heures
                                    </div>
                                    <Button 
                                        onClick={() => {
                                            setSelectedDispatch(dispatch);
                                            setShowConfirmDialog(true);
                                        }}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Accepter la réception
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Dialog de confirmation */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmer la réception du dispatch</DialogTitle>
                    </DialogHeader>
                    
                    {selectedDispatch && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-semibold mb-2">Détails du dispatch</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-gray-600">Produit:</span>
                                        <p className="font-medium">{selectedDispatch.produit?.nom}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Quantité:</span>
                                        <p className="font-medium">
                                            {selectedDispatch.quantite} {selectedDispatch.produit?.unite}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Navire:</span>
                                        <p className="font-medium">{selectedDispatch.navire?.nom}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">N° Dispatch:</span>
                                        <p className="font-medium">{selectedDispatch.numero_dispatch}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label>Notes de réception (optionnel)</Label>
                                <Textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="État de la marchandise, observations..."
                                    rows={3}
                                />
                            </div>

                            <Alert>
                                <AlertCircle className="w-4 h-4" />
                                <AlertDescription>
                                    En confirmant, vous attestez avoir vérifié et reçu la marchandise en bon état.
                                    Cette action ajoutera automatiquement la quantité à votre stock.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}

                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setShowConfirmDialog(false);
                                setSelectedDispatch(null);
                                setNotes('');
                            }}
                        >
                            Annuler
                        </Button>
                        <Button 
                            onClick={handleAcceptDispatch}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {loading ? 'Traitement...' : 'Confirmer la réception'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default PendingDispatches;