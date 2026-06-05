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
