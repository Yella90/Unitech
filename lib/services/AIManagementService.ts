// lib/services/AIManagementService.ts
import { supabase } from '@/lib/supabase';
import type { 
  AIProvider, 
  APIKey, 
  AIPerformance, 
  AIError, 
  AIContextRule,
  ContextType,
  ApiKeyStatus,
  DashboardStats
} from '@/lib/types/ai-management';

export class AIManagementService {
  private static instance: AIManagementService;
  
  static getInstance(): AIManagementService {
    if (!AIManagementService.instance) {
      AIManagementService.instance = new AIManagementService();
    }
    return AIManagementService.instance;
  }

  // ============================================================
  // GESTION DES FOURNISSEURS
  // ============================================================

  async getProviders(activeOnly: boolean = true): Promise<AIProvider[]> {
    let query = supabase.from('ai_providers').select('*');
    
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query.order('priority', { ascending: false });
    
    if (error) {
      console.error('❌ Erreur récupération providers:', error);
      return [];
    }
    
    return data || [];
  }

  async getProviderById(id: string): Promise<AIProvider | null> {
    const { data, error } = await supabase
      .from('ai_providers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('❌ Erreur récupération provider:', error);
      return null;
    }
    
    return data;
  }

  async createProvider(provider: Partial<AIProvider>): Promise<AIProvider | null> {
    const { data, error } = await supabase
      .from('ai_providers')
      .insert(provider)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erreur création provider:', error);
      return null;
    }
    
    return data;
  }

  async updateProvider(id: string, updates: Partial<AIProvider>): Promise<AIProvider | null> {
    const { data, error } = await supabase
      .from('ai_providers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erreur mise à jour provider:', error);
      return null;
    }
    
    return data;
  }

  // ============================================================
  // GESTION DES CLÉS API
  // ============================================================

  async getApiKeys(providerId?: string): Promise<APIKey[]> {
    let query = supabase.from('api_keys').select('*, provider:ai_providers(*)');
    
    if (providerId) {
      query = query.eq('provider_id', providerId);
    }
    
    const { data, error } = await query.order('is_primary', { ascending: false });
    
    if (error) {
      console.error('❌ Erreur récupération clés API:', error);
      return [];
    }
    
    return data || [];
  }

  async getApiKeyById(id: string): Promise<APIKey | null> {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*, provider:ai_providers(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('❌ Erreur récupération clé API:', error);
      return null;
    }
    
    return data;
  }

  async getActiveApiKey(providerId: string): Promise<APIKey | null> {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*, provider:ai_providers(*)')
      .eq('provider_id', providerId)
      .eq('status', 'active')
      .order('is_primary', { ascending: false })
      .order('usage_count', { ascending: true })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('❌ Erreur récupération clé active:', error);
      return null;
    }
    
    return data;
  }

  async createApiKey(data: Partial<APIKey>): Promise<APIKey | null> {
    const { data: result, error } = await supabase
      .from('api_keys')
      .insert({
        provider_id: data.provider_id,
        key_value: data.key_value,
        key_name: data.key_name || null,
        status: data.status || 'active',
        is_primary: data.is_primary || false,
        notes: data.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*, provider:ai_providers(*)')
      .single();
    
    if (error) {
      console.error('❌ Erreur création clé API:', error);
      return null;
    }
    
    return result;
  }

  async updateApiKey(id: string, updates: Partial<APIKey>): Promise<APIKey | null> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.key_name !== undefined) updateData.key_name = updates.key_name;
    if (updates.key_value !== undefined) updateData.key_value = updates.key_value;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.is_primary !== undefined) updateData.is_primary = updates.is_primary;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.remaining_quota !== undefined) updateData.remaining_quota = updates.remaining_quota;
    if (updates.total_quota !== undefined) updateData.total_quota = updates.total_quota;
    if (updates.expires_at !== undefined) updateData.expires_at = updates.expires_at;

    const { data, error } = await supabase
      .from('api_keys')
      .update(updateData)
      .eq('id', id)
      .select('*, provider:ai_providers(*)')
      .single();
    
    if (error) {
      console.error('❌ Erreur mise à jour clé API:', error);
      return null;
    }
    
    return data;
  }

  async deleteApiKey(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('❌ Erreur suppression clé API:', error);
      return false;
    }
    
    return true;
  }

  // ✅ CORRECTION: Remplacer supabase.raw() par une requête séparée
  async incrementApiUsage(apiKeyId: string, tokensUsed: number = 0): Promise<void> {
    try {
      // 1. Récupérer la clé actuelle
      const { data: current, error: fetchError } = await supabase
        .from('api_keys')
        .select('usage_count, monthly_usage, daily_usage')
        .eq('id', apiKeyId)
        .single();

      if (fetchError) {
        console.error('❌ Erreur récupération clé:', fetchError);
        return;
      }

      // 2. Mettre à jour avec les nouvelles valeurs
      const { error } = await supabase
        .from('api_keys')
        .update({
          usage_count: (current?.usage_count || 0) + 1,
          monthly_usage: (current?.monthly_usage || 0) + 1,
          daily_usage: (current?.daily_usage || 0) + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', apiKeyId);

      if (error) {
        console.error('❌ Erreur incrémentation usage:', error);
      }
    } catch (error) {
      console.error('❌ Erreur incrementApiUsage:', error);
    }
  }

  async markApiKeyError(apiKeyId: string, errorMessage: string): Promise<void> {
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
      const { error } = await supabase
        .from('api_keys')
        .update({
          error_count: newErrorCount,
          last_error: errorMessage,
          status: newErrorCount >= 5 ? 'inactive' : 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', apiKeyId);

      if (error) {
        console.error('❌ Erreur marquage erreur:', error);
      }
    } catch (error) {
      console.error('❌ Erreur markApiKeyError:', error);
    }
  }

  // ============================================================
  // PERFORMANCES
  // ============================================================

  async logPerformance(data: Partial<AIPerformance>): Promise<void> {
    const { error } = await supabase
      .from('ai_performance')
      .insert({
        provider_id: data.provider_id,
        api_key_id: data.api_key_id,
        model: data.model || 'unknown',
        request_type: data.request_type || 'general',
        duration_ms: data.duration_ms || 0,
        tokens_input: data.tokens_input || 0,
        tokens_output: data.tokens_output || 0,
        tokens_total: data.tokens_total || 0,
        cost: data.cost || 0,
        success: data.success !== undefined ? data.success : true,
        error_message: data.error_message || null,
        response_time: data.response_time || data.duration_ms || 0,
        timestamp: data.timestamp || new Date().toISOString(),
        session_id: data.session_id || null,
        context: data.context || null,
        metadata: data.metadata || {}
      });
    
    if (error) {
      console.error('❌ Erreur log performance:', error);
    }
  }

  async getProviderPerformance(
    providerId: string, 
    limit: number = 100
  ): Promise<AIPerformance[]> {
    const { data, error } = await supabase
      .from('ai_performance')
      .select('*')
      .eq('provider_id', providerId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('❌ Erreur récupération performances:', error);
      return [];
    }
    
    return data || [];
  }

  async getPerformanceStats(providerId: string, days: number = 7): Promise<{
    total: number;
    successRate: number;
    avgDuration: number;
    avgCost: number;
    totalTokens: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('ai_performance')
      .select('*')
      .eq('provider_id', providerId)
      .gte('timestamp', startDate.toISOString());
    
    if (error || !data) {
      return { total: 0, successRate: 0, avgDuration: 0, avgCost: 0, totalTokens: 0 };
    }

    const total = data.length;
    if (total === 0) {
      return { total: 0, successRate: 0, avgDuration: 0, avgCost: 0, totalTokens: 0 };
    }

    const successCount = data.filter(p => p.success).length;
    const totalDuration = data.reduce((acc, p) => acc + (p.duration_ms || 0), 0);
    const totalCost = data.reduce((acc, p) => acc + (p.cost || 0), 0);
    const totalTokens = data.reduce((acc, p) => acc + (p.tokens_total || 0), 0);

    return {
      total,
      successRate: successCount / total,
      avgDuration: totalDuration / total,
      avgCost: totalCost / total,
      totalTokens
    };
  }

  // ============================================================
  // ERREURS
  // ============================================================

  async logError(errorData: Partial<AIError>): Promise<void> {
    const { error } = await supabase
      .from('ai_errors')
      .insert({
        provider_id: errorData.provider_id,
        api_key_id: errorData.api_key_id,
        error_type: errorData.error_type || 'api_error',
        error_message: errorData.error_message || 'Unknown error',
        status_code: errorData.status_code || 500,
        request_data: errorData.request_data || {},
        response_data: errorData.response_data || {},
        resolved: false,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('❌ Erreur log erreur:', error);
    }
  }

  async getRecentErrors(limit: number = 10): Promise<AIError[]> {
    const { data, error } = await supabase
      .from('ai_errors')
      .select('*, provider:ai_providers(*), key:api_keys(*)')
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('❌ Erreur récupération erreurs:', error);
      return [];
    }
    
    return data || [];
  }

  async resolveError(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('ai_errors')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      console.error('❌ Erreur résolution erreur:', error);
      return false;
    }
    
    return true;
  }

  // ============================================================
  // CONTEXT RULES
  // ============================================================

  async getContextRules(contextType: ContextType): Promise<AIContextRule[]> {
    const { data, error } = await supabase
      .from('ai_context_rules')
      .select('*, provider:ai_providers(*)')
      .eq('context_type', contextType)
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('score', { ascending: false });
    
    if (error) {
      console.error('❌ Erreur récupération règles:', error);
      return [];
    }
    
    return data || [];
  }

  async createContextRule(rule: Partial<AIContextRule>): Promise<AIContextRule | null> {
    const { data, error } = await supabase
      .from('ai_context_rules')
      .insert({
        context_type: rule.context_type,
        provider_id: rule.provider_id,
        model: rule.model || 'default',
        priority: rule.priority || 0,
        conditions: rule.conditions || {},
        score: rule.score || 0,
        is_active: rule.is_active !== undefined ? rule.is_active : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*, provider:ai_providers(*)')
      .single();
    
    if (error) {
      console.error('❌ Erreur création règle:', error);
      return null;
    }
    
    return data;
  }

  // ============================================================
  // STATISTIQUES
  // ============================================================

  async getDashboardStats(): Promise<DashboardStats> {
    const providers = await this.getProviders(false);
    const keys = await this.getApiKeys();
    
    const providerStats = await Promise.all(
      providers.map(async (provider) => {
        const providerKeys = keys.filter(k => k.provider_id === provider.id);
        const perf = await this.getProviderPerformance(provider.id, 50);
        
        const successCount = perf.filter(p => p.success).length;
        const totalDuration = perf.reduce((acc, p) => acc + (p.duration_ms || 0), 0);
        
        return {
          provider,
          keyCount: providerKeys.length,
          activeKeys: providerKeys.filter(k => k.status === 'active').length,
          totalUsage: providerKeys.reduce((acc, k) => acc + (k.usage_count || 0), 0),
          errorRate: perf.length > 0 ? (perf.length - successCount) / perf.length : 0,
          avgResponseTime: perf.length > 0 ? totalDuration / perf.length : 0
        };
      })
    );

    const recentErrors = await this.getRecentErrors(10);

    return {
      totalProviders: providers.length,
      activeProviders: providers.filter(p => p.is_active).length,
      totalKeys: keys.length,
      activeKeys: keys.filter(k => k.status === 'active').length,
      providerStats,
      recentErrors,
      performanceOverview: {
        avgResponseTime: providerStats.reduce((acc, p) => acc + p.avgResponseTime, 0) / (providerStats.length || 1),
        successRate: providerStats.reduce((acc, p) => acc + (1 - p.errorRate), 0) / (providerStats.length || 1),
        totalRequests: providerStats.reduce((acc, p) => acc + p.totalUsage, 0)
      }
    };
  }

  async getProviderRanking(contextType: ContextType = 'general', limit: number = 10): Promise<any[]> {
    const rules = await this.getContextRules(contextType);
    const providers = await this.getProviders(true);
    
    const ranked = await Promise.all(
      providers.map(async (provider) => {
        const key = await this.getActiveApiKey(provider.id);
        if (!key) return null;

        const perf = await this.getPerformanceStats(provider.id, 7);
        const rule = rules.find(r => r.provider_id === provider.id);
        
        let score = 0;
        score += provider.priority || 0;
        if (rule) score += rule.score || 0;
        if (perf.successRate > 0.9) score += 20;
        score -= (key.error_count || 0) * 5;

        return {
          provider,
          key,
          score,
          performance: perf,
          rule
        };
      })
    );

    return ranked
      .filter(item => item !== null)
      .sort((a, b) => (b?.score || 0) - (a?.score || 0))
      .slice(0, limit);
  }

  // ============================================================
  // GETTERS
  // ============================================================

  async getApiKeyStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    expired: number;
    depleted: number;
  }> {
    const keys = await this.getApiKeys();
    
    return {
      total: keys.length,
      active: keys.filter(k => k.status === 'active').length,
      inactive: keys.filter(k => k.status === 'inactive').length,
      expired: keys.filter(k => k.status === 'expired').length,
      depleted: keys.filter(k => k.status === 'depleted').length
    };
  }
}

export const aiManagement = AIManagementService.getInstance();