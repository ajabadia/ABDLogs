import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@/lib/session';
import { AuditService } from '@/services/tenant/audit-service';
import connectDB from '@/lib/database/mongodb';

export const revalidate = 0; // Evitar el cacheado estático de la API

/**
 * 📊 GET /api/admin/audit
 * Returns the combined SaaS audit logs for a tenant.
 */
export async function GET(request: Request) {
  try {
    // 1. Garantizar acceso seguro con rol mínimo de administrador
    const user = await ensureIndustrialAccess('ADMIN');
    
    // 2. Resolver conexión principal para validar sesión (si es necesario) y luego conectar logs
    await connectDB();

    const { searchParams } = new URL(request.url);
    // Filtrar por el tenant solicitado o el del propio usuario administrador por defecto
    const tenantId = searchParams.get('tenantId') || user.tenantId;
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
