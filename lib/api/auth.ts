// lib/api/auth.ts
import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

// ============================================================
// TYPES
// ============================================================

export type AuthResult = {
  success: boolean;
  client?: any;
  user?: any;
  admin?: any;
  session?: any;
  token?: any;
  error?: string;
  status?: number;
};

export type ClientAuthResult = {
  success: boolean;
  client?: any;
  session?: any;
  error?: string;
  status?: number;
};

export type AdminAuthResult = {
  success: boolean;
  admin?: any;
  session?: any;
  error?: string;
  status?: number;
};

// ============================================================
// TYPES POUR REQUIRE AUTH - CORRIGÉ
// ============================================================

export type RequireAuthOptions = {
  requireAdmin?: boolean;
  requireClient?: boolean;
  requireSubscription?: string; // slug du service requis
  allowApiKey?: boolean;
};

export type RequireAuthResult = {
  success: boolean;
  client?: any;
  admin?: any;
  user?: any;
  session?: any;
  subscription?: any;
  token?: any;        // ✅ Ajout de la propriété token
  type?: 'client' | 'admin' | 'api' | 'none';
  error?: string;
  status?: number;
};

// ============================================================
// AUTHENTIFICATION API (Bearer Token / API Key / Session)
// ============================================================

/**
 * Authentifie une requête API avec un token (Bearer, x-api-key ou session)
 */
export async function authenticateAPIRequest(req: NextRequest): Promise<AuthResult> {
  try {
    // Récupérer le token depuis le header
    const authHeader = req.headers.get('authorization');
    const apiKey = req.headers.get('x-api-key');

    // Récupérer le cookie de session client
    const sessionToken = req.cookies.get('client_session_token')?.value;

    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (apiKey) {
      token = apiKey;
    }

    // Si pas de token, essayer avec la session
    if (!token && sessionToken) {
      token = sessionToken;
    }

    // ✅ Si pas de token, retourner une erreur
    if (!token) {
      return {
        success: false,
        error: 'Token d\'authentification requis',
        status: 401
      };
    }

    // 1. Vérifier si c'est un token de service (API key)
    const { data: tokenData, error: tokenError } = await supabase
      .from('service_tokens')
      .select('*, clients(*)')
      .eq('token', token)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!tokenError && tokenData) {
      const client = tokenData.clients;

      if (!client || !client.is_active) {
        return {
          success: false,
          error: 'Client inactif ou non trouvé',
          status: 401
        };
      }

      // Mettre à jour le dernier usage
      await supabase
        .from('service_tokens')
        .update({
          last_used_at: new Date().toISOString(),
          usage_count: tokenData.usage_count + 1
        })
        .eq('id', tokenData.id);

      return {
        success: true,
        client,
        user: client,
        token: tokenData
      };
    }

    // 2. Vérifier si c'est une session client
    const { data: session, error: sessionError } = await supabase
      .from('client_sessions')
      .select('*, clients(*)')
      .eq('token', token)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!sessionError && session) {
      const client = session.clients;

      if (!client || !client.is_active) {
        return {
          success: false,
          error: 'Client inactif ou non trouvé',
          status: 401
        };
      }

      // Mettre à jour la dernière activité
      await supabase
        .from('client_sessions')
        .update({
          last_activity_at: new Date().toISOString()
        })
        .eq('id', session.id);

      return {
        success: true,
        client,
        user: client,
        session,
        token: session
      };
    }

    // 3. Vérifier si c'est un token Supabase Auth
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (!userError && user) {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (!clientError && client && client.is_active) {
        return {
          success: true,
          user,
          client,
          token: { type: 'supabase_auth', user_id: user.id }
        };
      }
    }

    return {
      success: false,
      error: 'Token invalide ou expiré',
      status: 401
    };

  } catch (error) {
    console.error('❌ Erreur authentification API:', error);
    return {
      success: false,
      error: 'Erreur lors de l\'authentification',
      status: 500
    };
  }
}

// ============================================================
// AUTHENTIFICATION CLIENT (Cookies de session)
// ============================================================

/**
 * Authentifie un client via le cookie de session
 */
export async function authenticateClient(req: NextRequest): Promise<ClientAuthResult> {
  try {
    // 1. Récupérer le token depuis les cookies
    const sessionToken = req.cookies.get('client_session_token')?.value;

    if (!sessionToken) {
      console.warn('⚠️ Aucun token de session trouvé dans les cookies');
      return {
        success: false,
        error: 'Non authentifié',
        status: 401
      };
    }

    // 2. Vérifier la session
    const { data: session, error: sessionError } = await supabase
      .from('client_sessions')
      .select('*, clients(*)')
      .eq('token', sessionToken)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      console.warn('⚠️ Session invalide ou expirée');
      return {
        success: false,
        error: 'Session invalide ou expirée',
        status: 401
      };
    }

    const client = session.clients;

    if (!client) {
      console.warn('⚠️ Client non trouvé pour cette session');
      return {
        success: false,
        error: 'Client non trouvé',
        status: 403
      };
    }

    // 3. Vérifier que le compte est actif
    if (!client.is_active) {
      return {
        success: false,
        error: 'Compte désactivé',
        status: 403
      };
    }

    // 4. Mettre à jour la dernière activité
    await supabase
      .from('client_sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', session.id);

    return {
      success: true,
      client,
      session
    };

  } catch (error: any) {
    console.error('❌ Erreur authentification client:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de l\'authentification',
      status: 500
    };
  }
}

// ============================================================
// AUTHENTIFICATION ADMIN (Cookies de session admin)
// ============================================================

/**
 * Authentifie un administrateur via le cookie de session
 */
export async function authenticateAdmin(req: NextRequest): Promise<AdminAuthResult> {
  try {
    // Récupérer le token depuis les cookies
    const sessionToken = req.cookies.get('admin_session_token')?.value;

    if (!sessionToken) {
      return {
        success: false,
        error: 'Non authentifié',
        status: 401
      };
    }

    // Vérifier la session admin
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .select('*, admins(*)')
      .eq('token', sessionToken)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return {
        success: false,
        error: 'Session invalide ou expirée',
        status: 401
      };
    }

    const admin = session.admins;

    if (!admin) {
      return {
        success: false,
        error: 'Admin non trouvé',
        status: 403
      };
    }

    // Vérifier les rôles admin
    const adminRoles = ['admin', 'super_admin', 'developer'];
    if (!adminRoles.includes(admin.role)) {
      return {
        success: false,
        error: 'Accès non autorisé',
        status: 403
      };
    }

    // Mettre à jour la dernière activité
    await supabase
      .from('admin_sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', session.id);

    return {
      success: true,
      admin,
      session
    };

  } catch (error: any) {
    console.error('❌ Erreur authentification admin:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de l\'authentification',
      status: 500
    };
  }
}

// ============================================================
// VÉRIFICATIONS DE RÔLES
// ============================================================

/**
 * Vérifie si un client a un rôle admin
 */
export function checkAdminRole(client: any): boolean {
  if (!client) return false;
  const adminRoles = ['admin', 'super_admin', 'developer'];
  return client.role && adminRoles.includes(client.role);
}

/**
 * Vérifie si un client a accès à une ressource
 */
export function checkClientAccess(client: any, resourceClientId: string): boolean {
  if (!client) return false;
  
  // Admin a accès à tout
  if (checkAdminRole(client)) return true;
  
  // Client ne peut accéder qu'à ses propres ressources
  return client.id === resourceClientId;
}

/**
 * Vérifie si un client a une souscription active pour un service
 */
export async function checkClientSubscription(
  clientId: string, 
  serviceSlug: string
): Promise<{ hasAccess: boolean; subscription?: any; error?: string }> {
  try {
    // Récupérer le service
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id')
      .eq('slug', serviceSlug)
      .eq('is_active', true)
      .single();

    if (serviceError || !service) {
      return { hasAccess: false, error: 'Service non disponible' };
    }

    // Vérifier la souscription
    const { data: subscription, error: subError } = await supabase
      .from('client_services')
      .select('*')
      .eq('client_id', clientId)
      .eq('service_id', service.id)
      .eq('status', 'active')
      .maybeSingle();

    if (subError) {
      return { hasAccess: false, error: 'Erreur vérification souscription' };
    }

    if (!subscription) {
      return { hasAccess: false, error: 'Aucune souscription active' };
    }

    // Vérifier si la souscription est expirée
    if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
      return { hasAccess: false, error: 'Souscription expirée' };
    }

    return { hasAccess: true, subscription };

  } catch (error: any) {
    return { hasAccess: false, error: error.message };
  }
}

// ============================================================
// MIDDLEWARE D'AUTHENTIFICATION UNIFIÉ
// ============================================================

/**
 * Middleware d'authentification unifié
 */
export async function requireAuth(
  req: NextRequest,
  options: RequireAuthOptions = {}
): Promise<RequireAuthResult> {
  try {
    // 1. Essayer l'authentification client (cookies)
    const clientAuth = await authenticateClient(req);
    if (clientAuth.success) {
      // Vérifier si le client a besoin d'une souscription
      if (options.requireSubscription) {
        const subCheck = await checkClientSubscription(
          clientAuth.client.id,
          options.requireSubscription
        );
        if (!subCheck.hasAccess) {
          return {
            success: false,
            error: subCheck.error || 'Souscription requise',
            status: 403
          };
        }
        return {
          success: true,
          client: clientAuth.client,
          session: clientAuth.session,
          subscription: subCheck.subscription,
          type: 'client'
        };
      }

      // Si on ne demande pas spécifiquement un admin, c'est bon
      if (!options.requireAdmin) {
        return {
          success: true,
          client: clientAuth.client,
          session: clientAuth.session,
          type: 'client'
        };
      }

      // Si on demande un admin, vérifier le rôle
      if (options.requireAdmin && checkAdminRole(clientAuth.client)) {
        return {
          success: true,
          client: clientAuth.client,
          session: clientAuth.session,
          type: 'admin'
        };
      }
    }

    // 2. Essayer l'authentification admin
    const adminAuth = await authenticateAdmin(req);
    if (adminAuth.success) {
      return {
        success: true,
        admin: adminAuth.admin,
        session: adminAuth.session,
        type: 'admin'
      };
    }

    // 3. Essayer l'authentification API (Bearer token / API key)
    if (options.allowApiKey !== false) {
      const apiAuth = await authenticateAPIRequest(req);
      if (apiAuth.success) {
        return {
          success: true,
          client: apiAuth.client,
          user: apiAuth.user,
          token: apiAuth.token,    // ✅ Maintenant reconnu par le type
          type: 'api'
        };
      }
    }

    // 4. Pas d'authentification valide
    return {
      success: false,
      error: 'Authentification requise',
      status: 401,
      type: 'none'
    };

  } catch (error: any) {
    console.error('❌ Erreur requireAuth:', error);
    return {
      success: false,
      error: error.message || 'Erreur d\'authentification',
      status: 500,
      type: 'none'
    };
  }
}

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

/**
 * Récupère le token de session client depuis les cookies
 */
export function getClientSessionToken(req: NextRequest): string | null {
  return req.cookies.get('client_session_token')?.value || null;
}

/**
 * Récupère le token de session admin depuis les cookies
 */
export function getAdminSessionToken(req: NextRequest): string | null {
  return req.cookies.get('admin_session_token')?.value || null;
}

/**
 * Récupère le token Bearer depuis le header Authorization
 */
export function getBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * Récupère la clé API depuis le header x-api-key
 */
export function getApiKey(req: NextRequest): string | null {
  return req.headers.get('x-api-key') || null;
}

/**
 * Vérifie si la requête est authentifiée
 */
export async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const result = await requireAuth(req);
  return result.success;
}

/**
 * Vérifie si la requête est authentifiée en tant qu'admin
 */
export async function isAdmin(req: NextRequest): Promise<boolean> {
  const result = await requireAuth(req, { requireAdmin: true });
  return result.success;
}

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default {
  authenticateAPIRequest,
  authenticateClient,
  authenticateAdmin,
  checkAdminRole,
  checkClientAccess,
  checkClientSubscription,
  requireAuth,
  getClientSessionToken,
  getAdminSessionToken,
  getBearerToken,
  getApiKey,
  isAuthenticated,
  isAdmin
};