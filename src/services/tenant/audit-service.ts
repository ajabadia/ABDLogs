/**
 * @purpose Gestiona registros de auditoría para inquilinos registrando eventos, recuperando registros combinados y verificando cadenas de inquilinos.
 * @purpose_en Manages audit logs for tenants by logging events, retrieving combined logs, and verifying tenant chains.
 * @refactorable true (contains multiple distinct functionalities that could be separated)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:4,sig:66x746
 * @lastUpdated 2026-06-24T10:31:42.463Z
 */

import { connectDB } from '@ajabadia/satellite-sdk/db';
import { AuditLog, IAuditLog } from '@/models/AuditLog';
import { computeBlockHash } from '@ajabadia/satellite-sdk/utils';
import { verifyTenantChain } from './audit-chain-verifier';

export class AuditService {
  static async logEvent(params: Partial<IAuditLog>, retries = 3): Promise<void> {
    try {
      await connectDB();
      const tenantId = params.tenantId || 'SYSTEM';

      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const lastLog = await AuditLog.findOne({ tenantId }).sort({ createdAt: -1 });
          const previousHash = lastLog?.hash || `GENESIS_BLOCK_${tenantId}`;

          const doc = new AuditLog({ appId: process.env.NEXT_PUBLIC_APP_ID || 'gobernanza', createdAt: new Date(), ...params, previousHash });
          const obj = doc.toObject();
          const { hash: _h, previousHash: _ph, _id, __v, createdAt, ...cleanPayload } = obj;
          const hash = computeBlockHash(cleanPayload, previousHash, doc.createdAt.getTime());
          doc.hash = hash;
          await doc.save();
          return;
        } catch (err: unknown) {
          const mongoError = err as { code?: number };
          if (mongoError.code === 11000) {
            console.warn(`[AUDIT_SAAS_WARN] Hash collision detected for tenant ${tenantId}. Retrying ${attempt + 1}/${retries}...`);
            await new Promise(r => setTimeout(r, Math.random() * 50 * (attempt + 1)));
            continue;
          }
          throw err;
        }
      }
      throw new Error('Max retries reached for log event insertion due to concurrency.');
    } catch (err) {
      console.error('[AUDIT_SAAS_ERROR] Fail-safe active. Logs cluster failed:', err);
    }
  }

  static async getCombinedLogsByTenant(tenantId: string, limit = 50): Promise<IAuditLog[]> {
    try {
      await connectDB();
      const filter = tenantId === 'SYSTEM' || !tenantId ? {} : { tenantId };
      const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(limit).exec();
      return logs.map(doc => { const obj = doc.toObject(); if (obj._id) obj._id = obj._id.toString(); return obj as IAuditLog; });
    } catch (err) {
      console.error('[AUDIT_SAAS_READ_ERROR] Failed to query central logs database:', err);
      return [];
    }
  }

  static async getTelemetryStatsByTenant(tenantId: string, days = 30): Promise<{ date: string; appId: string; action: string; count: number }[]> {
    try {
      await connectDB();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const filter: Record<string, unknown> = { createdAt: { $gte: startDate } };
      if (tenantId !== 'SYSTEM' && tenantId) filter.tenantId = tenantId;

      const stats = await AuditLog.aggregate([
        { $match: filter },
        { $group: { _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, appId: '$appId', action: '$action' }, count: { $sum: 1 } } },
        { $project: { _id: 0, date: '$_id.date', appId: '$_id.appId', action: '$_id.action', count: 1 } },
        { $sort: { date: 1 } }
      ]);
      return stats;
    } catch (err) {
      console.error('[AUDIT_SAAS_TELEMETRY_ERROR] Failed to aggregate stats:', err);
      return [];
    }
  }

  static async verifyTenantChain(tenantId: string): Promise<{ isValid: boolean; invalidLogsCount: number; errorDetails: string[] }> {
    return verifyTenantChain(tenantId);
  }
}
