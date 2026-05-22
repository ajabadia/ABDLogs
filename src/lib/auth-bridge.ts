/**
 * 🛰️ ABD Ecosystem Identity Bridge
 * Standardized client for verifying sessions against the central ABDAuth provider.
 */

export interface FederatedSession {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
  };
  expires?: string;
}

export async function getFederatedSession(cookieString: string): Promise<FederatedSession> {
  // 🛰️ Points to the central identity provider's session verification endpoint
  const verifyUrl = process.env.AUTH_PROVIDER_URL;
  if (!verifyUrl) throw new Error('AUTH_PROVIDER_URL is not defined in environment');

  try {
    const response = await fetch(verifyUrl, {
      headers: {
        // 🛡️ Forwarding the cookies to the identity provider for session lookup
        'Cookie': cookieString,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return { authenticated: false };
    }

    return await response.json();
  } catch (error) {
    console.error('[IDENTITY_BRIDGE_FAILURE]', error);
    return { authenticated: false };
  }
}
