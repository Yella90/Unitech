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
  isAdmin?: boolean;
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

export type ClientAuthResult = {
  success: boolean;
  client?: any;
  session?: any;
  error?: string;
  status?: number;
};

// ============================================================
// AUTHENTIFICATION ADMIN
// ============================================================

export async function authenticateAdmin(req: NextRequest): Promise<AdminAuthResult> {
  try {
    // 1. Récupérer le token
    const sessionToken = req.cookies.get('session_token')?.value;
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    const token = sessionToken || bearerToken;

    if (!token) {
      return {
        success: false,
        error: 'Non authentifié',
        status: 401
      };
    }

    // 2. Vérifier la session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*, users(*)')
      .eq('token', token)
      .single();

    if (sessionError || !session) {
      return {
        success: false,
        error: 'Session invalide',
        status: 401
      };
    }

    // 3. Vérifier l'expiration
    if (new Date(session.expires_at) < new Date()) {
      return {
        success: false,
        error: 'Session expirée',
        status: 401
      };
    }

    const user = session.users;
    if (!user) {
      return {
        success: false,
        error: 'Utilisateur non trouvé',
        status: 403
      };
    }

    // 4. Vérifier les rôles admin
    const adminRoles = ['admin', 'super_admin', 'developer'];
    if (!adminRoles.includes(user.role)) {
      return {
        success: false,
        error: 'Accès non autorisé - Rôle administrateur requis',
        status: 403
      };
    }

    // 5. Mettre à jour la dernière activité
    await supabase
      .from('sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', session.id);

    return {
      success: true,
      admin: user,
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
// AUTHENTIFICATION CLIENT
// ============================================================

export async function authenticateClient(req: NextRequest): Promise<ClientAuthResult> {
  try {
    const sessionToken = req.cookies.get('client_session_token')?.value;

    if (!sessionToken) {
      return {
        success: false,
        error: 'Non authentifié',
        status: 401
      };
    }

    const { data: session, error: sessionError } = await supabase
      .from('client_sessions')
      .select('*, clients(*)')
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

    const client = session.clients;
    if (!client || !client.is_active) {
      return {
        success: false,
        error: 'Client inactif',
        status: 403
      };
    }

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
// AUTHENTIFICATION API (Générique)
// ============================================================

export async function authenticateAPIRequest(req: NextRequest): Promise<AuthResult> {
  try {
    // Essayer d'abord l'authentification admin
    const adminAuth = await authenticateAdmin(req);
    if (adminAuth.success) {
      return {
        success: true,
        user: adminAuth.admin,
        admin: adminAuth.admin,
        session: adminAuth.session,
        isAdmin: true
      };
    }

    // Essayer l'authentification client
    const clientAuth = await authenticateClient(req);
    if (clientAuth.success) {
      return {
        success: true,
        client: clientAuth.client,
        session: clientAuth.session
      };
    }

    // Essayer les tokens de service (API key)
    const authHeader = req.headers.get('authorization');
    const apiKey = req.headers.get('x-api-key');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : apiKey;

    if (token) {
      const { data: tokenData, error: tokenError } = await supabase
        .from('service_tokens')
        .select('*, clients(*)')
        .eq('token', token)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!tokenError && tokenData) {
        const client = tokenData.clients;
        if (client && client.is_active) {
          return {
            success: true,
            client,
            token: tokenData
          };
        }
      }
    }

    return {
      success: false,
      error: 'Non authentifié',
      status: 401
    };

  } catch (error: any) {
    console.error('❌ Erreur authentification API:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de l\'authentification',
      status: 500
    };
  }
}