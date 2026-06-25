/**
 * @purpose Valida la integridad y secuencia de los registros de auditoria para un inquilino específico revisando los valores de hash y los anteriores hashes.
 * @purpose_en Validates the integrity and sequence of audit logs for a specific tenant by checking the hash values and previous hashes.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:2,sig:14qi6ws
 * @lastUpdated 2026-06-24T10:31:36.506Z
 */

import { AuditLog, IAuditLog } from '@/models/AuditLog';
import { computeBlockHash } from '@ajabadia/satellite-sdk/utils';

export async function verifyTenantChain(tenantId: string): Promise<{ isValid: boolean; invalidLogsCount: number; errorDetails: string[] }> {
  try {
    const logs = await AuditLog.find({ tenantId }).sort({ _id: 1 });
    let expectedPreviousHash = `GENESIS_BLOCK_${tenantId}`;
    let invalidLogsCount = 0;
    const errorDetails: string[] = [];

    for (const log of logs) {
      if (log.previousHash !== expectedPreviousHash) {
        invalidLogsCount++;
        errorDetails.push(`Chain broken at ${log.createdAt.toISOString()}: expected previousHash ${expectedPreviousHash.substring(0, 8)}..., got ${log.previousHash?.substring(0, 8)}...`);
        break;
      }

      const obj = log.toObject();
      const { hash: storedHash, previousHash: storedPrev, _id, __v, createdAt, ...cleanPayload } = obj;
      const timestamp = log.createdAt.getTime();
      const calculatedHashWithTs = computeBlockHash(cleanPayload, expectedPreviousHash, timestamp);
      const calculatedHashWithoutTs = computeBlockHash(cleanPayload, expectedPreviousHash);

      if (calculatedHashWithTs !== storedHash && calculatedHashWithoutTs !== storedHash) {
        invalidLogsCount++;
        errorDetails.push(`Hash mismatch at ${log.createdAt.toISOString()} (Action: ${log.action}): Data has been tampered with.`);
        break;
      }

      expectedPreviousHash = storedHash;
    }

    return { isValid: invalidLogsCount === 0, invalidLogsCount, errorDetails };
  } catch (err: unknown) {
    console.error('[AUDIT_SAAS_VERIFY_ERROR] Verification failed:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { isValid: false, invalidLogsCount: 1, errorDetails: [msg] };
  }
}
