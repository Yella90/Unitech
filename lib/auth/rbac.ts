// lib/auth/rbac.ts

// ✅ Rôles autorisés pour l'accès admin
export const ADMIN_ROLES = ['admin', 'super_admin', 'developer'];

// ✅ Vérifier si un rôle est valide
export function isRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return ADMIN_ROLES.includes(role);
}

// ✅ Vérifier si un rôle a accès à une page admin spécifique
export function canAccessAdminPage(role: string | null | undefined, path: string): boolean {
  if (!role) return false;
  
  // Vérifier si le rôle est dans la liste des admins
  if (!ADMIN_ROLES.includes(role)) return false;
  
  // Vérifications spécifiques par route
  // Gestion des utilisateurs (seuls super_admin et admin)
  if (path.startsWith('/admin/users') && !['super_admin', 'admin'].includes(role)) {
    return false;
  }
  
  // Configuration des agents (seuls super_admin)
  if (path.startsWith('/admin/agents') && role !== 'super_admin') {
    return false;
  }
  
  // Création de nouveaux utilisateurs (seuls super_admin et admin)
  if (path === '/admin/users/new' && !['super_admin', 'admin'].includes(role)) {
    return false;
  }
  
  return true;
}