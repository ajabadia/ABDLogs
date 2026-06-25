/**
 * @purpose Gestiona solicitudes GET para estadísticas de telemetry agregadas durante los últimos N días, aplicando límites de velocidad y verificaciones de autenticación.
 * @purpose_en Handles the GET request for aggregated telemetry stats over the last N days, applying rate limiting and authentication checks.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:5,sig:10re7v9
 * @lastUpdated 2026-06-25T10:25:23.615Z
 */

import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { rateLimitMongodb } from '@ajabadia/satellite-sdk/utils';
import { AuditService } from '@/services/tenant/audit-service';
import { connectDB } from '@ajabadia/satellite-sdk/db';

export const revalidate = 0; // Telemetría en vivo, sin caché estática

/**
 * 📊 GET /api/admin/telemetry
 * Returns aggregated telemetry stats over the last N days (default 30).
 */
export async function GET(request: Request) {
  try {
    // 🚦 Rate limit: 30 telemetry requests per 60s
    const ip = rateLimitMongodb.getClientIpFromRequest(request);
    const allowed = await rateLimitMongodb.check(ip, 'api', 30, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 });
    }

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
