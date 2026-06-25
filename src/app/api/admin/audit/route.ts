/**
 * @purpose Gestiona el solicitud GET para obtener los registros de auditoría combinados de SaaS para un inquilino, asegurando el control de acceso y la limitación de tasa.
 * @purpose_en Manages the GET request for retrieving combined SaaS audit logs for a tenant, ensuring access control and rate limiting.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:6,sig:vzksrm
 * @lastUpdated 2026-06-25T10:24:40.515Z
 */

import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { rateLimitMongodb } from '@ajabadia/satellite-sdk/utils';
import { assertAccess } from '@/lib/abac';
import { AuditService } from '@/services/tenant/audit-service';
import { connectDB } from '@ajabadia/satellite-sdk/db';

export const revalidate = 0; // Evitar el cacheado estático de la API

/**
 * 📊 GET /api/admin/audit
 * Returns the combined SaaS audit logs for a tenant.
 */
export async function GET(request: Request) {
  try {
    // 🚦 Rate limit: 30 admin audit requests per 60s
    const ip = rateLimitMongodb.getClientIpFromRequest(request);
    const allowed = await rateLimitMongodb.check(ip, 'api', 30, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 });
    }

    // 1. Garantizar acceso seguro con ABAC
    const user = await ensureIndustrialAccess();
    await assertAccess({
      userId: user.id,
      tenantId: user.tenantId,
      resource: 'logs:audit',
      action: 'view'
    });
    
    // 2. Resolver conexión principal para validar sesión (si es necesario) y luego conectar logs
    await connectDB();

    const { searchParams } = new URL(request.url);
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const tenantIdParam = searchParams.get('tenantId');

    // Aislamiento Estricto SaaS: Solo SuperAdmin puede auditar otros tenants vía parámetro
    const tenantId = isSuperAdmin && tenantIdParam ? tenantIdParam : user.tenantId;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // 3. Recuperar y retornar la cronología consolidada de logs
    const logs = await AuditService.getCombinedLogsByTenant(tenantId, limit);
    
    return NextResponse.json(logs);
  } catch (error: unknown) {
    console.error('[API_GET_AUDIT_LOGS_ERROR]', error);
    const err = error as Error;
    const status = err.message === 'UNAUTHORIZED_ECOSYSTEM_ACCESS' ? 403 : 500;
    return NextResponse.json({ error: err.message || 'Unauthorized' }, { status });
  }
}
