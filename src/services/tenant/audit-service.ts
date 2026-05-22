import connectDB from '@/lib/database/mongodb';
import { AuditLog, IAuditLog } from '@/models/AuditLog';

export class AuditService {
  /**
   * Registra un evento de auditoría en la colección centralizada de logs.
   */
  static async logEvent(params: Partial<IAuditLog>): Promise<void> {
    try {
      await connectDB();
      const payload = {
        appId: process.env.NEXT_PUBLIC_APP_ID || 'gobernanza',
        createdAt: new Date(),
        ...params,
      };
      await AuditLog.create(payload);
      console.log(`[AUDIT_SAAS_LOG] Persisted ${payload.action} event successfully.`);
    } catch (err) {
      console.error('[AUDIT_SAAS_ERROR] Fail-safe active. Logs cluster failed:', err);
    }
  }

  /**
   * Obtiene la cronología unificada de logs de la colección centralizada
   */
  static async getCombinedLogsByTenant(tenantId: string, limit = 50): Promise<IAuditLog[]> {
    try {
      await connectDB();
      const filter = tenantId === 'SYSTEM' || !tenantId ? {} : { tenantId };
      
      const logs = await AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();

      return logs.map(doc => {
        const obj = doc.toObject();
        if (obj._id) obj._id = obj._id.toString();
        return obj as unknown as IAuditLog;
      });
    } catch (err) {
      console.error('[AUDIT_SAAS_READ_ERROR] Failed to query central logs database:', err);
      return [];
    }
  }

  /**
   * Obtiene estadísticas agregadas de telemetría para los dashboards (últimos N días)
   */
  static async getTelemetryStatsByTenant(tenantId: string, days = 30): Promise<any[]> {
    try {
      await connectDB();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const filter: any = { createdAt: { $gte: startDate } };
      if (tenantId !== 'SYSTEM' && tenantId) {
        filter.tenantId = tenantId;
      }

      const stats = await AuditLog.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              appId: '$appId',
              action: '$action'
            },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            date: '$_id.date',
            appId: '$_id.appId',
            action: '$_id.action',
            count: 1
          }
        },
        { $sort: { date: 1 } }
      ]);

      return stats;
    } catch (err) {
      console.error('[AUDIT_SAAS_TELEMETRY_ERROR] Failed to aggregate stats:', err);
      return [];
    }
  }
}
