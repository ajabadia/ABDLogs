import { NextResponse } from 'next/server';
import { ensureIndustrialAccess, connectDB, rateLimitMongodb } from '@ajabadia/satellite-sdk';
import { GDPRService } from '@/services/tenant/gdpr-service';

export const revalidate = 0;

/**
 * 🔒 POST /api/admin/compliance/export
 * Exports all tenant data (audit logs, alerts, thresholds) into a signed/optionally-encrypted ZIP.
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
    await connectDB();

    let body: { password?: string; tenantId?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Body optional
    }

    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const tenantId = isSuperAdmin && body.tenantId ? body.tenantId : user.tenantId;

    // 2. Generate ZIP buffer
    const zipBuffer = await GDPRService.exportTenantData(tenantId, body.password);

    // 3. Return ZIP attachment response
    const filename = `gdpr_export_${tenantId}_${Date.now()}.zip`;

    return new Response(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error: unknown) {
    console.error('[API_COMPLIANCE_EXPORT_ERROR]', error);
    const err = error as Error;
    const status = err.message === 'UNAUTHORIZED_ECOSYSTEM_ACCESS' ? 403 : 500;
    return NextResponse.json({ error: err.message || 'Server Error' }, { status });
  }
}
