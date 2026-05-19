import { jwtVerify, type JWTPayload } from 'jose';

/**
 * 🔑 Resolve the shared ecosystem secret key.
 * Must match AUTH_JWT_SECRET configured in ABDAuth.
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET || 'abd-auth-industrial-fallback-secret-2026';
  return new TextEncoder().encode(secret);
}

export interface VerifiedTokenPayload extends JWTPayload {
  sub: string;
  email: string;
  name: string;
  surname: string;
  role: string;
  tenantId: string;
  permissions: string[];
  dbPrefix: string;
  isolationStrategy: string;
}

/**
 * 🛡️ Verify JWT signature and expiration.
 * Returns the decoded payload or null if invalid/expired.
 */
export async function verifyToken(token: string): Promise<VerifiedTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as VerifiedTokenPayload;
  } catch (err) {
    console.error('[TOKEN_VERIFICATION_ERROR]', err);
    return null;
  }
}
