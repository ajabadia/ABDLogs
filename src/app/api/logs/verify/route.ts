/**
 * @purpose Valida la integridad y consistencia de una cadena de registro de auditoria blockchain.
 * @purpose_en Validates the integrity and consistency of a blockchain audit log chain.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:4,sig:92edy1
 * @lastUpdated 2026-06-25T10:26:19.930Z
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@ajabadia/satellite-sdk/db';
import { rateLimitMongodb, computeBlockHash } from '@ajabadia/satellite-sdk/utils';
import { AuditLog } from '@/models/AuditLog';

export async function GET(request: NextRequest) {
  // 🚦 Rate limit: 5 verifications per 60s (expensive chain scan)
  const ip = rateLimitMongodb.getClientIpFromRequest(request);
  const allowed = await rateLimitMongodb.check(ip, 'api', 5, 60);
  if (!allowed) {
    return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 });
  }

  // 🛡️ Seguridad Inter-servicio
  const authHeader = request.headers.get('Authorization');
  const systemToken = process.env.LOGS_SECRET_TOKEN;

  if (!authHeader || authHeader !== `Bearer ${systemToken}`) {
    return NextResponse.json({ error: 'UNAUTHORIZED_SERVICE_REQUEST' }, { status: 401 });
  }

  try {
    await connectDB();
    
    // Obtenemos todos los logs de la cadena ordenados desde el más antiguo al más reciente
    const logs = await AuditLog.find().sort({ _id: 1 }).lean();
    
    if (!logs || logs.length === 0) {
      return NextResponse.json({ status: 'Empty', message: 'No logs to verify' });
    }

    // 🌐 Registro dinámico de Blockchains activas (una por Tenant)
    const expectedPreviousHashes: Record<string, string> = {};
    let brokenBlockId = null;

    for (let i = 0; i < logs.length; i++) {
      const currentLog = logs[i];
      const tId = currentLog.tenantId;
      
      // Si es el primer bloque de este Tenant, inicializamos su Génesis
      const expectedPreviousHash = expectedPreviousHashes[tId] || `GENESIS_BLOCK_${tId}`;

      // Verificamos si el enlace de este bloque apunta correctamente al bloque anterior de SU cadena
      if (currentLog.previousHash !== expectedPreviousHash) {
        brokenBlockId = currentLog._id;
        break;
      }

      // Recreamos el payload exacto
      const payload = {
        appId: currentLog.appId,
        tenantId: currentLog.tenantId,
        action: currentLog.action,
        entityType: currentLog.entityType,
        entityId: currentLog.entityId,
        userId: currentLog.userId,
        userEmail: currentLog.userEmail,
        changedFields: currentLog.changedFields || {},
        previousState: currentLog.previousState || {},
        ipAddress: currentLog.ipAddress,
        userAgent: currentLog.userAgent
      };

      // Recalculamos la firma criptográfica usando el tiempo exacto en que fue guardado
      const timestamp = new Date(currentLog.createdAt).getTime();
      const calculatedHash = computeBlockHash(payload, expectedPreviousHash, timestamp);

      // Si la firma recalculada no coincide con la almacenada, los datos han sido manipulados
      if (calculatedHash !== currentLog.hash) {
        brokenBlockId = currentLog._id;
        break;
      }

      // El hash actual se convierte en el previo esperado para el siguiente ciclo de ESTE Tenant
      expectedPreviousHashes[tId] = currentLog.hash;
    }

    if (brokenBlockId) {
      return NextResponse.json({
        status: 'Chain_Broken',
        message: '¡CORRUPCIÓN DE AUDITORÍA DETECTADA!',
        corruptedBlockId: brokenBlockId
      }, { status: 400 });
    }

    return NextResponse.json({
      status: 'Valid',
      message: 'La cadena de bloques criptográfica es matemáticamente inmutable y está sana.',
      verifiedBlocks: logs.length
    }, { status: 200 });

  } catch (error) {
    console.error('[VERIFY_LOGS_ERROR]', error);
    return NextResponse.json({ error: 'FAILED_TO_VERIFY_CHAIN' }, { status: 500 });
  }
}
