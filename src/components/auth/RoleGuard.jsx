import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const RoleGuard = ({ 
  children, 
  roles = [], 
  permissions = [], 
  requireAll = false,
  fallback = null 
}) => {
  const { user, hasRole, hasPermission } = useAuth();

  console.log('🛡️ RoleGuard - Vérification accès');
  console.log('   Rôles requis:', roles);
  console.log('   Utilisateur:', user?.email, '- Rôle:', user?.role);

  // Si aucun utilisateur n'est connecté, ne rien afficher
  if (!user) {
    console.log('❌ RoleGuard - Pas d\'utilisateur connecté');
    return fallback || null;
  }

  // V�rifier les r�les
  const hasRequiredRoles = () => {
    if (roles.length === 0) return true;
    
    if (requireAll) {
      // L'utilisateur doit avoir TOUS les r�les
      return roles.every(role => hasRole(role));
    } else {
      // L'utilisateur doit avoir AU MOINS UN des r�les
      return roles.some(role => hasRole(role));
    }
  };

  // V�rifier les permissions
  const hasRequiredPermissions = () => {
    if (permissions.length === 0) return true;
    
    if (requireAll) {
      // L'utilisateur doit avoir TOUTES les permissions
      return permissions.every(permission => hasPermission(permission));
    } else {
      // L'utilisateur doit avoir AU MOINS UNE des permissions
      return permissions.some(permission => hasPermission(permission));
    }
  };

  // Si l'utilisateur a les rôles et permissions requis, afficher le contenu
  const hasRoles = hasRequiredRoles();
  const hasPerms = hasRequiredPermissions();
  
  console.log('   hasRequiredRoles:', hasRoles);
  console.log('   hasRequiredPermissions:', hasPerms);
  
  if (hasRoles && hasPerms) {
    console.log('✅ RoleGuard - Accès autorisé');
    return children;
  }

  // Sinon, afficher le fallback ou rien
  console.log('❌ RoleGuard - Accès refusé');
  return fallback || null;
};

// Composant pour afficher du contenu uniquement aux admins
RoleGuard.Admin = ({ children, fallback }) => (
  <RoleGuard roles={['admin']} fallback={fallback}>
    {children}
  </RoleGuard>
);

// Composant pour afficher du contenu aux managers et admins
RoleGuard.Manager = ({ children, fallback }) => (
  <RoleGuard roles={['admin', 'manager']} fallback={fallback}>
    {children}
  </RoleGuard>
);

// Composant pour afficher du contenu aux op�rateurs et plus
RoleGuard.Operator = ({ children, fallback }) => (
  <RoleGuard roles={['admin', 'manager', 'operator']} fallback={fallback}>
    {children}
  </RoleGuard>
);

// Composant pour v�rifier une permission sp�cifique
RoleGuard.Permission = ({ permission, children, fallback }) => (
  <RoleGuard permissions={[permission]} fallback={fallback}>
    {children}
  </RoleGuard>
);

// Composant pour afficher du contenu en lecture seule
RoleGuard.ReadOnly = ({ children }) => {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('write');
  
  // Cloner les enfants et passer la prop readOnly
  return React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { 
        readOnly: !canWrite,
        disabled: !canWrite 
      });
    }
    return child;
  });
};

export { RoleGuard as RequireRole };
export default RoleGuard;