// lib/ai/quota-manager.ts

import { Quota, ProviderName } from '../api/types';

export class QuotaManager {
  private quotas: Map<ProviderName, Quota> = new Map();

  constructor() {
    // Définir les quotas par défaut
    this.setQuota('groq', { limit: 100, used: 0, resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
    this.setQuota('gemini', { limit: 50, used: 0, resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
    this.setQuota('openrouter', { limit: 200, used: 0, resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
    this.setQuota('cerebras', { limit: 100, used: 0, resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
    this.setQuota('huggingface', { limit: 50, used: 0, resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
  }

  setQuota(provider: ProviderName, quota: Partial<Quota>): void {
    const existing = this.quotas.get(provider);
    this.quotas.set(provider, {
      provider,
      limit: quota.limit ?? existing?.limit ?? 100,
      used: quota.used ?? existing?.used ?? 0,
      resetAt: quota.resetAt ?? existing?.resetAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
      remaining: (quota.limit ?? existing?.limit ?? 100) - (quota.used ?? existing?.used ?? 0),
    });
  }

  async checkQuota(provider: ProviderName): Promise<boolean> {
    const quota = this.quotas.get(provider);
    if (!quota) return true; // Pas de quota défini

    // Réinitialiser si le temps est écoulé
    if (new Date() > quota.resetAt) {
      quota.used = 0;
      quota.remaining = quota.limit;
      quota.resetAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    return quota.remaining > 0;
  }

  async consumeQuota(provider: ProviderName, tokens: number = 1): Promise<void> {
    const quota = this.quotas.get(provider);
    if (!quota) return;

    // Réinitialiser si le temps est écoulé
    if (new Date() > quota.resetAt) {
      quota.used = 0;
      quota.remaining = quota.limit;
      quota.resetAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    if (quota.remaining < tokens) {
      throw new Error(`Quota dépassé pour ${provider}`);
    }

    quota.used += tokens;
    quota.remaining -= tokens;
  }

  getQuota(provider: ProviderName): Quota | undefined {
    const quota = this.quotas.get(provider);
    if (!quota) return undefined;

    // Réinitialiser si le temps est écoulé
    if (new Date() > quota.resetAt) {
      quota.used = 0;
      quota.remaining = quota.limit;
      quota.resetAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    return quota;
  }

  getAllQuotas(): Record<ProviderName, Quota> {
    const result: Record<ProviderName, Quota> = {} as any;
    for (const [name, quota] of this.quotas) {
      result[name] = this.getQuota(name)!;
    }
    return result;
  }
}

export const quotaManager = new QuotaManager();