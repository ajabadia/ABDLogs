/**
 * @purpose Gestiona un caché de memoria para los umbrales de alertas, proporcionando una forma de obtener y invalidar datos almacenados en caché según el ID del inquilino.
 * @purpose_en Manages an in-memory cache for alert thresholds, providing a way to fetch and invalidate cached data based on tenant ID.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:1qjss1s
 * @lastUpdated 2026-06-23T23:06:51.267Z
 */

import { connectDB } from '@ajabadia/satellite-sdk/db';
import { AlertThreshold, IAlertThreshold } from '@/models/AlertThreshold';

/**
 * In-memory cache for alert thresholds.
 * 
 * Avoids N+1 queries by caching thresholds per tenant with a configurable TTL.
 * The cache is invalidated whenever thresholds are created, updated, or deleted.
 */
class ThresholdCache {
  private cache = new Map<string, { thresholds: IAlertThreshold[]; cachedAt: number }>();
  private ttlMs: number;

  constructor(ttlMs = 30_000) {
    this.ttlMs = ttlMs;
  }

  /**
   * Get enabled thresholds for a tenant.
   * Returns cached thresholds if fresh, otherwise fetches from DB.
   */
  async get(tenantId: string): Promise<IAlertThreshold[]> {
    const entry = this.cache.get(tenantId);
    const now = Date.now();

    if (entry && now - entry.cachedAt < this.ttlMs) {
      return entry.thresholds;
    }

    // Cache miss or stale — fetch from DB
    try {
      await connectDB();
      const thresholds = await AlertThreshold.find({ tenantId, enabled: true }).lean();
      const result = thresholds as unknown as IAlertThreshold[];
      this.cache.set(tenantId, { thresholds: result, cachedAt: now });
      return result;
    } catch (err) {
      console.error('[THRESHOLD_CACHE_FETCH_ERROR]', err);
      // Return stale cache if available, otherwise empty
      return entry?.thresholds ?? [];
    }
  }

  /**
   * Invalidate the cache for a specific tenant.
   * Called after any threshold CRUD operation.
   */
  invalidate(tenantId: string): void {
    this.cache.delete(tenantId);
  }

  /**
   * Clear the entire cache (e.g., in tests).
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the number of cached entries (for monitoring).
   */
  get size(): number {
    return this.cache.size;
  }
}

// Singleton instance
export const thresholdCache = new ThresholdCache();
