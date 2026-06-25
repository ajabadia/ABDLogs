/**
 * @purpose Gestiona evaluación y operaciones de ciclo de vida para registros de inquilinos.
 * @purpose_en Manages alert evaluation and lifecycle operations for tenant logs.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:5,sig:115awj
 * @lastUpdated 2026-06-23T23:06:35.513Z
 */

import { connectDB } from '@ajabadia/satellite-sdk/db';
import { AlertThreshold, IAlertThreshold } from '@/models/AlertThreshold';
import { AlertEvent, IAlertEvent } from '@/models/AlertEvent';
import { AuditLog, IAuditLog } from '@/models/AuditLog';
import { thresholdCache } from './threshold-cache';

export class AlertService {
  /**
   * Evaluate a newly ingested log against all enabled thresholds for its tenant.
   * Uses in-memory ThresholdCache to avoid per-log DB queries, and parallelizes
   * count/find queries via Promise.all.
   * Returns any newly created AlertEvent documents.
   */
  static async evaluateLog(log: IAuditLog): Promise<IAlertEvent[]> {
    try {
      const tenantId = log.tenantId || 'SYSTEM';

      // 1. Get thresholds from cache — 0 DB queries if fresh (< 30s)
      const thresholds = await thresholdCache.get(tenantId);
      if (thresholds.length === 0) return [];

      // 2. In-memory filter — appId match, condition match, cooldown check
      const now = Date.now();
      const relevant = thresholds.filter(th => {
        if (th.appId && th.appId !== log.appId) return false;
        if (!AlertService.matchesCondition(log, th)) return false;
        if (th.lastTriggeredAt) {
          const cooldownMs = th.cooldownMinutes * 60 * 1000;
          if (now - new Date(th.lastTriggeredAt).getTime() < cooldownMs) return false;
        }
        return true;
      });

      if (relevant.length === 0) return [];

      // 3. Build match filters for each relevant threshold
      const filters = relevant.map(th => ({
        threshold: th,
        filter: AlertService.buildMatchFilter(tenantId, th, now),
      }));

      // 4. Parallel count queries — one per threshold, concurrent I/O
      const countResults = await Promise.all(
        filters.map(({ filter }) => AuditLog.countDocuments(filter))
      );

      // 5. Identify triggered thresholds and fetch matching log IDs in parallel
      const triggeredEntries: { threshold: IAlertThreshold; matchCount: number; matchingLogIds: string[] }[] = [];

      await Promise.all(
        filters.map(async ({ threshold, filter }, idx) => {
          const matchCount = countResults[idx];
          if (matchCount < threshold.threshold) return;

          const matchingLogs = await AuditLog.find(filter)
            .sort({ createdAt: -1 })
            .limit(50)
            .select('_id')
            .lean();

          triggeredEntries.push({
            threshold,
            matchCount,
            matchingLogIds: matchingLogs.map(l => (l as unknown as { _id: { toString(): string } })._id.toString()),
          });
        })
      );

      if (triggeredEntries.length === 0) return [];

      // 6. Create alert events and update lastTriggeredAt in parallel
      const newAlerts = await Promise.all(
        triggeredEntries.map(async ({ threshold, matchCount, matchingLogIds }) => {
          const [alertEvent] = await Promise.all([
            AlertEvent.create({
              tenantId,
              thresholdId: String(threshold._id),
              thresholdName: threshold.name,
              severity: threshold.severity,
              status: 'ACTIVE',
              message: `[${threshold.severity}] ${threshold.name}: ${matchCount} ocurrencias de "${threshold.field} = ${threshold.value}" en ${threshold.windowMinutes}min (límite: ${threshold.threshold})`,
              appId: log.appId,
              matchCount,
              windowMinutes: threshold.windowMinutes,
              matchingLogIds,
              createdAt: new Date(),
            }),
            AlertThreshold.updateOne(
              { _id: threshold._id },
              { $set: { lastTriggeredAt: new Date() } }
            ),
          ]);
          return alertEvent.toObject();
        })
      );

      return newAlerts;
    } catch (err) {
      console.error('[ALERT_SERVICE_ERROR] Failed to evaluate log:', err);
      return [];
    }
  }

  /**
   * Build a MongoDB filter for counting matching logs.
   */
  private static buildMatchFilter(
    tenantId: string,
    threshold: IAlertThreshold,
    now: number
  ): Record<string, unknown> {
    const windowStart = new Date(now - threshold.windowMinutes * 60 * 1000);
    const filter: Record<string, unknown> = {
      tenantId,
      createdAt: { $gte: windowStart },
      [threshold.field]: threshold.value,
    };
    if (threshold.appId) filter.appId = threshold.appId;
    return filter;
  }

  /**
   * Check if a log matches a threshold condition.
   */
  private static matchesCondition(log: IAuditLog, threshold: IAlertThreshold): boolean {
    const fieldValue = (log as unknown as Record<string, unknown>)[threshold.field] as string | undefined;
    if (fieldValue === undefined) return false;

    switch (threshold.operator) {
      case 'eq': return fieldValue === threshold.value;
      case 'neq': return fieldValue !== threshold.value;
      case 'gt': return fieldValue > threshold.value;
      case 'gte': return fieldValue >= threshold.value;
      case 'lt': return fieldValue < threshold.value;
      case 'lte': return fieldValue <= threshold.value;
      default: return false;
    }
  }

  /**
   * Get active alerts for a tenant.
   */
  static async getActiveAlerts(tenantId: string, limit = 20): Promise<IAlertEvent[]> {
    try {
      await connectDB();
      const filter: Record<string, unknown> = { tenantId, status: 'ACTIVE' };
      const alerts = await AlertEvent.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      return alerts.map(doc => ({ ...doc, _id: doc._id.toString() })) as unknown as IAlertEvent[];
    } catch (err) {
      console.error('[ALERT_SERVICE_GET_ACTIVE_ERROR]', err);
      return [];
    }
  }

  /**
   * Get alert history for a tenant (all statuses).
   */
  static async getAlertHistory(tenantId: string, limit = 50): Promise<IAlertEvent[]> {
    try {
      await connectDB();
      const alerts = await AlertEvent.find({ tenantId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      return alerts.map(doc => ({ ...doc, _id: doc._id.toString() })) as unknown as IAlertEvent[];
    } catch (err) {
      console.error('[ALERT_SERVICE_HISTORY_ERROR]', err);
      return [];
    }
  }

  /**
   * Get all thresholds for a tenant.
   */
  static async getThresholds(tenantId: string): Promise<IAlertThreshold[]> {
    try {
      await connectDB();
      return await AlertThreshold.find({ tenantId }).sort({ createdAt: -1 }).lean();
    } catch (err) {
      console.error('[ALERT_SERVICE_THRESHOLDS_ERROR]', err);
      return [];
    }
  }

  /**
   * Create or update a threshold.
   */
  static async upsertThreshold(
    tenantId: string,
    data: Partial<IAlertThreshold> & { name: string }
  ): Promise<IAlertThreshold | null> {
    try {
      await connectDB();
      const filter = { tenantId, name: data.name };
      const update = { ...data, tenantId };
      const threshold = await AlertThreshold.findOneAndUpdate(
        filter,
        { $set: update },
        { upsert: true, new: true }
      ).lean();
      return threshold;
    } catch (err) {
      console.error('[ALERT_SERVICE_UPSERT_THRESHOLD_ERROR]', err);
      return null;
    }
  }

  /**
   * Delete a threshold.
   */
  static async deleteThreshold(thresholdId: string, tenantId: string): Promise<boolean> {
    try {
      await connectDB();
      const result = await AlertThreshold.deleteOne({ _id: thresholdId, tenantId });
      return result.deletedCount > 0;
    } catch (err) {
      console.error('[ALERT_SERVICE_DELETE_THRESHOLD_ERROR]', err);
      return false;
    }
  }

  /**
   * Acknowledge an alert.
   */
  static async acknowledgeAlert(alertId: string, tenantId: string, userId: string): Promise<boolean> {
    try {
      await connectDB();
      const result = await AlertEvent.updateOne(
        { _id: alertId, tenantId },
        { $set: { status: 'ACKNOWLEDGED', acknowledgedBy: userId, acknowledgedAt: new Date() } }
      );
      return result.modifiedCount > 0;
    } catch (err) {
      console.error('[ALERT_SERVICE_ACK_ERROR]', err);
      return false;
    }
  }

  /**
   * Resolve an alert.
   */
  static async resolveAlert(alertId: string, tenantId: string): Promise<boolean> {
    try {
      await connectDB();
      const result = await AlertEvent.updateOne(
        { _id: alertId, tenantId },
        { $set: { status: 'RESOLVED', resolvedAt: new Date() } }
      );
      return result.modifiedCount > 0;
    } catch (err) {
      console.error('[ALERT_SERVICE_RESOLVE_ERROR]', err);
      return false;
    }
  }
}
