import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk';
import { AuditService } from '@/services/tenant/audit-service';
import { connectDB } from '@ajabadia/satellite-sdk';

export const revalidate = 0; // Telemetría en vivo, sin caché estática

/**
 * 📊 GET /api/admin/telemetry
 * Returns aggregated telemetry stats over the last N days (default 30).
 */
export async function GET(request: Request) {
  try {
    const user = await ensureIndustrialAccess('ADMIN');
    await connectDB();

    const { searchParams } = new URL(request.url);
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const tenantIdParam = searchParams.get('tenantId');
    const daysParam = searchParams.get('days');

    const tenantId = isSuperAdmin && tenantIdParam ? tenantIdParam : user.tenantId;
    const days = daysParam ? parseInt(daysParam, 10) : 30;

    const stats = await AuditService.getTelemetryStatsByTenant(tenantId, days);
    
    return NextResponse.json(stats);
  } catch (error: unknown) {
    console.error('[API_GET_TELEMETRY_ERROR]', error);
    const err = error as Error;
    const status = err.message === 'UNAUTHORIZED_ECOSYSTEM_ACCESS' ? 403 : 500;
    return NextResponse.json({ error: err.message || 'Unauthorized' }, { status });
  }
}
