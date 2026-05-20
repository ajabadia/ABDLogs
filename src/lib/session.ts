'use server';

import {
  getIndustrialSession as _getIndustrialSession,
  ensureIndustrialAccess as _ensureIndustrialAccess,
} from '@abd/satellite-sdk';
import type { FederatedSession, UserProfile } from '@/lib/session-types';

export async function getIndustrialSession(): Promise<FederatedSession> {
  return await _getIndustrialSession();
}

/**
 * 🛡️ Assertion Helper
 * Throws if the user is not authenticated or doesn't have the required role.
 */
export async function ensureIndustrialAccess(requiredRole?: string): Promise<UserProfile> {
  return await _ensureIndustrialAccess(requiredRole);
}
