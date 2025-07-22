import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FiltersProvider } from '../hooks/useFilters';

// Import des pages
import Login from '../pages/Login';
import MagasinierDashboard from '../pages/MagasinierDashboard';
import OperatorDashboard from '../pages/operator/OperatorDashboard';
import MagasinierSimple from '../pages/MagasinierSimple';
import SaisieSimple from '../pages/SaisieSimple';
import StockSimple from '../pages/StockSimple';
import TableauStock from '../pages/TableauStock';
import Stock from '../pages/Stock';
import Mouvements from '../pages/Mouvements';
import Produits from '../pages/Produits';
import Clients from '../pages/Clients';
import Commandes from '../pages/Commandes';
import Livraisons from '../pages/Livraisons';
import GestionLivraisons from '../pages/GestionLivraisons';
import LivraisonsMagasinier from '../pages/LivraisonsMagasinier';
import Rapports from '../pages/Rapports';
import Profile from '../pages/Profile';
import Users from '../pages/Users';
import ReceptionNavires from '../pages/ReceptionNavires';
import SaisieOperateur from '../pages/SaisieOperateur';
import SaisieEntreesSimple from '../pages/SaisieEntreesSimple';
import SaisieEntreesRotation from '../pages/SaisieEntreesRotation';
import SaisieSorties from '../pages/SaisieSorties';
import FicheReceptionRotation from '../components/rotation/FicheReceptionRotation';
import StockOperator from '../pages/StockOperator';
import Rotations from '../pages/Rotations';
import Ecarts from '../pages/Ecarts';
import EcartsNavire from '../pages/EcartsNavire';
import GestionTonnage from '../pages/GestionTonnage';
import SuiviReceptionTonnage from '../pages/SuiviReceptionTonnage';
import ComparaisonLivraisons from '../pages/ComparaisonLivraisons';
import ReceptionLivraison from '../pages/ReceptionLivraison';
import ReceptionLivraisonSimple from '../pages/ReceptionLivraisonSimple';
import TestPage from '../pages/TestPage';
import RotationsManager from '../pages/RotationsManager';
import TableauBordTonnage from '../pages/TableauBordTonnage';
import DispatchingUnifie from '../pages/DispatchingUnifie';
import DispatchNavire from '../pages/DispatchNavire';
import DetailsMagasinTonnage from '../pages/DetailsMagasinTonnage';
import DetailsMagasin from '../pages/DetailsMagasin';

// Import des composants de dispatching
import { DispatchList, CreateDispatch, DispatchDetail, RecordDelivery } from '../components/dispatching';
import DispatchesEnAttente from '../components/navireDispatching/DispatchesEnAttente';

// Import des pages simplifiées
import DashboardSimple from '../pages/DashboardSimple';
import GestionTonnageSimple from '../pages/GestionTonnageSimple';
import OperationsSimple from '../pages/OperationsSimple';
import RapportsSimple from '../pages/RapportsSimple';

// Import des guards et layout
import ProtectedRoute from '../components/auth/ProtectedRoute';
import RoleGuard from '../components/auth/RoleGuard';
import PageLayout from '../components/layout/PageLayout';

const AppRouter = () => {
  const { user } = useAuth();

  return (
    <FiltersProvider>
      <Routes>
      {/* Route publique */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />

      {/* Routes protégées */}
      {/* Page principale - redirige vers l'interface appropriée selon le rôle */}
      <Route path="/" element={
        <ProtectedRoute>
          <PageLayout>
            {user?.role === 'operator' ? <Navigate to="/magasinier-simple" /> : 
             <Navigate to="/suivi-tonnage" />}
          </PageLayout>
        </ProtectedRoute>
      } />
      
      {/* Route dashboard qui redirige selon le rôle */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <PageLayout>
            {user?.role === 'operator' ? <Navigate to="/magasinier-simple" /> : 
             <Navigate to="/suivi-tonnage" />}
          </PageLayout>
        </ProtectedRoute>
      } />
      
      {/* Dashboard opérateur pour gestion tonnage maritime */}
      <Route path="/operator-dashboard" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['operator']}>
              <OperatorDashboard />
            </RoleGuard>
          </PageLayout>

        </ProtectedRoute>
      } />
      
      {/* Dashboard magasinier spécifique */}
      <Route path="/magasinier" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['operator']}>
              <MagasinierDashboard />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />
      
      {/* Interface simplifiée pour magasinier */}
      <Route path="/magasinier-simple" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['operator']}>
              <MagasinierSimple />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/saisie-simple" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['operator']}>
              <SaisieSimple />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/stock-simple" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['operator']}>
              <StockSimple />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/tableau-stock" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['operator']}>
              <TableauStock />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />
      
      {/* Stock - version différente selon le rôle */}
      <Route path="/stock" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['manager', 'operator']}>
              <Stock />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/mouvements" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['manager', 'operator']}>
              <Mouvements />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />
      
      {/* Saisie entrées - pour les chefs de magasin (operator) */}
      <Route path="/saisie-entrees" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['operator', 'manager']}>
              <SaisieEntreesRotation />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />
      
      {/* Saisie sorties - pour les chefs de magasin (operator) */}
      <Route path="/saisie-sorties" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['operator', 'manager']}>
              <SaisieSorties />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />
      
      {/* Saisie opérateur - pour les opérateurs de saisie */}
      <Route path="/saisie-operateur" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['manager', 'operator']}>
              <SaisieOperateur />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/produits" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['manager', 'operator']}>
              <Produits />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />

      {/* Gestion des opérations - accessible aux chefs de magasin (operator) */}
      <Route path="/clients" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['manager', 'operator']}>
              <Clients />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/commandes" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['manager', 'operator']}>
              <Commandes />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/livraisons" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['manager', 'operator']}>
              <Livraisons />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />
      
      {/* Gestion livraisons - pour gestionnaire livraisons */}
      <Route path="/gestion-livraisons" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['manager', 'delivery_manager']}>
              <GestionLivraisons />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />
      
      {/* Livraisons magasinier - pour les magasiniers qui gèrent les livraisons sortantes */}
      <Route path="/livraisons-magasinier" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['operator', 'manager']}>
              <LivraisonsMagasinier />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />

      {/* Rapports - accessible à tous sauf viewers */}
      <Route path="/rapports" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['manager', 'operator']}>
              <Rapports />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />

      {/* Réception navires - pour managers et admins */}
      <Route path="/reception-navires" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['manager']}>
              <ReceptionNavires />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />


      {/* Réception des Rotations - pour operators */}
      <Route path="/operator/rotations" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['operator']}>
              <Rotations />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />


      {/* Rapport des écarts - accessible uniquement aux managers */}
      <Route path="/rapports/ecarts" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['manager']}>
              <EcartsNavire />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />

      {/* Gestion Tonnage - pour managers et operators */}
      <Route path="/gestion-tonnage" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['manager', 'operator']}>
              <GestionTonnage />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />
      
      {/* Détails magasin tonnage */}
      <Route path="/details-magasin/:magasinId" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['manager', 'operator']}>
              <DetailsMagasin />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />

      {/* Suivi Reception Tonnage - pour managers */}
      <Route path="/suivi-tonnage" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['manager']}>
              <SuiviReceptionTonnage />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />
      
      {/* Tableau de bord tonnage - pour managers */}
      <Route path="/tableau-bord-tonnage" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['manager']}>
              <TableauBordTonnage />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />

      {/* Test page */}
      <Route path="/test" element={<TestPage />} />
      
      {/* Reception Livraisons - pour magasiniers */}
      <Route path="/reception-livraisons" element={
        <ProtectedRoute>
          <PageLayout>
            <ReceptionLivraisonSimple />
          </PageLayout>
        </ProtectedRoute>
      } />

      {/* Rotations Manager - pour managers */}
      <Route path="/rotations-manager" element={
        <ProtectedRoute>
          <PageLayout>
            <RotationsManager />
          </PageLayout>
        </ProtectedRoute>
      } />
      
      {/* Route pour dispatcher un navire */}
      <Route path="/dispatch-navire" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['manager']}>
              <DispatchNavire />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />
      
      {/* Route détails magasin */}
      <Route path="/details-magasin/:magasinId" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['manager', 'operator']}>
              <DetailsMagasin />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />
      
      {/* Routes de dispatching */}
      <Route path="/dispatching" element={
        <ProtectedRoute>
          <PageLayout>
            {user?.role === 'manager' ? (
              <DispatchingUnifie />
            ) : (
              <RoleGuard roles={['operator']}>
                <DispatchesEnAttente />
              </RoleGuard>
            )}
          </PageLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/dispatching/create" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['manager']}>
              <CreateDispatch />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/dispatching/:id" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['manager', 'operator']}>
              <DispatchDetail />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/dispatching/:id/delivery" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['operator']}>
              <RecordDelivery />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />
      
      {/* Version protégée */}
      <Route path="/reception-livraisons-protected" element={
        <ProtectedRoute>
          <PageLayout>
            <ReceptionLivraisonSimple />
          </PageLayout>
        </ProtectedRoute>
      } />

      {/* Comparaison Livraisons - pour managers */}
      <Route path="/comparaison-livraisons" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['manager']}>
              <ComparaisonLivraisons />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />

      {/* Administration - réservée aux admins */}
      <Route path="/users" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['manager']}>
              <Users />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />

      {/* Profile - accessible à tous les utilisateurs authentifiés */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <PageLayout>
            <Profile />
          </PageLayout>
        </ProtectedRoute>
      } />

      {/* Routes simplifiées */}
      <Route path="/dashboard-simple" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['manager']}>
              <DashboardSimple />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />

      <Route path="/gestion-tonnage-simple" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['manager']}>
              <GestionTonnageSimple />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />

      <Route path="/operations-simple" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['manager']}>
              <OperationsSimple />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />

      <Route path="/rapports-simple" element={
        <ProtectedRoute>
          <PageLayout>
            <RoleGuard roles={['manager']}>
              <RapportsSimple />
            </RoleGuard>
          </PageLayout>
        </ProtectedRoute>
      } />

      {/* Route par défaut */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
    </FiltersProvider>
  );
};

export default AppRouter;