// lib/api/auth.ts
import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export type AuthResult = {
  success: boolean;
  client?: any;
  token?: any;
  error?: string;
  status?: number;
};

/**
 * Authentifie une requête API avec un token (Bearer ou x-api-key)
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

    // ✅ Si pas de token, retourner une erreur mais avec un message clair
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
        token: session
      };
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