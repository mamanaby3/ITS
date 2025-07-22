import React, { useState, useMemo } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Loading from '../ui/Loading';
import Input from '../ui/Input';
import { 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  PrinterIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  ClockIcon,
  TruckIcon
} from '../ui/SimpleIcons';

const CommandeList = ({ 
  commandes = [], 
  loading = false, 
  onEdit, 
  onDelete, 
  onViewDetails,
  onValidate,
  onCancel,
  onPrint,
  hasPermission 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [sortBy, setSortBy] = useState('dateCommande');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  // Obtenir la période de dates basée sur la sélection
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (selectedPeriod) {
      case 'today':
        return { start: today, end: now };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - 7);
        return { start: weekStart, end: now };
      case 'month':
        const monthStart = new Date(today);
        monthStart.setMonth(monthStart.getMonth() - 1);
        return { start: monthStart, end: now };
      default:
        return null;
    }
  };

  // Filtrer et trier les commandes
  const filteredAndSortedCommandes = useMemo(() => {
    let filtered = [...commandes];

    // Recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(commande =>
        commande.numero.toLowerCase().includes(term) ||
        commande.client.nom.toLowerCase().includes(term) ||
        commande.client.contact.toLowerCase().includes(term)
      );
    }

    // Filtre par statut
    if (filterStatus) {
      filtered = filtered.filter(commande => commande.statut === filterStatus);
    }

    // Filtre par client
    if (filterClient) {
      filtered = filtered.filter(commande => 
        commande.client.nom.toLowerCase().includes(filterClient.toLowerCase())
      );
    }

    // Filtre par période
    const dateRange = getDateRange();
    if (dateRange) {
      filtered = filtered.filter(commande => {
        const commandeDate = new Date(commande.dateCommande);
        return commandeDate >= dateRange.start && commandeDate <= dateRange.end;
      });
    }

    // Tri
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'client') {
        aVal = a.client.nom;
        bVal = b.client.nom;
      }

      if (sortBy === 'dateCommande' || sortBy === 'dateLivraison') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [commandes, searchTerm, filterStatus, filterClient, sortBy, sortOrder, selectedPeriod]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getStatusBadge = (statut) => {
    const statusConfig = {
      brouillon: { variant: 'default', label: 'Brouillon' },
      validee: { variant: 'info', label: 'Validée' },
      'en-preparation': { variant: 'warning', label: 'En préparation' },
      livree: { variant: 'success', label: 'Livrée' },
      facturee: { variant: 'purple', label: 'Facturée' },
      annulee: { variant: 'danger', label: 'Annulée' }
    };

    const config = statusConfig[statut] || statusConfig.brouillon;
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
  };

  const getClientTypeBadge = (type) => {
    const typeConfig = {
      particulier: { variant: 'default', label: 'Particulier' },
      entreprise: { variant: 'primary', label: 'Entreprise' },
      administration: { variant: 'purple', label: 'Administration' }
    };

    const config = typeConfig[type] || typeConfig.particulier;
    return <Badge variant={config.variant} size="xs">{config.label}</Badge>;
  };

  const canEdit = (commande) => {
    return commande.statut === 'brouillon' && hasPermission('manage_orders');
  };

  const canValidate = (commande) => {
    return commande.statut === 'brouillon' && hasPermission('validate_orders');
  };

  const canCancel = (commande) => {
    return ['brouillon', 'validee'].includes(commande.statut) && hasPermission('manage_orders');
  };

  if (loading) {
    return <Loading.List rows={5} />;
  }

  if (commandes.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commande</h3>
          <p className="text-gray-500">Commencez par créer votre première commande.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtre par statut */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous les statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="validee">Validée</option>
              <option value="en-preparation">En préparation</option>
              <option value="livree">Livrée</option>
              <option value="facturee">Facturée</option>
              <option value="annulee">Annulée</option>
            </select>

            {/* Filtre par client */}
            <input
              type="text"
              placeholder="Filtrer par client..."
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            {/* Filtre par période */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Toutes les périodes</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {filteredAndSortedCommandes.length} commande{filteredAndSortedCommandes.length > 1 ? 's' : ''} trouvée{filteredAndSortedCommandes.length > 1 ? 's' : ''}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('');
                setFilterClient('');
                setSelectedPeriod('all');
              }}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        </div>
      </Card>

      {/* Liste des commandes */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('numero')}
              >
                Numéro
                {sortBy === 'numero' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '‘' : '“'}</span>
                )}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('dateCommande')}
              >
                Date
                {sortBy === 'dateCommande' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '‘' : '“'}</span>
                )}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('client')}
              >
                Client
                {sortBy === 'client' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '‘' : '“'}</span>
                )}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Articles
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('montantTotal')}
              >
                Montant
                {sortBy === 'montantTotal' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '‘' : '“'}</span>
                )}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Livraison
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedCommandes.map((commande) => (
              <tr key={commande.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{commande.numero}</div>
                  <div className="text-xs text-gray-500">
                    <ClockIcon className="inline w-3 h-3 mr-1" />
                    {formatTime(commande.dateCommande)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    <CalendarIcon className="inline w-4 h-4 mr-1 text-gray-400" />
                    {formatDate(commande.dateCommande)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{commande.client.nom}</div>
                    <div className="text-xs text-gray-500">
                      {commande.client.contact} {getClientTypeBadge(commande.client.type)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {commande.articles.length} article{commande.articles.length > 1 ? 's' : ''}
                  </div>
                  <div className="text-xs text-gray-500">
                    {commande.articles.reduce((sum, article) => sum + article.quantite, 0)} unités
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(commande.montantTotal)}
                  </div>
                  {commande.remise > 0 && (
                    <div className="text-xs text-gray-500">
                      Remise: {formatCurrency(commande.remise)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(commande.statut)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {commande.dateLivraison ? (
                    <div className="text-sm">
                      <div className="flex items-center text-gray-900">
                        <TruckIcon className="w-4 h-4 mr-1 text-gray-400" />
                        {formatDate(commande.dateLivraison)}
                      </div>
                      {commande.adresseLivraison && (
                        <div className="text-xs text-gray-500 mt-1">
                          {commande.adresseLivraison.split(',')[0]}...
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Non planifiée</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="xs"
                      variant="ghost"
                      icon={<EyeIcon />}
                      onClick={() => onViewDetails(commande)}
                      title="Voir détails"
                    />
                    
                    {canEdit(commande) && (
                      <Button
                        size="xs"
                        variant="ghost"
                        icon={<PencilIcon />}
                        onClick={() => onEdit(commande)}
                        title="Modifier"
                      />
                    )}

                    {canValidate(commande) && (
                      <Button
                        size="xs"
                        variant="ghost"
                        icon={<CheckIcon />}
                        onClick={() => onValidate(commande)}
                        title="Valider"
                      />
                    )}

                    {commande.statut !== 'annulee' && (
                      <Button
                        size="xs"
                        variant="ghost"
                        icon={<PrinterIcon />}
                        onClick={() => onPrint(commande)}
                        title="Imprimer"
                      />
                    )}

                    {canCancel(commande) && (
                      <Button
                        size="xs"
                        variant="ghost"
                        icon={<XMarkIcon />}
                        onClick={() => onCancel(commande)}
                        title="Annuler"
                      />
                    )}

                    {hasPermission('delete_orders') && commande.statut === 'brouillon' && (
                      <Button
                        size="xs"
                        variant="ghost"
                        icon={<TrashIcon />}
                        onClick={() => onDelete(commande)}
                        title="Supprimer"
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommandeList;