import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  HomeIcon,
  CubeIcon,
  ShoppingBagIcon,
  UsersIcon,
  TruckIcon,
  ClipboardDocumentListIcon,
  DocumentChartBarIcon,
  UserCircleIcon,
  Cog6ToothIcon
} from '../ui/SimpleIcons';
import { Ship, BarChart3, Package, AlertTriangle } from 'lucide-react';

const Navigation = ({ isMobile = false, onNavigate }) => {
  const location = useLocation();
  const { user, hasPermission } = useAuth();

  // Définir les items de navigation basés sur les rôles
  const getNavigationItemsByRole = () => {
    const role = user?.role;
    console.log('🔐 User role in navigation:', role);
    console.log('🔐 Full user object:', user);
    
    switch(role) {
      case 'manager':
        // Menu simplifié pour le manager
        return {
          dashboardItems: [
            { name: 'Tableau de Bord', path: '/suivi-tonnage', icon: HomeIcon }
          ],
          stockItems: [
            { name: 'Réception Navires', path: '/reception-navires', icon: Ship },
            { name: 'Dispatching', path: '/dispatching', icon: TruckIcon },
            { name: 'Stock Magasins', path: '/gestion-tonnage', icon: Package },
            { name: 'Mouvements Stock', path: '/mouvements', icon: BarChart3 }
          ],
          commercialItems: [
            { name: 'Clients', path: '/clients', icon: UsersIcon },
            { name: 'Produits', path: '/produits', icon: ShoppingBagIcon }
          ],
          livraisonItems: [],
          reportItems: [
            { name: 'Rapport Écarts', path: '/comparaison-livraisons', icon: AlertTriangle }
          ],
          adminItems: []
        };
        
      case 'operator': // Magasinier - Interface simplifiée
        return {
          dashboardItems: [
            { name: 'Mon Tableau de Bord', path: '/magasinier-simple', icon: HomeIcon }
          ],
          stockItems: [
            { name: 'Enregistrer Entrées', path: '/saisie-simple', icon: Package },
            { name: 'Mon Stock', path: '/stock-simple', icon: CubeIcon },
            { name: 'Tableau de Stock', path: '/tableau-stock', icon: BarChart3 }
          ],
          commercialItems: [],
          livraisonItems: [],
          reportItems: [],
          adminItems: []
        };
        
        
      default:
        // Par défaut, montrer uniquement le tableau de bord
        return {
          dashboardItems: [
            { name: 'Tableau de bord', path: '/', icon: HomeIcon }
          ],
          stockItems: [],
          commercialItems: [],
          livraisonItems: [],
          reportItems: [],
          adminItems: []
        };
    }
  };

  const navigationStructure = getNavigationItemsByRole();
  const { dashboardItems, stockItems, commercialItems, livraisonItems, reportItems, adminItems } = navigationStructure;

  const bottomNavigationItems = [
    {
      name: 'Profil',
      path: '/profile',
      icon: UserCircleIcon
    }
  ];
  
  // Ajouter les paramètres seulement pour manager
  // TODO: Réactiver quand la page Settings sera créée
  // if (user?.role === 'manager') {
  //   bottomNavigationItems.push({
  //     name: 'Paramètres',
  //     path: '/settings',
  //     icon: Cog6ToothIcon
  //   });
  // }

  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.path || 
                    (item.path !== '/' && location.pathname.startsWith(item.path));

    return (
      <NavLink
        to={item.path}
        onClick={() => onNavigate && onNavigate()}
        className={`
          flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
          ${isActive 
            ? 'bg-blue-50 text-blue-700' 
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }
          ${isMobile ? 'mx-2' : ''}
        `}
      >
        <item.icon className={`
          h-5 w-5 mr-3 flex-shrink-0
          ${isActive ? 'text-blue-600' : 'text-gray-400'}
        `} />
        <span>{item.name}</span>
        {isActive && (
          <div className="ml-auto w-1 h-6 bg-blue-600 rounded-full" />
        )}
      </NavLink>
    );
  };

  return (
    <nav className={`${isMobile ? 'py-4' : 'py-2'}`}>
      {/* Tableaux de bord */}
      {dashboardItems.length > 0 && (
        <>
          <div className="mb-2 px-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tableaux de bord</p>
          </div>
          <div className={`space-y-1 mb-6 ${isMobile ? '' : 'px-3'}`}>
            {dashboardItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>
        </>
      )}

      {/* Gestion des stocks */}
      {stockItems.length > 0 && (
        <>
          <div className="mb-2 px-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gestion des stocks</p>
          </div>
          <div className={`space-y-1 mb-6 ${isMobile ? '' : 'px-3'}`}>
            {stockItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>
        </>
      )}

      {/* Gestion des opérations */}
      {commercialItems.length > 0 && (
        <>
          <div className="mb-2 px-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gestion des opérations</p>
          </div>
          <div className={`space-y-1 mb-6 ${isMobile ? '' : 'px-3'}`}>
            {commercialItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>
        </>
      )}

      {/* Gestion des livraisons */}
      {livraisonItems.length > 0 && (
        <>
          <div className="mb-2 px-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Livraisons</p>
          </div>
          <div className={`space-y-1 mb-6 ${isMobile ? '' : 'px-3'}`}>
            {livraisonItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>
        </>
      )}


      {/* Rapports */}
      {reportItems.length > 0 && (
        <>
          <div className="mb-2 px-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Rapports & Analyses</p>
          </div>
          <div className={`space-y-1 mb-6 ${isMobile ? '' : 'px-3'}`}>
            {reportItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>
        </>
      )}

      {/* Admin section */}
      {adminItems.length > 0 && (
        <>
          <div className="mb-2 px-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Administration</p>
          </div>
          <div className={`space-y-1 mb-6 ${isMobile ? '' : 'px-3'}`}>
            {adminItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>
        </>
      )}

      {/* Navigation secondaire */}
      <div className="border-t border-gray-200 pt-4">
        <div className={`space-y-1 ${isMobile ? '' : 'px-3'}`}>
          {bottomNavigationItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;