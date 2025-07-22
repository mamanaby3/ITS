// src/components/stock/StockForm.jsx
import React, { useState, useEffect } from 'react';
import { X, Package, Save, Calendar, MapPin, Hash } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { validateStockMovement } from '../../utils/validators';
import { formatDate } from '../../utils/formatters';
import { useMagasins } from '../../hooks/useMagasins';

const StockForm = ({
    isOpen,
    onClose,
    onSubmit,
    stock = null,
    produits = [],
    emplacements = [],
    mode = 'entree', // 'entree', 'sortie', 'transfert', 'ajustement'
    loading = false
}) => {
    const { magasins } = useMagasins();
    
    const initialFormData = {
        produitId: '',
        quantite: '',
        emplacement: '',
        lot: '',
        dateExpiration: '',
        prixUnitaire: '',
        fournisseur: '',
        motif: '',
        entrepotId: magasins[0]?.id || '',
        nouvelEmplacement: '', // pour transfert
        typeAjustement: 'inventaire' // pour ajustement
    };

    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (stock && mode === 'edit') {
            setFormData({
                ...initialFormData,
                produitId: stock.produitId || '',
                quantite: stock.quantite || '',
                emplacement: stock.emplacement || '',
                lot: stock.lot || '',
                dateExpiration: stock.dateExpiration ? formatDate(stock.dateExpiration, 'yyyy-MM-dd') : '',
                prixUnitaire: stock.prixUnitaire || '',
                entrepotId: stock.entrepotId || magasins[0]?.id || ''
            });
        } else {
            setFormData(initialFormData);
        }
        setErrors({});
    }, [stock, mode, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Effacer l'erreur du champ modifi�
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const validationResult = validateStockMovement({
            ...formData,
            type: mode
        });

        if (!validationResult.isValid) {
            setErrors(validationResult.errors);
            return false;
        }

        // Validations suppl�mentaires selon le mode
        const newErrors = {};

        if (mode === 'transfert' && !formData.nouvelEmplacement) {
            newErrors.nouvelEmplacement = 'Nouvel emplacement requis';
        }

        if (mode === 'sortie' && !formData.motif) {
            newErrors.motif = 'Motif de sortie requis';
        }

        if (mode === 'ajustement' && !formData.motif) {
            newErrors.motif = 'Motif d\'ajustement requis';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return false;
        }

        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!validate()) return;

        onSubmit({
            ...formData,
            produitId: parseInt(formData.produitId),
            quantite: parseFloat(formData.quantite),
            prixUnitaire: formData.prixUnitaire ? parseFloat(formData.prixUnitaire) : undefined
        });
    };

    const getTitle = () => {
        switch (mode) {
            case 'entree':
                return 'Entr�e de stock';
            case 'sortie':
                return 'Sortie de stock';
            case 'transfert':
                return 'Transfert de stock';
            case 'ajustement':
                return 'Ajustement de stock';
            case 'edit':
                return 'Modifier le stock';
            default:
                return 'Mouvement de stock';
        }
    };

    const selectedProduit = produits.find(p => p.id === parseInt(formData.produitId));

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <div className="p-6">
                {/* En-t�te */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                        <Package className="h-5 w-5" />
                        <span>{getTitle()}</span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Produit */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Produit *
                        </label>
                        <select
                            name="produitId"
                            value={formData.produitId}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.produitId ? 'border-red-300' : 'border-gray-300'
                            }`}
                            disabled={mode === 'edit'}
                        >
                            <option value="">S�lectionner un produit</option>
                            {produits.map(produit => (
                                <option key={produit.id} value={produit.id}>
                                    {produit.nom} - {produit.reference}
                                </option>
                            ))}
                        </select>
                        {errors.produitId && (
                            <p className="mt-1 text-sm text-red-600">{errors.produitId}</p>
                        )}
                    </div>

                    {/* Quantit� et Unit� */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantit� *
                            </label>
                            <Input
                                type="number"
                                name="quantite"
                                value={formData.quantite}
                                onChange={handleChange}
                                placeholder="0"
                                min="0"
                                step="0.01"
                                error={errors.quantite}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unit�
                            </label>
                            <Input
                                value={selectedProduit?.unite || '-'}
                                disabled
                                className="bg-gray-50"
                            />
                        </div>
                    </div>

                    {/* Entrep�t (pour entr�e) */}
                    {mode === 'entree' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Entrep�t *
                            </label>
                            <select
                                name="entrepotId"
                                value={formData.entrepotId}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    errors.entrepotId ? 'border-red-300' : 'border-gray-300'
                                }`}
                            >
                                {magasins.map(entrepot => (
                                    <option key={entrepot.id} value={entrepot.id}>
                                        {entrepot.nom} - {entrepot.ville}
                                    </option>
                                ))}
                            </select>
                            {errors.entrepotId && (
                                <p className="mt-1 text-sm text-red-600">{errors.entrepotId}</p>
                            )}
                        </div>
                    )}

                    {/* Emplacement */}
                    {(mode === 'entree' || mode === 'transfert') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span>{mode === 'transfert' ? 'Emplacement actuel' : 'Emplacement'} *</span>
                            </label>
                            <select
                                name="emplacement"
                                value={formData.emplacement}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    errors.emplacement ? 'border-red-300' : 'border-gray-300'
                                }`}
                            >
                                <option value="">S�lectionner un emplacement</option>
                                {emplacements.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.id} - Zone {emp.zone}
                                    </option>
                                ))}
                            </select>
                            {errors.emplacement && (
                                <p className="mt-1 text-sm text-red-600">{errors.emplacement}</p>
                            )}
                        </div>
                    )}

                    {/* Nouvel emplacement (pour transfert) */}
                    {mode === 'transfert' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span>Nouvel emplacement *</span>
                            </label>
                            <select
                                name="nouvelEmplacement"
                                value={formData.nouvelEmplacement}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    errors.nouvelEmplacement ? 'border-red-300' : 'border-gray-300'
                                }`}
                            >
                                <option value="">S�lectionner un emplacement</option>
                                {emplacements
                                    .filter(emp => emp.id !== formData.emplacement)
                                    .map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.id} - Zone {emp.zone}
                                        </option>
                                    ))}
                            </select>
                            {errors.nouvelEmplacement && (
                                <p className="mt-1 text-sm text-red-600">{errors.nouvelEmplacement}</p>
                            )}
                        </div>
                    )}

                    {/* Lot et date d'expiration (pour entr�e) */}
                    {mode === 'entree' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-1">
                                    <Hash className="h-4 w-4" />
                                    <span>Num�ro de lot</span>
                                </label>
                                <Input
                                    type="text"
                                    name="lot"
                                    value={formData.lot}
                                    onChange={handleChange}
                                    placeholder="LOT-XXXXX"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>Date d'expiration</span>
                                </label>
                                <Input
                                    type="date"
                                    name="dateExpiration"
                                    value={formData.dateExpiration}
                                    onChange={handleChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    error={errors.dateExpiration}
                                />
                            </div>
                        </div>
                    )}

                    {/* Prix unitaire et fournisseur (pour entr�e) */}
                    {mode === 'entree' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Prix unitaire
                                </label>
                                <Input
                                    type="number"
                                    name="prixUnitaire"
                                    value={formData.prixUnitaire}
                                    onChange={handleChange}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fournisseur
                                </label>
                                <Input
                                    type="text"
                                    name="fournisseur"
                                    value={formData.fournisseur}
                                    onChange={handleChange}
                                    placeholder="Nom du fournisseur"
                                />
                            </div>
                        </div>
                    )}

                    {/* Motif (pour sortie et ajustement) */}
                    {(mode === 'sortie' || mode === 'ajustement') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Motif *
                            </label>
                            <textarea
                                name="motif"
                                value={formData.motif}
                                onChange={handleChange}
                                rows={3}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    errors.motif ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder={mode === 'sortie' ? 'Motif de la sortie...' : 'Motif de l\'ajustement...'}
                            />
                            {errors.motif && (
                                <p className="mt-1 text-sm text-red-600">{errors.motif}</p>
                            )}
                        </div>
                    )}

                    {/* Type d'ajustement */}
                    {mode === 'ajustement' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type d'ajustement
                            </label>
                            <select
                                name="typeAjustement"
                                value={formData.typeAjustement}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="inventaire">Inventaire</option>
                                <option value="perte">Perte</option>
                                <option value="deterioration">D�t�rioration</option>
                                <option value="correction">Correction d'erreur</option>
                            </select>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-6 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            loading={loading}
                            className="flex items-center space-x-2"
                        >
                            <Save className="h-4 w-4" />
                            <span>{mode === 'edit' ? 'Enregistrer' : 'Valider'}</span>
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default StockForm;