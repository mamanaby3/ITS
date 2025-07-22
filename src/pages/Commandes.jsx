import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import CommandeForm from '../components/commandes/CommandeForm';
import CommandeList from '../components/commandes/CommandeList';
import { useAuth } from '../hooks/useAuth';
import commandesService from '../services/commandes';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  TruckIcon,
  BanknotesIcon,
  CalendarIcon
} from '../components/ui/SimpleIcons';

const Commandes = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    enCours: 0,
    validees: 0,
    livrees: 0,
    annulees: 0,
    montantTotal: 0,
    montantEnCours: 0,
    commandesJour: 0
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [commandeToCancel, setCommandeToCancel] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    dateDebut: '',
    dateFin: '',
    clientId: ''
  });

  useEffect(() => {
    loadCommandes();
  }, [filters]);

  const loadCommandes = async () => {
    try {
      setLoading(true);
      const commandesData = await commandesService.getAllCommandes(filters);
      setCommandes(commandesData);
      calculateStats(commandesData);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (commandesData) => {
    const today = new Date().toISOString().split('T')[0];
    
    const stats = commandesData.reduce((acc, commande) => {
      acc.total++;
      
      switch (commande.status) {
        case 'en_cours':
          acc.enCours++;
          acc.montantEnCours += commande.montantTotal || 0;
          break;
        case 'validee':
          acc.validees++;
          break;
        case 'livree':
          acc.livrees++;
          break;
        case 'annulee':
          acc.annulees++;
          break;
      }
      
      acc.montantTotal += commande.montantTotal || 0;
      
      if (commande.date.startsWith(today)) {
        acc.commandesJour++;
      }
      
      return acc;
    }, {
      total: 0,
      enCours: 0,
      validees: 0,
      livrees: 0,
      annulees: 0,
      montantTotal: 0,
      montantEnCours: 0,
      commandesJour: 0
    });
    
    setStats(stats);
  };

  const handleCreateCommande = () => {
    setSelectedCommande(null);
    setIsFormOpen(true);
  };

  const handleEditCommande = (commande) => {
    if (commande.status !== 'en_cours') {
      toast.error('Seules les commandes en cours peuvent être modifiées');
      return;
    }
    setSelectedCommande(commande);
    setIsFormOpen(true);
  };

  const handleCancelCommande = (commande) => {
    if (['livree', 'annulee'].includes(commande.status)) {
      toast.error('Cette commande ne peut pas être annulée');
      return;
    }
    setCommandeToCancel(commande);
    setIsCancelModalOpen(true);
  };

  const confirmCancel = async () => {
    if (!commandeToCancel) return;

    try {
      await commandesService.updateCommandeStatus(commandeToCancel.id, 'annulee');
      toast.success('Commande annulée avec succès');
      loadCommandes();
    } catch (error) {
      toast.error(error.message || 'Erreur lors de l\'annulation');
    } finally {
      setIsCancelModalOpen(false);
      setCommandeToCancel(null);
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      if (selectedCommande) {
        await commandesService.updateCommande(selectedCommande.id, data);
        toast.success('Commande modifiée avec succès');
      } else {
        await commandesService.createCommande(data);
        toast.success('Commande créée avec succès');
      }
      setIsFormOpen(false);
      loadCommandes();
    } catch (error) {
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleViewDetails = (commande) => {
    navigate(`/commandes/${commande.id}`);
  };

  const handleValidateCommande = async (commande) => {
    try {
      await commandesService.updateCommandeStatus(commande.id, 'validee');
      toast.success('Commande validée avec succès');
      loadCommandes();
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la validation');
    }
  };

  const handleGenerateBL = (commande) => {
    navigate(`/livraisons/nouveau`, { state: { commandeId: commande.id } });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const StatCard = ({ icon: Icon, title, value, color, subtitle }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`mt-2 text-2xl font-bold text-${color}-600`}>
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 bg-${color}-100 rounded-lg`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Commandes</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gérez les commandes clients et leur suivi
          </p>
        </div>
        
        {hasPermission('manage_orders') && (
          <div className="mt-4 sm:mt-0">
            <Button
              variant="primary"
              icon={<PlusIcon />}
              onClick={handleCreateCommande}
            >
              Nouvelle Commande
            </Button>
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ClipboardDocumentListIcon}
          title="Total Commandes"
          value={stats.total}
          color="blue"
          subtitle={`${stats.commandesJour} aujourd'hui`}
        />
        <StatCard
          icon={ClockIcon}
          title="En Cours"
          value={stats.enCours}
          color="yellow"
          subtitle={formatCurrency(stats.montantEnCours)}
        />
        <StatCard
          icon={CheckCircleIcon}
          title="Livrées"
          value={stats.livrees}
          color="green"
          subtitle="Commandes complétées"
        />
        <StatCard
          icon={BanknotesIcon}
          title="Chiffre d'Affaires"
          value={formatCurrency(stats.montantTotal)}
          color="purple"
          subtitle="Total des commandes"
        />
      </div>

      {/* Filtres */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les statuts</option>
              <option value="en_cours">En cours</option>
              <option value="validee">Validée</option>
              <option value="en_preparation">En préparation</option>
              <option value="livree">Livrée</option>
              <option value="annulee">Annulée</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date début
            </label>
            <input
              type="date"
              value={filters.dateDebut}
              onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date fin
            </label>
            <input
              type="date"
              value={filters.dateFin}
              onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={() => setFilters({
                status: '',
                dateDebut: '',
                dateFin: '',
                clientId: ''
              })}
              fullWidth
            >
              Réinitialiser
            </Button>
          </div>
        </div>
      </Card>

      {/* Liste des commandes */}
      <Card>
        <CommandeList
          commandes={commandes}
          loading={loading}
          onEdit={handleEditCommande}
          onCancel={handleCancelCommande}
          onValidate={handleValidateCommande}
          onViewDetails={handleViewDetails}
          onGenerateBL={handleGenerateBL}
          hasPermission={hasPermission}
        />
      </Card>

      {/* Modal formulaire */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedCommande ? 'Modifier la commande' : 'Nouvelle commande'}
        size="xl"
      >
        <CommandeForm
          commande={selectedCommande}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      {/* Modal d'annulation */}
      <Modal.Confirm
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={confirmCancel}
        title="Annuler la commande"
        message={`Êtes-vous sûr de vouloir annuler la commande "${commandeToCancel?.numero}" ? Cette action est irréversible.`}
        confirmText="Annuler la commande"
        confirmVariant="danger"
      />
    </div>
  );
};

export default Commandes;