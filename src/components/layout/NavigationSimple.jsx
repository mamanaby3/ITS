import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { HomeIcon, CubeIcon, TruckIcon, DocumentChartBarIcon, UsersIcon, UserCircleIcon } from '../ui/SimpleIcons';
import { Package } from 'lucide-react';

const NavigationSimple = ({ isMobile = false, onNavigate }) => {
  const location = useLocation();
  const { user } = useAuth();

  const navigationItems = user?.role === 'manager' ? [
    { name: 'Tableau de bord', path: '/dashboard-simple', icon: HomeIcon },
    { name: 'Stock', path: '/gestion-tonnage-simple', icon: Package },
    { name: 'Opérations', path: '/operations-simple', icon: TruckIcon },
    { name: 'Rapports', path: '/rapports-simple', icon: DocumentChartBarIcon },
    { name: 'Utilisateurs', path: '/users', icon: UsersIcon }
  ] : [
    { name: 'Mon Stock', path: '/stock', icon: CubeIcon },
    { name: 'Entrées', path: '/saisie-entrees', icon: Package }
  ];

  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.path || 
                    (item.path !== '/' && location.pathname.startsWith(item.path));

    return (
      <NavLink
        to={item.path}
        onClick={() => onNavigate && onNavigate()}
        className={`
          flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
          ${isActive 
            ? 'bg-blue-600 text-white' 
            : 'text-gray-700 hover:bg-gray-100'
          }
          ${isMobile ? 'mx-2' : ''}
        `}
      >
        <item.icon className="h-5 w-5 mr-3" />
        <span>{item.name}</span>
      </NavLink>
    );
  };

  return (
    <nav className={`${isMobile ? 'py-4' : 'py-2'} space-y-1`}>
      <div className={`space-y-1 ${isMobile ? '' : 'px-3'}`}>
        {navigationItems.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}
      </div>
      
      <div className="border-t border-gray-200 pt-4 mt-6">
        <div className={`${isMobile ? '' : 'px-3'}`}>
          <NavLink
            to="/profile"
            onClick={() => onNavigate && onNavigate()}
            className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <UserCircleIcon className="h-5 w-5 mr-3" />
            <span>Profil</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default NavigationSimple;