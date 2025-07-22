import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Package, Truck, Calendar, User, AlertTriangle, CheckCircle } from 'lucide-react';
import apiService from '@/services/api';
import toast from 'react-hot-toast';

const schema = yup.object({
    produit_id: yup.string().required('Produit requis'),
    quantite: yup.number().positive('Quantité doit être positive').required('Quantité requise'),
    type_mouvement: yup.string().required('Type requis'),
    client_id: yup.string().when('type_mouvement', {
        is: 'vente',
        then: yup.string().required('Client requis pour une vente')
    }),
    numero_bon: yup.string().required('Numéro de bon requis'),
    chauffeur_nom: yup.string().required('Nom du chauffeur requis'),
    numero_camion: yup.string().required('Numéro du camion requis'),
    destination: yup.string().required('Destination requise'),
    notes: yup.string()
});

const StockExitModal = ({ open, onClose, onSubmit, defaultProduct, currentStock }) => {
    const [products, setProducts] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stockInfo, setStockInfo] = useState(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            type_mouvement: 'vente',
            quantite: '',
            produit_id: defaultProduct?.id || ''
        }
    });

    const selectedProductId = watch('produit_id');
    const quantite = watch('quantite');
    const typeMovement = watch('type_mouvement');

    useEffect(() => {
        if (open) {
            fetchProducts();
            fetchClients();
            if (defaultProduct) {
                setValue('produit_id', defaultProduct.id.toString());
            }
        }
    }, [open, defaultProduct]);

    useEffect(() => {
        if (selectedProductId && currentStock) {
            const stock = currentStock.find(s => s.produit_id == selectedProductId);
            setStockInfo(stock);
        }
    }, [selectedProductId, currentStock]);

    const fetchProducts = async () => {
        try {
            const response = await apiService.get('/produits');
            setProducts(response.data || []);
        } catch (error) {
            toast.error('Erreur lors du chargement des produits');
        }
    };

    const fetchClients = async () => {
        try {
            const response = await apiService.get('/clients');
            setClients(response.data || []);
        } catch (error) {
            toast.error('Erreur lors du chargement des clients');
        }
    };

    const handleFormSubmit = async (data) => {
        // Vérifier le stock disponible
        if (stockInfo && data.quantite > stockInfo.quantite_actuelle) {
            toast.error('Quantité demandée supérieure au stock disponible');
            return;
        }

        setLoading(true);
        try {
            await onSubmit({
                ...data,
                type: 'sortie',
                date_mouvement: new Date().toISOString()
            });
            reset();
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        reset();
        setStockInfo(null);
        onClose();
    };

    const isStockSufficient = stockInfo && quantite && quantite <= stockInfo.quantite_actuelle;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Package className="w-6 h-6 text-orange-600" />
                        Enregistrer une Sortie de Stock
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                    {/* Type de sortie */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Type de sortie</Label>
                            <Select 
                                value={typeMovement}
                                onValueChange={(value) => setValue('type_mouvement', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner le type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="vente">Vente Client</SelectItem>
                                    <SelectItem value="transfert">Transfert Inter-Magasin</SelectItem>
                                    <SelectItem value="perte">Perte/Casse</SelectItem>
                                    <SelectItem value="ajustement">Ajustement Inventaire</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.type_mouvement && (
                                <p className="text-sm text-red-600 mt-1">{errors.type_mouvement.message}</p>
                            )}
                        </div>

                        <div>
                            <Label>Date et heure</Label>
                            <div className="flex items-center gap-2 mt-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">{new Date().toLocaleString('fr-FR')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Produit et Quantité */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Produit</Label>
                            <Select 
                                value={selectedProductId}
                                onValueChange={(value) => setValue('produit_id', value)}
                                disabled={!!defaultProduct}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un produit" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map(product => (
                                        <SelectItem key={product.id} value={product.id.toString()}>
                                            {product.nom} ({product.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.produit_id && (
                                <p className="text-sm text-red-600 mt-1">{errors.produit_id.message}</p>
                            )}
                        </div>

                        <div>
                            <Label>Quantité</Label>
                            <div className="relative">
                                <Input 
                                    type="number"
                                    step="0.01"
                                    {...register('quantite', { valueAsNumber: true })}
                                    placeholder="0.00"
                                    className={`pr-16 ${quantite && stockInfo && quantite > stockInfo.quantite_actuelle ? 'border-red-500' : ''}`}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                                    {products.find(p => p.id == selectedProductId)?.unite || 'unité'}
                                </span>
                            </div>
                            {errors.quantite && (
                                <p className="text-sm text-red-600 mt-1">{errors.quantite.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Info stock */}
                    {stockInfo && (
                        <Alert className={isStockSufficient ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                            <AlertDescription className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {isStockSufficient ? (
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <AlertTriangle className="w-4 h-4 text-red-600" />
                                    )}
                                    <span className={isStockSufficient ? 'text-green-800' : 'text-red-800'}>
                                        Stock disponible: {stockInfo.quantite_actuelle} {stockInfo.produit?.unite}
                                    </span>
                                </div>
                                {quantite && (
                                    <span className="font-medium">
                                        Reste après sortie: {(stockInfo.quantite_actuelle - quantite).toFixed(2)} {stockInfo.produit?.unite}
                                    </span>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Client (si vente) */}
                    {typeMovement === 'vente' && (
                        <div>
                            <Label>Client</Label>
                            <Select 
                                value={watch('client_id')}
                                onValueChange={(value) => setValue('client_id', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un client" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(client => (
                                        <SelectItem key={client.id} value={client.id.toString()}>
                                            {client.nom} - {client.entreprise}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.client_id && (
                                <p className="text-sm text-red-600 mt-1">{errors.client_id.message}</p>
                            )}
                        </div>
                    )}

                    {/* Informations de livraison */}
                    <div className="space-y-4">
                        <h3 className="font-medium flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            Informations de livraison
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Numéro de bon de sortie</Label>
                                <Input 
                                    {...register('numero_bon')}
                                    placeholder="BS-2024-001"
                                />
                                {errors.numero_bon && (
                                    <p className="text-sm text-red-600 mt-1">{errors.numero_bon.message}</p>
                                )}
                            </div>
                            <div>
                                <Label>Destination</Label>
                                <Input 
                                    {...register('destination')}
                                    placeholder="Lieu de livraison"
                                />
                                {errors.destination && (
                                    <p className="text-sm text-red-600 mt-1">{errors.destination.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Nom du chauffeur</Label>
                                <Input 
                                    {...register('chauffeur_nom')}
                                    placeholder="Nom complet"
                                />
                                {errors.chauffeur_nom && (
                                    <p className="text-sm text-red-600 mt-1">{errors.chauffeur_nom.message}</p>
                                )}
                            </div>
                            <div>
                                <Label>Numéro du camion</Label>
                                <Input 
                                    {...register('numero_camion')}
                                    placeholder="DK-1234-AB"
                                />
                                {errors.numero_camion && (
                                    <p className="text-sm text-red-600 mt-1">{errors.numero_camion.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <Label>Notes / Observations</Label>
                        <Textarea 
                            {...register('notes')}
                            placeholder="Informations complémentaires..."
                            rows={3}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Annuler
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading || (quantite && stockInfo && quantite > stockInfo.quantite_actuelle)}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {loading ? 'Enregistrement...' : 'Enregistrer la sortie'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default StockExitModal;