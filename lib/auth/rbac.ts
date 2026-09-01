// lib/auth/rbac.ts

// ============================================================
// TYPES
// ============================================================
export type Role = 'super_admin' | 'admin' | 'project_manager' | 'team_lead' | 'developer' | 'designer' | 'client' | 'viewer';

export type Permission = 
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'users.assign_role'
  | 'projects.view'
  | 'projects.create'
  | 'projects.edit'
  | 'projects.delete'
  | 'trainings.view'
  | 'trainings.create'
  | 'trainings.edit'
  | 'trainings.delete'
  | 'email.view'
  | 'email.create'
  | 'email.send'
  | 'email.create_response'
  | 'recruitment.view'
  | 'recruitment.create'
  | 'recruitment.edit'
  | 'recruitment.delete'
  | 'ai.analyze'
  | 'ai.generate'
  | 'ai.regenerate'
  | 'ai.trigger'
  | 'ai.approve'
  | 'settings.view'
  | 'settings.edit'
  | 'logs.view'
  | 'api_keys.view'
  | 'api_keys.create'
  | 'api_keys.delete'
  | 'analytics.view';

// ============================================================
// DÉFINITION DES RÔLES
// ============================================================
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  TEAM_LEAD: 'team_lead',
  DEVELOPER: 'developer',
  DESIGNER: 'designer',
  CLIENT: 'client',
  VIEWER: 'viewer',
} as const;

// ============================================================
// HIÉRARCHIE DES RÔLES
// ============================================================
export const ROLE_HIERARCHY: Record<Role, number> = {
  super_admin: 100,
  admin: 80,
  project_manager: 60,
  team_lead: 50,
  developer: 40,
  designer: 30,
  client: 20,
  viewer: 10,
};

// ============================================================
// RÔLES ADMIN
// ============================================================
export const ADMIN_ROLES: Role[] = [
  'super_admin',
  'admin',
  'project_manager',
  'team_lead',
  'developer',
];

// ============================================================
// PERMISSIONS PAR RÔLE
// ============================================================
export const PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    'users.view', 'users.create', 'users.edit', 'users.delete', 'users.assign_role',
    'projects.view', 'projects.create', 'projects.edit', 'projects.delete',
    'trainings.view', 'trainings.create', 'trainings.edit', 'trainings.delete',
    'email.view', 'email.create', 'email.send', 'email.create_response',
    'recruitment.view', 'recruitment.create', 'recruitment.edit', 'recruitment.delete',
    'ai.analyze', 'ai.generate', 'ai.regenerate', 'ai.trigger', 'ai.approve',
    'settings.view', 'settings.edit',
    'logs.view',
    'api_keys.view', 'api_keys.create', 'api_keys.delete',
    'analytics.view',
  ],
  admin: [
    'users.view', 'users.create', 'users.edit', 'users.delete', 'users.assign_role',
    'projects.view', 'projects.create', 'projects.edit', 'projects.delete',
    'trainings.view', 'trainings.create', 'trainings.edit', 'trainings.delete',
    'email.view', 'email.create', 'email.send', 'email.create_response',
    'recruitment.view', 'recruitment.create', 'recruitment.edit', 'recruitment.delete',
    'ai.analyze', 'ai.generate', 'ai.regenerate', 'ai.trigger',
    'settings.view', 'settings.edit',
    'logs.view',
    'api_keys.view', 'api_keys.create', 'api_keys.delete',
    'analytics.view',
  ],
  project_manager: [
    'projects.view', 'projects.create', 'projects.edit',
    'trainings.view',
    'email.view', 'email.create', 'email.send', 'email.create_response',
    'recruitment.view', 'recruitment.create', 'recruitment.edit',
    'ai.analyze', 'ai.generate',
    'settings.view',
    'analytics.view',
  ],
  team_lead: [
    'projects.view', 'projects.edit',
    'email.view', 'email.create_response',
    'recruitment.view',
    'ai.analyze', 'ai.generate',
    'analytics.view',
  ],
  developer: [
    'projects.view',
    'email.view', 'email.create_response',
    'recruitment.view',
    'ai.analyze', 'ai.generate',
    'analytics.view',
  ],
  designer: [
    'projects.view',
    'email.view',
    'recruitment.view',
    'analytics.view',
  ],
  client: [
    'projects.view',
    'recruitment.view',
    'analytics.view',
  ],
  viewer: [
    'projects.view',
    'analytics.view',
  ],
};

// ============================================================
// FONCTIONS PRINCIPALES
// ============================================================

/**
 * Vérifie si un rôle est valide
 */
export function isRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return Object.values(ROLES).includes(role as any);
}

/**
 * Vérifie si un rôle a une permission spécifique
 */
export function hasPermission(role: Role | string | null | undefined, permission: Permission): boolean {
  if (!role || !isRole(role)) return false;
  
  const rolePermissions = PERMISSIONS[role as Role];
  if (!rolePermissions) return false;
  
  return rolePermissions.includes(permission);
}

/**
 * Vérifie si un rôle a toutes les permissions demandées
 */
export function hasAllPermissions(role: Role | string | null | undefined, permissions: Permission[]): boolean {
  if (!role || !isRole(role)) return false;
  
  return permissions.every(p => hasPermission(role, p));
}

/**
 * Vérifie si un rôle a au moins une des permissions demandées
 */
export function hasAnyPermission(role: Role | string | null | undefined, permissions: Permission[]): boolean {
  if (!role || !isRole(role)) return false;
  
  return permissions.some(p => hasPermission(role, p));
}

/**
 * Vérifie si un rôle a accès à une page admin spécifique
 */
export function canAccessAdminPage(role: Role | string | null | undefined, path: string): boolean {
  if (!role || !isRole(role)) return false;
  
  // Vérifier si le rôle est dans la liste des admins
  if (!ADMIN_ROLES.includes(role as Role)) return false;
  
  // Vérifications spécifiques par route
  if (path.startsWith('/admin/users') && !['super_admin', 'admin'].includes(role)) {
    return false;
  }
  
  if (path.startsWith('/admin/agents') && role !== 'super_admin') {
    return false;
  }
  
  if (path === '/admin/users/new' && !['super_admin', 'admin'].includes(role)) {
    return false;
  }
  
  if (path.startsWith('/admin/api-keys') && !['super_admin', 'admin'].includes(role)) {
    return false;
  }
  
  if (path.startsWith('/admin/logs') && !['super_admin', 'admin'].includes(role)) {
    return false;
  }
  
  if (path.startsWith('/admin/settings') && !['super_admin', 'admin'].includes(role)) {
    return false;
  }
  
  return true;
}

/**
 * Obtient le niveau d'un rôle (hiérarchie)
 */
export function getRoleLevel(role: Role | string | null | undefined): number {
  if (!role || !isRole(role)) return 0;
  return ROLE_HIERARCHY[role as Role] || 0;
}

/**
 * Vérifie si un rôle a un niveau supérieur ou égal à un autre
 */
export function hasRoleLevel(role: Role | string | null | undefined, requiredLevel: number): boolean {
  if (!role || !isRole(role)) return false;
  return getRoleLevel(role) >= requiredLevel;
}

/**
 * Obtient la liste des permissions pour un rôle
 */
export function getPermissionsForRole(role: Role | string | null | undefined): Permission[] {
  if (!role || !isRole(role)) return [];
  return PERMISSIONS[role as Role] || [];
}

/**
 * Obtient tous les rôles
 */
export function getAllRoles(): Role[] {
  return Object.values(ROLES) as Role[];
}

/**
 * Obtient toutes les permissions
 */
export function getAllPermissions(): Permission[] {
  const allPermissions: Permission[] = [];
  for (const role of Object.values(ROLES) as Role[]) {
    const perms = PERMISSIONS[role] || [];
    for (const perm of perms) {
      if (!allPermissions.includes(perm)) {
        allPermissions.push(perm);
      }
    }
  }
  return allPermissions;
}

/**
 * Obtient les rôles inférieurs à un rôle donné
 */
export function getLowerRoles(role: Role | string | null | undefined): Role[] {
  if (!role || !isRole(role)) return [];
  
  const currentLevel = getRoleLevel(role);
  return Object.keys(ROLE_HIERARCHY)
    .filter((r) => ROLE_HIERARCHY[r as Role] < currentLevel)
    .map((r) => r as Role);
}

/**
 * Obtient les rôles supérieurs à un rôle donné
 */
export function getHigherRoles(role: Role | string | null | undefined): Role[] {
  if (!role || !isRole(role)) return [];
  
  const currentLevel = getRoleLevel(role);
  return Object.keys(ROLE_HIERARCHY)
    .filter((r) => ROLE_HIERARCHY[r as Role] > currentLevel)
    .map((r) => r as Role);
}

/**
 * Vérifie si un utilisateur peut gérer un autre utilisateur
 */
export function canManageUser(
  currentRole: Role | string | null | undefined,
  targetRole: Role | string | null | undefined
): boolean {
  if (!currentRole || !targetRole || !isRole(currentRole) || !isRole(targetRole)) return false;
  
  const currentLevel = getRoleLevel(currentRole);
  const targetLevel = getRoleLevel(targetRole);
  
  return currentLevel > targetLevel;
}

/**
 * Obtient le scope d'un rôle (pour les APIs externes)
 */
export function getScope(role: Role | string | null | undefined): string[] {
  if (!role || !isRole(role)) return [];
  
  const scopeMap: Record<Role, string[]> = {
    super_admin: ['*'],
    admin: ['admin', 'users', 'projects', 'trainings', 'email', 'recruitment', 'ai', 'settings'],
    project_manager: ['projects', 'trainings', 'email', 'recruitment', 'ai'],
    team_lead: ['projects', 'email', 'recruitment', 'ai'],
    developer: ['projects', 'email', 'recruitment', 'ai'],
    designer: ['projects', 'email'],
    client: ['projects'],
    viewer: ['projects'],
  };
  
  return scopeMap[role as Role] || [];
}

/**
 * Vérifie si un rôle a accès à un scope
 */
export function hasScope(role: Role | string | null | undefined, scope: string): boolean {
  if (!role || !isRole(role)) return false;
  
  const scopes = getScope(role);
  return scopes.includes('*') || scopes.includes(scope);
}

/**
 * Obtient le rôle à partir d'une chaîne
 */
export function getRole(roleString: string | null | undefined): Role | null {
  if (!roleString) return null;
  if (isRole(roleString)) {
    return roleString as Role;
  }
  return null;
}

/**
 * Vérifie si un rôle est un rôle admin
 */
export function isAdminRole(role: Role | string | null | undefined): boolean {
  if (!role || !isRole(role)) return false;
  return ADMIN_ROLES.includes(role as Role);
}

/**
 * Vérifie si un rôle est un rôle super admin
 */
export function isSuperAdmin(role: Role | string | null | undefined): boolean {
  return role === ROLES.SUPER_ADMIN;
}

/**
 * Vérifie si un rôle est un rôle admin (alias)
 */
export function isAdmin(role: Role | string | null | undefined): boolean {
  return isAdminRole(role);
}

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================
export default {
  ROLES,
  ROLE_HIERARCHY,
  ADMIN_ROLES,
  PERMISSIONS,
  isRole,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  canAccessAdminPage,
  getRoleLevel,
  hasRoleLevel,
  getPermissionsForRole,
  getAllRoles,
  getAllPermissions,
  getLowerRoles,
  getHigherRoles,
  canManageUser,
  getScope,
  hasScope,
  getRole,
  isAdminRole,
  isSuperAdmin,
  isAdmin,
};