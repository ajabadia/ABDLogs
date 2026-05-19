import { NextResponse } from 'next/server';

/**
 * 🚿 Secure Logout Handler
 * Clears the local session cookie and redirects to the central Identity Provider's logout endpoint.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isSilent = searchParams.get('silent') === 'true';

  // 🧹 Wipe the local session cookie helper
  const clearCookieConfig = {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
  };

  if (isSilent) {
    const response = new NextResponse(null, { status: 200 });
    response.cookies.set('abd_session', '', clearCookieConfig);
    
    // 🛡️ Volumetric Anti-Caching Headers (SOC2 Standards)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  const providerLogoutUrl = `${process.env.AUTH_PROVIDER_URL || 'https://abd-auth.vercel.app'}/api/auth/logout`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3500';
  const redirectUri = `${appUrl}/logout-success`;
  
  const response = NextResponse.redirect(
    new URL(`${providerLogoutUrl}?redirect_uri=${encodeURIComponent(redirectUri)}`)
  );
  
  response.cookies.set('abd_session', '', clearCookieConfig);

  // 🛡️ Volumetric Anti-Caching Headers (SOC2 Standards)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

