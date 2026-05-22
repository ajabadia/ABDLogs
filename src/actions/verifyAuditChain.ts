'use server';

import { ensureIndustrialAccess } from '@/lib/session';
import { AuditService } from '@/services/tenant/audit-service';

export async function verifyAuditChainAction(tenantId?: string) {
  try {
    // 1. Validar acceso (solo admins)
    const sessionUser = await ensureIndustrialAccess('ADMIN');
    
    // 2. Determinar tenant (SaaS Isolation)
    const isSuperAdmin = sessionUser.role === 'SUPER_ADMIN';
    const targetTenantId = isSuperAdmin && tenantId ? tenantId : sessionUser.tenantId;

    if (!targetTenantId) {
      throw new Error('No tenant context provided for verification');
    }

    // 3. Ejecutar verificación
    const result = await AuditService.verifyTenantChain(targetTenantId);
    
    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    console.error('[ACTION_VERIFY_CHAIN_ERROR]', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred during verification'
    };
  }
}
