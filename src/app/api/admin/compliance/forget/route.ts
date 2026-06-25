/**
 * @purpose Gestiona el solicitud POST para anonimizar PII en registros de auditoria para operadores objetivo, asegurando límites de velocidad y autorización.
 * @purpose_en Handles the POST request to anonymize PII in audit logs for target operators, ensuring rate limiting and authorization.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:6,sig:16u5kpr
 * @lastUpdated 2026-06-25T10:24:58.221Z
 */

import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { connectDB } from '@ajabadia/satellite-sdk/db';
import { rateLimitMongodb } from '@ajabadia/satellite-sdk/utils';
import { GDPRService } from '@/services/tenant/gdpr-service';
import { assertAccess } from '@/lib/abac';

export const revalidate = 0;

/**
 * 🔒 POST /api/admin/compliance/forget
 * Anonymizes PII in audit logs matching the target operators (Right to be Forgotten).
 */
export async function POST(request: Request) {
  try {
    // 🚦 Rate limit
    const ip = rateLimitMongodb.getClientIpFromRequest(request);
    const allowed = await rateLimitMongodb.check(ip, 'api', 10, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 });
    }

    // 1. Authorize: Operator must have ADMIN role minimum
    const user = await ensureIndustrialAccess('ADMIN');
    await assertAccess({ userId: user.id || user.email || 'system', tenantId: user.tenantId, resource: 'compliance/forget', action: 'execute' });
    await connectDB();

    const body = await request.json();
    const { targetUser, targetIp } = body;

    if (!targetUser && !targetIp) {
      return NextResponse.json(
        { error: 'At least targetUser or targetIp must be provided' },
        { status: 400 }
      );
    }

    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const tenantId = isSuperAdmin && body.tenantId ? body.tenantId : user.tenantId;

    // 2. Perform selective anonymization (preserving chain integrity)
    const { affectedCount } = await GDPRService.anonymizeLogs(
      tenantId,
      targetUser,
      targetIp
    );

    return NextResponse.json({
      success: true,
      affectedCount,
      message: `Anonymized ${affectedCount} log entries successfully.`,
    });
  } catch (error: unknown) {
    console.error('[API_COMPLIANCE_FORGET_ERROR]', error);
    const err = error as Error;
    const status = err.message === 'UNAUTHORIZED_ECOSYSTEM_ACCESS' ? 403 : 500;
    return NextResponse.json({ error: err.message || 'Server Error' }, { status });
  }
}
