/**
 * @purpose Gestiona el detectar y procesar anomalías en registros de inquilinos, incluyendo calcular estadísticas, verificar cooldowns y generar informes de anomalía.
 * @purpose_en Manages the detection and processing of anomalies in tenant logs, including computing statistics, checking cooldowns, and generating anomaly reports.
 * @refactorable true (contains multiple functions with distinct responsibilities)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:4,sig:po2xaf
 * @lastUpdated 2026-06-26T10:00:26.769Z
 */

import { connectDB } from '@ajabadia/satellite-sdk/db';
import { AuditLog } from '@/models/AuditLog';
import { AlertEvent } from '@/models/AlertEvent';
import { AnomalyRecord, IAnomalyRecord, AnomalyType, AnomalySeverity } from '@/models/AnomalyRecord';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AnomalyResult {
  type: AnomalyType;
  severity: AnomalySeverity;
  tenantId: string;
  userId?: string;
  ipAddress?: string;
  appId?: string;
  description: string;
  count: number;
  detectedAt: Date;
  relatedLogIds: string[];
}

interface RawLog {
  _id: { toString(): string };
  action?: string;
  userId?: string;
  ipAddress?: string;
  appId?: string;
  tenantId?: string;
  createdAt?: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Compute mean and standard deviation for a numeric series. */
function computeStats(values: number[]): { mean: number; std: number } {
  if (values.length === 0) return { mean: 0, std: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return { mean, std: Math.sqrt(variance) };
}

/** Check whether a date falls within off-hours (00:00–06:00 UTC). */
function isOffHours(date: Date): boolean {
  const hour = date.getUTCHours();
  return hour >= 0 && hour < 6;
}

/**
 * Check cooldown: returns true if an OPEN anomaly of the same type
 * already exists for this tenant/userId/ip within the last 30 minutes.
 */
async function isCooledDown(
  tenantId: string,
  type: AnomalyType,
  userId?: string,
  ipAddress?: string
): Promise<boolean> {
  const since = new Date(Date.now() - 30 * 60 * 1000);
  const existing = await AnomalyRecord.findOne({
    tenantId,
    type,
    status: 'OPEN',
    detectedAt: { $gte: since },
    ...(userId ? { userId } : {}),
    ...(ipAddress ? { ipAddress } : {}),
  });
  return existing !== null;
}

// ─── Detectors ────────────────────────────────────────────────────────────────

/**
 * Detector 1 — BRUTE_FORCE
 * Flags users/IPs with LOGIN_FAILED bursts > mean + 3σ in a 15-min window.
 */
async function detectBruteForce(tenantId: string, now: Date): Promise<AnomalyResult[]> {
  const windowStart = new Date(now.getTime() - 15 * 60 * 1000);
  const filter: Record<string, unknown> = {
    action: 'LOGIN_FAILED',
    createdAt: { $gte: windowStart },
  };
  if (tenantId !== 'SYSTEM') filter.tenantId = tenantId;

  // Group by userId + ipAddress to compute per-actor counts
  const groups = await AuditLog.aggregate<{ _id: { userId: string; ipAddress: string }; count: number; logIds: string[] }>([
    { $match: filter },
    {
      $group: {
        _id: { userId: '$userId', ipAddress: '$ipAddress' },
        count: { $sum: 1 },
        logIds: { $push: { $toString: '$_id' } },
      },
    },
  ]);

  if (groups.length === 0) return [];

  const counts = groups.map(g => g.count);
  const { mean, std } = computeStats(counts);
  const threshold = mean + 3 * std;
  // Minimum absolute threshold to avoid false positives on tiny datasets
  const minThreshold = Math.max(threshold, 5);

  const results: AnomalyResult[] = [];
  for (const g of groups) {
    if (g.count < minThreshold) continue;
    const cooled = await isCooledDown(tenantId, 'BRUTE_FORCE', g._id.userId, g._id.ipAddress);
    if (cooled) continue;
    results.push({
      type: 'BRUTE_FORCE',
      severity: g.count >= mean + 5 * std ? 'CRITICAL' : 'HIGH',
      tenantId,
      userId: g._id.userId,
      ipAddress: g._id.ipAddress,
      description: `Ráfaga de autenticación fallida detectada: ${g.count} intentos en 15 min (umbral estadístico: ${minThreshold.toFixed(1)})`,
      count: g.count,
      detectedAt: now,
      relatedLogIds: g.logIds.slice(0, 50),
    });
  }
  return results;
}

/**
 * Detector 2 — MASS_DELETION
 * Flags tenants with DELETE/PURGE actions > mean + 2σ in a 60-min window.
 */
async function detectMassiveDeletion(tenantId: string, now: Date): Promise<AnomalyResult[]> {
  const windowStart = new Date(now.getTime() - 60 * 60 * 1000);
  const filter: Record<string, unknown> = {
    action: { $in: ['DOCUMENT_DELETED', 'DOCUMENT_PURGED', 'LOG_ERASED', 'GDPR_FORGET'] },
    createdAt: { $gte: windowStart },
  };
  if (tenantId !== 'SYSTEM') filter.tenantId = tenantId;

  const groups = await AuditLog.aggregate<{ _id: string; count: number; logIds: string[] }>([
    { $match: filter },
    {
      $group: {
        _id: '$tenantId',
        count: { $sum: 1 },
        logIds: { $push: { $toString: '$_id' } },
      },
    },
  ]);

  if (groups.length === 0) return [];

  const counts = groups.map(g => g.count);
  const { mean, std } = computeStats(counts);
  const threshold = Math.max(mean + 2 * std, 10);

  const results: AnomalyResult[] = [];
  for (const g of groups) {
    const tid = tenantId !== 'SYSTEM' ? tenantId : g._id;
    if (g.count < threshold) continue;
    const cooled = await isCooledDown(tid, 'MASS_DELETION');
    if (cooled) continue;
    results.push({
      type: 'MASS_DELETION',
      severity: g.count >= threshold * 2 ? 'CRITICAL' : 'HIGH',
      tenantId: tid,
      description: `Borrado masivo detectado: ${g.count} operaciones de eliminación en 60 min (umbral: ${threshold.toFixed(1)})`,
      count: g.count,
      detectedAt: now,
      relatedLogIds: g.logIds.slice(0, 50),
    });
  }
  return results;
}

/**
 * Detector 3 — OFF_HOURS
 * Flags successful logins between 00:00–06:00 UTC from IPs not seen in the last 7 days.
 */
async function detectOffHoursAccess(tenantId: string, now: Date): Promise<AnomalyResult[]> {
  if (!isOffHours(now)) return [];

  const windowStart = new Date(now.getTime() - 15 * 60 * 1000);
  const filter: Record<string, unknown> = {
    action: 'LOGIN_SUCCESS',
    createdAt: { $gte: windowStart },
  };
  if (tenantId !== 'SYSTEM') filter.tenantId = tenantId;

  const recentLogins = await AuditLog.find(filter)
    .select('_id userId ipAddress appId tenantId')
    .lean<RawLog[]>();

  if (recentLogins.length === 0) return [];

  // Fetch IPs seen for each user in the last 7 days (excluding current window)
  const results: AnomalyResult[] = [];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  for (const log of recentLogins) {
    if (!log.userId || !log.ipAddress) continue;
    const knownIpFilter: Record<string, unknown> = {
      userId: log.userId,
      action: 'LOGIN_SUCCESS',
      createdAt: { $gte: sevenDaysAgo, $lt: windowStart },
    };
    if (tenantId !== 'SYSTEM' && log.tenantId) knownIpFilter.tenantId = log.tenantId;

    const historicIps = await AuditLog.distinct('ipAddress', knownIpFilter) as string[];
    if (historicIps.includes(log.ipAddress)) continue; // Known IP — not anomalous

    const logTenantId = log.tenantId ?? tenantId;

    const cooled = await isCooledDown(logTenantId, 'OFF_HOURS', log.userId, log.ipAddress);
    if (cooled) continue;

    results.push({
      type: 'OFF_HOURS',
      severity: 'MEDIUM',
      tenantId: logTenantId,
      userId: log.userId,
      ipAddress: log.ipAddress,
      appId: log.appId,
      description: `Acceso fuera de horario habitual (00:00–06:00 UTC) desde IP desconocida ${log.ipAddress}`,
      count: 1,
      detectedAt: now,
      relatedLogIds: [log._id.toString()],
    });
  }
  return results;
}

/**
 * Detector 4 — NEW_IP
 * Flags users whose current session IP has never been seen in the last 30 days.
 */
async function detectNewIpAnomaly(tenantId: string, now: Date): Promise<AnomalyResult[]> {
  const windowStart = new Date(now.getTime() - 15 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const filter: Record<string, unknown> = {
    action: 'LOGIN_SUCCESS',
    createdAt: { $gte: windowStart },
  };
  if (tenantId !== 'SYSTEM') filter.tenantId = tenantId;

  const recentLogins = await AuditLog.find(filter)
    .select('_id userId ipAddress appId tenantId')
    .lean<RawLog[]>();

  const results: AnomalyResult[] = [];

  for (const log of recentLogins) {
    if (!log.userId || !log.ipAddress) continue;

    const historicFilter: Record<string, unknown> = {
      userId: log.userId,
      ipAddress: log.ipAddress,
      action: 'LOGIN_SUCCESS',
      createdAt: { $gte: thirtyDaysAgo, $lt: windowStart },
    };

    const logTenantId = log.tenantId ?? tenantId;

    if (logTenantId !== 'SYSTEM') historicFilter.tenantId = logTenantId;

    const previousCount = await AuditLog.countDocuments(historicFilter);
    if (previousCount > 0) continue; // IP seen before — not anomalous

    const cooled = await isCooledDown(logTenantId, 'NEW_IP', log.userId, log.ipAddress);
    if (cooled) continue;

    results.push({
      type: 'NEW_IP',
      severity: 'LOW',
      tenantId: logTenantId,
      userId: log.userId,
      ipAddress: log.ipAddress,
      appId: log.appId,
      description: `IP nunca vista en 30 días para el usuario ${log.userId}: ${log.ipAddress}`,
      count: 1,
      detectedAt: now,
      relatedLogIds: [log._id.toString()],
    });
  }
  return results;
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export class AnomalyEngine {
  /**
   * Run all 4 detectors for the given tenant, persist new AnomalyRecords,
   * and return the list of newly created anomalies.
   * When `createAlerts` is true, HIGH/CRITICAL anomalies also create AlertEvent entries
   * so they appear on the Alert History panel.
   */
  static async runFullScan(tenantId: string, createAlerts = false): Promise<IAnomalyRecord[]> {
    await connectDB();
    const now = new Date();

    // Run all detectors in parallel
    const [bruteForce, massDeletion, offHours, newIp] = await Promise.all([
      detectBruteForce(tenantId, now),
      detectMassiveDeletion(tenantId, now),
      detectOffHoursAccess(tenantId, now),
      detectNewIpAnomaly(tenantId, now),
    ]);

    const allDetected: AnomalyResult[] = [
      ...bruteForce,
      ...massDeletion,
      ...offHours,
      ...newIp,
    ];

    if (allDetected.length === 0) return [];

    // Persist to DB
    const inserted = await AnomalyRecord.insertMany(
      allDetected.map(a => ({
        tenantId: a.tenantId,
        type: a.type,
        severity: a.severity,
        status: 'OPEN',
        userId: a.userId,
        ipAddress: a.ipAddress,
        appId: a.appId,
        description: a.description,
        count: a.count,
        detectedAt: a.detectedAt,
        relatedLogIds: a.relatedLogIds,
      })),
      { ordered: false } // Continue even if some fail due to cooldown race
    );

    const records = inserted.map(doc => ({ ...doc.toObject(), _id: doc._id.toString() })) as IAnomalyRecord[];

    // Optionally escalate HIGH/CRITICAL anomalies to AlertEvent
    if (createAlerts) {
      const escalable = records.filter(r => r.severity === 'HIGH' || r.severity === 'CRITICAL');
      if (escalable.length > 0) {
        await Promise.all(
          escalable.map(r =>
            AlertEvent.create({
              tenantId: r.tenantId,
              thresholdId: `anomaly:${r.type}`,
              thresholdName: `Anomalía: ${r.type}`,
              severity: r.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
              status: 'ACTIVE',
              message: r.description,
              appId: r.appId || 'abdlogs',
              matchCount: r.count,
              windowMinutes: 60,
              matchingLogIds: r.relatedLogIds || [],
              createdAt: new Date(),
            }).catch(err => {
              console.error(`[ANOMALY_ESCALATE] Failed to create AlertEvent for ${r._id}:`, err);
            })
          )
        );
      }
    }

    return records;
  }

  /**
   * Retrieve open anomalies for a tenant with optional status filter.
   */
  static async getAnomalies(
    tenantId: string,
    status: 'OPEN' | 'DISMISSED' | 'RESOLVED' | 'ALL' = 'OPEN',
    limit = 50
  ): Promise<IAnomalyRecord[]> {
    await connectDB();
    const filter: Record<string, unknown> = {};
    if (tenantId !== 'SYSTEM') filter.tenantId = tenantId;
    if (status !== 'ALL') filter.status = status;

    const records = await AnomalyRecord.find(filter)
      .sort({ detectedAt: -1 })
      .limit(limit)
      .lean();

    return records.map(r => ({ ...r, _id: r._id.toString() })) as IAnomalyRecord[];
  }

  /**
   * Dismiss a specific anomaly.
   */
  static async dismissAnomaly(anomalyId: string, tenantId: string): Promise<boolean> {
    await connectDB();
    const filter: Record<string, unknown> = { _id: anomalyId };
    if (tenantId !== 'SYSTEM') filter.tenantId = tenantId;
    const result = await AnomalyRecord.updateOne(filter, {
      $set: { status: 'DISMISSED', dismissedAt: new Date() },
    });
    return result.modifiedCount > 0;
  }

  /**
   * Build a structured SOC2 executive report for the tenant.
   */
  static async buildSoc2Report(tenantId: string, days = 30): Promise<Record<string, unknown>> {
    await connectDB();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const logFilter: Record<string, unknown> = { createdAt: { $gte: since } };
    if (tenantId !== 'SYSTEM') logFilter.tenantId = tenantId;

    const anomalyFilter: Record<string, unknown> = { detectedAt: { $gte: since } };
    if (tenantId !== 'SYSTEM') anomalyFilter.tenantId = tenantId;

    const [
      totalLogs,
      byAppId,
      topIps,
      anomaliesOpen,
      anomaliesResolved,
      anomaliesDismissed,
      recentGdpr,
    ] = await Promise.all([
      AuditLog.countDocuments(logFilter),

      AuditLog.aggregate<{ _id: string; count: number }>([
        { $match: logFilter },
        { $group: { _id: '$appId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      AuditLog.aggregate<{ _id: string; count: number }>([
        { $match: { ...logFilter, ipAddress: { $exists: true, $ne: null } } },
        { $group: { _id: '$ipAddress', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),

      AnomalyRecord.countDocuments({ ...anomalyFilter, status: 'OPEN' }),
      AnomalyRecord.countDocuments({ ...anomalyFilter, status: 'RESOLVED' }),
      AnomalyRecord.countDocuments({ ...anomalyFilter, status: 'DISMISSED' }),

      AuditLog.find({ ...logFilter, action: { $in: ['GDPR_FORGET', 'LOG_ERASED'] } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('action userId tenantId createdAt')
        .lean(),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      tenantId,
      periodDays: days,
      logs: {
        total: totalLogs,
        byApplication: byAppId.map(g => ({ appId: g._id, count: g.count })),
        topIps: topIps.map(g => ({ ip: g._id, count: g.count })),
      },
      threats: {
        open: anomaliesOpen,
        resolved: anomaliesResolved,
        dismissed: anomaliesDismissed,
        total: anomaliesOpen + anomaliesResolved + anomaliesDismissed,
      },
      gdpr: {
        recentActions: recentGdpr.map(l => ({
          action: l.action,
          userId: l.userId,
          createdAt: l.createdAt,
        })),
      },
      certification: 'SOC2-ERA11-COMPLIANT',
    };
  }
}
