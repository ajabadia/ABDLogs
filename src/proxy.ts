import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { getTenantSubdomain, resolveTenantFromSubdomain, TenantInfo } from './lib/proxy/tenant-resolver';
import { verifySessionExpiry, UserProfile } from './lib/proxy/session-validator';
import { verifyToken } from './lib/token-verifier';

const intlMiddleware = createMiddleware(routing);

/**
 * 🛰️ ABDQuiz Proxy Guard
 * Standardized interceptor for Federated Identity in Next.js 16.
 * Decouples security logic from standard page loads, supporting subdomain isolation.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip auth for static assets, internal Next.js routes and APIs
  const isAsset = 
    pathname.includes('.') || 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico';

  if (isAsset) {
    return intlMiddleware(request);
  }

  // 2. Extract and Validate Subdomain Tenant Metadata
  const host = request.headers.get('host');
  const subdomain = getTenantSubdomain(host);
  let tenantInfo: TenantInfo | null = null;

  if (subdomain) {
    tenantInfo = await resolveTenantFromSubdomain(subdomain);

    // Block access if subdomain is active but tenant is not found or inactive in central IdP
    if (!tenantInfo || !tenantInfo.active) {
      const baseAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3600';
      return NextResponse.redirect(new URL(`${baseAppUrl}/logout-success?error=tenant_not_found`));
    }
  }

  // 3. Skip auth for public landing pages and logout page
  const isPublicPath = 
    pathname === '/' ||
    pathname === '/es' ||
    pathname === '/en' ||
    pathname === '/es/' ||
    pathname === '/en/' ||
    pathname.endsWith('/logout-success');

  // 4. Session Validation via cryptographic JWT verification
  const sessionCookie = request.cookies.get('abd_session');
  let isAuthenticated = false;
  let didVerifyThisRequest = false;
  let userProfile: UserProfile | null = null;

  if (sessionCookie?.value) {
    const payload = await verifyToken(sessionCookie.value);
    if (payload) {
      isAuthenticated = true;
      userProfile = {
        email: payload.email,
        tenantId: payload.tenantId,
      };
    }
  }

  // 🛡️ Cross-Tenant Security Check: Force re-auth if session tenant doesn't match active subdomain tenant
  if (isAuthenticated && userProfile && tenantInfo) {
    if (userProfile.tenantId !== tenantInfo.tenantId) {
      isAuthenticated = false; // Purge cross-tenant session pollution
    }
  }

  // 🛡️ Session Expiry Desync Check: If authenticated but verified cookie is missing
  if (isAuthenticated && sessionCookie && userProfile) {
    const verifiedCookie = request.cookies.get('abd_session_verified');
    
    if (!verifiedCookie) {
      const email = userProfile.email;
      
      if (email) {
        const isSessionActive = await verifySessionExpiry(email, request.url);
        if (isSessionActive) {
          didVerifyThisRequest = true;
        } else {
          isAuthenticated = false; // Account deactivated or locked!
        }
      }
    }
  }

  // 5. Bypass authentication check for public paths if the tenant validation is successful
  if (isPublicPath && !isAuthenticated) {
    return intlMiddleware(request);
  }

  // 6. Unauthorized redirect to central IdP (Federated Authorization Flow)
  if (!isAuthenticated) {
    const providerUrl = process.env.AUTH_PROVIDER_URL || 'https://abd-auth.vercel.app';
    const currentUrl = new URL(request.url);
    const dynamicAppUrl = `${currentUrl.protocol}//${currentUrl.host}`;
    const clientId = process.env.AUTH_CLIENT_ID || 'abdquiz-industrial-client-id';

    const authorizeUrl = new URL(`${providerUrl}/api/auth/federated/authorize`, request.url);
    authorizeUrl.searchParams.set('client_id', clientId);
    authorizeUrl.searchParams.set('redirect_uri', `${dynamicAppUrl}/api/auth/federated/callback`);
    authorizeUrl.searchParams.set('state', pathname); 
    
    if (tenantInfo) {
      authorizeUrl.searchParams.set('tenant', tenantInfo.tenantId);
    }
    
    const response = NextResponse.redirect(authorizeUrl);
    
    // 🧹 Purge session cookies to prevent loops
    response.cookies.set('abd_session', '', { path: '/', maxAge: 0, expires: new Date(0) });
    response.cookies.set('abd_session_verified', '', { path: '/', maxAge: 0, expires: new Date(0) });
    
    return response;
  }

  // 7. Pass through to intl middleware if authenticated
  const response = await intlMiddleware(request);

  // If verified successfully on this request, set the verified immunity cookie for 60 seconds
  if (didVerifyThisRequest) {
    response.cookies.set('abd_session_verified', '1', {
      path: '/',
      maxAge: 60, // 60 seconds of network immunity
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.svg$).*)'],
};
