/**
 * @purpose Gestiona el consumo y procesamiento de registros de auditoría.
 * @purpose_en Handles the ingestion and processing of audit logs.
 * @refactorable true (contains business logic and data manipulation)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:6,sig:syc89t
 * @lastUpdated 2026-06-25T10:26:13.540Z
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@ajabadia/satellite-sdk/db';
import { rateLimitMongodb } from '@ajabadia/satellite-sdk/utils';
import { AuditLog } from '@/models/AuditLog';
import { computeBlockHash } from '@ajabadia/satellite-sdk/utils';

import { z } from 'zod';

const AuditLogIngestSchema = z.object({
  appId: z.string().min(1),
  tenantId: z.string().min(1),
  action: z.string().min(1),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  userId: z.string().min(1),
  userEmail: z.string().email(),
  changedFields: z.record(z.string(), z.any()).optional().default({}),
  previousState: z.record(z.string(), z.any()).optional().default({}),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional()
}).passthrough(); // Allow extra fields to be passed to payload if needed

export async function POST(request: NextRequest) {
  // 🚦 Rate limit: 100 ingestions per 60s per source IP
  const ip = rateLimitMongodb.getClientIpFromRequest(request);
  const allowed = await rateLimitMongodb.check(ip, 'ingestion', 100, 60);
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
    const rawBody = await request.json();
    
    // Validate with Zod
    const validation = AuditLogIngestSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: 'VALIDATION_FAILED', details: validation.error.format() }, { status: 400 });
    }
    
    const body = validation.data;
    await connectDB();
    
    // 🔐 5.5 Cryptographic Chain Hashing (SOC2) - Tenant Segmented
    // 1. Recover the latest block in the chain for this specific Tenant
    const lastLog = await AuditLog.findOne({ tenantId: body.tenantId }).sort({ _id: -1 }).lean();
    const previousHash = lastLog?.hash || `GENESIS_BLOCK_${body.tenantId}`;
    
    const payload = {
      appId: body.appId,
      tenantId: body.tenantId,
      action: body.action,
      entityType: body.entityType,
      entityId: body.entityId,
      userId: body.userId,
      userEmail: body.userEmail,
      changedFields: body.changedFields,
      previousState: body.previousState,
      ipAddress: body.ipAddress,
      userAgent: body.userAgent
    };

    // 3. Compute immutable SHA-256 block hash
    const timestamp = Date.now();
    const hash = computeBlockHash(payload, previousHash, timestamp);

    // 4. Inject chaining & timestamp exactly as used in hash
    body.createdAt = new Date(timestamp);
    body.previousHash = previousHash;
    body.hash = hash;
    
    const newLog = await AuditLog.create(body);
    return NextResponse.json({ success: true, id: newLog._id, hash: newLog.hash }, { status: 201 });
  } catch (error) {
    console.error('[INGEST_LOG_ERROR]', error);
    return NextResponse.json({ error: 'FAILED_TO_INGEST_LOG' }, { status: 500 });
  }
}
