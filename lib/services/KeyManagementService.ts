// lib/services/KeyManagementService.ts
import { supabase } from '@/lib/supabase';
import type { APIKey, AIProvider } from '@/lib/types/ai-management';

export class KeyManagementService {
  private static instance: KeyManagementService;
  
  static getInstance(): KeyManagementService {
    if (!KeyManagementService.instance) {
      KeyManagementService.instance = new KeyManagementService();
    }
    return KeyManagementService.instance;
  }

  // ============================================================
  // RÉCUPÉRATION DE LA MEILLEURE CLÉ API
  // ============================================================

  /**
   * Récupère la meilleure clé API disponible
   * @param providerName - Nom du provider spécifique (optionnel)
   * @returns La meilleure clé API ou null
   */
  async getBestApiKey(providerName?: string): Promise<APIKey | null> {
    try {
      console.log(`🔍 Recherche de la meilleure clé API${providerName ? ` pour ${providerName}` : ''}...`);

      // 1. Construire la requête
      let query = supabase
        .from('api_keys')
        .select('*, provider:ai_providers(*)')
        .eq('status', 'active');

      // 2. Si un provider spécifique est demandé
      if (providerName) {
        const { data: provider, error: providerError } = await supabase
          .from('ai_providers')
          .select('id, is_active')
          .eq('name', providerName)
          .single();

        if (providerError) {
          console.warn(`⚠️ Provider ${providerName} non trouvé, recherche de n'importe quelle clé`);
        } else if (!provider.is_active) {
          console.warn(`⚠️ Provider ${providerName} est inactif`);
          // Continuer la recherche avec d'autres providers
        } else {
          query = query.eq('provider_id', provider.id);
        }
      }

      // 3. Récupérer les clés (primaires d'abord, puis moins utilisées)
      const { data: keys, error } = await query
        .order('is_primary', { ascending: false })
        .order('usage_count', { ascending: true })
        .limit(10);

      if (error) {
        console.error('❌ Erreur récupération clés:', error);
        return null;
      }

      if (!keys || keys.length === 0) {
        console.warn('⚠️ Aucune clé API disponible');
        return null;
      }

      console.log(`📊 ${keys.length} clés trouvées`);

      // 4. Filtrer les clés avec trop d'erreurs
      const validKeys = keys.filter(k => k.error_count < 5);
      
      if (validKeys.length === 0) {
        console.warn('⚠️ Toutes les clés ont trop d\'erreurs, tentative de réinitialisation...');
        
        // Réinitialiser les clés avec erreurs
        for (const key of keys) {
          await this.resetKeyErrors(key.id);
        }
        
        // Re-tenter avec la première clé
        if (keys.length > 0) {
          console.log(`🔄 Utilisation de la clé ${keys[0].key_name} après réinitialisation`);
          return keys[0];
        }
        
        return null;
      }

      // 5. Sélectionner la meilleure clé
      const bestKey = validKeys[0];
      console.log(`✅ Clé sélectionnée: ${bestKey.provider?.display_name || 'Inconnu'} (${bestKey.key_name})`);
      console.log(`   Utilisations: ${bestKey.usage_count}, Erreurs: ${bestKey.error_count}`);
      console.log(`   Clé: ${bestKey.key_value.slice(0, 10)}...`);
      
      return bestKey;

    } catch (error) {
      console.error('❌ Erreur getBestApiKey:', error);
      return null;
    }
  }

  // ============================================================
  // RÉCUPÉRATION D'UNE CLÉ PAR PROVIDER
  // ============================================================

  async getApiKeyByProvider(providerId: string): Promise<APIKey | null> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('provider_id', providerId)
        .eq('status', 'active')
        .order('is_primary', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.warn(`⚠️ Aucune clé active pour le provider ${providerId}`);
        } else {
          console.error(`❌ Erreur récupération clé:`, error);
        }
        return null;
      }

      return data;
    } catch (error) {
      console.error(`❌ Erreur getApiKeyByProvider:`, error);
      return null;
    }
  }

  // ============================================================
  // RÉCUPÉRATION DE TOUTES LES CLÉS
  // ============================================================

  async getAllApiKeys(providerId?: string): Promise<APIKey[]> {
    try {
      let query = supabase
        .from('api_keys')
        .select('*, provider:ai_providers(*)')
        .order('created_at', { ascending: false });

      if (providerId) {
        query = query.eq('provider_id', providerId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erreur récupération clés:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erreur getAllApiKeys:', error);
      return [];
    }
  }

  // ============================================================
  // CRÉATION D'UNE CLÉ API
  // ============================================================

  async createApiKey(data: {
    provider_id: string;
    key_value: string;
    key_name?: string;
    status?: 'active' | 'inactive' | 'expired' | 'depleted';
    is_primary?: boolean;
    notes?: string;
  }): Promise<APIKey | null> {
    try {
      // Si c'est une clé primaire, désactiver les autres du même provider
      if (data.is_primary) {
        await supabase
          .from('api_keys')
          .update({ is_primary: false })
          .eq('provider_id', data.provider_id);
      }

      const { data: result, error } = await supabase
        .from('api_keys')
        .insert({
          provider_id: data.provider_id,
          key_value: data.key_value,
          key_name: data.key_name || null,
          status: data.status || 'active',
          is_primary: data.is_primary || false,
          notes: data.notes || null,
          usage_count: 0,
          monthly_usage: 0,
          daily_usage: 0,
          error_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*, provider:ai_providers(*)')
        .single();

      if (error) {
        console.error('❌ Erreur création clé:', error);
        return null;
      }

      console.log(`✅ Clé créée: ${result.key_name || 'sans nom'}`);
      return result;
    } catch (error) {
      console.error('❌ Erreur createApiKey:', error);
      return null;
    }
  }

  // ============================================================
  // MISE À JOUR D'UNE CLÉ API
  // ============================================================

  async updateApiKey(id: string, data: Partial<APIKey>): Promise<APIKey | null> {
    try {
      // Si la clé devient primaire, désactiver les autres du même provider
      if (data.is_primary) {
        const current = await this.getApiKeyById(id);
        if (current) {
          await supabase
            .from('api_keys')
            .update({ is_primary: false })
            .eq('provider_id', current.provider_id);
        }
      }

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (data.key_value !== undefined) updateData.key_value = data.key_value;
      if (data.key_name !== undefined) updateData.key_name = data.key_name;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.is_primary !== undefined) updateData.is_primary = data.is_primary;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.remaining_quota !== undefined) updateData.remaining_quota = data.remaining_quota;
      if (data.total_quota !== undefined) updateData.total_quota = data.total_quota;
      if (data.expires_at !== undefined) updateData.expires_at = data.expires_at;

      const { data: result, error } = await supabase
        .from('api_keys')
        .update(updateData)
        .eq('id', id)
        .select('*, provider:ai_providers(*)')
        .single();

      if (error) {
        console.error('❌ Erreur mise à jour clé:', error);
        return null;
      }

      console.log(`✅ Clé mise à jour: ${result.key_name || 'sans nom'}`);
      return result;
    } catch (error) {
      console.error('❌ Erreur updateApiKey:', error);
      return null;
    }
  }

  // ============================================================
  // SUPPRESSION D'UNE CLÉ API
  // ============================================================

  async deleteApiKey(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erreur suppression clé:', error);
        return false;
      }

      console.log(`✅ Clé supprimée: ${id}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur deleteApiKey:', error);
      return false;
    }
  }

  // ============================================================
  // RÉCUPÉRATION D'UNE CLÉ PAR ID
  // ============================================================

  async getApiKeyById(id: string): Promise<APIKey | null> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*, provider:ai_providers(*)')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Erreur récupération clé:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Erreur getApiKeyById:', error);
      return null;
    }
  }

  // ============================================================
  // INCRÉMENTATION DE L'UTILISATION
  // ============================================================

  async incrementUsage(apiKeyId: string, tokensUsed: number = 0): Promise<void> {
    try {
      // 1. Récupérer la clé actuelle
      const { data: current, error: fetchError } = await supabase
        .from('api_keys')
        .select('usage_count, monthly_usage, daily_usage')
        .eq('id', apiKeyId)
        .single();

      if (fetchError) {
        console.error('❌ Erreur récupération usage:', fetchError);
        return;
      }

      // 2. Mettre à jour avec les nouvelles valeurs
      const { error: updateError } = await supabase
        .from('api_keys')
        .update({
          usage_count: (current?.usage_count || 0) + 1,
          monthly_usage: (current?.monthly_usage || 0) + 1,
          daily_usage: (current?.daily_usage || 0) + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', apiKeyId);

      if (updateError) {
        console.error('❌ Erreur incrémentation usage:', updateError);
      }
    } catch (error) {
      console.error('❌ Erreur incrementUsage:', error);
    }
  }

  // ============================================================
  // MARQUAGE D'UNE ERREUR
  // ============================================================

  async markError(apiKeyId: string, errorMessage: string): Promise<void> {
    try {
      // 1. Récupérer le nombre d'erreurs actuel
      const { data: current, error: fetchError } = await supabase
        .from('api_keys')
        .select('error_count')
        .eq('id', apiKeyId)
        .single();

      if (fetchError) {
        console.error('❌ Erreur récupération erreurs:', fetchError);
        return;
      }

      const newErrorCount = (current?.error_count || 0) + 1;
      
      // 2. Mettre à jour
      const { error: updateError } = await supabase
        .from('api_keys')
        .update({
          error_count: newErrorCount,
          last_error: errorMessage,
          status: newErrorCount >= 5 ? 'inactive' : 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', apiKeyId);

      if (updateError) {
        console.error('❌ Erreur marquage erreur:', updateError);
      }
    } catch (error) {
      console.error('❌ Erreur markError:', error);
    }
  }

  // ============================================================
  // RÉINITIALISATION DES ERREURS
  // ============================================================

  async resetKeyErrors(apiKeyId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({
          error_count: 0,
          last_error: null,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', apiKeyId);

      if (error) {
        console.error('❌ Erreur réinitialisation erreurs:', error);
      } else {
        console.log(`🔄 Erreurs réinitialisées pour la clé ${apiKeyId}`);
      }
    } catch (error) {
      console.error('❌ Erreur resetKeyErrors:', error);
    }
  }

  // ============================================================
  // RÉINITIALISATION DE TOUTES LES ERREURS
  // ============================================================

  async resetAllErrors(): Promise<void> {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({
          error_count: 0,
          last_error: null,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .gt('error_count', 0);

      if (error) {
        console.error('❌ Erreur réinitialisation toutes les erreurs:', error);
      } else {
        console.log(`🔄 Toutes les erreurs ont été réinitialisées`);
      }
    } catch (error) {
      console.error('❌ Erreur resetAllErrors:', error);
    }
  }

  // ============================================================
  // STATISTIQUES DES CLÉS
  // ============================================================

  async getKeyStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    expired: number;
    depleted: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('status');

      if (error) {
        console.error('❌ Erreur statistiques:', error);
        return { total: 0, active: 0, inactive: 0, expired: 0, depleted: 0 };
      }

      const stats = {
        total: data?.length || 0,
        active: data?.filter(k => k.status === 'active').length || 0,
        inactive: data?.filter(k => k.status === 'inactive').length || 0,
        expired: data?.filter(k => k.status === 'expired').length || 0,
        depleted: data?.filter(k => k.status === 'depleted').length || 0,
      };

      return stats;
    } catch (error) {
      console.error('❌ Erreur getKeyStats:', error);
      return { total: 0, active: 0, inactive: 0, expired: 0, depleted: 0 };
    }
  }

  // ============================================================
  // STATISTIQUES PAR PROVIDER
  // ============================================================

  async getProviderKeyStats(providerId: string): Promise<{
    total: number;
    active: number;
    totalUsage: number;
    avgErrorCount: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('status, usage_count, error_count')
        .eq('provider_id', providerId);

      if (error) {
        console.error('❌ Erreur statistiques provider:', error);
        return { total: 0, active: 0, totalUsage: 0, avgErrorCount: 0 };
      }

      const total = data?.length || 0;
      const active = data?.filter(k => k.status === 'active').length || 0;
      const totalUsage = data?.reduce((acc, k) => acc + (k.usage_count || 0), 0) || 0;
      const avgErrorCount = total > 0 ? data?.reduce((acc, k) => acc + (k.error_count || 0), 0) / total : 0;

      return { total, active, totalUsage, avgErrorCount };
    } catch (error) {
      console.error('❌ Erreur getProviderKeyStats:', error);
      return { total: 0, active: 0, totalUsage: 0, avgErrorCount: 0 };
    }
  }
}

// ============================================================
// INSTANCE
// ============================================================

export const keyManagement = KeyManagementService.getInstance();