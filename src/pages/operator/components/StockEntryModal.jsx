import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Package, Truck, Calendar, FileText, AlertCircle } from 'lucide-react';
import apiService from '@/services/api';
import toast from 'react-hot-toast';

const schema = yup.object({
    produit_id: yup.string().required('Produit requis'),
    quantite: yup.number().positive('Quantité doit être positive').required('Quantité requise'),
    type_mouvement: yup.string().required('Type requis'),
    fournisseur: yup.string().when('type_mouvement', {
        is: 'achat',
        then: yup.string().required('Fournisseur requis pour un achat')
    }),
    numero_bon: yup.string(),
    transporteur: yup.string(),
    notes: yup.string()
});

const StockEntryModal = ({ open, onClose, onSubmit, defaultProduct }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

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
            type_mouvement: 'reception_dispatch',
            quantite: '',
            produit_id: defaultProduct?.id || ''
        }
    });

    const typeMovement = watch('type_mouvement');

    useEffect(() => {
        if (open) {
            fetchProducts();
            if (defaultProduct) {
                setValue('produit_id', defaultProduct.id);
            }
        }
    }, [open, defaultProduct]);

    const fetchProducts = async () => {
        try {
            const response = await apiService.get('/produits');
            setProducts(response.data || []);
        } catch (error) {
            toast.error('Erreur lors du chargement des produits');
        }
    };

    const handleFormSubmit = async (data) => {
        setLoading(true);
        try {
            await onSubmit({
                ...data,
                type: 'entree',
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
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Package className="w-6 h-6 text-green-600" />
                        Enregistrer une Entrée de Stock
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                    {/* Type d'entrée */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Type d'entrée</Label>
                            <Select 
                                value={typeMovement}
                                onValueChange={(value) => setValue('type_mouvement', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner le type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="reception_dispatch">Réception Dispatch</SelectItem>
                                    <SelectItem value="achat">Achat Direct</SelectItem>
                                    <SelectItem value="retour_client">Retour Client</SelectItem>
                                    <SelectItem value="transfert">Transfert Inter-Magasin</SelectItem>
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
                                value={watch('produit_id')}
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
                                    className="pr-16"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                                    {products.find(p => p.id == watch('produit_id'))?.unite || 'unité'}
                                </span>
                            </div>
                            {errors.quantite && (
                                <p className="text-sm text-red-600 mt-1">{errors.quantite.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Fournisseur (si achat) */}
                    {typeMovement === 'achat' && (
                        <div>
                            <Label>Fournisseur</Label>
                            <Input 
                                {...register('fournisseur')}
                                placeholder="Nom du fournisseur"
                            />
                            {errors.fournisseur && (
                                <p className="text-sm text-red-600 mt-1">{errors.fournisseur.message}</p>
                            )}
                        </div>
                    )}

                    {/* Informations de transport */}
                    <div className="space-y-4">
                        <h3 className="font-medium flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            Informations de transport
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Numéro de bon</Label>
                                <Input 
                                    {...register('numero_bon')}
                                    placeholder="BL-2024-001"
                                />
                            </div>
                            <div>
                                <Label>Transporteur</Label>
                                <Input 
                                    {...register('transporteur')}
                                    placeholder="Nom du transporteur"
                                />
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

                    {/* Alert info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Rappel important</p>
                            <p>Vérifiez physiquement la marchandise avant d'enregistrer l'entrée. 
                            Toute entrée enregistrée sera automatiquement ajoutée au stock disponible.</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Annuler
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {loading ? 'Enregistrement...' : 'Enregistrer l\'entrée'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default StockEntryModal;