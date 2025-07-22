import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Loading from '../ui/Loading';
import { 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon 
} from '../ui/SimpleIcons';

const ProduitList = ({ 
  produits = [], 
  loading = false, 
  onEdit, 
  onDelete, 
  onViewDetails,
  onStockIn,
  onStockOut,
  hasPermission 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('nom');
  const [sortOrder, setSortOrder] = useState('asc');

  // Filtrer et trier les produits
  const filteredAndSortedProduits = React.useMemo(() => {
    let filtered = produits;

    // Recherche
    if (searchTerm) {
      filtered = filtered.filter(produit =>
        produit.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produit.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produit.categorie.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tri
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'quantiteEnStock') {
        aVal = a.quantiteEnStock || 0;
        bVal = b.quantiteEnStock || 0;
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
  }, [produits, searchTerm, sortBy, sortOrder]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return <Loading.List rows={5} />;
  }

  if (produits.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun produit</h3>
        <p className="text-gray-500">Commencez par ajouter votre premier produit.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Barre de recherche et filtres */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="text-sm text-gray-600">
          {filteredAndSortedProduits.length} produit{filteredAndSortedProduits.length > 1 ? 's' : ''} trouvé{filteredAndSortedProduits.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Tableau des produits */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('reference')}
              >
                Référence
                {sortBy === 'reference' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('nom')}
              >
                Nom
                {sortBy === 'nom' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('categorie')}
              >
                Catégorie
                {sortBy === 'categorie' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('quantiteEnStock')}
              >
                Stock
                {sortBy === 'quantiteEnStock' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('prix')}
              >
                Prix d'achat
                {sortBy === 'prix' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('prixVente')}
              >
                Prix de vente
                {sortBy === 'prixVente' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedProduits.map((produit) => (
              <tr key={produit.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {produit.reference}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{produit.nom}</div>
                    {produit.description && (
                      <div className="text-sm text-gray-500">{produit.description}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <Badge variant="default">{produit.categorie}</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {produit.quantiteEnStock || 0} {produit.unite || 'unités'}
                  </div>
                  {produit.quantiteEnStock <= produit.seuil && (
                    <div className="text-xs text-red-600">
                      Seuil: {produit.seuil}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(produit.prix)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(produit.prixVente)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge 
                    variant={
                      produit.quantiteEnStock === 0 ? 'danger' :
                      produit.quantiteEnStock <= produit.seuil ? 'warning' :
                      'success'
                    }
                  >
                    {produit.quantiteEnStock === 0 ? 'Rupture' :
                     produit.quantiteEnStock <= produit.seuil ? 'Stock bas' :
                     'Disponible'}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    {hasPermission('manage_stock') && (
                      <>
                        <Button
                          size="xs"
                          variant="ghost"
                          icon={<ArrowDownTrayIcon />}
                          onClick={() => onStockIn(produit)}
                          title="Entrée stock"
                        />
                        <Button
                          size="xs"
                          variant="ghost"
                          icon={<ArrowUpTrayIcon />}
                          onClick={() => onStockOut(produit)}
                          disabled={produit.quantiteEnStock === 0}
                          title="Sortie stock"
                        />
                      </>
                    )}
                    <Button
                      size="xs"
                      variant="ghost"
                      icon={<EyeIcon />}
                      onClick={() => onViewDetails(produit)}
                      title="Voir détails"
                    />
                    {hasPermission('manage_products') && (
                      <>
                        <Button
                          size="xs"
                          variant="ghost"
                          icon={<PencilIcon />}
                          onClick={() => onEdit(produit)}
                          title="Modifier"
                        />
                        <Button
                          size="xs"
                          variant="ghost"
                          icon={<TrashIcon />}
                          onClick={() => onDelete(produit)}
                          title="Supprimer"
                        />
                      </>
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

export default ProduitList;