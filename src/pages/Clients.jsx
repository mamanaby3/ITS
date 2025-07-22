import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ClientForm from '../components/clients/ClientForm';
import ClientList from '../components/clients/ClientList';
import { useAuth } from '../hooks/useAuth';
import { clientsService } from '../services';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  UsersIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon
} from '../components/ui/SimpleIcons';

const Clients = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    actifs: 0,
    creditTotal: 0,
    creditUtilise: 0
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const clientsData = await clientsService.getAllClients();
      setClients(clientsData);
      calculateStats(clientsData);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
      toast.error('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (clientsData) => {
    const stats = clientsData.reduce((acc, client) => ({
      total: acc.total + 1,
      actifs: acc.actifs + (client.actif ? 1 : 0),
      creditTotal: acc.creditTotal + (client.creditLimit || 0),
      creditUtilise: acc.creditUtilise + (client.creditUtilise || 0)
    }), { total: 0, actifs: 0, creditTotal: 0, creditUtilise: 0 });
    
    setStats(stats);
  };

  const handleCreateClient = () => {
    setSelectedClient(null);
    setIsFormOpen(true);
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  const handleDeleteClient = (client) => {
    setClientToDelete(client);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;

    try {
      await clientsService.deleteClient(clientToDelete.id);
      toast.success('Client supprimé avec succès');
      loadClients();
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la suppression');
    } finally {
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      if (selectedClient) {
        await clientsService.updateClient(selectedClient.id, data);
        toast.success('Client modifié avec succès');
      } else {
        await clientsService.createClient(data);
        toast.success('Client créé avec succès');
      }
      setIsFormOpen(false);
      loadClients();
    } catch (error) {
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleViewDetails = (client) => {
    navigate(`/clients/${client.id}`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const filteredClients = clients.filter(client => 
    client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.telephone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Clients</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gérez votre portefeuille clients et leurs informations
          </p>
        </div>
        
        {hasPermission('clients.create') && (
          <div className="mt-4 sm:mt-0">
            <Button
              variant="primary"
              icon={<PlusIcon />}
              onClick={handleCreateClient}
            >
              Nouveau Client
            </Button>
          </div>
        )}
      </div>

      {/* Statistiques */}
      <Card.Grid cols={4} gap={4}>
        <StatCard
          icon={UsersIcon}
          title="Total Clients"
          value={stats.total}
          color="blue"
          subtitle="Clients enregistrés"
        />
        <StatCard
          icon={CheckCircleIcon}
          title="Clients Actifs"
          value={stats.actifs}
          color="green"
          subtitle="Clients opérationnels"
        />
        <StatCard
          icon={BanknotesIcon}
          title="Crédit Accordé"
          value={formatCurrency(stats.creditTotal)}
          color="purple"
          subtitle="Limite totale"
        />
        <StatCard
          icon={ExclamationTriangleIcon}
          title="Crédit Utilisé"
          value={formatCurrency(stats.creditUtilise)}
          color="yellow"
          subtitle={`${Math.round((stats.creditUtilise / stats.creditTotal) * 100)}% utilisé`}
        />
      </Card.Grid>

      {/* Barre de recherche */}
      <Card>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher un client (nom, code, email, téléphone)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => setSearchTerm('')}
            disabled={!searchTerm}
          >
            Réinitialiser
          </Button>
        </div>
      </Card>

      {/* Liste des clients */}
      <Card>
        <ClientList
          clients={filteredClients}
          loading={loading}
          onEdit={handleEditClient}
          onDelete={handleDeleteClient}
          onViewDetails={handleViewDetails}
          hasPermission={hasPermission}
        />
      </Card>

      {/* Modal formulaire */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedClient ? 'Modifier le client' : 'Nouveau client'}
        size="xl"
      >
        <ClientForm
          client={selectedClient}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal.Confirm
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer le client"
        message={`Êtes-vous sûr de vouloir supprimer le client "${clientToDelete?.nom}" ? Cette action supprimera également tout l'historique associé.`}
        confirmText="Supprimer"
        confirmVariant="danger"
      />
    </div>
  );
};

export default Clients;
