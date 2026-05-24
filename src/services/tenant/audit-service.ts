import connectDB from '@/lib/database/mongodb';
import { AuditLog, IAuditLog } from '@/models/AuditLog';
import { computeBlockHash } from '@/lib/crypto-chain';

export class AuditService {
  /**
   * Registra un evento de auditoría en la colección centralizada de logs.
   * Incorpora encadenamiento criptográfico con hashes SHA-256.
   */
  static async logEvent(params: Partial<IAuditLog>, retries = 3): Promise<void> {
    try {
      await connectDB();
      const tenantId = params.tenantId || 'SYSTEM';
      
      let attempt = 0;
      while (attempt < retries) {
        try {
          // 1. Obtener el hash del bloque anterior de este tenant
          const lastLog = await AuditLog.findOne({ tenantId }).sort({ createdAt: -1 });
          const previousHash = lastLog?.hash || `GENESIS_BLOCK_${tenantId}`;
          
          // 2. Instanciar documento para que Mongoose aplique defaults (ej. changedFields = {})
          const doc = new AuditLog({
            appId: process.env.NEXT_PUBLIC_APP_ID || 'gobernanza',
            createdAt: new Date(),
            ...params,
            previousHash
          });
          
          const obj = doc.toObject();
          const { hash: _h, previousHash: _ph, _id, __v, ...cleanPayload } = obj;
          
          // 3. Serialización determinista y cálculo del sello SHA-256
          const timestamp = doc.createdAt.getTime();
          const hash = computeBlockHash(cleanPayload, previousHash, timestamp);
          
          doc.hash = hash;
          
          // 4. Intentar guardar
          await doc.save();
          
          // console.log(`[AUDIT_SAAS_LOG] Persisted ${doc.action} event successfully with hash ${hash.substring(0, 8)}...`);
          return; // Éxito, salir del bucle
        } catch (err: unknown) {
          // Si es un error de índice único (código 11000 en MongoDB), significa que otro proceso insertó a la vez
          const mongoError = err as { code?: number };
          if (mongoError.code === 11000) {
            attempt++;
            console.warn(`[AUDIT_SAAS_WARN] Hash collision detected for tenant ${tenantId}. Retrying ${attempt}/${retries}...`);
            await new Promise(r => setTimeout(r, Math.random() * 50 * attempt));
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
        return obj as IAuditLog;
      });
    } catch (err) {
      console.error('[AUDIT_SAAS_READ_ERROR] Failed to query central logs database:', err);
      return [];
    }
  }

  /**
   * Obtiene estadísticas agregadas de telemetría para los dashboards (últimos N días)
   */
  static async getTelemetryStatsByTenant(tenantId: string, days = 30): Promise<{ date: string; appId: string; action: string; count: number }[]> {
    try {
      await connectDB();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const filter: Record<string, unknown> = { createdAt: { $gte: startDate } };
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

  /**
   * Verifica la integridad de la cadena de bloques para un tenant específico.
   * Recalcula los hashes y los compara en secuencia.
   */
  static async verifyTenantChain(tenantId: string): Promise<{ isValid: boolean, invalidLogsCount: number, errorDetails: string[] }> {
    try {
      await connectDB();
      
      const logs = await AuditLog.find({ tenantId }).sort({ createdAt: 1 });
      
      let expectedPreviousHash = `GENESIS_BLOCK_${tenantId}`;
      let invalidLogsCount = 0;
      const errorDetails: string[] = [];
      
      for (const log of logs) {
        if (log.previousHash !== expectedPreviousHash) {
          invalidLogsCount++;
          errorDetails.push(`Chain broken at ${log.createdAt.toISOString()}: expected previousHash ${expectedPreviousHash.substring(0,8)}..., got ${log.previousHash?.substring(0,8)}...`);
          break; // Detener validación tras la primera rotura para no acumular errores en cascada
        }
        
        const obj = log.toObject();
        const { hash: storedHash, previousHash: storedPrev, _id, __v, ...cleanPayload } = obj;
        
        const timestamp = log.createdAt.getTime();
        // Fallback for legacy logs: check with and without timestamp
        const calculatedHashWithTs = computeBlockHash(cleanPayload, expectedPreviousHash, timestamp);
        const calculatedHashWithoutTs = computeBlockHash(cleanPayload, expectedPreviousHash);
        
        if (calculatedHashWithTs !== storedHash && calculatedHashWithoutTs !== storedHash) {
          invalidLogsCount++;
          errorDetails.push(`Hash mismatch at ${log.createdAt.toISOString()} (Action: ${log.action}): Data has been tampered with.`);
          break;
        }
        
        expectedPreviousHash = storedHash;
      }
      
      return {
        isValid: invalidLogsCount === 0,
        invalidLogsCount,
        errorDetails
      };
    } catch (err: unknown) {
      console.error('[AUDIT_SAAS_VERIFY_ERROR] Verification failed:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return { isValid: false, invalidLogsCount: 1, errorDetails: [msg] };
    }
  }
}
