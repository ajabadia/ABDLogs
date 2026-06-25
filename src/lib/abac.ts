/**
 * @purpose Valida el acceso del usuario según las políticas ABAC.
 * @purpose_en Validates user access based on ABAC policies.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:1,sig:1sueyld
 * @lastUpdated 2026-06-25T09:18:15.479Z
 */

import { evaluateAccess, InsufficientPrivilegesError } from '@ajabadia/satellite-sdk/auth-middleware';

export interface AssertAccessParams {
  userId: string;
  tenantId: string;
  resource: string;
  action: string;
  context?: Record<string, unknown>;
}

export async function assertAccess(params: AssertAccessParams): Promise<void> {
  const result = await evaluateAccess({
    tenantId: params.tenantId,
    userId: params.userId,
    resource: params.resource,
    action: params.action,
    context: params.context,
  });

  if (!result.allowed) {
    throw new InsufficientPrivilegesError(`ABAC Denied: ${result.reason}`);
  }
}
