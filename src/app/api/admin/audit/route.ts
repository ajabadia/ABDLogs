import { NextResponse } from 'next/server';
import { ensureIndustrialAccess, rateLimitMongodb } from '@ajabadia/satellite-sdk';
import { assertAccess } from '@/lib/abac';
import { AuditService } from '@/services/tenant/audit-service';
import { connectDB } from '@ajabadia/satellite-sdk';

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
