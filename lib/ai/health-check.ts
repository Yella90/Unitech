// lib/ai/health-check.ts

import { aiRouter } from './router';
import { ProviderHealth, ProviderName } from '../api/types';

export class AIHealthCheck {
  private interval: NodeJS.Timeout | null = null;
  private healthCache: Record<ProviderName, ProviderHealth> = {} as any;
  private isChecking = false;

  start(intervalMs: number = 60000): void {
    if (this.interval) return;

    this.interval = setInterval(async () => {
      await this.checkAll();
    }, intervalMs);

    // Exécuter immédiatement
    this.checkAll();
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  async checkAll(): Promise<Record<ProviderName, ProviderHealth>> {
    if (this.isChecking) return this.healthCache;

    this.isChecking = true;
    try {
      this.healthCache = await aiRouter.getHealth();
      console.log('✅ AI Health Check completed');
    } catch (error) {
      console.error('❌ AI Health Check failed:', error);
    } finally {
      this.isChecking = false;
    }

    return this.healthCache;
  }

  async getHealth(): Promise<Record<ProviderName, ProviderHealth>> {
    return this.healthCache;
  }

  async getAvailableProviders(): Promise<ProviderName[]> {
    const available: ProviderName[] = [];

    for (const [name, health] of Object.entries(this.healthCache)) {
      if (health.available) {
        available.push(name as ProviderName);
      }
    }

    return available;
  }
}

export const aiHealthCheck = new AIHealthCheck();