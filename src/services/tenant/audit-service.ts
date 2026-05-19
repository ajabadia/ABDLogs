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
}
