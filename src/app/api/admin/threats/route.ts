/**
 * @purpose Gestiona y renderiza registros de anomalías para los inquilinos.
 * @purpose_en Handles API requests for managing and retrieving anomaly records for tenants.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:3,imports:6,sig:174kcuq
 * @lastUpdated 2026-06-25T10:25:43.119Z
 */

import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { connectDB } from '@ajabadia/satellite-sdk/db';
import { rateLimitMongodb } from '@ajabadia/satellite-sdk/utils';
import { AnomalyEngine } from '@/services/tenant/anomaly-engine';
import { assertAccess } from '@/lib/abac';

export const revalidate = 0;

/**
 * 🔒 GET /api/admin/threats
 * Returns anomaly records for the authenticated tenant.
 * Query params: ?tenantId=&status=OPEN|DISMISSED|RESOLVED|ALL&limit=50
 */
export async function GET(request: Request) {
  try {
    const user = await ensureIndustrialAccess('ADMIN');
    await assertAccess({ userId: user.id || user.email || 'system', tenantId: user.tenantId, resource: 'threats', action: 'view' });
    await connectDB();

    const { searchParams } = new URL(request.url);
    const overrideTenantId = searchParams.get('tenantId') ?? undefined;
    const statusParam = searchParams.get('status') ?? 'OPEN';
    const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200);

    const tenantId = (user.role === 'SUPER_ADMIN' && overrideTenantId)
      ? overrideTenantId
      : (user.tenantId ?? 'SYSTEM');

    const validStatuses = ['OPEN', 'DISMISSED', 'RESOLVED', 'ALL'];
    const status = validStatuses.includes(statusParam)
      ? (statusParam as 'OPEN' | 'DISMISSED' | 'RESOLVED' | 'ALL')
      : 'OPEN';

    const anomalies = await AnomalyEngine.getAnomalies(tenantId, status, limit);

    return NextResponse.json({ ok: true, tenantId, anomalies });
  } catch (error: unknown) {
    console.error('[API_THREATS_GET_ERROR]', error);
    const err = error as Error;
    const status = err.message === 'UNAUTHORIZED_ECOSYSTEM_ACCESS' ? 403 : 500;
    return NextResponse.json({ error: err.message || 'Server Error' }, { status });
  }
}

/**
 * 🔒 POST /api/admin/threats
 * Triggers a full anomaly scan for the tenant.
 * Body: { tenantId?: string }
 */
export async function POST(request: Request) {
  try {
    // Rate limit: max 5 scans per minute per IP
    const ip = rateLimitMongodb.getClientIpFromRequest(request);
    const allowed = await rateLimitMongodb.check(ip, 'api', 5, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 });
    }

    const user = await ensureIndustrialAccess('ADMIN');
    await assertAccess({ userId: user.id || user.email || 'system', tenantId: user.tenantId, resource: 'threats', action: 'scan' });
    await connectDB();

    let body: { tenantId?: string } = {};
    try { body = await request.json(); } catch { /* body optional */ }

    const tenantId = (user.role === 'SUPER_ADMIN' && body.tenantId)
      ? body.tenantId
      : (user.tenantId ?? 'SYSTEM');

    const anomalies = await AnomalyEngine.runFullScan(tenantId);

    return NextResponse.json({
      ok: true,
      tenantId,
      created: anomalies.length,
      anomalies,
    });
  } catch (error: unknown) {
    console.error('[API_THREATS_SCAN_ERROR]', error);
    const err = error as Error;
    const httpStatus = err.message === 'UNAUTHORIZED_ECOSYSTEM_ACCESS' ? 403 : 500;
    return NextResponse.json({ error: err.message || 'Server Error' }, { status: httpStatus });
  }
}
