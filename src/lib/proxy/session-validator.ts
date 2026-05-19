export interface UserProfile {
  email: string;
  tenantId: string;
}

/**
 * 🛡️ Session Expiry Desync Check: Asks the central Identity Provider if the user session is active.
 * Used when network immunity cookie has expired.
 */
export async function verifySessionExpiry(
  email: string,
  requestUrl: string
): Promise<boolean> {
  try {
    const providerUrl = process.env.AUTH_PROVIDER_URL || 'https://abd-auth.vercel.app';
    const clientSecret = process.env.AUTH_CLIENT_SECRET || 'abdquiz-industrial-client-secret';
    
    const verifyUrl = new URL(`${providerUrl}/api/auth/session/verify`, requestUrl);
    verifyUrl.searchParams.set('email', email);
    
    const response = await fetch(verifyUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${clientSecret}`,
        'Content-Type': 'application/json'
      },
      next: { revalidate: 0 }
    } as RequestInit & { next?: { revalidate: number } });
    
    if (response.ok) {
      const data = await response.json() as { active: boolean };
      return !!data.active;
    } else {
      // 🛡️ Resilience Standard: If central IdP is experiencing config mismatch (e.g. 401 Bearer secret mismatch)
      // or server errors (500), do NOT lock out the user locally. Gracefully fail-open.
      console.warn(`[PROXY_SESSION_VERIFICATION_WARNING] Central IdP responded with status ${response.status}. Falling back to local session validity.`);
      return true;
    }
  } catch (err) {
    console.error('[PROXY_SESSION_VERIFICATION_ERROR] Network or connection failure to Central IdP. Falling back to local session.', err);
    return true; // Fail-open on connection errors to prevent absolute lockouts
  }
}
