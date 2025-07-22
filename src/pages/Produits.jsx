import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ProduitForm from '../components/produits/ProduitForm';
import ProduitList from '../components/produits/ProduitList';
import { useAuth } from '../hooks/useAuth';
import { produitsService, stockService } from '../services';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  CubeIcon,
  TagIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon
} from '../components/ui/SimpleIcons';

const Produits = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    categories: 0,
    enStock: 0,
    horsStock: 0
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [produitToDelete, setProduitToDelete] = useState(null);

  useEffect(() => {
    loadProduits();
    loadStats();
  }, []);

  const loadProduits = async () => {
    try {
      setLoading(true);
      const produitsData = await produitsService.getProduitsWithStock();
      setProduits(produitsData);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const stats = await produitsService.getProduitsStats();
      const categories = produitsService.getCategories();
      setStats({
        ...stats,
        categories: categories.length
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const handleCreateProduit = () => {
    setSelectedProduit(null);
    setIsFormOpen(true);
  };

  const handleEditProduit = (produit) => {
    setSelectedProduit(produit);
    setIsFormOpen(true);
  };

  const handleDeleteProduit = (produit) => {
    setProduitToDelete(produit);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!produitToDelete) return;

    try {
      await produitsService.deleteProduit(produitToDelete.id);
      toast.success('Produit supprimé avec succès');
      loadProduits();
      loadStats();
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la suppression');
    } finally {
      setIsDeleteModalOpen(false);
      setProduitToDelete(null);
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      if (selectedProduit) {
        await produitsService.updateProduit(selectedProduit.id, data);
        toast.success('Produit modifié avec succès');
      } else {
        await produitsService.createProduit(data);
        toast.success('Produit créé avec succès');
      }
      setIsFormOpen(false);
      loadProduits();
      loadStats();
    } catch (error) {
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleStockAction = (produit, action) => {
    navigate(`/stock/${action}`, { state: { produitId: produit.id } });
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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Produits</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gérez votre catalogue de produits et leurs informations
          </p>
        </div>
        
        {hasPermission('produits.create') && (
          <div className="mt-4 sm:mt-0">
            <Button
              variant="primary"
              icon={<PlusIcon />}
              onClick={handleCreateProduit}
            >
              Nouveau Produit
            </Button>
          </div>
        )}
      </div>

      {/* Statistiques */}
      <Card.Grid cols={4} gap={4}>
        <StatCard
          icon={CubeIcon}
          title="Total Produits"
          value={stats.total}
          color="blue"
          subtitle="Références actives"
        />
        <StatCard
          icon={TagIcon}
          title="Catégories"
          value={stats.categories}
          color="purple"
          subtitle="Types de produits"
        />
        <StatCard
          icon={ChartBarIcon}
          title="En Stock"
          value={stats.produitsEnStock}
          color="green"
          subtitle="Produits disponibles"
        />
        <StatCard
          icon={ExclamationTriangleIcon}
          title="Hors Stock"
          value={stats.produitsHorsStock}
          color="red"
          subtitle="À réapprovisionner"
        />
      </Card.Grid>

      {/* Liste des produits */}
      <Card>
        <ProduitList
          produits={produits}
          loading={loading}
          onEdit={handleEditProduit}
          onDelete={handleDeleteProduit}
          onStockIn={(produit) => handleStockAction(produit, 'entree')}
          onStockOut={(produit) => handleStockAction(produit, 'sortie')}
          hasPermission={hasPermission}
        />
      </Card>

      {/* Modal formulaire */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedProduit ? 'Modifier le produit' : 'Nouveau produit'}
        size="xl"
      >
        <ProduitForm
          produit={selectedProduit}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal.Confirm
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer le produit"
        message={`Êtes-vous sûr de vouloir supprimer le produit "${produitToDelete?.nom}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        confirmVariant="danger"
      />
    </div>
  );
};

export default Produits;