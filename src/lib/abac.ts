/**
 * @purpose Valida las permisiones del usuario según reglas de Control de Acceso Base de Acceso (ABAC).
 * @purpose_en Validates user permissions based on Access-Based Access Control (ABAC) rules.
 * @refactorable false
 * @classification Helper Utility
 * @complexity Low
 * @fingerprint exports:2,imports:1,sig:xe7cw6
 * @lastUpdated 2026-06-23T23:06:31.548Z
 */

import { evaluateAccess, InsufficientPrivilegesError } from '@ajabadia/satellite-sdk';

export interface AssertAccessParams {
  userId: string;
  tenantId: string;
  resource: string;
  action: string;
  context?: Record<string, unknown>;
}

/**
 * Asserts that the actor has permission to perform the action on the resource.
 * Throws InsufficientPrivilegesError if the Guardian Engine denies access.
 */
export async function assertAccess(params: AssertAccessParams): Promise<void> {
  const result = await evaluateAccess({
    tenantId: params.tenantId,
    userId: params.userId,
    resource: params.resource,
    action: params.action,
    context: params.context
  });

  if (!result.allowed) {
    throw new InsufficientPrivilegesError(`ABAC Denied: ${result.reason}`);
  }
}
