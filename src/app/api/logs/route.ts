import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { AuditLog } from '@/models/AuditLog';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  // 🛡️ Seguridad Inter-servicio
  const authHeader = request.headers.get('Authorization');
  const systemToken = process.env.LOGS_SECRET_TOKEN || 'shared-system-token-2026';

  if (!authHeader || authHeader !== `Bearer ${systemToken}`) {
    return NextResponse.json({ error: 'UNAUTHORIZED_SERVICE_REQUEST' }, { status: 401 });
  }

  try {
    const body = await request.json();
    await connectToDatabase();
    
    // 🔐 5.5 Cryptographic Chain Hashing (SOC2) - Tenant Segmented
    // 1. Recover the latest block in the chain for this specific Tenant
    const lastLog = await AuditLog.findOne({ tenantId: body.tenantId }).sort({ _id: -1 }).lean();
    const previousHash = lastLog?.hash || `GENESIS_BLOCK_TENANT_${body.tenantId}`;
    
    // 2. Prepare payload string deterministically
    const payloadString = JSON.stringify({
      appId: body.appId,
      tenantId: body.tenantId,
      action: body.action,
      entityType: body.entityType,
      entityId: body.entityId,
      userId: body.userId,
      userEmail: body.userEmail,
      changedFields: body.changedFields || {},
      previousState: body.previousState || {}
    });

    // 3. Compute immutable SHA-256 block hash
    // Includes chronological entropy from timestamp (simulated here at block execution)
    const timestamp = Date.now();
    const hash = crypto.createHash('sha256')
                       .update(previousHash + payloadString + timestamp)
                       .digest('hex');

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
