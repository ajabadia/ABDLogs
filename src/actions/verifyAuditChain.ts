/**
 * @purpose Valida la cadena de auditoría para un inquilino determinado o el inquilino actual, asegurando lógica de acceso industrial y verificación de manejo.
 * @purpose_en Validates the audit chain for a given tenant or the current user's tenant, ensuring industrial access and handling verification logic.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:2,sig:153ajzn
 * @lastUpdated 2026-06-25T10:24:10.463Z
 */

'use server';

import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
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
  } catch (error: unknown) {
    console.error('[ACTION_VERIFY_CHAIN_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during verification'
    };
  }
}
