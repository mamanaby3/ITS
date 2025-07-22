import React, { useState, useEffect } from 'react';
import { Package, Save, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import produitService from '../services/produits';
import stockService from '../services/stock';
import { toast } from 'react-hot-toast';

const SaisieSimple = () => {
    const navigate = useNavigate();
    const { getCurrentMagasin } = useAuth();
    const [produits, setProduits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [entries, setEntries] = useState([{
        produit_id: '',
        quantite: '',
        numero_lot: '',
        date_peremption: ''
    }]);

    useEffect(() => {
        loadProduits();
    }, []);

    const loadProduits = async () => {
        try {
            const data = await produitService.getAll();
            setProduits(data);
        } catch (error) {
            console.error('Erreur chargement produits:', error);
            toast.error('Erreur lors du chargement des produits');
        }
    };

    const addEntry = () => {
        setEntries([...entries, {
            produit_id: '',
            quantite: '',
            numero_lot: '',
            date_peremption: ''
        }]);
    };

    const removeEntry = (index) => {
        if (entries.length > 1) {
            setEntries(entries.filter((_, i) => i !== index));
        }
    };

    const updateEntry = (index, field, value) => {
        const newEntries = [...entries];
        newEntries[index][field] = value;
        setEntries(newEntries);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        const validEntries = entries.filter(entry => 
            entry.produit_id && entry.quantite && parseFloat(entry.quantite) > 0
        );

        if (validEntries.length === 0) {
            toast.error('Veuillez remplir au moins une entrée complète');
            return;
        }

        setLoading(true);
        try {
            const magasinId = getCurrentMagasin();
            
            // Enregistrer chaque entrée
            for (const entry of validEntries) {
                await stockService.ajouterEntree({
                    magasin_id: magasinId,
                    produit_id: entry.produit_id,
                    quantite: parseFloat(entry.quantite),
                    type_mouvement: 'entree',
                    reference: `ENT-${Date.now()}`,
                    numero_lot: entry.numero_lot,
                    date_peremption: entry.date_peremption,
                    notes: 'Entrée via interface simplifiée'
                });
            }

            toast.success(`${validEntries.length} entrée(s) enregistrée(s) avec succès!`);
            
            // Réinitialiser le formulaire
            setEntries([{
                produit_id: '',
                quantite: '',
                numero_lot: '',
                date_peremption: ''
            }]);
            
            // Rediriger vers le tableau de bord après 2 secondes
            setTimeout(() => {
                navigate('/magasinier-simple');
            }, 2000);
            
        } catch (error) {
            console.error('Erreur enregistrement:', error);
            toast.error('Erreur lors de l\'enregistrement des entrées');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* Header */}
            <div className="mb-6">
                <Button
                    variant="outline"
                    size="sm"
                    className="mb-4"
                    onClick={() => navigate('/magasinier-simple')}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                </Button>
                
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Enregistrer des entrées
                </h1>
                <p className="text-gray-600">
                    Saisissez les produits reçus dans votre magasin
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="p-6">
                    <div className="space-y-4">
                        {entries.map((entry, index) => (
                            <div key={index} className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-gray-700">
                                        Entrée #{index + 1}
                                    </h3>
                                    {entries.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeEntry(index)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Produit *
                                        </label>
                                        <select
                                            value={entry.produit_id}
                                            onChange={(e) => updateEntry(index, 'produit_id', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Sélectionner un produit</option>
                                            {produits.map(produit => (
                                                <option key={produit.id} value={produit.id}>
                                                    {produit.nom} ({produit.unite})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Quantité *
                                        </label>
                                        <Input
                                            type="number"
                                            value={entry.quantite}
                                            onChange={(e) => updateEntry(index, 'quantite', e.target.value)}
                                            placeholder="0"
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Numéro de lot
                                        </label>
                                        <Input
                                            type="text"
                                            value={entry.numero_lot}
                                            onChange={(e) => updateEntry(index, 'numero_lot', e.target.value)}
                                            placeholder="Ex: LOT-2024-001"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Date de péremption
                                        </label>
                                        <Input
                                            type="date"
                                            value={entry.date_peremption}
                                            onChange={(e) => updateEntry(index, 'date_peremption', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <Button
                            type="button"
                            variant="outline"
                            onClick={addEntry}
                            className="w-full"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter un autre produit
                        </Button>
                    </div>

                    <div className="mt-6 flex gap-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Enregistrement...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Enregistrer les entrées
                                </>
                            )}
                        </Button>
                        
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/magasinier-simple')}
                            disabled={loading}
                        >
                            Annuler
                        </Button>
                    </div>
                </Card>
            </form>

            {/* Instructions */}
            <Card className="mt-6 bg-blue-50 border-blue-200">
                <div className="p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">📝 Instructions</h3>
                    <ul className="text-blue-800 space-y-1 text-sm">
                        <li>• Les champs marqués d'un * sont obligatoires</li>
                        <li>• Vous pouvez enregistrer plusieurs produits en une seule fois</li>
                        <li>• Le numéro de lot et la date de péremption sont optionnels mais recommandés</li>
                        <li>• Vérifiez bien les quantités avant de valider</li>
                    </ul>
                </div>
            </Card>
        </div>
    );
};

export default SaisieSimple;