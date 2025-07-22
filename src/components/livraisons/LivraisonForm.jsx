import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { PlusIcon, TrashIcon, TruckIcon } from '../ui/SimpleIcons';
import { formatDate } from '../../utils/formatters';
import clientService from '../../services/clients';
import commandeService from '../../services/commandes';
import produitService from '../../services/produits';

// Schéma de validation
const schema = yup.object({
  commandeId: yup.string().required('La commande est requise'),
  clientId: yup.string().required('Le client est requis'),
  date: yup.date().required('La date est requise'),
  transporteur: yup.string().required('Le transporteur est requis'),
  vehicule: yup.string(),
  chauffeur: yup.string(),
  produits: yup.array().of(
    yup.object({
      produitId: yup.string().required('Le produit est requis'),
      quantiteLivree: yup.number()
        .required('La quantité est requise')
        .positive('La quantité doit être positive')
        .test('max-quantity', 'Quantité supérieure à la commande', function(value) {
          const { quantiteCommandee } = this.parent;
          return !quantiteCommandee || value <= quantiteCommandee;
        })
    })
  ).min(1, 'Au moins un produit est requis'),
  observations: yup.string()
});

const LivraisonForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  livraison = null,
  commande = null 
}) => {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [produits, setProduits] = useState([]);
  const [selectedCommande, setSelectedCommande] = useState(null);

  const isEdit = !!livraison;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      commandeId: livraison?.commande?.id || commande?.id || '',
      clientId: livraison?.client?.id || commande?.client?.id || '',
      date: livraison?.date ? formatDate(livraison.date, 'YYYY-MM-DD') : formatDate(new Date(), 'YYYY-MM-DD'),
      transporteur: livraison?.transporteur || '',
      vehicule: livraison?.vehicule || '',
      chauffeur: livraison?.chauffeur || '',
      produits: livraison?.produits || commande?.produits?.map(p => ({
        produitId: p.produit.id,
        produit: p.produit,
        quantiteCommandee: p.quantite,
        quantiteLivree: p.quantite
      })) || [],
      observations: livraison?.observations || ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'produits'
  });

  const watchCommandeId = watch('commandeId');
  const watchClientId = watch('clientId');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (watchCommandeId) {
      loadCommandeDetails(watchCommandeId);
    }
  }, [watchCommandeId]);

  const loadData = async () => {
    try {
      const [clientsData, commandesData, produitsData] = await Promise.all([
        clientService.getClients(),
        commandeService.getCommandes({ statut: 'confirmee' }),
        produitService.getProduits()
      ]);
      
      setClients(clientsData);
      setCommandes(commandesData);
      setProduits(produitsData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast.error('Erreur lors du chargement des données');
    }
  };

  const loadCommandeDetails = async (commandeId) => {
    try {
      const commande = await commandeService.getCommandeById(commandeId);
      setSelectedCommande(commande);
      
      // Mettre à jour le client
      setValue('clientId', commande.client.id);
      
      // Mettre à jour les produits si c'est une nouvelle livraison
      if (!isEdit) {
        setValue('produits', commande.produits.map(p => ({
          produitId: p.produit.id,
          produit: p.produit,
          quantiteCommandee: p.quantite,
          quantiteLivree: p.quantite
        })));
      }
    } catch (error) {
      console.error('Erreur chargement commande:', error);
      toast.error('Erreur lors du chargement de la commande');
    }
  };

  const onFormSubmit = async (data) => {
    try {
      setLoading(true);
      
      const livraisonData = {
        ...data,
        numero: livraison?.numero || `BL-${Date.now()}`,
        statut: 'en_preparation',
        produits: data.produits.map(p => ({
          produitId: p.produitId,
          quantiteCommandee: p.quantiteCommandee,
          quantiteLivree: p.quantiteLivree
        }))
      };

      await onSubmit(livraisonData);
      toast.success(isEdit ? 'Livraison modifiée avec succès' : 'Livraison créée avec succès');
      reset();
      onClose();
    } catch (error) {
      console.error('Erreur soumission:', error);
      toast.error(error.message || 'Erreur lors de la soumission');
    } finally {
      setLoading(false);
    }
  };

  const addProduit = () => {
    append({
      produitId: '',
      quantiteCommandee: 0,
      quantiteLivree: 0
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <TruckIcon className="h-6 w-6 mr-2 text-blue-600" />
            {isEdit ? 'Modifier la livraison' : 'Nouvelle livraison'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Commande */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commande *
            </label>
            <select
              {...register('commandeId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={isEdit || !!commande}
            >
              <option value="">Sélectionner une commande</option>
              {commandes.map(cmd => (
                <option key={cmd.id} value={cmd.id}>
                  {cmd.numero} - {cmd.client.nom}
                </option>
              ))}
            </select>
            {errors.commandeId && (
              <p className="mt-1 text-sm text-red-600">{errors.commandeId.message}</p>
            )}
          </div>

          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client *
            </label>
            <select
              {...register('clientId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={true}
            >
              <option value="">Sélectionner un client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.nom}
                </option>
              ))}
            </select>
            {errors.clientId && (
              <p className="mt-1 text-sm text-red-600">{errors.clientId.message}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de livraison *
            </label>
            <Input
              type="date"
              {...register('date')}
              error={errors.date?.message}
            />
          </div>

          {/* Transporteur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transporteur *
            </label>
            <Input
              {...register('transporteur')}
              placeholder="Nom du transporteur"
              error={errors.transporteur?.message}
            />
          </div>

          {/* Véhicule */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Véhicule
            </label>
            <Input
              {...register('vehicule')}
              placeholder="Immatriculation ou type"
              error={errors.vehicule?.message}
            />
          </div>

          {/* Chauffeur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chauffeur
            </label>
            <Input
              {...register('chauffeur')}
              placeholder="Nom du chauffeur"
              error={errors.chauffeur?.message}
            />
          </div>
        </div>

        {/* Produits */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Produits à livrer</h3>
            {!watchCommandeId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addProduit}
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <select
                    {...register(`produits.${index}.produitId`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={!!watchCommandeId}
                  >
                    <option value="">Sélectionner un produit</option>
                    {produits.map(produit => (
                      <option key={produit.id} value={produit.id}>
                        {produit.nom} - {produit.reference}
                      </option>
                    ))}
                  </select>
                  {errors.produits?.[index]?.produitId && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.produits[index].produitId.message}
                    </p>
                  )}
                </div>

                <div className="w-32">
                  <Input
                    type="number"
                    {...register(`produits.${index}.quantiteCommandee`)}
                    placeholder="Qté cmd"
                    disabled
                  />
                </div>

                <div className="w-32">
                  <Input
                    type="number"
                    {...register(`produits.${index}.quantiteLivree`)}
                    placeholder="Qté livrée"
                    error={errors.produits?.[index]?.quantiteLivree?.message}
                  />
                </div>

                {!watchCommandeId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {errors.produits && (
            <p className="mt-2 text-sm text-red-600">{errors.produits.message}</p>
          )}
        </div>

        {/* Observations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observations
          </label>
          <textarea
            {...register('observations')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Remarques ou instructions spéciales..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
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
            variant="primary"
            loading={loading}
          >
            {isEdit ? 'Modifier' : 'Créer la livraison'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default LivraisonForm;